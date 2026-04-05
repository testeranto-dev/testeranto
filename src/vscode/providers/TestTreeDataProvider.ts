import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';
import * as TestTreeUtils from './utils/testTree';
import { createErrorItems } from './createErrorItems';

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
    console.log('[TestTreeDataProvider] getTreeItem called with element:', element ? `type: ${element.type}, label: ${element.label}` : 'undefined');

    if (element === null || element === undefined) {
      console.error('[TestTreeDataProvider] getTreeItem called with null/undefined element');
      // Return a placeholder tree item to prevent crashes
      const item = new vscode.TreeItem('Error: Invalid element', vscode.TreeItemCollapsibleState.None);
      item.tooltip = 'This item could not be loaded';
      return item;
    }
    // Ensure element has required properties
    if (typeof element !== 'object' || element === null) {
      console.error('[TestTreeDataProvider] getTreeItem called with non-object element:', element);
      const item = new vscode.TreeItem('Invalid element', vscode.TreeItemCollapsibleState.None);
      item.tooltip = 'This item is corrupted';
      return item;
    }
    if (!('type' in element)) {
      console.error('[TestTreeDataProvider] getTreeItem called with element missing type property:', element);
      const item = new vscode.TreeItem('Invalid element', vscode.TreeItemCollapsibleState.None);
      item.tooltip = 'This item is corrupted';
      return item;
    }
    console.log('[TestTreeDataProvider] Returning valid element');
    return element;
  }

  getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
    console.log('[TestTreeDataProvider] getChildren called with element:', element ? `type: ${element.type}, label: ${element.label}` : 'undefined');

    // Handle null/undefined element
    if (element === null || element === undefined) {
      console.log('[TestTreeDataProvider] No element, returning runtime items');
      return this.getRuntimeItems();
    }

    // Ensure element is a TestTreeItem and has a type property
    if (typeof element !== 'object' || element === null) {
      console.error('[TestTreeDataProvider] Element is not an object:', element);
      return Promise.resolve([]);
    }

    if (element.type === undefined) {
      console.error('[TestTreeDataProvider] Element type is undefined:', element);
      return Promise.resolve([]);
    }

    switch (element.type) {
      case TreeItemType.Runtime:
        console.log('[TestTreeDataProvider] Handling Runtime element');
        const runtimeKeyFromRuntime = element.data?.runtime;
        return this.getTestItems(runtimeKeyFromRuntime);
      case TreeItemType.Test:
        console.log('[TestTreeDataProvider] Handling Test element');
        const { runtimeKey, testName } = element.data || {};
        return this.getTestFileItems(runtimeKey, testName);
      case TreeItemType.Info:
        console.log(`[TestTreeDataProvider] Handling Info folder: ${element.label}`);
        // This is a folder (like Source Files, Logs, Output Files)
        // Return its pre-populated children
        console.log(`[TestTreeDataProvider] getChildren for Info folder: ${element.label}, children count: ${element.children?.length || 0}`);
        if (element.children && element.children.length > 0) {
          console.log(`[TestTreeDataProvider] Returning children for ${element.label}:`, element.children.map(c => c.label));
          return Promise.resolve(element.children);
        }
        console.log(`[TestTreeDataProvider] No children for ${element.label}`);
        return Promise.resolve([]);
      case TreeItemType.File:
        console.log(`[TestTreeDataProvider] Handling File element: ${element.label}`);
        const {
          runtime: fileRuntime,
          testName: fileTestName,
          path,
          isFile
        } = element.data || {};

        console.log(`[TestTreeDataProvider] File data:`, { fileRuntime, fileTestName, path, isFile });

        if (isFile) {
          console.log(`[TestTreeDataProvider] File is a leaf, returning empty array`);
          return Promise.resolve([]);
        }

        // Check if element has pre-populated children
        if (element.children && element.children.length > 0) {
          console.log(`[TestTreeDataProvider] File has pre-populated children`);
          return Promise.resolve(element.children);
        }

        // Handle directory expansion
        console.log(`[TestTreeDataProvider] Expanding directory for file`);
        return TestTreeUtils.getDirectoryChildren(fileRuntime, fileTestName, path || '');
      default:
        console.warn('[TestTreeDataProvider] Unknown element type:', element.type);
        return Promise.resolve([]);
    }
  }

  private async getRuntimeItems(): Promise<TestTreeItem[]> {
    const items: TestTreeItem[] = [];

    // Add config file item at the root
    items.push(this.createConfigFileItem());

    items.push(TestTreeUtils.createRefreshItem());

    // Add connection status item
    const connectionStatusItem = this.createConnectionStatusItem();
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
      // Try to fetch unified tree to get runtime information
      const response = await fetch(ApiUtils.getUnifiedTestTreeUrl());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const unifiedTree = data.tree || {};

      if (Object.keys(unifiedTree).length > 0) {
        items.push(new TestTreeItem(
          `Runtimes (${Object.keys(unifiedTree).length})`,
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Available test runtimes',
            count: Object.keys(unifiedTree).length
          },
          undefined,
          new vscode.ThemeIcon('symbol-namespace')
        ));

        for (const [runtimeKey, runtimeEntry] of Object.entries(unifiedTree)) {
          const runtime = runtimeEntry as any;
          const testCount = Object.keys(runtime.tests || {}).length;
          items.push(new TestTreeItem(
            runtimeKey,
            TreeItemType.Runtime,
            testCount > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            {
              runtime: runtimeKey,
              description: `${testCount} test(s)`,
              testsCount: testCount
            },
            undefined,
            new vscode.ThemeIcon('symbol-namespace')
          ));
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
    } catch (error) {
      console.error('[TestTreeDataProvider] Error fetching unified tree:', error);
      // Fall back to configs
      try {
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
      } catch (configError) {
        console.error('[TestTreeDataProvider] Error fetching configs:', configError);
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

  private async getTestItems(runtime?: string): Promise<TestTreeItem[]> {
    if (!runtime) {
      return [];
    }

    try {
      const response = await fetch(ApiUtils.getUnifiedTestTreeUrl());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const unifiedTree = data.tree || {};
      const runtimeEntry = unifiedTree[runtime];
      if (!runtimeEntry) {
        return [];
      }
      const tests = runtimeEntry.tests || {};
      return Object.keys(tests).map((testName: string) => {
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
      console.error('[TestTreeDataProvider] Error fetching unified tree for tests:', error);
      // Fall back to configs
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
  }

  private async getTestFileItems(
    runtimeKey: string,
    testName: string,
  ): Promise<TestTreeItem[]> {
    console.log(`[TestTreeDataProvider] getTestFileItems START for ${runtimeKey}/${testName} using unified tree`);

    try {
      console.log(`[TestTreeDataProvider] Fetching unified test tree from server...`);
      const items = this.getTestFileItems(runtimeKey, testName);

      console.log(`[TestTreeDataProvider] Built ${items.length} top-level items for ${runtimeKey}/${testName}`);
      return items;
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching unified test tree:", error);
      return createErrorItems(runtimeKey, testName);
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
