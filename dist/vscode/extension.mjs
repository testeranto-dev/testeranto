// src/vscode/extension.ts
import * as vscode5 from "vscode";

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode4 from "vscode";

// src/vscode/TestTreeItem.ts
import * as vscode from "vscode";
var TestTreeItem = class extends vscode.TreeItem {
  constructor(label, type, collapsibleState, data, command, iconPath, contextValue) {
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
    this.contextValue = contextValue || this.getContextValue();
  }
  children;
  getDefaultIcon() {
    switch (this.type) {
      case 0 /* Runtime */:
        return new vscode.ThemeIcon("symbol-namespace");
      case 1 /* Test */:
        return new vscode.ThemeIcon("beaker");
      case 2 /* File */:
        return new vscode.ThemeIcon("file");
      case 3 /* Info */:
        return new vscode.ThemeIcon("info");
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

// src/vscode/providers/TestTreeDataProviderUtils.ts
import * as vscode2 from "vscode";
var TestTreeDataProviderUtils = class _TestTreeDataProviderUtils {
  static configData = null;
  static async fetchConfigsViaHttp() {
    const response = await fetch("http://localhost:3000/~/configs");
    const data = await response.json();
    _TestTreeDataProviderUtils.configData = data;
    return data;
  }
  static getConfigData() {
    return _TestTreeDataProviderUtils.configData;
  }
  static setConfigData(data) {
    _TestTreeDataProviderUtils.configData = data;
  }
  static async getRuntimeItems() {
    const items = [];
    items.push(
      new TestTreeItem(
        "Refresh now",
        3 /* Info */,
        vscode2.TreeItemCollapsibleState.None,
        {
          description: "Update configuration from server",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode2.ThemeIcon("refresh", new vscode2.ThemeColor("testing.iconQueued"))
      )
    );
    const configData = _TestTreeDataProviderUtils.configData;
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;
      const runtimeEntries = Object.entries(runtimes);
      if (runtimeEntries.length > 0) {
        items.push(
          new TestTreeItem(
            `\u{1F4CA} ${runtimeEntries.length} Runtime(s)`,
            3 /* Info */,
            vscode2.TreeItemCollapsibleState.None,
            {
              description: "From HTTP /~/configs endpoint",
              count: runtimeEntries.length
            },
            void 0,
            new vscode2.ThemeIcon("server", new vscode2.ThemeColor("testing.iconUnset"))
          )
        );
        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig;
          if (config.runtime) {
            items.push(
              new TestTreeItem(
                `${runtimeKey} (${config.runtime})`,
                0 /* Runtime */,
                vscode2.TreeItemCollapsibleState.Collapsed,
                {
                  runtime: config.runtime,
                  runtimeKey,
                  testsCount: config.tests?.length || 0
                },
                void 0,
                new vscode2.ThemeIcon("symbol-namespace")
              )
            );
          }
        }
      }
    }
    return items;
  }
  static getTestItems(runtime) {
    if (!runtime) {
      return [];
    }
    const configData = _TestTreeDataProviderUtils.configData;
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;
      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          return tests.map((testName) => {
            const item = new TestTreeItem(
              testName,
              1 /* Test */,
              vscode2.TreeItemCollapsibleState.Collapsed,
              { runtimeKey, testName },
              {
                command: "testeranto.launchAiderTerminal",
                title: "Launch Aider Terminal",
                arguments: [runtimeKey, testName]
              },
              new vscode2.ThemeIcon("terminal"),
              "testWithAider"
            );
            item.tooltip = `Click to launch aider terminal for ${testName}`;
            return item;
          });
        }
      }
    }
    return [];
  }
  static async getTestFileItems(runtime, testName) {
    try {
      const response = await fetch("http://localhost:3000/~/collated-files");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const tree = data.tree || {};
      const filteredTree = this.filterTreeForRuntimeAndTest(tree, runtime, testName);
      const fileItems = this.convertTreeToItems(filteredTree, runtime, testName);
      if (fileItems.length > 0) {
        return fileItems;
      }
      return [
        new TestTreeItem(
          "No files available",
          2 /* File */,
          vscode2.TreeItemCollapsibleState.None,
          { runtime, testName },
          void 0,
          new vscode2.ThemeIcon("info")
        )
      ];
    } catch (error) {
      console.error("Error fetching collated files:", error);
      return [
        new TestTreeItem(
          "Error loading files",
          2 /* File */,
          vscode2.TreeItemCollapsibleState.None,
          { runtime, testName },
          void 0,
          new vscode2.ThemeIcon("error")
        )
      ];
    }
  }
  static filterTreeForRuntimeAndTest(tree, runtime, testName) {
    const result = {};
    const filterNode = (node) => {
      if (node.type === "file") {
        if (node.runtime === runtime && node.testName === testName) {
          return node;
        }
        if (node.runtimes && node.runtimes.includes(runtime) && node.tests && node.tests.includes(testName)) {
          return node;
        }
        if (node.fileType === "output" && node.runtime === runtime) {
          return node;
        }
        return null;
      } else if (node.type === "directory") {
        const filteredChildren = {};
        for (const [childName, child] of Object.entries(node.children || {})) {
          const filteredChild = filterNode(child);
          if (filteredChild !== null) {
            filteredChildren[childName] = filteredChild;
          }
        }
        if (Object.keys(filteredChildren).length > 0) {
          return {
            type: "directory",
            children: filteredChildren
          };
        }
        return null;
      }
      return null;
    };
    for (const [name, node] of Object.entries(tree)) {
      const filteredNode = filterNode(node);
      if (filteredNode !== null) {
        result[name] = filteredNode;
      }
    }
    return result;
  }
  static async getDirectoryChildren(runtime, testName, dirPath) {
    try {
      const response = await fetch("http://localhost:3000/~/collated-files");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const tree = data.tree || {};
      const filteredTree = this.filterTreeForRuntimeAndTest(tree, runtime, testName);
      const normalizedDirPath = dirPath.startsWith("/") ? dirPath.substring(1) : dirPath;
      const dirParts = normalizedDirPath.split("/").filter((part) => part.length > 0);
      let currentNode = filteredTree;
      for (const part of dirParts) {
        if (currentNode[part] && currentNode[part].type === "directory") {
          currentNode = currentNode[part].children || {};
        } else {
          return [];
        }
      }
      const items = [];
      for (const [name, node] of Object.entries(currentNode)) {
        const item = this.convertNodeToItem(name, node, runtime, testName, dirPath);
        if (item) {
          items.push(item);
        }
      }
      items.sort((a, b) => {
        const aIsDir = a.data?.isFile === false;
        const bIsDir = b.data?.isFile === false;
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.label.toString().localeCompare(b.label.toString());
      });
      return items;
    } catch (error) {
      console.error("Error in getDirectoryChildren:", error);
      return [];
    }
  }
  static buildTreeItemsFromNode(node, runtime, testName) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode2.TreeItemCollapsibleState.None : vscode2.TreeItemCollapsibleState.Collapsed;
      let fileUri;
      const workspaceFolders = vscode2.workspace.workspaceFolders;
      if (child.isFile && workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (child.fullPath.startsWith("/")) {
          fileUri = vscode2.Uri.file(child.fullPath);
        } else {
          fileUri = vscode2.Uri.joinPath(workspaceRoot, child.fullPath);
        }
      }
      let icon;
      if (child.isFile) {
        if (child.fileType === "input") {
          icon = new vscode2.ThemeIcon("arrow-down", new vscode2.ThemeColor("testing.iconQueued"));
        } else if (child.fileType === "output") {
          icon = new vscode2.ThemeIcon("arrow-up", new vscode2.ThemeColor("testing.iconPassed"));
        } else if (child.fileType === "both") {
          icon = new vscode2.ThemeIcon("arrow-both", new vscode2.ThemeColor("testing.iconUnset"));
        } else {
          icon = new vscode2.ThemeIcon("file-text");
        }
      } else {
        icon = new vscode2.ThemeIcon("folder");
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
          isFile: child.isFile,
          fileType: child.fileType
        },
        child.isFile && fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : void 0,
        icon
      );
      if (child.isFile && child.fileType) {
        let typeLabel = "File";
        if (child.fileType === "input") {
          typeLabel = "Input";
        } else if (child.fileType === "output") {
          typeLabel = "Output";
        } else if (child.fileType === "both") {
          typeLabel = "Input/Output";
        }
        treeItem.tooltip = `${typeLabel} file: ${child.fullPath}`;
      }
      items.push(treeItem);
    }
    return items;
  }
  static convertTreeToItems(tree, runtime, testName) {
    const items = [];
    const convertNode = (name, node, parentPath = "") => {
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      if (node.type === "file") {
        const collapsibleState = vscode2.TreeItemCollapsibleState.None;
        let fileUri;
        const workspaceFolders = vscode2.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri;
          if (node.path.startsWith("/")) {
            fileUri = vscode2.Uri.file(node.path);
          } else {
            fileUri = vscode2.Uri.joinPath(workspaceRoot, node.path);
          }
        }
        let icon;
        if (node.fileType === "input") {
          icon = new vscode2.ThemeIcon("arrow-down", new vscode2.ThemeColor("testing.iconQueued"));
        } else if (node.fileType === "output") {
          icon = new vscode2.ThemeIcon("arrow-up", new vscode2.ThemeColor("testing.iconPassed"));
        } else if (node.fileType === "both") {
          icon = new vscode2.ThemeIcon("arrow-both", new vscode2.ThemeColor("testing.iconUnset"));
        } else {
          icon = new vscode2.ThemeIcon("file-text");
        }
        const treeItem = new TestTreeItem(
          name,
          2 /* File */,
          collapsibleState,
          {
            runtime,
            testName,
            fileName: node.path,
            path: node.path,
            isFile: true,
            fileType: node.fileType
          },
          fileUri ? {
            command: "vscode.open",
            title: "Open File",
            arguments: [fileUri]
          } : void 0,
          icon
        );
        if (node.fileType) {
          let typeLabel = "File";
          if (node.fileType === "input") {
            typeLabel = "Input";
          } else if (node.fileType === "output") {
            typeLabel = "Output";
          } else if (node.fileType === "both") {
            typeLabel = "Input/Output";
          }
          treeItem.tooltip = `${typeLabel} file: ${node.path}`;
        }
        return treeItem;
      } else if (node.type === "directory") {
        const collapsibleState = vscode2.TreeItemCollapsibleState.Collapsed;
        const treeItem = new TestTreeItem(
          name,
          2 /* File */,
          collapsibleState,
          {
            runtime,
            testName,
            path: currentPath,
            isFile: false
          },
          void 0,
          new vscode2.ThemeIcon("folder")
        );
        treeItem.children = Object.entries(node.children || {}).map(
          ([childName, childNode]) => convertNode(childName, childNode, currentPath)
        ).filter((item) => item !== null);
        return treeItem;
      }
      return null;
    };
    for (const [name, node] of Object.entries(tree)) {
      const item = convertNode(name, node);
      if (item) {
        items.push(item);
      }
    }
    return items;
  }
  static convertNodeToItem(name, node, runtime, testName, parentPath) {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    if (node.type === "file") {
      const collapsibleState = vscode2.TreeItemCollapsibleState.None;
      let fileUri;
      const workspaceFolders = vscode2.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (node.path.startsWith("/")) {
          fileUri = vscode2.Uri.file(node.path);
        } else {
          fileUri = vscode2.Uri.joinPath(workspaceRoot, node.path);
        }
      }
      let icon;
      if (node.fileType === "input") {
        icon = new vscode2.ThemeIcon("arrow-down", new vscode2.ThemeColor("testing.iconQueued"));
      } else if (node.fileType === "output") {
        icon = new vscode2.ThemeIcon("arrow-up", new vscode2.ThemeColor("testing.iconPassed"));
      } else if (node.fileType === "both") {
        icon = new vscode2.ThemeIcon("arrow-both", new vscode2.ThemeColor("testing.iconUnset"));
      } else {
        icon = new vscode2.ThemeIcon("file-text");
      }
      const treeItem = new TestTreeItem(
        name,
        2 /* File */,
        collapsibleState,
        {
          runtime,
          testName,
          fileName: node.path,
          path: currentPath,
          isFile: true,
          fileType: node.fileType
        },
        fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : void 0,
        icon
      );
      if (node.fileType) {
        let typeLabel = "File";
        if (node.fileType === "input") {
          typeLabel = "Input";
        } else if (node.fileType === "output") {
          typeLabel = "Output";
        } else if (node.fileType === "both") {
          typeLabel = "Input/Output";
        }
        treeItem.tooltip = `${typeLabel} file: ${node.path}`;
      }
      return treeItem;
    } else if (node.type === "directory") {
      const collapsibleState = vscode2.TreeItemCollapsibleState.Collapsed;
      const treeItem = new TestTreeItem(
        name,
        2 /* File */,
        collapsibleState,
        {
          runtime,
          testName,
          path: currentPath,
          isFile: false
        },
        void 0,
        new vscode2.ThemeIcon("folder")
      );
      treeItem.children = Object.entries(node.children || {}).map(
        ([childName, childNode]) => this.convertNodeToItem(childName, childNode, runtime, testName, currentPath)
      ).filter((item) => item !== null);
      return treeItem;
    }
    return null;
  }
};

// src/vscode/providers/BaseTreeDataProvider.ts
import * as vscode3 from "vscode";
var BaseTreeDataProvider = class {
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  ws = null;
  isConnected = false;
  constructor() {
    this.setupWebSocket();
  }
  getTreeItem(element) {
    return element;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  setupWebSocket() {
    if (typeof WebSocket === "undefined") {
      return;
    }
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket("ws://localhost:3000");
    this.ws.onopen = () => {
      this.isConnected = true;
      this._onDidChangeTreeData.fire();
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    this.ws.onerror = () => {
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    };
    this.ws.onclose = () => {
      this.isConnected = false;
      this.ws = null;
      this._onDidChangeTreeData.fire();
    };
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged") {
      this.refresh();
    }
  }
  dispose() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
var TestTreeDataProvider = class extends BaseTreeDataProvider {
  configWatcher;
  constructor() {
    super();
    TestTreeDataProviderUtils.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.setupConfigWatcher();
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    TestTreeDataProviderUtils.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] HTTP refresh failed:", error);
    }).then(() => {
      this._onDidChangeTreeData.fire();
    });
  }
  setupConfigWatcher() {
    const workspaceFolders = vscode4.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode4.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
    this.configWatcher = vscode4.workspace.createFileSystemWatcher(configPattern);
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
    super.dispose();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return TestTreeDataProviderUtils.getRuntimeItems();
    } else if (element.type === 0 /* Runtime */) {
      const runtime = element.data?.runtime;
      return Promise.resolve(TestTreeDataProviderUtils.getTestItems(runtime));
    } else if (element.type === 1 /* Test */) {
      const { runtime, testName } = element.data || {};
      return TestTreeDataProviderUtils.getTestFileItems(runtime, testName);
    } else if (element.type === 2 /* File */) {
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
      if (element.children && element.children.length > 0) {
        return Promise.resolve(element.children);
      }
      if (isTestResultsSection) {
        return Promise.resolve([]);
      }
      if (isFilesSection) {
        return TestTreeDataProviderUtils.getDirectoryChildren(runtime, testName, "");
      }
      if (isFeaturesSection && features) {
        return Promise.resolve(features.map((feature) => {
          return new TestTreeItem(
            feature,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              runtime,
              testName,
              isFeature: true,
              feature
            },
            void 0,
            new vscode4.ThemeIcon("symbol-string")
          );
        }));
      }
      if (isTestCasesSection && testCases) {
        return Promise.resolve(testCases.map((tc) => {
          const statusIcon = tc.failed ? new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed")) : new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed"));
          return new TestTreeItem(
            tc.key || `Test Case`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              testName,
              isTestCase: true,
              testCase: tc
            },
            void 0,
            statusIcon
          );
        }));
      }
      if (isTestCase && testCase) {
        const items = [];
        if (testCase.features && Array.isArray(testCase.features)) {
          const featuresItem = new TestTreeItem(
            `Features (${testCase.features.length})`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              testName,
              isTestCaseFeatures: true,
              features: testCase.features
            },
            void 0,
            new vscode4.ThemeIcon("list-unordered")
          );
          items.push(featuresItem);
        }
        if (testCase.whens && Array.isArray(testCase.whens)) {
          const whensItem = new TestTreeItem(
            `Steps (${testCase.whens.length})`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              testName,
              isTestCaseWhens: true,
              whens: testCase.whens
            },
            void 0,
            new vscode4.ThemeIcon("play")
          );
          items.push(whensItem);
        }
        if (testCase.thens && Array.isArray(testCase.thens)) {
          const thensItem = new TestTreeItem(
            `Assertions (${testCase.thens.length})`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              testName,
              isTestCaseThens: true,
              thens: testCase.thens
            },
            void 0,
            new vscode4.ThemeIcon("check")
          );
          items.push(thensItem);
        }
        return Promise.resolve(items);
      }
      if (element.data?.isTestCaseFeatures && features) {
        return Promise.resolve(features.map((feature) => {
          return new TestTreeItem(
            feature,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              runtime,
              testName,
              isFeature: true,
              feature
            },
            void 0,
            new vscode4.ThemeIcon("symbol-string")
          );
        }));
      }
      if (element.data?.isTestCaseWhens && testCase?.whens) {
        return Promise.resolve(testCase.whens.map((w, i) => {
          const statusIcon = w.status ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
          return new TestTreeItem(
            `${i + 1}. ${w.name}`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              runtime,
              testName,
              isWhen: true,
              when: w
            },
            void 0,
            statusIcon
          );
        }));
      }
      if (element.data?.isTestCaseThens && testCase?.thens) {
        return Promise.resolve(testCase.thens.map((t, i) => {
          const statusIcon = t.status ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
          return new TestTreeItem(
            `${i + 1}. ${t.name}`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              runtime,
              testName,
              isThen: true,
              then: t
            },
            void 0,
            statusIcon
          );
        }));
      }
      return TestTreeDataProviderUtils.getDirectoryChildren(runtime, testName, path || "");
    }
    return Promise.resolve([]);
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
          TestTreeDataProviderUtils.fetchConfigsViaHttp().catch((error) => {
            console.log("[TestTreeDataProvider] HTTP fetch after resource change failed:", error);
          }).then(() => {
            this._onDidChangeTreeData.fire();
          });
        }
        break;
      default:
        console.log("[TestTreeDataProvider] Unhandled message type:", message.type);
    }
  }
};

// src/vscode/extension.ts
function activate(context) {
  const mainStatusBarItem = vscode5.window.createStatusBarItem(vscode5.StatusBarAlignment.Right, 100);
  mainStatusBarItem.text = "$(beaker) Testeranto";
  mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
  mainStatusBarItem.command = "testeranto.showTests";
  mainStatusBarItem.show();
  const serverStatusBarItem = vscode5.window.createStatusBarItem(vscode5.StatusBarAlignment.Right, 99);
  serverStatusBarItem.text = "$(circle-slash) Server";
  serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
  serverStatusBarItem.command = "testeranto.startServer";
  serverStatusBarItem.backgroundColor = new vscode5.ThemeColor("statusBarItem.warningBackground");
  serverStatusBarItem.show();
  const updateServerStatus = async () => {
    try {
      const workspaceFolders = vscode5.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode5.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode5.workspace.fs.readFile(configUri);
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
            serverStatusBarItem.backgroundColor = new vscode5.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          serverStatusBarItem.text = "$(circle-slash) Server";
          serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          serverStatusBarItem.backgroundColor = new vscode5.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        serverStatusBarItem.text = "$(circle-slash) Server";
        serverStatusBarItem.tooltip = "No workspace folder open";
        serverStatusBarItem.backgroundColor = new vscode5.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      serverStatusBarItem.text = "$(error) Server Error";
      serverStatusBarItem.tooltip = "Error checking server status";
      serverStatusBarItem.backgroundColor = new vscode5.ThemeColor("statusBarItem.errorBackground");
    }
  };
  updateServerStatus();
  const runtimeProvider = new TestTreeDataProvider();
  const showTestsCommand = vscode5.commands.registerCommand(
    "testeranto.showTests",
    () => {
      vscode5.window.showInformationMessage("Showing Testeranto Dashboard");
      vscode5.commands.executeCommand("testeranto.unifiedView.focus");
    }
  );
  const runTestCommand = vscode5.commands.registerCommand(
    "testeranto.runTest",
    async (item) => {
      if (item.type === 1 /* Test */) {
        const { runtime, testName } = item.data || {};
        vscode5.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
        const terminal = terminalManager.showTerminal(runtime, testName);
        if (terminal) {
          vscode5.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
        } else {
          vscode5.window.showWarningMessage(`Terminal for ${testName} not found`);
        }
      }
    }
  );
  const aiderCommand = vscode5.commands.registerCommand(
    "testeranto.aider",
    async (...args) => {
      console.log("[Testeranto] Aider command triggered with args:", args);
      let runtime;
      let testName;
      if (args.length === 0) {
        vscode5.window.showErrorMessage("Cannot connect to aider: No arguments provided");
        return;
      }
      const firstArg = args[0];
      if (firstArg && typeof firstArg === "object" && firstArg.type !== void 0) {
        if (firstArg.type === 1 /* Test */) {
          console.log("[Testeranto] Item label:", firstArg.label);
          console.log("[Testeranto] Item data:", JSON.stringify(firstArg.data, null, 2));
          runtime = firstArg.data?.runtime;
          testName = firstArg.data?.testName;
          if (!runtime) {
            runtime = firstArg.data?.runtimeKey;
          }
          if (!testName) {
            testName = firstArg.label;
          }
        } else {
          vscode5.window.showErrorMessage(`Cannot connect to aider: Item is not a test (type: ${firstArg.type})`);
          return;
        }
      } else if (args.length >= 2) {
        runtime = args[0];
        testName = args[1];
        console.log("[Testeranto] Using direct parameters:", runtime, testName);
      } else {
        runtime = firstArg;
        testName = "unknown";
        console.log("[Testeranto] Using single parameter:", runtime);
      }
      console.log("[Testeranto] Extracted runtime:", runtime, "type:", typeof runtime);
      console.log("[Testeranto] Extracted testName:", testName, "type:", typeof testName);
      if (!runtime || !testName) {
        vscode5.window.showErrorMessage(`Cannot connect to aider: Missing runtime or test name. Runtime: ${runtime}, Test: ${testName}`);
        return;
      }
      console.log("[Testeranto] Calling createAiderTerminal with raw values");
      vscode5.window.showInformationMessage(`Connecting to aider process for ${testName || "unknown"} (${runtime || "unknown"})...`);
      try {
        const aiderTerminal = await terminalManager.createAiderTerminal(runtime, testName);
        aiderTerminal.show();
        let processedTestName = testName || "";
        processedTestName = processedTestName?.replace(/\.[^/.]+$/, "") || "";
        processedTestName = processedTestName.replace(/^example\//, "");
        const sanitizedTestName = processedTestName ? processedTestName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-") : "";
        const containerName = `${runtime}-${sanitizedTestName}-aider`;
        aiderTerminal.sendText("clear");
        setTimeout(() => {
          aiderTerminal.sendText(`echo "Connecting to aider container: ${containerName}"`);
          aiderTerminal.sendText(`docker exec -it ${containerName} /bin/bash`);
        }, 500);
      } catch (error) {
        vscode5.window.showErrorMessage(`Failed to create aider terminal: ${error.message}`);
        console.error("[Testeranto] Error creating aider terminal:", error);
        return;
      }
    }
  );
  const launchAiderTerminalCommand = vscode5.commands.registerCommand(
    "testeranto.launchAiderTerminal",
    async (...args) => {
      console.log("[Testeranto] launchAiderTerminal called with args:", args);
      let runtime;
      let testName;
      if (args.length === 0) {
        vscode5.window.showErrorMessage("Cannot launch aider terminal: No arguments provided");
        return;
      }
      const firstArg = args[0];
      if (firstArg && typeof firstArg === "object" && firstArg.type !== void 0) {
        runtime = firstArg.data?.runtime;
        testName = firstArg.data?.testName;
        console.log("[Testeranto] Extracted from TestTreeItem - runtime:", runtime, "type:", typeof runtime);
        console.log("[Testeranto] Extracted from TestTreeItem - testName:", testName, "type:", typeof testName);
        console.log("[Testeranto] Full data object:", JSON.stringify(firstArg.data, null, 2));
      } else if (args.length >= 2) {
        runtime = args[0];
        testName = args[1];
        console.log("[Testeranto] Using direct arguments:", runtime, testName);
      } else {
        runtime = firstArg;
        testName = "unknown";
        console.log("[Testeranto] Using single argument:", runtime);
      }
      console.log("[Testeranto] Raw values - runtime:", runtime, "type:", typeof runtime);
      console.log("[Testeranto] Raw values - testName:", testName, "type:", typeof testName);
      vscode5.window.showInformationMessage(`Launching aider terminal for ${testName || "unknown"} (${runtime || "unknown"})...`);
      try {
        const terminal = await terminalManager.createAiderTerminal(runtime, testName);
        terminal.show();
        vscode5.window.showInformationMessage(`Aider terminal launched for ${testName || "unknown"} (${runtime || "unknown"})`);
      } catch (error) {
        console.error("Failed to launch aider terminal:", error);
        vscode5.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
      }
    }
  );
  const openConfigCommand = vscode5.commands.registerCommand(
    "testeranto.openConfig",
    async () => {
      try {
        const uri = vscode5.Uri.file("allTests.ts");
        const doc = await vscode5.workspace.openTextDocument(uri);
        await vscode5.window.showTextDocument(doc);
      } catch (err) {
        vscode5.window.showWarningMessage("Could not open allTests.ts configuration file");
      }
    }
  );
  const openFileCommand = vscode5.commands.registerCommand(
    "testeranto.openFile",
    async (item) => {
      if (item.type === 2 /* File */) {
        const fileName = item.data?.fileName || item.label;
        const uri = vscode5.Uri.file(fileName);
        try {
          const doc = await vscode5.workspace.openTextDocument(uri);
          await vscode5.window.showTextDocument(doc);
        } catch (err) {
          const files = await vscode5.workspace.findFiles(`**/${fileName}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode5.workspace.openTextDocument(files[0]);
            await vscode5.window.showTextDocument(doc);
          } else {
            vscode5.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      }
    }
  );
  const refreshCommand = vscode5.commands.registerCommand("testeranto.refresh", async () => {
    vscode5.window.showInformationMessage("Refreshing all Testeranto views...");
    await updateServerStatus();
    unifiedProvider.refresh();
    runtimeProvider.refresh();
    resultsProvider.refresh();
    processProvider.refresh();
    reportProvider.refresh();
  });
  const retryConnectionCommand = vscode5.commands.registerCommand("testeranto.retryConnection", (provider) => {
    vscode5.window.showInformationMessage("Retrying connection to server...");
    if (provider && typeof provider.setupWebSocket === "function") {
      if (provider.connectionAttempts !== void 0) {
        provider.connectionAttempts = 0;
      }
      if (provider.isConnected !== void 0) {
        provider.isConnected = false;
      }
      provider.setupWebSocket();
      if (typeof provider.refresh === "function") {
        provider.refresh();
      }
    } else {
      vscode5.window.showWarningMessage("Provider does not support WebSocket reconnection");
    }
  });
  const startServerCommand = vscode5.commands.registerCommand("testeranto.startServer", async () => {
    vscode5.window.showInformationMessage("Starting Testeranto server...");
    const terminal = vscode5.window.createTerminal("Testeranto Server");
    terminal.show();
    const workspaceFolders = vscode5.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      terminal.sendText(`cd "${workspacePath}" && npm start`);
    } else {
      terminal.sendText("npm start");
    }
    vscode5.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
    setTimeout(async () => {
      await updateServerStatus();
      testerantoTreeDataProvider.refresh();
    }, 5e3);
  });
  const runtimeTreeView = vscode5.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: runtimeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      runtimeProvider.dispose();
    }
  });
  context.subscriptions.push(
    showTestsCommand,
    runTestCommand,
    aiderCommand,
    launchAiderTerminalCommand,
    openFileCommand,
    openConfigCommand,
    refreshCommand,
    retryConnectionCommand,
    startServerCommand,
    // generateHtmlReportCommand,
    // unifiedTreeView,
    runtimeTreeView,
    // resultsTreeView,
    // processTreeView,
    // reportTreeView,
    mainStatusBarItem,
    serverStatusBarItem
  );
  console.log("[Testeranto] Commands registered");
  console.log("[Testeranto] Unified tree view registered");
  vscode5.commands.getCommands().then((commands2) => {
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
