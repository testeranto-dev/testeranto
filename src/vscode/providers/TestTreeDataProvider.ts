import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import * as TestTreeUtils from './utils/testTree';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private configWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    super();
    TestTreeUtils.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] Initial HTTP fetch failed:', error);
    });
    this.setupConfigWatcher();
  }

  refresh(): void {
    console.log('[TestTreeDataProvider] Manual refresh requested');
    TestTreeUtils.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] HTTP refresh failed:', error);
    }).then(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  private setupConfigWatcher(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode.RelativePattern(workspaceRoot, 'testeranto/extension-config.json');

    this.configWatcher = vscode.workspace.createFileSystemWatcher(configPattern);

    this.configWatcher.onDidChange(() => {
      console.log('[TestTreeDataProvider] Config file changed, refreshing tree');
      this.refresh();
    });

    this.configWatcher.onDidCreate(() => {
      console.log('[TestTreeDataProvider] Config file created, refreshing tree');
      this.refresh();
    });

    this.configWatcher.onDidDelete(() => {
      console.log('[TestTreeDataProvider] Config file deleted, refreshing tree');
      this.refresh();
    });
  }

  dispose(): void {
    if (this.configWatcher) {
      this.configWatcher.dispose();
    }
    super.dispose();
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
    if (!element) {
      return this.getRuntimeItems();
    } else if (element.type === TreeItemType.Runtime) {
      const runtime = element.data?.runtime;
      return Promise.resolve(this.getTestItems(runtime));
    } else if (element.type === TreeItemType.Test) {
      const { runtime, testName } = element.data || {};
      return this.getTestFileItems(runtime, testName);
    } else if (element.type === TreeItemType.File) {
      const { 
        runtime, 
        testName, 
        path, 
        isFile
      } = element.data || {};

      if (isFile) {
        return Promise.resolve([]);
      }

      // Check if element has pre-populated children
      if (element.children && element.children.length > 0) {
        return Promise.resolve(element.children);
      }

      // Handle directory expansion
      return TestTreeUtils.getDirectoryChildren(runtime, testName, path || '');
    }
    return Promise.resolve([]);
  }

  private async getRuntimeItems(): Promise<TestTreeItem[]> {
    const items: TestTreeItem[] = [];

    items.push(TestTreeUtils.createRefreshItem());

    const configData = TestTreeUtils.getConfigData();
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;
      const runtimeEntries = Object.entries(runtimes);

      if (runtimeEntries.length > 0) {
        items.push(TestTreeUtils.createRuntimeCountItem(runtimeEntries.length));

        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig as any;
          if (config.runtime) {
            items.push(TestTreeUtils.createRuntimeItem(runtimeKey, config));
          }
        }
      }
    }
    return items;
  }

  private getTestItems(runtime?: string): TestTreeItem[] {
    if (!runtime) {
      return [];
    }

    const configData = TestTreeUtils.getConfigData();
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;

      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig as any;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          return tests.map((testName: string) => {
            return TestTreeUtils.createTestItem(runtimeKey, testName);
          });
        }
      }
    }
    return [];
  }

  private async getTestFileItems(
    runtime: string,
    testName: string,
  ): Promise<TestTreeItem[]> {
    try {
      console.log(
        `[TestTreeDataProvider] Fetching collated files for ${runtime}/${testName}`,
      );

      const response = await fetch("http://localhost:3000/~/collated-files");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(
        `[TestTreeDataProvider] Received collated files data:`,
        data,
      );

      const tree = data.tree || {};
      console.log(`[TestTreeDataProvider] Tree keys:`, Object.keys(tree));

      const filteredTree = TestTreeUtils.filterTreeForRuntimeAndTest(
        tree,
        runtime,
        testName,
      );
      console.log(
        `[TestTreeDataProvider] Filtered tree keys:`,
        Object.keys(filteredTree),
      );

      TestTreeUtils.logTreeStructure(filteredTree, 0);

      const fileItems = TestTreeUtils.convertTreeToItems(
        filteredTree,
        runtime,
        testName,
      );
      console.log(
        `[TestTreeDataProvider] Converted ${fileItems.length} file items`,
      );

      if (fileItems.length > 0) {
        return fileItems;
      }

      return TestTreeUtils.createNoFilesItem(runtime, testName);
    } catch (error) {
      console.error(
        "[TestTreeDataProvider] Error fetching collated files:",
        error,
      );
      return TestTreeUtils.createErrorItems(runtime, testName, error);
    }
  }

  protected handleWebSocketMessage(message: any): void {
    console.log('[TestTreeDataProvider] Received WebSocket message:', message.type);

    switch (message.type) {
      case 'connected':
        console.log('[TestTreeDataProvider] WebSocket connection confirmed');
        break;
      case 'resourceChanged':
        console.log('[TestTreeDataProvider] Resource changed, fetching updated configs:', message.url);
        if (message.url === '/~/configs') {
          TestTreeUtils.fetchConfigsViaHttp().catch(error => {
            console.log('[TestTreeDataProvider] HTTP fetch after resource change failed:', error);
          }).then(() => {
            this._onDidChangeTreeData.fire();
          });
        }
        break;
      default:
        console.log('[TestTreeDataProvider] Unhandled message type:', message.type);
    }
  }
}
