import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import * as TestTreeUtils from './utils/testTree';
import { createConfigFileItem } from './createConfigFileItem';
import { createConnectionStatusItem } from './createConnectionStatusItem';

export async function getRuntimeItems(provider: any): Promise<TestTreeItem[]> {
    console.log("[TestTreeDataProvider] getRuntimeItems called - READING FROM GRAPH");

    const items: TestTreeItem[] = [];

    // SIMPLE TEST ITEM - Always show this to prove the tree works
    items.push(new TestTreeItem(
      'Testeranto Test Item',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Test item to show extension works'
      },
      undefined,
      new vscode.ThemeIcon('check')
    ));

    // Add config file item at the root
    items.push(createConfigFileItem());

    items.push(TestTreeUtils.createRefreshItem());

    // Add connection status item
    const connectionStatusItem = createConnectionStatusItem(provider);
    items.push(connectionStatusItem);

    // Add webview button
    items.push(new TestTreeItem(
      'Open Server Report',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'View HTML report in webview',
        webview: true
      },
      {
        command: 'testeranto.openServerWebview',
        title: 'Open Server Webview',
        arguments: []
      },
      new vscode.ThemeIcon('globe')
    ));

    try {
      // Read from graph-data.json instead of HTTP endpoints
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');

      if (!fs.existsSync(graphDataPath)) {
        items.push(new TestTreeItem(
          'Graph data not found',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Run tests to generate graph-data.json'
          },
          {
            command: 'testeranto.startServer',
            title: 'Start Server',
            arguments: []
          },
          new vscode.ThemeIcon('warning')
        ));
        return items;
      }

      const graphDataContent = fs.readFileSync(graphDataPath, 'utf-8');
      const graphData = JSON.parse(graphDataContent);

      // Extract runtimes from graph nodes
      const runtimeNodes = graphData.data?.unifiedGraph?.nodes?.filter((node: any) =>
        node.type === 'entrypoint' || node.type === 'config'
      ) || [];

      // Group by runtime/configKey
      const runtimesMap = new Map<string, { count: number, nodes: any[] }>();

      for (const node of runtimeNodes) {
        const runtimeKey = node.metadata?.configKey || node.metadata?.runtime || 'unknown';
        const current = runtimesMap.get(runtimeKey) || { count: 0, nodes: [] };
        current.count++;
        current.nodes.push(node);
        runtimesMap.set(runtimeKey, current);
      }

      if (runtimesMap.size > 0) {
        items.push(new TestTreeItem(
          `Runtimes (${runtimesMap.size})`,
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Available test runtimes from graph',
            count: runtimesMap.size
          },
          undefined,
          new vscode.ThemeIcon('symbol-namespace')
        ));

        for (const [runtimeKey, data] of runtimesMap.entries()) {
          items.push(new TestTreeItem(
            runtimeKey,
            TreeItemType.Runtime,
            data.count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            {
              runtime: runtimeKey,
              description: `${data.count} test(s)`,
              testsCount: data.count
            },
            undefined,
            new vscode.ThemeIcon('symbol-namespace')
          ));
        }
      } else {
        items.push(new TestTreeItem(
          'No tests found in graph',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Run tests to populate graph'
          },
          {
            command: 'testeranto.startServer',
            title: 'Start Server',
            arguments: []
          },
          new vscode.ThemeIcon('info')
        ));
      }
    } catch (error) {
      console.error('[TestTreeDataProvider] Error reading graph data:', error);
      items.push(new TestTreeItem(
        'Error reading graph data',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: error.message,
          error: true
        },
        undefined,
        new vscode.ThemeIcon('error')
      ));
    }
    return items;
}
