import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';
import type { GetRuntimeResponse } from '../../api';

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GetRuntimeResponse | null = null;

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
      const runtimeCount = Object.keys(this.graphData?.runtimes || {}).length;
      console.log('[TestTreeDataProvider] Loaded graph data from API:', runtimeCount, 'runtimes');
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

    // Use the runtimes object from the response
    const runtimeKeys = Object.keys(this.graphData.runtimes || {});

    for (const runtimeKey of runtimeKeys) {
      const runtimeData = this.graphData.runtimes[runtimeKey];
      const testCount = runtimeData.tests?.length || 0;
      items.push(new TestTreeItem(
        runtimeKey,
        TreeItemType.Runtime,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${testCount} test(s)`,
          count: testCount
        },
        undefined,
        new vscode.ThemeIcon('symbol-namespace')
      ));
    }

    return items;
  }

  private getTestItems(runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    const runtimeData = this.graphData.runtimes?.[runtimeKey];
    if (!runtimeData) return [];

    const testPaths = runtimeData.tests || [];
    const inputFiles = runtimeData.inputFiles || {};

    return testPaths.map((testPath: string) => {
      const fileName = testPath.split('/').pop() || testPath;
      const testInputFiles = inputFiles[testPath] || [];
      return new TestTreeItem(
        fileName,
        TreeItemType.Test,
        vscode.TreeItemCollapsibleState.None,
        {
          runtimeKey,
          testId: testPath,
          description: testPath,
          status: 'unknown',
          inputFiles: testInputFiles
        },
        {
          command: 'testeranto.runTest',
          title: 'Run Test',
          arguments: [runtimeKey, testPath, testInputFiles]
        },
        new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'))
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
