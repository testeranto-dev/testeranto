import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { TestTreeDataProviderUtils } from './TestTreeDataProviderUtils';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private configWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    super();
    TestTreeDataProviderUtils.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] Initial HTTP fetch failed:', error);
    });
    this.setupConfigWatcher();
  }

  refresh(): void {
    console.log('[TestTreeDataProvider] Manual refresh requested');
    TestTreeDataProviderUtils.fetchConfigsViaHttp().catch(error => {
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
      return TestTreeDataProviderUtils.getRuntimeItems();
    } else if (element.type === TreeItemType.Runtime) {
      const runtime = element.data?.runtime;
      return Promise.resolve(TestTreeDataProviderUtils.getTestItems(runtime));
    } else if (element.type === TreeItemType.Test) {
      const { runtime, testName } = element.data || {};
      return TestTreeDataProviderUtils.getTestFileItems(runtime, testName);
    } else if (element.type === TreeItemType.File) {
      const { 
        runtime, 
        testName, 
        path, 
        isFile,
        isTestResultsSection,
        isFilesSection,
        isFeaturesSection,
        isTestCasesSection,
        isTestCase,
        isFeature,
        filePath,
        testData,
        features,
        testCases,
        testCase
      } = element.data || {};

      if (isFile) {
        return Promise.resolve([]);
      }

      // Check if element has pre-populated children
      if (element.children && element.children.length > 0) {
        return Promise.resolve(element.children);
      }

      // Handle test results section
      if (isTestResultsSection) {
        // For now, return empty - the test results are already added in getTestFileItems
        return Promise.resolve([]);
      }
      
      // Handle files section
      if (isFilesSection) {
        return TestTreeDataProviderUtils.getDirectoryChildren(runtime, testName, '');
      }
      
      // Handle features section
      if (isFeaturesSection && features) {
        return Promise.resolve(features.map((feature: string) => {
          return new TestTreeItem(
            feature,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            { 
              runtime, 
              testName,
              isFeature: true,
              feature: feature 
            },
            undefined,
            new vscode.ThemeIcon("symbol-string")
          );
        }));
      }
      
      // Handle test cases section
      if (isTestCasesSection && testCases) {
        return Promise.resolve(testCases.map((tc: any) => {
          const statusIcon = tc.failed ? 
            new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed")) :
            new vscode.ThemeIcon("check", new vscode.ThemeColor("testing.iconPassed"));
          
          return new TestTreeItem(
            tc.key || `Test Case`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            { 
              runtime, 
              testName,
              isTestCase: true,
              testCase: tc 
            },
            undefined,
            statusIcon
          );
        }));
      }
      
      // Handle individual test case expansion
      if (isTestCase && testCase) {
        const items: TestTreeItem[] = [];
        
        // Add features if present
        if (testCase.features && Array.isArray(testCase.features)) {
          const featuresItem = new TestTreeItem(
            `Features (${testCase.features.length})`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            { 
              runtime, 
              testName,
              isTestCaseFeatures: true,
              features: testCase.features 
            },
            undefined,
            new vscode.ThemeIcon("list-unordered")
          );
          items.push(featuresItem);
        }
        
        // Add whens if present
        if (testCase.whens && Array.isArray(testCase.whens)) {
          const whensItem = new TestTreeItem(
            `Steps (${testCase.whens.length})`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            { 
              runtime, 
              testName,
              isTestCaseWhens: true,
              whens: testCase.whens 
            },
            undefined,
            new vscode.ThemeIcon("play")
          );
          items.push(whensItem);
        }
        
        // Add thens if present
        if (testCase.thens && Array.isArray(testCase.thens)) {
          const thensItem = new TestTreeItem(
            `Assertions (${testCase.thens.length})`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            { 
              runtime, 
              testName,
              isTestCaseThens: true,
              thens: testCase.thens 
            },
            undefined,
            new vscode.ThemeIcon("check")
          );
          items.push(thensItem);
        }
        
        return Promise.resolve(items);
      }
      
      // Handle test case features expansion
      if (element.data?.isTestCaseFeatures && features) {
        return Promise.resolve(features.map((feature: string) => {
          return new TestTreeItem(
            feature,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            { 
              runtime, 
              testName,
              isFeature: true,
              feature: feature 
            },
            undefined,
            new vscode.ThemeIcon("symbol-string")
          );
        }));
      }
      
      // Handle test case whens expansion
      if (element.data?.isTestCaseWhens && testCase?.whens) {
        return Promise.resolve(testCase.whens.map((w: any, i: number) => {
          const statusIcon = w.status ? 
            new vscode.ThemeIcon("check", new vscode.ThemeColor("testing.iconPassed")) :
            new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));
          
          return new TestTreeItem(
            `${i + 1}. ${w.name}`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            { 
              runtime, 
              testName,
              isWhen: true,
              when: w 
            },
            undefined,
            statusIcon
          );
        }));
      }
      
      // Handle test case thens expansion
      if (element.data?.isTestCaseThens && testCase?.thens) {
        return Promise.resolve(testCase.thens.map((t: any, i: number) => {
          const statusIcon = t.status ? 
            new vscode.ThemeIcon("check", new vscode.ThemeColor("testing.iconPassed")) :
            new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));
          
          return new TestTreeItem(
            `${i + 1}. ${t.name}`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            { 
              runtime, 
              testName,
              isThen: true,
              then: t 
            },
            undefined,
            statusIcon
          );
        }));
      }

      // Handle directory expansion
      return TestTreeDataProviderUtils.getDirectoryChildren(runtime, testName, path || '');
    }
    return Promise.resolve([]);
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
          TestTreeDataProviderUtils.fetchConfigsViaHttp().catch(error => {
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
