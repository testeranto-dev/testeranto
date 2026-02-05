// src/vscode/extension.ts
import * as vscode6 from "vscode";

// src/vscode/TerminalManager.ts
import * as vscode from "vscode";
var TerminalManager = class {
  terminals = /* @__PURE__ */ new Map();
  getTerminalKey(runtime, testName) {
    return `${runtime}:${testName}`;
  }
  createTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = vscode.window.createTerminal(`Testeranto: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    return terminal;
  }
  getTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    return this.terminals.get(key);
  }
  showTerminal(runtime, testName) {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.show();
    }
    return terminal;
  }
  sendTextToTerminal(runtime, testName, text) {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.sendText(text);
    }
  }
  disposeTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = this.terminals.get(key);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(key);
    }
  }
  disposeAll() {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
  }
  getAllTestConfigs() {
    const configs = [];
    const runtimes = ["node", "web", "python", "golang"];
    for (const runtime of runtimes) {
      let testNames = [];
      switch (runtime) {
        case "node":
          testNames = ["Calculator.test.ts"];
          break;
        case "web":
          testNames = ["Calculator.test.ts"];
          break;
        case "python":
          testNames = ["Calculator.pitono.test.py"];
          break;
        case "golang":
          testNames = ["Calculator.golingvu.test.go"];
          break;
      }
      for (const testName of testNames) {
        configs.push({ runtime, testName });
      }
    }
    return configs;
  }
  createAiderTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      return terminal;
    }
    terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    return terminal;
  }
  createAllTerminals() {
    const configs = this.getAllTestConfigs();
    for (const { runtime, testName } of configs) {
      try {
        this.createTerminal(runtime, testName);
      } catch (error) {
        console.error(`Failed to create terminal for ${testName} (${runtime}):`, error);
      }
    }
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode3 from "vscode";

// src/vscode/TestTreeItem.ts
import * as vscode2 from "vscode";
var TestTreeItem = class extends vscode2.TreeItem {
  constructor(label, type, collapsibleState, data, command, iconPath) {
    super(label, collapsibleState);
    this.label = label;
    this.type = type;
    this.collapsibleState = collapsibleState;
    this.data = data;
    this.command = command;
    this.iconPath = iconPath;
    this.tooltip = `${this.label}`;
    if (data?.description) {
      this.description = data.description;
    }
    this.iconPath = iconPath || this.getDefaultIcon();
    this.contextValue = this.getContextValue();
  }
  getDefaultIcon() {
    switch (this.type) {
      case 0 /* Runtime */:
        return new vscode2.ThemeIcon("symbol-namespace");
      case 1 /* Test */:
        return new vscode2.ThemeIcon("beaker");
      case 2 /* File */:
        return new vscode2.ThemeIcon("file");
      case 3 /* Info */:
        return new vscode2.ThemeIcon("info");
      default:
        return void 0;
    }
  }
  getContextValue() {
    switch (this.type) {
      case 0 /* Runtime */:
        return "runtimeItem";
      case 1 /* Test */:
        return "testItem";
      case 2 /* File */:
        return "fileItem";
      case 3 /* Info */:
        return "infoItem";
      default:
        return "unknown";
    }
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
var TestTreeDataProvider = class {
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  ws = null;
  isConnected = false;
  connectionAttempts = 0;
  maxConnectionAttempts = 5;
  reconnectTimeout = null;
  configData = null;
  configWatcher;
  constructor() {
    this.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.connectWebSocket();
    this.setupConfigWatcher();
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    this.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] HTTP refresh failed:", error);
    });
  }
  setupConfigWatcher() {
    const workspaceFolders = vscode3.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode3.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
    this.configWatcher = vscode3.workspace.createFileSystemWatcher(configPattern);
    this.configWatcher.onDidChange(() => {
      console.log("[TestTreeDataProvider] Config file changed, refreshing tree");
      this.refresh();
    });
    this.configWatcher.onDidCreate(() => {
      console.log("[TestTreeDataProvider] Config file created, refreshing tree");
      this.refresh();
    });
    this.configWatcher.onDidDelete(() => {
      console.log("[TestTreeDataProvider] Config file deleted, refreshing tree");
      this.refresh();
    });
  }
  dispose() {
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
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return this.getRuntimeItems();
    } else if (element.type === 0 /* Runtime */) {
      const runtime = element.data?.runtime;
      return Promise.resolve(this.getTestItems(runtime));
    } else if (element.type === 1 /* Test */) {
      const { runtime, testName } = element.data || {};
      return this.getInputFileItems(runtime, testName);
    } else if (element.type === 2 /* File */) {
      const { runtime, testName, path: path2, isFile } = element.data || {};
      if (isFile) {
        return Promise.resolve([]);
      }
      return this.getDirectoryChildren(runtime, testName, path2);
    }
    return Promise.resolve([]);
  }
  async getRuntimeItems() {
    const items = [];
    items.push(
      new TestTreeItem(
        "Refresh now",
        3 /* Info */,
        vscode3.TreeItemCollapsibleState.None,
        {
          description: "Update configuration from server",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode3.ThemeIcon("refresh", new vscode3.ThemeColor("testing.iconQueued"))
      )
    );
    if (this.configData && this.configData.configs && this.configData.configs.runtimes) {
      const runtimes = this.configData.configs.runtimes;
      console.log(`[TestTreeDataProvider] Found ${Object.keys(runtimes).length} runtimes in config endpoint`);
      const runtimeEntries = Object.entries(runtimes);
      if (runtimeEntries.length > 0) {
        items.push(
          new TestTreeItem(
            `\u{1F4CA} ${runtimeEntries.length} Runtime(s)`,
            3 /* Info */,
            vscode3.TreeItemCollapsibleState.None,
            {
              description: "From HTTP /~/configs endpoint",
              count: runtimeEntries.length
            },
            void 0,
            new vscode3.ThemeIcon("server", new vscode3.ThemeColor("testing.iconUnset"))
          )
        );
        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig;
          if (config.runtime) {
            items.push(
              new TestTreeItem(
                // config.runtime.charAt(0).toUpperCase() + config.runtime.slice(1),
                `${runtimeKey} (${config.runtime})`,
                0 /* Runtime */,
                vscode3.TreeItemCollapsibleState.Collapsed,
                {
                  runtime: config.runtime,
                  runtimeKey,
                  testsCount: config.tests?.length || 0
                },
                void 0,
                new vscode3.ThemeIcon("symbol-namespace")
              )
            );
          }
        }
        return items;
      }
    }
  }
  getTestItems(runtime) {
    if (!runtime) {
      return [];
    }
    if (this.configData && this.configData.configs && this.configData.configs.runtimes) {
      const runtimes = this.configData.configs.runtimes;
      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          console.log(`[TestTreeDataProvider] Found ${tests.length} tests for ${runtime} from HTTP endpoint`);
          return tests.map(
            (testName) => new TestTreeItem(
              testName,
              1 /* Test */,
              vscode3.TreeItemCollapsibleState.Collapsed,
              { runtime, testName }
            )
          );
        }
      }
    }
    const workspaceFolders = vscode3.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log("[TestTreeDataProvider] No workspace folder open");
      return [];
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configUri = vscode3.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
    try {
      const fileContent = vscode3.workspace.fs.readFileSync(configUri);
      const config = JSON.parse(Buffer.from(fileContent).toString("utf-8"));
      if (config.runtimes && Array.isArray(config.runtimes)) {
        const runtimeConfig = config.runtimes.find((r) => r.runtime === runtime);
        if (runtimeConfig && runtimeConfig.tests && Array.isArray(runtimeConfig.tests)) {
          return runtimeConfig.tests.map(
            (testName) => new TestTreeItem(
              testName,
              1 /* Test */,
              vscode3.TreeItemCollapsibleState.Collapsed,
              { runtime, testName }
            )
          );
        }
      }
      console.log(`[TestTreeDataProvider] No tests found for runtime: ${runtime}`);
      return [];
    } catch (error) {
      console.log(`[TestTreeDataProvider] Config file not available for tests: ${error.message}`);
      return [];
    }
  }
  connectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    console.log("[TestTreeDataProvider] Connecting to WebSocket at ws://localhost:3000");
    try {
      this.ws = new WebSocket("ws://localhost:3000");
      this.ws.onopen = () => {
        console.log("[TestTreeDataProvider] WebSocket connected");
        this.isConnected = true;
        this.connectionAttempts = 0;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error("[TestTreeDataProvider] Error parsing WebSocket message:", error);
        }
      };
      this.ws.onerror = (error) => {
        console.error("[TestTreeDataProvider] WebSocket error:", error);
        this.isConnected = false;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onclose = (event) => {
        console.log(`[TestTreeDataProvider] WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.ws = null;
        this._onDidChangeTreeData.fire();
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          console.log(`[TestTreeDataProvider] Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts}) in 5 seconds...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, 5e3);
        } else {
          console.log("[TestTreeDataProvider] Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("[TestTreeDataProvider] Failed to create WebSocket:", error);
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    }
  }
  handleWebSocketMessage(message) {
    console.log("[TestTreeDataProvider] Received WebSocket message:", message.type);
    switch (message.type) {
      case "connected":
        console.log("[TestTreeDataProvider] WebSocket connection confirmed");
        break;
      case "resourceChanged":
        console.log("[TestTreeDataProvider] Resource changed, fetching updated configs:", message.url);
        if (message.url === "/~/configs") {
          this.fetchConfigsViaHttp().catch((error) => {
            console.log("[TestTreeDataProvider] HTTP fetch after resource change failed:", error);
          });
        }
        break;
      default:
        console.log("[TestTreeDataProvider] Unhandled message type:", message.type);
    }
  }
  async fetchConfigsViaHttp() {
    console.log("[TestTreeDataProvider] Fetching configs via HTTP from http://localhost:3000/~/configs");
    try {
      const response = await fetch("http://localhost:3000/~/configs");
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
    } catch (error) {
      console.error("[TestTreeDataProvider] HTTP fetch failed:", error.message || error);
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
  async getInputFileItems(runtime, testName) {
    console.log(`[TestTreeDataProvider] Fetching input files for ${runtime}/${testName}`);
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [
          new TestTreeItem(
            "No input files found",
            2 /* File */,
            vscode3.TreeItemCollapsibleState.None,
            {
              description: "Server returned error",
              runtime,
              testName
            },
            void 0,
            new vscode3.ThemeIcon("warning")
          )
        ];
      }
      const data = await response.json();
      let inputFiles = [];
      if (Array.isArray(data.inputFiles)) {
        inputFiles = data.inputFiles;
      } else if (data.inputFiles && typeof data.inputFiles === "object") {
        for (const key in data.inputFiles) {
          if (Array.isArray(data.inputFiles[key])) {
            inputFiles = data.inputFiles[key];
            break;
          }
        }
      } else {
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
            2 /* File */,
            vscode3.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't been built yet",
              runtime,
              testName
            },
            void 0,
            new vscode3.ThemeIcon("info")
          )
        ];
      }
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of inputFiles) {
        const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0);
        if (parts.length === 0) continue;
        let currentNode = treeRoot;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: /* @__PURE__ */ new Map(),
              fullPath: parts.slice(0, i + 1).join("/"),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part);
        }
      }
      return this.buildTreeItemsFromNode(treeRoot, runtime, testName);
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to fetch input files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch input files",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime,
            testName
          },
          void 0,
          new vscode3.ThemeIcon("error")
        )
      ];
    }
  }
  buildTreeItemsFromNode(node, runtime, testName) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode3.TreeItemCollapsibleState.None : vscode3.TreeItemCollapsibleState.Collapsed;
      const workspaceFolders = vscode3.workspace.workspaceFolders;
      let fileUri;
      if (child.isFile && workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (child.fullPath.startsWith("/")) {
          fileUri = vscode3.Uri.file(child.fullPath);
        } else {
          fileUri = vscode3.Uri.joinPath(workspaceRoot, child.fullPath);
        }
      }
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
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
        } : void 0,
        child.isFile ? new vscode3.ThemeIcon("file-text") : new vscode3.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  async getDirectoryChildren(runtime, testName, dirPath) {
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [];
      }
      const data = await response.json();
      let inputFiles = [];
      if (Array.isArray(data.inputFiles)) {
        inputFiles = data.inputFiles;
      } else if (data.inputFiles && typeof data.inputFiles === "object") {
        for (const key in data.inputFiles) {
          if (Array.isArray(data.inputFiles[key])) {
            inputFiles = data.inputFiles[key];
            break;
          }
        }
      } else {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            inputFiles = data[key];
            break;
          }
        }
      }
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of inputFiles) {
        const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0);
        if (parts.length === 0) continue;
        let currentNode2 = treeRoot;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!currentNode2.children.has(part)) {
            currentNode2.children.set(part, {
              name: part,
              children: /* @__PURE__ */ new Map(),
              fullPath: parts.slice(0, i + 1).join("/"),
              isFile: isLast
            });
          }
          currentNode2 = currentNode2.children.get(part);
        }
      }
      const normalizedDirPath = dirPath.startsWith("/") ? dirPath.substring(1) : dirPath;
      const dirParts = normalizedDirPath.split("/").filter((part) => part.length > 0);
      let currentNode = treeRoot;
      for (const part of dirParts) {
        if (currentNode.children.has(part)) {
          currentNode = currentNode.children.get(part);
        } else {
          return [];
        }
      }
      return this.buildTreeItemsFromNode(currentNode, runtime, testName);
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to get directory children:`, error);
      return [];
    }
  }
  async getFileTreeItems(runtime, testName) {
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error getting input files for tree: ${response.status}`);
        return [];
      }
      const data = await response.json();
      const inputFiles = data.inputFiles || [];
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of inputFiles) {
        const fileName = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = fileName.split("/");
        let currentNode = treeRoot;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part || part.trim().length === 0) {
            continue;
          }
          const isLast = i === parts.length - 1;
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: /* @__PURE__ */ new Map(),
              fullPath: parts.slice(0, i + 1).join("/"),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part);
        }
      }
      return this.buildTreeItems(treeRoot, runtime, testName);
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to get file tree items:`, error);
      return [];
    }
  }
  buildTreeItems(node, runtime, testName, workspaceRoot) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.isFile && !b.isFile) return 1;
      if (!a.isFile && b.isFile) return -1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode3.TreeItemCollapsibleState.None : vscode3.TreeItemCollapsibleState.Collapsed;
      const fullPath = workspaceRoot ? vscode3.Uri.joinPath(workspaceRoot, child.fullPath).fsPath : child.fullPath;
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
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
          arguments: [vscode3.Uri.file(fullPath)]
        } : void 0,
        child.isFile ? new vscode3.ThemeIcon("file") : new vscode3.ThemeIcon("folder")
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
};

// src/vscode/providers/ProcessesTreeDataProvider.ts
import * as vscode4 from "vscode";
var ProcessesTreeDataProvider = class {
  _onDidChangeTreeData = new vscode4.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  processes = [];
  ws = null;
  isConnected = false;
  connectionAttempts = 0;
  maxConnectionAttempts = 5;
  reconnectTimeout = null;
  constructor() {
    this.fetchProcessesViaHttp().catch((error) => {
      console.log("[ProcessesTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.connectWebSocket();
  }
  refresh() {
    console.log("[ProcessesTreeDataProvider] Manual refresh requested");
    this.fetchProcessesViaHttp().catch((error) => {
      console.log("[ProcessesTreeDataProvider] HTTP refresh failed:", error);
    });
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.getProcessItems());
    }
    return Promise.resolve([]);
  }
  getProcessItems() {
    const items = [];
    if (this.isConnected) {
      items.push(
        new TestTreeItem(
          "\u2705 Connected via WebSocket",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Receiving real-time updates",
            connected: true
          },
          void 0,
          new vscode4.ThemeIcon("radio-tower", new vscode4.ThemeColor("testing.iconPassed"))
        )
      );
    } else {
      items.push(
        new TestTreeItem(
          "\u26A0\uFE0F Not connected",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Click to retry WebSocket connection",
            disconnected: true
          },
          {
            command: "testeranto.retryConnection",
            title: "Retry Connection",
            arguments: [this]
          },
          new vscode4.ThemeIcon("warning", new vscode4.ThemeColor("testing.iconFailed"))
        )
      );
    }
    items.push(
      new TestTreeItem(
        "Refresh now",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          description: "Update Docker container list",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode4.ThemeIcon("refresh", new vscode4.ThemeColor("testing.iconQueued"))
      )
    );
    if (this.processes.length > 0) {
      items.push(
        new TestTreeItem(
          `\u{1F4E6} ${this.processes.length} Docker container(s)`,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Active and stopped containers",
            count: this.processes.length
          },
          void 0,
          new vscode4.ThemeIcon("package", new vscode4.ThemeColor("testing.iconUnset"))
        )
      );
      for (const process2 of this.processes) {
        let icon;
        let labelPrefix = "";
        let statusColor;
        let status = process2.status || "";
        const state = process2.state || "";
        const isActive = process2.isActive === true;
        const runtime = process2.runtime || "unknown";
        if (isActive) {
          icon = new vscode4.ThemeIcon("play", new vscode4.ThemeColor("testing.iconPassed"));
          labelPrefix = "\u25B6 ";
          statusColor = new vscode4.ThemeColor("testing.iconPassed");
        } else {
          icon = new vscode4.ThemeIcon("stop", new vscode4.ThemeColor("testing.iconFailed"));
          labelPrefix = "\u25A0 ";
          statusColor = new vscode4.ThemeColor("testing.iconFailed");
          if (process2.exitCode !== null && process2.exitCode !== void 0) {
            status = `${status} (exit: ${process2.exitCode})`;
          }
        }
        const containerName = process2.processId || process2.name || "Unknown";
        const label = `${labelPrefix}${containerName}`;
        let description = "";
        if (process2.command) {
          description = process2.command;
        } else if (process2.image) {
          description = process2.image;
        }
        if (status) {
          description = `${description} - ${status}`;
        }
        description = `${description} [${runtime}]`;
        items.push(
          new TestTreeItem(
            label,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              description,
              status,
              state,
              isActive,
              processId: process2.processId,
              runtime,
              ports: process2.ports,
              exitCode: process2.exitCode,
              containerName,
              startedAt: process2.startedAt,
              finishedAt: process2.finishedAt
            },
            void 0,
            icon
          )
        );
      }
    } else {
      items.push(
        new TestTreeItem(
          "No Docker containers found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Make sure the Testeranto server is running on port 3000",
            noProcesses: true
          },
          void 0,
          new vscode4.ThemeIcon("info", new vscode4.ThemeColor("testing.iconUnset"))
        )
      );
      items.push(
        new TestTreeItem(
          "Start Testeranto Server",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Launch the server in a terminal",
            startServer: true
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode4.ThemeIcon("play", new vscode4.ThemeColor("testing.iconPassed"))
        )
      );
    }
    return items;
  }
  connectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    console.log("[ProcessesTreeDataProvider] Connecting to WebSocket at ws://localhost:3000");
    try {
      this.ws = new WebSocket("ws://localhost:3000");
      this.ws.onopen = () => {
        console.log("[ProcessesTreeDataProvider] WebSocket connected");
        this.isConnected = true;
        this.connectionAttempts = 0;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error("[ProcessesTreeDataProvider] Error parsing WebSocket message:", error);
        }
      };
      this.ws.onerror = (error) => {
        console.error("[ProcessesTreeDataProvider] WebSocket error:", error);
        this.isConnected = false;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onclose = (event) => {
        console.log(`[ProcessesTreeDataProvider] WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.ws = null;
        this._onDidChangeTreeData.fire();
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          console.log(`[ProcessesTreeDataProvider] Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts}) in 5 seconds...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, 5e3);
        } else {
          console.log("[ProcessesTreeDataProvider] Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("[ProcessesTreeDataProvider] Failed to create WebSocket:", error);
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    }
  }
  handleWebSocketMessage(message) {
    console.log("[ProcessesTreeDataProvider] Received WebSocket message:", message.type);
    switch (message.type) {
      case "connected":
        console.log("[ProcessesTreeDataProvider] WebSocket connection confirmed");
        break;
      case "resourceChanged":
        console.log("[ProcessesTreeDataProvider] Resource changed, fetching updated processes:", message.url);
        if (message.url === "/~/processes") {
          this.fetchProcessesViaHttp().catch((error) => {
            console.log("[ProcessesTreeDataProvider] HTTP fetch after resource change failed:", error);
          });
        }
        break;
      case "useHttp":
        console.log("[ProcessesTreeDataProvider] Server requested HTTP for processes");
        this.fetchProcessesViaHttp().catch((error) => {
          console.log("[ProcessesTreeDataProvider] HTTP fetch failed:", error);
        });
        break;
      default:
        console.log("[ProcessesTreeDataProvider] Unhandled message type:", message.type);
    }
  }
  async fetchProcessesViaHttp() {
    console.log("[ProcessesTreeDataProvider] Fetching processes via HTTP from http://localhost:3000/~/processes");
    try {
      const response = await fetch("http://localhost:3000/~/processes");
      if (!response.ok) {
        console.error(`[ProcessesTreeDataProvider] HTTP error! status: ${response.status}`);
        this.processes = [];
        this._onDidChangeTreeData.fire();
        return;
      }
      const data = await response.json();
      console.log(`[ProcessesTreeDataProvider] HTTP fetch returned ${data.processes?.length || 0} processes`);
      this.processes = data.processes || [];
      console.log(`[ProcessesTreeDataProvider] Updated processes array to have ${this.processes.length} items`);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error("[ProcessesTreeDataProvider] HTTP fetch failed:", error.message || error);
      this.processes = [];
      this._onDidChangeTreeData.fire();
    }
  }
  dispose() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
};

// src/vscode/providers/FeaturesTreeDataProvider.ts
import * as vscode5 from "vscode";
import * as fs from "fs";
import * as path from "path";
var FeaturesTreeDataProvider = class {
  _onDidChangeTreeData = new vscode5.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  resultsDir;
  constructor() {
    const workspaceFolders = vscode5.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.resultsDir = path.join(workspaceFolders[0].uri.fsPath, "testeranto", "reports", "allTests", "example");
    } else {
      this.resultsDir = path.join(process.cwd(), "testeranto", "reports", "allTests", "example");
    }
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.getSourceStructure());
    } else {
      const data = element.data;
      if (data?.sourcePath) {
        return Promise.resolve(this.getSourceChildren(data.sourcePath));
      } else if (data?.testFile && data.testResultIndex === void 0) {
        return Promise.resolve(this.getTestResults(data.testFile));
      } else if (data?.testResultIndex !== void 0) {
        return Promise.resolve(this.getTestDetails(data.testFile, data.testResultIndex));
      }
    }
    return Promise.resolve([]);
  }
  getSourceStructure() {
    if (!fs.existsSync(this.resultsDir)) {
      return [
        new TestTreeItem(
          "No test results found",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate results in testeranto/reports/allTests/example/"
          },
          void 0,
          new vscode5.ThemeIcon("info")
        )
      ];
    }
    const files = fs.readdirSync(this.resultsDir).filter((file) => file.endsWith(".json"));
    if (files.length === 0) {
      return [
        new TestTreeItem(
          "No test results found",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate results"
          },
          void 0,
          new vscode5.ThemeIcon("info")
        )
      ];
    }
    const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
    const exampleNode = {
      name: "example",
      children: /* @__PURE__ */ new Map(),
      fullPath: "example",
      isFile: false
    };
    treeRoot.children.set("example", exampleNode);
    for (const file of files) {
      const match = file.match(/^\w+\.(.+)\.json$/);
      if (match) {
        const testFileName = match[1];
        if (!exampleNode.children.has(testFileName)) {
          exampleNode.children.set(testFileName, {
            name: testFileName,
            children: /* @__PURE__ */ new Map(),
            fullPath: `example/${testFileName}`,
            isFile: true,
            fileName: file
          });
        }
      }
    }
    return this.buildSourceTreeItems(treeRoot);
  }
  buildSourceTreeItems(node) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.isFile && !b.isFile) return 1;
      if (!a.isFile && b.isFile) return -1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = vscode5.TreeItemCollapsibleState.Collapsed;
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
        collapsibleState,
        {
          sourcePath: child.fullPath,
          testFile: child.fileName,
          fileName: child.fileName,
          // Add a flag to indicate if it's a file or directory
          isFile: child.isFile
        },
        void 0,
        child.isFile ? new vscode5.ThemeIcon("file-code") : new vscode5.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  getSourceChildren(sourcePath) {
    if (!fs.existsSync(this.resultsDir)) {
      return [];
    }
    const files = fs.readdirSync(this.resultsDir).filter((file) => file.endsWith(".json"));
    const parts = sourcePath.split("/").filter((p) => p.length > 0);
    if (parts.length === 0) {
      return [
        new TestTreeItem(
          "example",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          {
            sourcePath: "example",
            isFile: false
          },
          void 0,
          new vscode5.ThemeIcon("folder")
        )
      ];
    }
    if (parts.length === 1 && parts[0] === "example") {
      const testFiles = /* @__PURE__ */ new Map();
      for (const file of files) {
        const match = file.match(/^(\w+)\.(.+)\.json$/);
        if (match) {
          const runtime = match[1];
          const testName = match[2];
          if (!testFiles.has(testName)) {
            testFiles.set(testName, []);
          }
          testFiles.get(testName).push(file);
        }
      }
      const items = [];
      for (const [testName, runtimeFiles] of testFiles) {
        let passedCount = 0;
        let failedCount = 0;
        for (const file of runtimeFiles) {
          try {
            const filePath = path.join(this.resultsDir, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const result = JSON.parse(content);
            if (result.status === true || result.failed === false) {
              passedCount++;
            } else {
              failedCount++;
            }
          } catch {
          }
        }
        const total = runtimeFiles.length;
        const description = `${passedCount} passed, ${failedCount} failed`;
        items.push(
          new TestTreeItem(
            testName,
            2 /* File */,
            vscode5.TreeItemCollapsibleState.Collapsed,
            {
              sourcePath: `example/${testName}`,
              testName,
              isFile: true,
              description
            },
            void 0,
            failedCount === 0 ? new vscode5.ThemeIcon("file-code", new vscode5.ThemeColor("testing.iconPassed")) : new vscode5.ThemeIcon("file-code", new vscode5.ThemeColor("testing.iconFailed"))
          )
        );
      }
      return items.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (parts.length === 2 && parts[0] === "example") {
      const testName = parts[1];
      const runtimeFiles = files.filter((file) => {
        const match = file.match(/^(\w+)\.(.+)\.json$/);
        return match && match[2] === testName;
      });
      return runtimeFiles.map((file) => {
        const match = file.match(/^(\w+)\.(.+)\.json$/);
        const runtime = match ? match[1] : "unknown";
        let icon = new vscode5.ThemeIcon("file-code");
        let description = "";
        try {
          const filePath = path.join(this.resultsDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const result = JSON.parse(content);
          if (result.status === true || result.failed === false) {
            icon = new vscode5.ThemeIcon("check", new vscode5.ThemeColor("testing.iconPassed"));
            description = "PASSED";
          } else {
            icon = new vscode5.ThemeIcon("error", new vscode5.ThemeColor("testing.iconFailed"));
            description = `FAILED: ${result.fails || 0} failures`;
          }
        } catch {
          description = "Error reading file";
          icon = new vscode5.ThemeIcon("warning");
        }
        return new TestTreeItem(
          runtime,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          {
            sourcePath: `example/${testName}/${runtime}`,
            testFile: file,
            fileName: file,
            isFile: true,
            description
          },
          void 0,
          icon
        );
      }).sort((a, b) => a.label.localeCompare(b.label));
    }
    if (parts.length === 3 && parts[0] === "example") {
      const testName = parts[1];
      const runtime = parts[2];
      const fileName = `${runtime}.${testName}.json`;
      if (files.includes(fileName)) {
        return this.getTestResults(fileName);
      }
    }
    return [];
  }
  getTestResults(testFile) {
    const filePath = path.join(this.resultsDir, testFile);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const result = JSON.parse(content);
      const items = [];
      const overallPassed = result.status === true || result.failed === false;
      items.push(
        new TestTreeItem(
          `Overall: ${overallPassed ? "PASSED" : "FAILED"}`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: `Fails: ${result.fails || 0} | Features: ${result.features?.length || 0}`
          },
          void 0,
          overallPassed ? new vscode5.ThemeIcon("check", new vscode5.ThemeColor("testing.iconPassed")) : new vscode5.ThemeIcon("error", new vscode5.ThemeColor("testing.iconFailed"))
        )
      );
      if (result.features && result.features.length > 0) {
        const featuresItem = new TestTreeItem(
          `Features (${result.features.length})`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          {
            description: "All test features"
          },
          void 0,
          new vscode5.ThemeIcon("symbol-array")
        );
        items.push(featuresItem);
      }
      if (result.givens && result.givens.length > 0) {
        const givensItem = new TestTreeItem(
          `Test Scenarios (${result.givens.length})`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          {
            description: "Given-When-Then test cases"
          },
          void 0,
          new vscode5.ThemeIcon("list-tree")
        );
        items.push(givensItem);
        for (let i = 0; i < result.givens.length; i++) {
          const given = result.givens[i];
          const givenPassed = given.status === true || given.failed === false;
          const givenItem = new TestTreeItem(
            `Scenario ${i + 1}: ${given.key || "Unnamed"}`,
            2 /* File */,
            vscode5.TreeItemCollapsibleState.Collapsed,
            {
              testFile,
              testResultIndex: i,
              description: givenPassed ? "PASSED" : "FAILED"
            },
            void 0,
            givenPassed ? new vscode5.ThemeIcon("check", new vscode5.ThemeColor("testing.iconPassed")) : new vscode5.ThemeIcon("error", new vscode5.ThemeColor("testing.iconFailed"))
          );
          items.push(givenItem);
        }
      }
      return items;
    } catch (error) {
      return [
        new TestTreeItem(
          "Error reading test results",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: String(error)
          },
          void 0,
          new vscode5.ThemeIcon("error")
        )
      ];
    }
  }
  getTestDetails(testFile, index) {
    const filePath = path.join(this.resultsDir, testFile);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const result = JSON.parse(content);
      if (!result.givens || index >= result.givens.length) {
        return [
          new TestTreeItem(
            "Test scenario not found",
            2 /* File */,
            vscode5.TreeItemCollapsibleState.None,
            { description: "Invalid test scenario index" },
            void 0,
            new vscode5.ThemeIcon("warning")
          )
        ];
      }
      const given = result.givens[index];
      const items = [];
      const givenPassed = given.status === true || given.failed === false;
      items.push(
        new TestTreeItem(
          `GIVEN: ${given.key || "Test Scenario"}`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          { description: givenPassed ? "PASSED" : "FAILED" },
          void 0,
          givenPassed ? new vscode5.ThemeIcon("check") : new vscode5.ThemeIcon("error")
        )
      );
      if (given.features && given.features.length > 0) {
        const featuresItem = new TestTreeItem(
          `Features (${given.features.length})`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          { description: "Features tested in this scenario" },
          void 0,
          new vscode5.ThemeIcon("symbol-array")
        );
        items.push(featuresItem);
        for (const feature of given.features) {
          items.push(
            new TestTreeItem(
              feature,
              2 /* File */,
              vscode5.TreeItemCollapsibleState.None,
              { description: "Feature" },
              void 0,
              new vscode5.ThemeIcon("symbol-string")
            )
          );
        }
      }
      if (given.whens && given.whens.length > 0) {
        const whensItem = new TestTreeItem(
          `WHEN Steps (${given.whens.length})`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          { description: "Actions performed" },
          void 0,
          new vscode5.ThemeIcon("list-ordered")
        );
        items.push(whensItem);
        for (let i = 0; i < given.whens.length; i++) {
          const when = given.whens[i];
          items.push(
            new TestTreeItem(
              `Step ${i + 1}: ${when.name || "Action"}`,
              2 /* File */,
              vscode5.TreeItemCollapsibleState.None,
              {
                description: when.status || "No status",
                tooltip: when.error ? `Error: ${when.error}` : void 0
              },
              void 0,
              when.error ? new vscode5.ThemeIcon("error") : new vscode5.ThemeIcon("circle")
            )
          );
        }
      }
      if (given.thens && given.thens.length > 0) {
        const thensItem = new TestTreeItem(
          `THEN Assertions (${given.thens.length})`,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          { description: "Expected outcomes" },
          void 0,
          new vscode5.ThemeIcon("checklist")
        );
        items.push(thensItem);
        for (let i = 0; i < given.thens.length; i++) {
          const then = given.thens[i];
          const assertionPassed = !then.error;
          items.push(
            new TestTreeItem(
              `Assertion ${i + 1}: ${then.name || "Check"}`,
              2 /* File */,
              vscode5.TreeItemCollapsibleState.None,
              {
                description: assertionPassed ? "PASSED" : "FAILED",
                tooltip: then.error ? `Error: ${then.error}` : void 0
              },
              void 0,
              assertionPassed ? new vscode5.ThemeIcon("check") : new vscode5.ThemeIcon("error")
            )
          );
        }
      }
      if (given.error) {
        items.push(
          new TestTreeItem(
            "Error Details",
            2 /* File */,
            vscode5.TreeItemCollapsibleState.None,
            { description: given.error },
            void 0,
            new vscode5.ThemeIcon("warning")
          )
        );
      }
      return items;
    } catch (error) {
      return [
        new TestTreeItem(
          "Error reading test details",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          { description: String(error) },
          void 0,
          new vscode5.ThemeIcon("error")
        )
      ];
    }
  }
};

// src/vscode/extension.ts
function activate(context) {
  console.log("[Testeranto] Extension activating...");
  const terminalManager = new TerminalManager();
  terminalManager.createAllTerminals();
  console.log("[Testeranto] Created terminals for all tests");
  const mainStatusBarItem = vscode6.window.createStatusBarItem(vscode6.StatusBarAlignment.Right, 100);
  mainStatusBarItem.text = "$(beaker) Testeranto";
  mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
  mainStatusBarItem.command = "testeranto.showTests";
  mainStatusBarItem.show();
  const serverStatusBarItem = vscode6.window.createStatusBarItem(vscode6.StatusBarAlignment.Right, 99);
  serverStatusBarItem.text = "$(circle-slash) Server";
  serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
  serverStatusBarItem.command = "testeranto.startServer";
  serverStatusBarItem.backgroundColor = new vscode6.ThemeColor("statusBarItem.warningBackground");
  serverStatusBarItem.show();
  const updateServerStatus = async () => {
    try {
      const workspaceFolders = vscode6.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode6.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode6.workspace.fs.readFile(configUri);
          const configText = Buffer.from(fileContent).toString("utf-8");
          const config = JSON.parse(configText);
          if (config.serverStarted === true) {
            serverStatusBarItem.text = "$(check) Server";
            serverStatusBarItem.tooltip = "Testeranto server is running. Click to restart.";
            serverStatusBarItem.backgroundColor = void 0;
            console.log("[Testeranto] Server status: Running (config indicates server is started)");
            if (config.processes && config.processes.length > 0) {
              const runningProcesses = config.processes.filter((p) => p.isActive === true);
              const stoppedProcesses = config.processes.filter((p) => p.isActive !== true);
              if (runningProcesses.length > 0) {
                serverStatusBarItem.text = `$(check) Server (${runningProcesses.length} running)`;
                if (stoppedProcesses.length > 0) {
                  serverStatusBarItem.tooltip = `Testeranto server is running. ${runningProcesses.length} containers running, ${stoppedProcesses.length} stopped.`;
                }
              } else {
                serverStatusBarItem.text = "$(check) Server (0 running)";
                if (stoppedProcesses.length > 0) {
                  serverStatusBarItem.tooltip = `Testeranto server is running. All ${stoppedProcesses.length} containers are stopped.`;
                }
              }
            }
          } else {
            serverStatusBarItem.text = "$(circle-slash) Server";
            serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
            serverStatusBarItem.backgroundColor = new vscode6.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          serverStatusBarItem.text = "$(circle-slash) Server";
          serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          serverStatusBarItem.backgroundColor = new vscode6.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        serverStatusBarItem.text = "$(circle-slash) Server";
        serverStatusBarItem.tooltip = "No workspace folder open";
        serverStatusBarItem.backgroundColor = new vscode6.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      serverStatusBarItem.text = "$(error) Server Error";
      serverStatusBarItem.tooltip = "Error checking server status";
      serverStatusBarItem.backgroundColor = new vscode6.ThemeColor("statusBarItem.errorBackground");
    }
  };
  updateServerStatus();
  let configWatcher;
  const setupConfigWatcher = () => {
    const workspaceFolders = vscode6.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      const configPattern = new vscode6.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
      if (configWatcher) {
        configWatcher.dispose();
      }
      configWatcher = vscode6.workspace.createFileSystemWatcher(configPattern, false, false, false);
      const handleConfigChange = (uri) => {
        console.log("[Testeranto] Config file changed:", uri.fsPath);
        setTimeout(() => {
          updateServerStatus();
          testTreeDataProvider.refresh();
          processesTreeDataProvider.refresh();
          featuresTreeDataProvider.refresh();
        }, 100);
      };
      configWatcher.onDidChange(handleConfigChange);
      configWatcher.onDidCreate(handleConfigChange);
      configWatcher.onDidDelete(() => {
        console.log("[Testeranto] Config file deleted");
        updateServerStatus();
        testTreeDataProvider.refresh();
        processesTreeDataProvider.refresh();
        featuresTreeDataProvider.refresh();
      });
      context.subscriptions.push(configWatcher);
      console.log("[Testeranto] Config file watcher set up");
    }
  };
  setupConfigWatcher();
  context.subscriptions.push(
    vscode6.workspace.onDidChangeWorkspaceFolders(() => {
      console.log("[Testeranto] Workspace folders changed, re-setting up config watcher");
      setupConfigWatcher();
      updateServerStatus();
    })
  );
  const testTreeDataProvider = new TestTreeDataProvider();
  const processesTreeDataProvider = new ProcessesTreeDataProvider();
  const featuresTreeDataProvider = new FeaturesTreeDataProvider();
  const showTestsCommand = vscode6.commands.registerCommand(
    "testeranto.showTests",
    () => {
      vscode6.window.showInformationMessage("Showing Testeranto tests");
      vscode6.commands.executeCommand("testerantoTestsView.focus");
    }
  );
  const runTestCommand = vscode6.commands.registerCommand(
    "testeranto.runTest",
    async (item) => {
      if (item.type === 1 /* Test */) {
        const { runtime, testName } = item.data || {};
        vscode6.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
        const terminal = terminalManager.showTerminal(runtime, testName);
        if (terminal) {
          vscode6.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
        } else {
          vscode6.window.showWarningMessage(`Terminal for ${testName} not found`);
        }
      }
    }
  );
  const aiderCommand = vscode6.commands.registerCommand(
    "testeranto.aider",
    async (item) => {
      if (item.type === 1 /* Test */) {
        const { runtime, testName } = item.data || {};
        vscode6.window.showInformationMessage(`Connecting to aider process for ${testName} (${runtime})...`);
        const aiderTerminal = terminalManager.createAiderTerminal(runtime, testName);
        aiderTerminal.show();
        let processedTestName = testName;
        processedTestName = processedTestName?.replace(/\.[^/.]+$/, "") || "";
        processedTestName = processedTestName.replace(/^example\//, "");
        const sanitizedTestName = processedTestName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-");
        const containerName = `${runtime}-${sanitizedTestName}-aider`;
        aiderTerminal.sendText("clear");
        setTimeout(() => {
          aiderTerminal.sendText(`echo "Connecting to aider container: ${containerName}"`);
          aiderTerminal.sendText(`docker exec -it ${containerName} /bin/bash`);
        }, 500);
      }
    }
  );
  const openConfigCommand = vscode6.commands.registerCommand(
    "testeranto.openConfig",
    async () => {
      try {
        const uri = vscode6.Uri.file("allTests.ts");
        const doc = await vscode6.workspace.openTextDocument(uri);
        await vscode6.window.showTextDocument(doc);
      } catch (err) {
        vscode6.window.showWarningMessage("Could not open allTests.ts configuration file");
      }
    }
  );
  const openFileCommand = vscode6.commands.registerCommand(
    "testeranto.openFile",
    async (item) => {
      if (item.type === 2 /* File */) {
        const fileName = item.data?.fileName || item.label;
        const uri = vscode6.Uri.file(fileName);
        try {
          const doc = await vscode6.workspace.openTextDocument(uri);
          await vscode6.window.showTextDocument(doc);
        } catch (err) {
          const files = await vscode6.workspace.findFiles(`**/${fileName}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode6.workspace.openTextDocument(files[0]);
            await vscode6.window.showTextDocument(doc);
          } else {
            vscode6.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      }
    }
  );
  const refreshCommand = vscode6.commands.registerCommand("testeranto.refresh", async () => {
    vscode6.window.showInformationMessage("Refreshing all Testeranto views...");
    await updateServerStatus();
    testTreeDataProvider.refresh();
    processesTreeDataProvider.refresh();
    featuresTreeDataProvider.refresh();
  });
  const retryConnectionCommand = vscode6.commands.registerCommand("testeranto.retryConnection", (provider) => {
    vscode6.window.showInformationMessage("Retrying connection to server...");
    if (provider && typeof provider.connectWebSocket === "function") {
      if (provider.connectionAttempts !== void 0) {
        provider.connectionAttempts = 0;
      }
      if (provider.isConnected !== void 0) {
        provider.isConnected = false;
      }
      provider.connectWebSocket();
      if (typeof provider.refresh === "function") {
        provider.refresh();
      }
    } else {
      vscode6.window.showWarningMessage("Provider does not support WebSocket reconnection");
    }
  });
  const startServerCommand = vscode6.commands.registerCommand("testeranto.startServer", async () => {
    vscode6.window.showInformationMessage("Starting Testeranto server...");
    const terminal = vscode6.window.createTerminal("Testeranto Server");
    terminal.show();
    const workspaceFolders = vscode6.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      terminal.sendText(`cd "${workspacePath}" && npm start`);
    } else {
      terminal.sendText("npm start");
    }
    vscode6.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
    setTimeout(async () => {
      await updateServerStatus();
      testTreeDataProvider.refresh();
      processesTreeDataProvider.refresh();
    }, 5e3);
  });
  const testTreeView = vscode6.window.createTreeView("testerantoTestsView", {
    treeDataProvider: testTreeDataProvider,
    showCollapseAll: true
  });
  const processesTreeView = vscode6.window.createTreeView("testerantoResultsView", {
    treeDataProvider: processesTreeDataProvider,
    showCollapseAll: true
  });
  const featuresTreeView = vscode6.window.createTreeView("testerantoFeaturesView", {
    treeDataProvider: featuresTreeDataProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      terminalManager.disposeAll();
      processesTreeDataProvider.dispose();
      testTreeDataProvider.dispose();
      featuresTreeDataProvider.dispose();
    }
  });
  context.subscriptions.push(
    showTestsCommand,
    runTestCommand,
    aiderCommand,
    openFileCommand,
    openConfigCommand,
    refreshCommand,
    retryConnectionCommand,
    startServerCommand,
    testTreeView,
    // fileTreeView,
    processesTreeView,
    featuresTreeView,
    mainStatusBarItem,
    serverStatusBarItem
  );
  console.log("[Testeranto] Commands registered");
  console.log("[Testeranto] Four tree views registered");
  vscode6.commands.getCommands().then((commands2) => {
    const hasCommand = commands2.includes("testeranto.showTests");
    console.log(`[Testeranto] Command available in palette: ${hasCommand}`);
  });
  console.log("[Testeranto] Extension activated successfully");
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
