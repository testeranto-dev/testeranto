import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import * as TestTreeUtils from './utils/testTree';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';
import type { CollatedFilesResponse } from '../../../api';

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private configWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    super();
    // Show a visible message to prove logging works
    vscode.window.showInformationMessage('TestTreeDataProvider constructor called!');
    console.log('[TestTreeDataProvider] CONSTRUCTOR CALLED - LOGGING FROM TestTreeDataProvider.ts');
    TestTreeUtils.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] Initial HTTP fetch failed:', error);
    });
    this.setupConfigWatcher();
  }

  refresh(): void {
    console.log('[TestTreeDataProvider] Manual refresh requested');
    // Show a loading indicator
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Refreshing Testeranto...",
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0 });
      
      try {
        await TestTreeUtils.fetchConfigsViaHttp();
        progress.report({ increment: 100 });
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage('Testeranto refreshed successfully');
      } catch (error) {
        console.error('[TestTreeDataProvider] HTTP refresh failed:', error);
        vscode.window.showErrorMessage(`Failed to refresh: ${error.message}`);
        this._onDidChangeTreeData.fire();
      }
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
      const { runtimeKey, testName } = element.data || {};
      return this.getTestFileItems(runtimeKey, testName);
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

    // Add config file item at the root
    items.push(this.createConfigFileItem());

    items.push(TestTreeUtils.createRefreshItem());

    // Add connection status item
    const connectionStatusItem = this.createConnectionStatusItem();
    items.push(connectionStatusItem);

    try {
      // Try to fetch configs to check if server is reachable
      const configData = await TestTreeUtils.fetchConfigsViaHttp();
      
      if (configData?.configs?.runtimes) {
        const runtimes = configData.configs.runtimes;
        const runtimeEntries = Object.entries(runtimes);

        if (runtimeEntries.length > 0) {
          items.push(TestTreeUtils.createRuntimeCountItem(runtimeEntries.length));

          for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
            const config = runtimeConfig as any;
            if (config?.runtime) {
              items.push(TestTreeUtils.createRuntimeItem(runtimeKey, config));
            }
          }
        } else {
          items.push(new TestTreeItem(
            'No tests configured',
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
              description: 'Add tests to testeranto/testeranto.ts'
            },
            {
              command: 'testeranto.openTesterantoConfig',
              title: 'Open Config',
              arguments: []
            },
            new vscode.ThemeIcon('info')
          ));
        }
      } else {
        items.push(new TestTreeItem(
          'Server returned empty configuration',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Check server logs'
          },
            {
              command: 'testeranto.startServer',
              title: 'Start Server',
              arguments: []
            },
          new vscode.ThemeIcon('warning')
        ));
      }
    } catch (error) {
      console.error('[TestTreeDataProvider] Error fetching configs:', error);
      items.push(new TestTreeItem(
        'Cannot connect to server',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Click to start the server',
          startServer: true,
          error: error.message
        },
        {
          command: 'testeranto.startServer',
          title: 'Start Server',
          arguments: []
        },
        new vscode.ThemeIcon('error')
      ));
    }
    return items;
  }

  private createConnectionStatusItem(): TestTreeItem {
    const isConnected = (this as any).isConnected;
    const description = isConnected ? 'WebSocket connected' : 'WebSocket disconnected';
    const icon = isConnected ? 
      new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('testing.iconPassed')) :
      new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('testing.iconFailed'));

    return new TestTreeItem(
      'Connection Status',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: description,
        connected: isConnected,
        disconnected: !isConnected
      },
      {
        command: 'testeranto.retryConnection',
        title: 'Retry Connection',
        arguments: [this]
      },
      icon
    );
  }

  private createConfigFileItem(): TestTreeItem {
    const item = new TestTreeItem(
      "testeranto/testeranto.ts",
      TreeItemType.File,
      vscode.TreeItemCollapsibleState.None,
      {
        fileName: "testeranto/testeranto.ts",
        description: "Main configuration file",
        isFile: true,
        fileType: "config"
      },
      {
        command: "testeranto.openTesterantoConfig",
        title: "Open Testeranto Config",
        arguments: []
      },
      new vscode.ThemeIcon("settings-gear")
    );
    item.tooltip = "Click to open the main Testeranto configuration file";
    return item;
  }

  private getTestItems(runtime?: string): TestTreeItem[] {
    if (!runtime) {
      return [];
    }

    const configData = TestTreeUtils.getConfigData();
    if (configData?.configs?.runtimes) {
      const runtimes = configData.configs.runtimes;

      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig as any;
        if (config?.runtime === runtime) {
          const tests = Array.isArray(config.tests) ? config.tests : [];
          return tests.map((testName: string) => {
            return TestTreeUtils.createTestItem(runtimeKey, testName);
          });
        }
      }
    }
    return [];
  }

  private async getTestFileItems(
    runtimeKey: string,
    testName: string,
  ): Promise < TestTreeItem[] > {
    console.log(`[TestTreeDataProvider] getTestFileItems START for ${runtimeKey}/${testName}`);

    try {
      console.log(`[TestTreeDataProvider] Fetching collated files from server...`);
      const response = await fetch(ApiUtils.getCollatedFilesUrl());
      console.log(`[TestTreeDataProvider] Fetch response status: ${response.status}`);

      if(!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const data = await response.json();
// Use type assertion for the response
const collatedFilesResponse = data as CollatedFilesResponse;
console.log(`[TestTreeDataProvider] Received collated files data, has tree: ${!!collatedFilesResponse.tree}`);

const tree = collatedFilesResponse.tree || {};
console.log(`[TestTreeDataProvider] Tree has ${Object.keys(tree).length} top-level keys:`, Object.keys(tree));

// Log all runtime keys for debugging
console.log(`[TestTreeDataProvider] Looking for runtime "${runtimeKey}" in tree keys:`);
Object.keys(tree).forEach(key => {
  console.log(`  - "${key}"`);
});

// Ensure runtimeKey and testName are valid strings
const safeRuntime = runtimeKey || '';
const safeTestName = testName || '';

let filteredTree = {};
try {
  filteredTree = TestTreeUtils.filterTreeForRuntimeAndTest(
    tree,
    safeRuntime,
    safeTestName,
  );
} catch (filterError) {
  console.error(`[TestTreeDataProvider] Error in filterTreeForRuntimeAndTest:`, filterError);
  // Return error items instead of crashing
  return TestTreeUtils.createErrorItems(runtimeKey, testName, filterError);
}

console.log(`[TestTreeDataProvider] After filtering, got tree with ${Object.keys(filteredTree).length} keys`);

if (Object.keys(filteredTree).length === 0) {
  console.log(`[TestTreeDataProvider] No files found for ${runtimeKey}/${testName}`);
  console.log(`[TestTreeDataProvider] This could mean:`);
  console.log(`  1. The test hasn't been run yet`);
  console.log(`  2. The test name doesn't match the tree structure`);
  console.log(`  3. The server hasn't generated files for this test`);

  // Try to get configs to see what tests are available
  try {
    const configResponse = await fetch(ApiUtils.getConfigsUrl());
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log(`[TestTreeDataProvider] Available configs:`, Object.keys(configData.configs?.runtimes || {}));
    }
  } catch (configError) {
    console.log(`[TestTreeDataProvider] Could not fetch configs:`, configError);
  }
} else {
  console.log(`[TestTreeDataProvider] Filtered tree keys:`, Object.keys(filteredTree));
}

let fileItems: TestTreeItem[] = [];
try {
  fileItems = TestTreeUtils.convertTreeToItems(
    filteredTree,
    runtimeKey,
    testName,
  );
} catch (convertError) {
  console.error(`[TestTreeDataProvider] Error in convertTreeToItems:`, convertError);
  return TestTreeUtils.createErrorItems(runtimeKey, testName, convertError);
}

console.log(`[TestTreeDataProvider] Converted ${fileItems.length} file items`);

if (fileItems.length > 0) {
  return fileItems;
}

return TestTreeUtils.createNoFilesItem(runtimeKey, testName);
    } catch (error) {
  console.error("[TestTreeDataProvider] Error fetching collated files:", error);
  return TestTreeUtils.createErrorItems(runtimeKey, testName, error);
}
  }

  protected handleWebSocketMessage(message: any): void {
  console.log('[TestTreeDataProvider] Received WebSocket message:', message.type);

  switch(message.type) {
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
