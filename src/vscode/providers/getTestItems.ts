import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export async function getTestItems(runtime?: string): Promise<TestTreeItem[]> {
    if (!runtime) {
      return [];
    }

    try {
      // Read from graph-data.json
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');

      if (!fs.existsSync(graphDataPath)) {
        return [];
      }

      const graphDataContent = fs.readFileSync(graphDataPath, 'utf-8');
      const graphData = JSON.parse(graphDataContent);

      // Find test nodes for this runtime
      const testNodes = graphData.data?.unifiedGraph?.nodes?.filter((node: any) =>
        node.type === 'test' &&
        (node.metadata?.configKey === runtime || node.metadata?.runtime === runtime)
      ) || [];

      // Group by test name
      const testsMap = new Map<string, any[]>();

      for (const node of testNodes) {
        const testName = node.metadata?.testName || node.label || 'unknown';
        const current = testsMap.get(testName) || [];
        current.push(node);
        testsMap.set(testName, current);
      }

      return Array.from(testsMap.keys()).map((testName: string) => {
        return new TestTreeItem(
          testName,
          TreeItemType.Test,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey: runtime,
            testName: testName,
            runtime: runtime,
            test: testName
          },
          undefined,
          new vscode.ThemeIcon('beaker')
        );
      });
    } catch (error) {
      console.error('[TestTreeDataProvider] Error reading graph data for tests:', error);
      return [];
    }
}
