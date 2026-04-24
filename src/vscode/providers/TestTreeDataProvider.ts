import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;

  constructor() {
    super();
    console.log('[TestTreeDataProvider] Constructor called');
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      console.log('[TestTreeDataProvider] Loading graph data from runtime slice API endpoint');
      const response = await fetch(ApiUtils.getRuntimeSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      console.log('[TestTreeDataProvider] Loaded graph data from API:', this.graphData?.nodes?.length, 'nodes');
    } catch (error) {
      console.error('[TestTreeDataProvider] Failed to load graph data from API:', error);
      this.graphData = null;
      throw error;
    }
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[TestTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!this.graphData) {
      await this.loadGraphData();
    }

    if (!element) {
      return this.getRuntimeItems();
    }

    const elementData = element.data || {};

    switch (element.type) {
      case TreeItemType.Runtime:
        return this.getTestItems(elementData.runtimeKey);
      case TreeItemType.Test:
        return [];
      default:
        return [];
    }
  }

  private getRuntimeItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    items.push(new TestTreeItem(
      'Refresh',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Reload graph data',
        refresh: true
      },
      {
        command: 'testeranto.refresh',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    if (!this.graphData) {
      items.push(new TestTreeItem(
        'Cannot connect to server',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Testeranto server is not running on port 3000.',
          startServer: true
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

    // Group nodes by runtime (configKey)
    const runtimeMap = new Map<string, { count: number; nodes: GraphNode[] }>();

    for (const node of this.graphData.nodes) {
      const runtimeKey = node.metadata?.configKey || node.metadata?.runtime || 'unknown';
      const current = runtimeMap.get(runtimeKey) || { count: 0, nodes: [] };
      current.count++;
      current.nodes.push(node);
      runtimeMap.set(runtimeKey, current);
    }

    for (const [runtimeKey, data] of runtimeMap.entries()) {
      items.push(new TestTreeItem(
        runtimeKey,
        TreeItemType.Runtime,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${data.count} test(s)`,
          count: data.count
        },
        undefined,
        new vscode.ThemeIcon('symbol-namespace')
      ));
    }

    return items;
  }

  private getTestItems(runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find nodes that belong to this runtime and are test-like
    const testNodes = this.graphData.nodes.filter(node =>
      (node.type === 'test' || node.type === 'entrypoint') &&
      node.metadata?.configKey === runtimeKey
    );

    return testNodes.map(node => {
      const status = node.metadata?.status;
      const failed = node.metadata?.failed;
      let icon: vscode.ThemeIcon;
      if (failed === true || status === 'blocked') {
        icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      } else if (failed === false || status === 'done') {
        icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      } else {
        icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
      }

      return new TestTreeItem(
        node.label || node.id,
        TreeItemType.Test,
        vscode.TreeItemCollapsibleState.None,
        {
          runtimeKey,
          testId: node.id,
          description: node.description,
          status
        },
        undefined,
        icon
      );
    });
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[TestTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

    if (message.type === 'resourceChanged') {
      if (message.url === '/~/runtime' || message.url === '/~/graph') {
        console.log('[TestTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[TestTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice('/runtime');
    this.subscribeToSlice('/graph');
  }
}
