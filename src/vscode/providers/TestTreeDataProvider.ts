import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import type { IRunTime } from '../../Types';
import { TreeItemType } from '../types';

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  fullPath: string;
  isFile: boolean;
}

export class TestTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = new
    vscode.EventEmitter<TestTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private configData: any = null;
  private configWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    // Make initial HTTP request to get configs
    this.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] Initial HTTP fetch failed:', error);
    });
    // Connect to WebSocket for real-time updates
    this.connectWebSocket();
    // Also keep the file watcher for backward compatibility
    this.setupConfigWatcher();
  }

  refresh(): void {
    console.log('[TestTreeDataProvider] Manual refresh requested');
    this.fetchConfigsViaHttp().catch(error => {
      console.log('[TestTreeDataProvider] HTTP refresh failed:', error);
    });
  }

  private setupConfigWatcher(): void {
    // Watch for changes to the extension config file for backward compatibility
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
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
      // Show combined input and output files
      return this.getTestFileItems(runtime, testName);
    } else if (element.type === TreeItemType.File) {
      // Check if this is a directory (not a file)
      const { runtime, testName, path, isFile } = element.data || {};
      
      // If it's a file, no children
      if (isFile) {
        return Promise.resolve([]);
      }
      
      // If it's a directory, we need to get its children
      // Fetch all files and find the children for this path
      return this.getDirectoryChildren(runtime, testName, path);
    }
    return Promise.resolve([]);
  }

  private async getRuntimeItems(): Promise<TestTreeItem[]> {
    // Show connection status
    const items: TestTreeItem[] = [];

    // Add connection status item
    // if (this.isConnected) {
    //   items.push(
    //     new TestTreeItem(
    //       "✅ Connected via WebSocket",
    //       TreeItemType.Info,
    //       vscode.TreeItemCollapsibleState.None,
    //       {
    //         description: "Receiving real-time updates",
    //         connected: true
    //       },
    //       undefined,
    //       new vscode.ThemeIcon("radio-tower", new vscode.ThemeColor("testing.iconPassed"))
    //     )
    //   );
    // } else {
    //   items.push(
    //     new TestTreeItem(
    //       "⚠️ Not connected",
    //       TreeItemType.Info,
    //       vscode.TreeItemCollapsibleState.None,
    //       {
    //         description: "Click to retry WebSocket connection",
    //         disconnected: true
    //       },
    //       {
    //         command: "testeranto.retryConnection",
    //         title: "Retry Connection",
    //         arguments: [this]
    //       },
    //       new vscode.ThemeIcon("warning", new vscode.ThemeColor("testing.iconFailed"))
    //     )
    //   );
    // }

    // Add refresh item
    items.push(
      new TestTreeItem(
        "Refresh now",
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: "Update configuration from server",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode.ThemeIcon("refresh", new vscode.ThemeColor("testing.iconQueued"))
      )
    );

    // Check if we have config data from HTTP endpoint
    if (this.configData && this.configData.configs && this.configData.configs.runtimes) {
      const runtimes = this.configData.configs.runtimes;
      console.log(`[TestTreeDataProvider] Found ${Object.keys(runtimes).length} runtimes in config endpoint`);

      // Convert the runtimes object to an array for display
      const runtimeEntries = Object.entries(runtimes);

      if (runtimeEntries.length > 0) {
        // Add a header item
        items.push(
          new TestTreeItem(
            `📊 ${runtimeEntries.length} Runtime(s)`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "From HTTP /~/configs endpoint",
              count: runtimeEntries.length
            },
            undefined,
            new vscode.ThemeIcon("server", new vscode.ThemeColor("testing.iconUnset"))
          )
        );

        // Add each runtime
        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig as any;
          if (config.runtime) {
            items.push(
              new TestTreeItem(
                // config.runtime.charAt(0).toUpperCase() + config.runtime.slice(1),
                `${runtimeKey} (${config.runtime})`,
                TreeItemType.Runtime,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                  runtime: config.runtime,
                  runtimeKey: runtimeKey,
                  testsCount: config.tests?.length || 0
                },
                undefined,
                new vscode.ThemeIcon("symbol-namespace")
              )
            );
          }
        }
        return items;
      }
    }

  }

  private getTestItems(runtime?: string): TestTreeItem[] {
    if (!runtime) {
      return [];
    }

    // Try to get tests from HTTP config data first
    if (this.configData && this.configData.configs && this.configData.configs.runtimes) {
      const runtimes = this.configData.configs.runtimes;

      // Find the runtime configuration
      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig as any;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          console.log(`[TestTreeDataProvider] Found ${tests.length} tests for ${runtime} from HTTP endpoint`);
          return tests.map((testName: string) =>
            new TestTreeItem(
              testName,
              TreeItemType.Test,
              vscode.TreeItemCollapsibleState.Collapsed,
              { runtime, testName }
            )
          );
        }
      }
    }

    // Fallback to file-based config
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('[TestTreeDataProvider] No workspace folder open');
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri;
    const configUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'extension-config.json');

    try {
      const fileContent = vscode.workspace.fs.readFileSync(configUri);
      const config = JSON.parse(Buffer.from(fileContent).toString('utf-8'));

      if (config.runtimes && Array.isArray(config.runtimes)) {
        const runtimeConfig = config.runtimes.find((r: any) => r.runtime === runtime);
        if (runtimeConfig && runtimeConfig.tests && Array.isArray(runtimeConfig.tests)) {
          return runtimeConfig.tests.map((testName: string) =>
            new TestTreeItem(
              testName,
              TreeItemType.Test,
              vscode.TreeItemCollapsibleState.Collapsed,
              { runtime, testName }
            )
          );
        }
      }
      console.log(`[TestTreeDataProvider] No tests found for runtime: ${runtime}`);
      return [];
    } catch (error: any) {
      console.log(`[TestTreeDataProvider] Config file not available for tests: ${error.message}`);
      return [];
    }
  }

  public connectWebSocket(): void {
    if (this.ws) {
      // Close existing connection
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    console.log('[TestTreeDataProvider] Connecting to WebSocket at ws://localhost:3000');

    try {
      this.ws = new WebSocket('ws://localhost:3000');

      this.ws.onopen = () => {
        console.log('[TestTreeDataProvider] WebSocket connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
        this._onDidChangeTreeData.fire();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[TestTreeDataProvider] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[TestTreeDataProvider] WebSocket error:', error);
        this.isConnected = false;
        this._onDidChangeTreeData.fire();
      };

      this.ws.onclose = (event) => {
        console.log(`[TestTreeDataProvider] WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.ws = null;
        this._onDidChangeTreeData.fire();

        // Attempt to reconnect after 5 seconds
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          console.log(`[TestTreeDataProvider] Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts}) in 5 seconds...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, 5000);
        } else {
          console.log('[TestTreeDataProvider] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[TestTreeDataProvider] Failed to create WebSocket:', error);
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    }
  }

  private handleWebSocketMessage(message: any): void {
    console.log('[TestTreeDataProvider] Received WebSocket message:', message.type);

    switch (message.type) {
      case 'connected':
        console.log('[TestTreeDataProvider] WebSocket connection confirmed');
        break;
      case 'resourceChanged':
        console.log('[TestTreeDataProvider] Resource changed, fetching updated configs:', message.url);
        // If the configs resource changed, fetch via HTTP
        if (message.url === '/~/configs') {
          this.fetchConfigsViaHttp().catch(error => {
            console.log('[TestTreeDataProvider] HTTP fetch after resource change failed:', error);
          });
        }
        break;
      default:
        console.log('[TestTreeDataProvider] Unhandled message type:', message.type);
    }
  }

  private async fetchConfigsViaHttp(): Promise<void> {
    console.log('[TestTreeDataProvider] Fetching configs via HTTP from http://localhost:3000/~/configs');
    try {
      const response = await fetch('http://localhost:3000/~/configs');

      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        this.configData = null;
        this._onDidChangeTreeData.fire();
        return;
      }

      const data = await response.json();
      console.log(`[TestTreeDataProvider] HTTP fetch returned config data`);

      this.configData = data;
      console.log(`[TestTreeDataProvider] Updated config data`);
      this._onDidChangeTreeData.fire();
    } catch (error: any) {
      console.error('[TestTreeDataProvider] HTTP fetch failed:', error.message || error);
      this.configData = null;
      this._onDidChangeTreeData.fire();
    }
  }

  // The rest of the methods remain the same as before...
  // private async getFileItems(runtime: IRunTime, testName: string): Promise<TestTreeItem[]> {
  //   console.log("getFileItems");
  //   if (!runtime || !testName) {
  //     return [];
  //   }

  //   // return this.buildTreeItems(treeRoot, runtime, testName, workspaceRoot);

  //   // // Determine which JSON file to read based on runtime and testName
  //   // let jsonFilePath: string;
  //   // switch (runtime) {
  //   //   case "golang":
  //   //     jsonFilePath = "testeranto/bundles/allTests/golang/example/Calculator.test.go-inputFiles.json";
  //   //     break;
  //   //   case "python":
  //   //     jsonFilePath = "testeranto/bundles/allTests/python/example/Calculator.test.py-inputFiles.json";
  //   //     break;
  //   //   case "node":
  //   //     jsonFilePath = "testeranto/bundles/allTests/node/example/Calculator.test.mjs-inputFiles.json";
  //   //     break;
  //   //   case "web":
  //   //     jsonFilePath = "testeranto/bundles/allTests/web/example/Calculator.test.mjs-inputFiles.json";
  //   //     break;
  //   //   case "ruby":
  //   //     jsonFilePath = "testeranto/bundles/allTests/ruby/example/Calculator.test.rb-inputFiles.json";
  //   //     break;
  //   //   case "rust":
  //   //     jsonFilePath = "testeranto/bundles/allTests/rust/example/Calculator.test.rs-inputFiles.json";
  //   //     break;
  //   //   case "java":
  //   //     jsonFilePath = "testeranto/bundles/allTests/java/example/Calculator.test.java-inputFiles.json";
  //   //     break;
  //   //   default:
  //   //     return [];
  //   // }

  //   // try {
  //   //   // Get the workspace root
  //   //   const workspaceFolders = vscode.workspace.workspaceFolders;
  //   //   if (!workspaceFolders || workspaceFolders.length === 0) {
  //   //     throw new Error("No workspace folder open");
  //   //   }
  //   //   const workspaceRoot = workspaceFolders[0].uri;

  //   //   // Build the full URI to the JSON file
  //   //   const jsonFileUri = vscode.Uri.joinPath(workspaceRoot, jsonFilePath);
  //   //   console.log(`Reading JSON from: ${jsonFileUri.fsPath}`);

  //   //   // Read the JSON file
  //   //   const fileContent = await vscode.workspace.fs.readFile(jsonFileUri);
  //   //   const files: string[] = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
  //   //   console.log(`Found ${files.length} files in JSON`);

  //   //   // Build a tree structure
  //   //   const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

  //   //   for (const rawFileName of files) {
  //   //     // Remove leading '/' if present to make paths relative to workspace root
  //   //     const fileName = rawFileName.startsWith('/') ? rawFileName.substring(1) : rawFileName;
  //   //     const parts = fileName.split('/');
  //   //     let currentNode = treeRoot;

  //   //     for (let i = 0; i < parts.length; i++) {
  //   //       const part = parts[i];
  //   //       const isLast = i === parts.length - 1;

  //   //       if (!currentNode.children.has(part)) {
  //   //         currentNode.children.set(part, {
  //   //           name: part,
  //   //           children: new Map(),
  //   //           fullPath: parts.slice(0, i + 1).join('/'),
  //   //           isFile: isLast
  //   //         });
  //   //       }
  //   //       currentNode = currentNode.children.get(part)!;
  //   //     }
  //   //   }

  //   //   // Convert tree to TestTreeItems
  //   //   return this.buildTreeItems(treeRoot, runtime, testName, workspaceRoot);
  //   // } catch (error) {
  //   //   console.error(`Failed to read file list from ${jsonFilePath}:`, error);
  //   //   vscode.window.showErrorMessage(`Could not load file list for ${testName}: ${error}`);
  //   //   // Return empty array to prevent tree view from crashing
  //   //   return [];
  //   // }
  // }

  private async getTestFileItems(runtime: string, testName: string): Promise<TestTreeItem[]> {
    console.log(`[TestTreeDataProvider] Getting combined input and output files for ${runtime}/${testName}`);
    
    try {
      // Fetch both input and output files in parallel
      const [inputResponse, outputResponse] = await Promise.all([
        fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`),
        fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`)
      ]);

      let inputFiles: string[] = [];
      let outputFiles: string[] = [];

      // Process input files
      if (inputResponse.ok) {
        const inputData = await inputResponse.json();
        if (Array.isArray(inputData.inputFiles)) {
          inputFiles = inputData.inputFiles;
        } else if (inputData.inputFiles && typeof inputData.inputFiles === 'object') {
          for (const key in inputData.inputFiles) {
            if (Array.isArray(inputData.inputFiles[key])) {
              inputFiles = inputData.inputFiles[key];
              break;
            }
          }
        } else {
          for (const key in inputData) {
            if (Array.isArray(inputData[key])) {
              inputFiles = inputData[key];
              break;
            }
          }
        }
      }

      // Process output files
      if (outputResponse.ok) {
        const outputData = await outputResponse.json();
        if (Array.isArray(outputData.outputFiles)) {
          outputFiles = outputData.outputFiles;
        } else if (outputData.outputFiles && typeof outputData.outputFiles === 'object') {
          for (const key in outputData.outputFiles) {
            if (Array.isArray(outputData.outputFiles[key])) {
              outputFiles = outputData.outputFiles[key];
              break;
            }
          }
        } else {
          for (const key in outputData) {
            if (Array.isArray(outputData[key])) {
              outputFiles = outputData[key];
              break;
            }
          }
        }
      }

      // Combine all files
      const allFiles = [...inputFiles, ...outputFiles];
      console.log(`[TestTreeDataProvider] Found ${inputFiles.length} input files and ${outputFiles.length} output files (total: ${allFiles.length})`);

      if (allFiles.length === 0) {
        return [
          new TestTreeItem(
            "No files available",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't been built or generated output yet",
              runtime,
              testName
            },
            undefined,
            new vscode.ThemeIcon("info")
          )
        ];
      }

      // Build a tree structure from all file paths
      const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

      for (const filePath of allFiles) {
        // Normalize the path: remove leading '/' if present
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        // Split and filter out empty parts and '.' which represents current directory
        const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
        
        if (parts.length === 0) continue;
        
        let currentNode = treeRoot;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: new Map(),
              fullPath: parts.slice(0, i + 1).join('/'),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part)!;
        }
      }

      // Convert the tree to TestTreeItems
      return this.buildTreeItemsFromNode(treeRoot, runtime, testName);

    } catch (error: any) {
      console.error(`[TestTreeDataProvider] Failed to fetch combined files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch files",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime,
            testName
          },
          undefined,
          new vscode.ThemeIcon("error")
        )
      ];
    }
  }

  private async getInputFileItems(runtime: string, testName: string): Promise<TestTreeItem[]> {
    console.log(`[TestTreeDataProvider] Fetching input files for ${runtime}/${testName}`);

    try {
      // Fetch input files from server
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);

      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [
          new TestTreeItem(
            "No input files found",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "Server returned error",
              runtime,
              testName,
              fileType: 'input'
            },
            undefined,
            new vscode.ThemeIcon("warning")
          )
        ];
      }

      const data = await response.json();
      
      // Extract the list of input files
      // The API might return them in different formats, so let's be flexible
      let inputFiles: string[] = [];
      
      if (Array.isArray(data.inputFiles)) {
        // Direct array format
        inputFiles = data.inputFiles;
      } else if (data.inputFiles && typeof data.inputFiles === 'object') {
        // Try to find any array in the object
        for (const key in data.inputFiles) {
          if (Array.isArray(data.inputFiles[key])) {
            inputFiles = data.inputFiles[key];
            break;
          }
        }
      } else {
        // If we can't find inputFiles, check the root of the response
        for (const key in data) {
          if (Array.isArray(data[key])) {
            inputFiles = data[key];
            break;
          }
        }
      }

      console.log(`[TestTreeDataProvider] Found ${inputFiles.length} input files`);

      if (inputFiles.length === 0) {
        return [
          new TestTreeItem(
            "No input files available",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't been built yet",
              runtime,
              testName,
              fileType: 'input'
            },
            undefined,
            new vscode.ThemeIcon("info")
          )
        ];
      }

      // Build a tree structure from the file paths
      const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

      for (const filePath of inputFiles) {
        // Normalize the path: remove leading '/' if present
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        // Split and filter out empty parts and '.' which represents current directory
        const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
        
        if (parts.length === 0) continue;
        
        let currentNode = treeRoot;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: new Map(),
              fullPath: parts.slice(0, i + 1).join('/'),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part)!;
        }
      }

      // Convert the tree to TestTreeItems
      return this.buildTreeItemsFromNode(treeRoot, runtime, testName, 'input');

    } catch (error: any) {
      console.error(`[TestTreeDataProvider] Failed to fetch input files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch input files",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime,
            testName,
            fileType: 'input'
          },
          undefined,
          new vscode.ThemeIcon("error")
        )
      ];
    }
  }

  private async getOutputFileItems(runtime: string, testName: string): Promise<TestTreeItem[]> {
    console.log(`[TestTreeDataProvider] Fetching output files for ${runtime}/${testName}`);

    try {
      // Fetch output files from server
      const response = await fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);

      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [
          new TestTreeItem(
            "No output files found",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "Server returned error",
              runtime,
              testName,
              fileType: 'output'
            },
            undefined,
            new vscode.ThemeIcon("warning")
          )
        ];
      }

      const data = await response.json();
      
      // Extract the list of output files
      let outputFiles: string[] = [];
      
      if (Array.isArray(data.outputFiles)) {
        outputFiles = data.outputFiles;
      } else if (data.outputFiles && typeof data.outputFiles === 'object') {
        for (const key in data.outputFiles) {
          if (Array.isArray(data.outputFiles[key])) {
            outputFiles = data.outputFiles[key];
            break;
          }
        }
      } else {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            outputFiles = data[key];
            break;
          }
        }
      }

      console.log(`[TestTreeDataProvider] Found ${outputFiles.length} output files`);

      if (outputFiles.length === 0) {
        return [
          new TestTreeItem(
            "No output files available",
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't generated output yet",
              runtime,
              testName,
              fileType: 'output'
            },
            undefined,
            new vscode.ThemeIcon("info")
          )
        ];
      }

      // Build a tree structure from the file paths
      const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

      for (const filePath of outputFiles) {
        // Normalize the path: remove leading '/' if present
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        // Split and filter out empty parts and '.' which represents current directory
        const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
        
        if (parts.length === 0) continue;
        
        let currentNode = treeRoot;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: new Map(),
              // Reconstruct full path without leading '.'
              fullPath: parts.slice(0, i + 1).join('/'),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part)!;
        }
      }

      // Convert the tree to TestTreeItems
      return this.buildTreeItemsFromNode(treeRoot, runtime, testName, 'output');

    } catch (error: any) {
      console.error(`[TestTreeDataProvider] Failed to fetch output files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch output files",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime,
            testName,
            fileType: 'output'
          },
          undefined,
          new vscode.ThemeIcon("error")
        )
      ];
    }
  }

  private buildTreeItemsFromNode(
    node: TreeNode,
    runtime: string,
    testName: string
  ): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    // Sort children: folders first, then files, alphabetically
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      // Directories before files
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      // Alphabetical order
      return a.name.localeCompare(b.name);
    });

    for (const child of sortedChildren) {
      const collapsibleState = child.isFile
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed;

      // Get the workspace root to create absolute paths
      const workspaceFolders = vscode.workspace.workspaceFolders;
      let fileUri: vscode.Uri | undefined;
      
      if (child.isFile && workspaceFolders && workspaceFolders.length > 0) {
        // Create an absolute path by joining with workspace root
        // The child.fullPath might be relative, so we need to handle it properly
        const workspaceRoot = workspaceFolders[0].uri;
        // Check if the path is absolute or relative
        if (child.fullPath.startsWith('/')) {
          // Absolute path
          fileUri = vscode.Uri.file(child.fullPath);
        } else {
          // Relative to workspace
          fileUri = vscode.Uri.joinPath(workspaceRoot, child.fullPath);
        }
      }

      const treeItem = new TestTreeItem(
        child.name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          fileName: child.fullPath,
          path: child.fullPath,
          isFile: child.isFile
        },
        child.isFile && fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : undefined,
        child.isFile ? new vscode.ThemeIcon("file-text") : new vscode.ThemeIcon("folder")
      );

      items.push(treeItem);
    }

    return items;
  }

  private async getDirectoryChildren(runtime: string, testName: string, dirPath: string): Promise<TestTreeItem[]> {
    try {
      // Fetch both input and output files
      const [inputResponse, outputResponse] = await Promise.all([
        fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`),
        fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`)
      ]);

      let allFiles: string[] = [];

      // Process input files
      if (inputResponse.ok) {
        const inputData = await inputResponse.json();
        let inputFiles: string[] = [];
        if (Array.isArray(inputData.inputFiles)) {
          inputFiles = inputData.inputFiles;
        } else if (inputData.inputFiles && typeof inputData.inputFiles === 'object') {
          for (const key in inputData.inputFiles) {
            if (Array.isArray(inputData.inputFiles[key])) {
              inputFiles = inputData.inputFiles[key];
              break;
            }
          }
        } else {
          for (const key in inputData) {
            if (Array.isArray(inputData[key])) {
              inputFiles = inputData[key];
              break;
            }
          }
        }
        allFiles.push(...inputFiles);
      }

      // Process output files
      if (outputResponse.ok) {
        const outputData = await outputResponse.json();
        let outputFiles: string[] = [];
        if (Array.isArray(outputData.outputFiles)) {
          outputFiles = outputData.outputFiles;
        } else if (outputData.outputFiles && typeof outputData.outputFiles === 'object') {
          for (const key in outputData.outputFiles) {
            if (Array.isArray(outputData.outputFiles[key])) {
              outputFiles = outputData.outputFiles[key];
              break;
            }
          }
        } else {
          for (const key in outputData) {
            if (Array.isArray(outputData[key])) {
              outputFiles = outputData[key];
              break;
            }
          }
        }
        allFiles.push(...outputFiles);
      }

      // Build a tree structure from all file paths
      const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

      for (const filePath of allFiles) {
        // Normalize the path: remove leading '/' if present
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        // Split and filter out empty parts and '.' which represents current directory
        const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
        
        if (parts.length === 0) continue;
        
        let currentNode = treeRoot;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: new Map(),
              fullPath: parts.slice(0, i + 1).join('/'),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part)!;
        }
      }

      // Find the node corresponding to the directory path
      // Remove leading '/' if present in dirPath
      const normalizedDirPath = dirPath.startsWith('/') ? dirPath.substring(1) : dirPath;
      const dirParts = normalizedDirPath.split('/').filter(part => part.length > 0);
      
      let currentNode = treeRoot;
      for (const part of dirParts) {
        if (currentNode.children.has(part)) {
          currentNode = currentNode.children.get(part)!;
        } else {
          // Directory not found
          return [];
        }
      }

      // Build tree items for the children of this directory
      return this.buildTreeItemsFromNode(currentNode, runtime, testName);
    } catch (error: any) {
      console.error(`[TestTreeDataProvider] Failed to get directory children:`, error);
      return [];
    }
  }

  private async getFileTreeItems(runtime: IRunTime, testName: string): Promise<TestTreeItem[]> {
    // Get input files from server API
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);

      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error getting input files for tree: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const inputFiles = data.inputFiles || [];

      // Build tree structure from file paths
      const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

      for (const filePath of inputFiles) {
        // Remove leading '/' if present
        const fileName = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const parts = fileName.split('/');
        let currentNode = treeRoot;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          // Skip empty parts and '.' which represents current directory
          if (!part || part.trim().length === 0 || part === '.') {
            continue;
          }
          const isLast = i === parts.length - 1;

          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: new Map(),
              fullPath: parts.slice(0, i + 1).join('/'),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part)!;
        }
      }

      return this.buildTreeItems(treeRoot, runtime, testName);
    } catch (error: any) {
      console.error(`[TestTreeDataProvider] Failed to get file tree items:`, error);
      return [];
    }
  }

  private buildTreeItems(
    node: TreeNode,
    runtime: IRunTime,
    testName: string,
    workspaceRoot?: vscode.Uri
  ): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.isFile && !b.isFile) return 1;
      if (!a.isFile && b.isFile) return -1;
      return a.name.localeCompare(b.name);
    });

    for (const child of sortedChildren) {
      const collapsibleState = child.isFile
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed;

      // Create the full file path
      const fullPath = workspaceRoot ?
        vscode.Uri.joinPath(workspaceRoot, child.fullPath).fsPath :
        child.fullPath;

      const treeItem = new TestTreeItem(
        child.name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          fileName: child.fullPath,
          path: child.fullPath
        },
        child.isFile ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [vscode.Uri.file(fullPath)]
        } : undefined,
        child.isFile ? new vscode.ThemeIcon("file") : new vscode.ThemeIcon("folder")
      );

      items.push(treeItem);
    }

    return items;
  }

  // private async getDirectoryItems(runtime: IRunTime, testName: string, path: string): Promise<TestTreeItem[]> {
  //   const tree = await this.buildFileTree(runtime, testName);
  //   if (!tree) {
  //     return [];
  //   }

  //   // Find the node corresponding to the path
  //   const parts = path.split('/').filter(p => p.length > 0);
  //   let currentNode = tree;
  //   for (const part of parts) {
  //     if (currentNode.children.has(part)) {
  //       currentNode = currentNode.children.get(part)!;
  //     } else {
  //       return [];
  //     }
  //   }

  //   return this.buildTreeItems(currentNode, runtime, testName);
  // }
}
