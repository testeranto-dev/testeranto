// src/vscode/extension.ts
import * as vscode17 from "vscode";
import * as path2 from "path";
import * as fs from "fs";

// src/vscode/TerminalManager.ts
import * as vscode from "vscode";

// src/api/vscodeExtensionHttp.ts
var vscodeHttpAPI = {
  // Configuration and metadata
  getConfigs: {
    method: "GET",
    path: "/~/configs",
    description: "Get server configuration",
    response: {}
  },
  getUnifiedTestTree: {
    method: "GET",
    path: "/~/unified-test-tree",
    description: "Get unified test tree organized by runtime and test",
    response: {}
  },
  getGraphData: {
    method: "GET",
    path: "/~/graph-data",
    description: "Get graph data for visualization",
    response: {}
  },
  getProcesses: {
    method: "GET",
    path: "/~/processes",
    description: "Get running processes summary",
    response: {}
  },
  getProcessLogs: {
    method: "GET",
    path: "/~/process-logs/:processId",
    description: "Get logs for a specific process",
    params: {
      processId: "string"
    },
    response: {}
  },
  getAiderProcesses: {
    method: "GET",
    path: "/~/aider-processes",
    description: "Get aider processes",
    response: {}
  },
  // HTML report
  getHtmlReport: {
    method: "GET",
    path: "/~/html-report",
    description: "Get HTML report info",
    response: {}
  },
  // App state
  getAppState: {
    method: "GET",
    path: "/~/app-state",
    description: "Get application state",
    response: {}
  },
  // Graph operations
  getGraph: {
    method: "GET",
    path: "/~/graph",
    description: "Get current graph data",
    response: {}
  },
  updateGraph: {
    method: "POST",
    path: "/~/graph",
    description: "Update graph with operations",
    response: {}
  },
  parseMarkdownToGraph: {
    method: "POST",
    path: "/~/graph/parse-markdown",
    description: "Parse markdown files to update graph",
    response: {}
  },
  serializeGraphToMarkdown: {
    method: "POST",
    path: "/~/graph/serialize-markdown",
    description: "Serialize graph changes back to markdown files",
    response: {}
  }
};

// src/vscode/providers/utils/apiUtils.ts
var ApiUtils = class {
  static baseUrl = "http://localhost:3000";
  static getUrl(endpointKey, params, query) {
    const endpoint = vscodeHttpAPI[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in vscodeHttpAPI`);
    }
    let path3 = endpoint.path;
    if (params && endpoint.params) {
      for (const [key, value] of Object.entries(params)) {
        if (endpoint.params[key]) {
          path3 = path3.replace(`:${key}`, value);
        }
      }
    }
    const url = `${this.baseUrl}${path3}`;
    if (query && Object.keys(query).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, value);
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        return `${url}?${queryString}`;
      }
    }
    return url;
  }
  static async fetchWithTimeout(url, options = {}, timeout = 5e3) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
  static getConfigsUrl() {
    return this.getUrl("getConfigs");
  }
  static getProcessesUrl() {
    return this.getUrl("getProcesses");
  }
  static getProcessLogsUrl(processId) {
    return this.getUrl("getProcessLogs", { processId });
  }
  static getAiderProcessesUrl() {
    return this.getUrl("getAiderProcesses");
  }
  static getHtmlReportUrl() {
    return this.getUrl("getHtmlReport");
  }
  static getAppStateUrl() {
    return this.getUrl("getAppState");
  }
  static getUnifiedTestTreeUrl() {
    return this.getUrl("getUnifiedTestTree");
  }
  static getWebSocketUrl() {
    const httpUrl = this.baseUrl;
    if (httpUrl.startsWith("http://")) {
      return httpUrl.replace("http://", "ws://");
    } else if (httpUrl.startsWith("https://")) {
      return httpUrl.replace("https://", "wss://");
    }
    return "ws://localhost:3000";
  }
  static getBaseUrl() {
    return this.baseUrl;
  }
};

// src/vscode/TerminalManager.ts
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
  // Fetch aider processes from the server
  async fetchAiderProcesses() {
    try {
      const response = await fetch(ApiUtils.getAiderProcessesUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const aiderResponse = data;
      return aiderResponse.aiderProcesses || [];
    } catch (error) {
      console.error("Failed to fetch aider processes:", error);
      return [];
    }
  }
  // Create terminals for all aider processes (but don't automatically start them)
  async createAiderTerminals() {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      console.log(`Found ${aiderProcesses.length} aider processes`);
      for (const process of aiderProcesses) {
        console.log(`Aider process available: ${process.testName} (${process.runtime}) - ${process.isActive ? "running" : "stopped"}`);
      }
    } catch (error) {
      console.error("Failed to fetch aider processes:", error);
    }
  }
  async createAiderTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      terminal.show();
      return terminal;
    }
    terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    const configKey = await this.getConfigKeyForTest(runtime, testName);
    if (!configKey) {
      terminal.sendText(`echo "Error: Could not find configuration for ${testName} (${runtime})"`);
      terminal.show();
      return terminal;
    }
    const containerName = this.getAiderContainerName(configKey, testName);
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      terminal.sendText(`echo "Error: Could not determine workspace root"`);
      terminal.show();
      return terminal;
    }
    const relativeMessagePath = `testeranto/reports/${configKey}/${testName}/aider-message.txt`;
    terminal.sendText(`if ! docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then echo "Starting aider container..." && docker compose -f "${workspaceRoot}/testeranto/docker-compose.yml" up -d ${containerName} && sleep 2; fi`);
    terminal.sendText(`docker exec -i ${containerName} sh -c "cd /workspace && cat '${relativeMessagePath}' | aider --yes"`);
    terminal.show();
    return terminal;
  }
  // Restart a specific aider process
  async restartAiderProcess(runtime, testName) {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      const process = aiderProcesses.find(
        (p) => p.runtime === runtime && p.testName === testName
      );
      if (process) {
        const key = this.getTerminalKey(runtime, testName);
        let terminal = this.terminals.get(key);
        if (!terminal || terminal.exitStatus !== void 0) {
          terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
          this.terminals.set(key, terminal);
        }
        terminal.sendText(`docker restart ${process.containerId}`);
        terminal.sendText(`sleep 2 && docker exec -it ${process.containerId} /bin/bash`);
        terminal.show();
      } else {
        vscode.window.showErrorMessage(`No aider process found for ${testName} (${runtime})`);
      }
    } catch (error) {
      console.error("Failed to restart aider process:", error);
      vscode.window.showErrorMessage(`Failed to restart aider process: ${error}`);
    }
  }
  async getConfigKeyForTest(runtime, testName) {
    try {
      const response = await fetch(ApiUtils.getConfigsUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.configs && data.configs.runtimes) {
        for (const [configKey, configValue] of Object.entries(data.configs.runtimes)) {
          const runtimeConfig = configValue;
          const runtimeMatches = runtimeConfig.runtime === runtime || configKey.toLowerCase().includes(runtime.toLowerCase()) || runtime.toLowerCase().includes(configKey.toLowerCase());
          if (runtimeMatches) {
            const tests = runtimeConfig.tests || [];
            if (tests.includes(testName)) {
              return configKey;
            }
            const testFileName = testName.split("/").pop();
            if (testFileName && tests.includes(testFileName)) {
              return configKey;
            }
            for (const test of tests) {
              if (test.includes(testName) || testName.includes(test)) {
                return configKey;
              }
            }
            const cleanTestName = testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
            for (const test of tests) {
              const cleanTest = test.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
              if (cleanTest === cleanTestName) {
                return configKey;
              }
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch configs:", error);
      return null;
    }
  }
  getAiderContainerName(configKey, testName) {
    const cleanTestName = testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
    const cleanConfigKey = configKey.toLowerCase();
    return `${cleanConfigKey}-${cleanTestName}-aider`;
  }
  getWorkspaceRoot() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return null;
  }
  createAllTerminals() {
    this.createAiderTerminals().catch((error) => {
      console.error("Error in createAllTerminals:", error);
    });
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode8 from "vscode";

// src/vscode/TestTreeItem.ts
import * as vscode2 from "vscode";
var TestTreeItem = class extends vscode2.TreeItem {
  constructor(label, type, collapsibleState, data, command, iconPath, contextValue) {
    super(label, collapsibleState);
    this.label = label;
    this.type = type;
    this.collapsibleState = collapsibleState;
    this.command = command;
    this.iconPath = iconPath;
    const safeData = data || {};
    this.data = safeData;
    this.tooltip = `${this.label}`;
    if (safeData.description) {
      this.description = safeData.description;
    }
    this.iconPath = iconPath || this.getDefaultIcon();
    this.contextValue = contextValue || this.getContextValue();
  }
  children;
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
        return "testItemWithAider";
      case 2 /* File */:
        return "fileItem";
      case 3 /* Info */:
        return "infoItem";
      default:
        return "unknown";
    }
  }
  // Add a method to get context value for test items with aider
  getContextValueWithAider() {
    if (this.type === 1 /* Test */) {
      return "testItemWithAider";
    }
    return this.getContextValue();
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
    console.log("[BaseTreeDataProvider] Constructor called");
    this.setupWebSocket();
    console.log("[BaseTreeDataProvider] Constructor completed");
  }
  getTreeItem(element) {
    if (element === null || element === void 0) {
      console.error("[BaseTreeDataProvider] getTreeItem called with null/undefined element");
      const item = new vscode3.TreeItem("Invalid item", vscode3.TreeItemCollapsibleState.None);
      item.tooltip = "This item could not be loaded";
      return item;
    }
    return element;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  setupWebSocket() {
    if (typeof WebSocket === "undefined") {
      console.log("[BaseTreeDataProvider] WebSocket not available in this environment");
      return;
    }
    if (this.ws) {
      this.ws.close();
    }
    try {
      const wsUrl = ApiUtils.getWebSocketUrl();
      console.log(`[BaseTreeDataProvider] Attempting to connect to WebSocket at ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        console.log("[BaseTreeDataProvider] WebSocket connection established");
        this.isConnected = true;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[BaseTreeDataProvider] WebSocket message received:", message.type);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error("[BaseTreeDataProvider] Error parsing WebSocket message:", error);
        }
      };
      this.ws.onerror = (error) => {
        console.error("[BaseTreeDataProvider] WebSocket error:", error);
        this.isConnected = false;
        this._onDidChangeTreeData.fire();
      };
      this.ws.onclose = (event) => {
        console.log(`[BaseTreeDataProvider] WebSocket closed: code=${event.code}, reason=${event.reason}`);
        this.isConnected = false;
        this.ws = null;
        setTimeout(() => {
          console.log("[BaseTreeDataProvider] Attempting to reconnect WebSocket...");
          this.setupWebSocket();
        }, 5e3);
        this._onDidChangeTreeData.fire();
      };
    } catch (error) {
      console.error("[BaseTreeDataProvider] Error setting up WebSocket:", error);
      this.isConnected = false;
    }
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

// src/vscode/providers/utils/testTree/configFetcher.ts
var configData = null;
async function fetchConfigsViaHttp() {
  try {
    const response = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 3e3);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    configData = data;
    return data;
  } catch (error) {
    console.error("[configFetcher] Error fetching configs:", error);
    throw error;
  }
}
function getConfigData() {
  return configData;
}

// src/vscode/providers/utils/testTree/treeItemBuilder.ts
import * as vscode4 from "vscode";
function createRefreshItem() {
  return new TestTreeItem(
    "Refresh now",
    3 /* Info */,
    vscode4.TreeItemCollapsibleState.None,
    {
      description: "Update configuration from server",
      refresh: true
    },
    {
      command: "testeranto.refresh",
      title: "Refresh",
      arguments: []
    },
    new vscode4.ThemeIcon(
      "refresh",
      new vscode4.ThemeColor("testing.iconQueued")
    )
  );
}
function createRuntimeCountItem(count) {
  return new TestTreeItem(
    `\u{1F4CA} ${count} Runtime(s)`,
    3 /* Info */,
    vscode4.TreeItemCollapsibleState.None,
    {
      description: "From HTTP /~/configs endpoint",
      count
    },
    void 0,
    new vscode4.ThemeIcon(
      "server",
      new vscode4.ThemeColor("testing.iconUnset")
    )
  );
}
function createRuntimeItem(runtimeKey, config) {
  return new TestTreeItem(
    `${runtimeKey} (${config.runtime})`,
    0 /* Runtime */,
    vscode4.TreeItemCollapsibleState.Collapsed,
    {
      runtime: config.runtime,
      runtimeKey,
      testsCount: config.tests?.length || 0
    },
    void 0,
    new vscode4.ThemeIcon("symbol-namespace")
  );
}
function createTestItem(runtimeKey, testName) {
  const item = new TestTreeItem(
    testName,
    1 /* Test */,
    vscode4.TreeItemCollapsibleState.Collapsed,
    { runtimeKey, testName },
    {
      command: "testeranto.launchAiderTerminal",
      title: "Launch Aider",
      arguments: [{ runtimeKey, testName }]
    },
    new vscode4.ThemeIcon("beaker"),
    "testItemWithAider"
  );
  item.tooltip = `Click to launch aider for this test.`;
  return item;
}

// src/vscode/providers/utils/testTree/treeFilter.ts
import * as assert from "node:assert";
function filterTreeForRuntimeAndTest(tree, runtime, testName) {
  assert.ok(tree, "Tree must be provided");
  assert.ok(typeof tree === "object", "Tree must be an object");
  assert.ok(runtime, "Runtime must be provided");
  assert.ok(typeof runtime === "string", "Runtime must be a string");
  assert.ok(testName, "Test name must be provided");
  assert.ok(typeof testName === "string", "Test name must be a string");
  console.log(`[treeFilter] ==========================================`);
  console.log(`[treeFilter] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`);
  const normalizeTestName = (name) => {
    if (!name) return "";
    const nameStr = String(name);
    return nameStr.replace(/\.test\.ts$/, "").replace(/\.spec\.ts$/, "").replace(/\.test\.js$/, "").replace(/\.spec\.js$/, "").replace(/\.test\.go$/, "").replace(/\.spec\.go$/, "").replace(/\.test$/, "").replace(/\.spec$/, "").replace(/\.ts$/, "").replace(/\.js$/, "").replace(/\.go$/, "").replace(/\.node\.ts$/, "").replace(/\.node\.js$/, "").replace(/[\/\\]/g, "_").toLowerCase();
  };
  const getTestBaseName = (name) => {
    if (!name) return "";
    const nameStr = String(name);
    const baseName = nameStr.split("/").pop() || nameStr;
    return normalizeTestName(baseName);
  };
  const normalizedTestName = normalizeTestName(testName);
  const testBaseName = getTestBaseName(testName);
  console.log(`[treeFilter] normalizedTestName: "${normalizedTestName}", testBaseName: "${testBaseName}"`);
  let runtimeNode = null;
  if (tree[runtime]) {
    runtimeNode = tree[runtime];
  } else {
    for (const key of Object.keys(tree)) {
      if (key.toLowerCase().includes(runtime.toLowerCase()) || runtime.toLowerCase().includes(key.toLowerCase())) {
        runtimeNode = tree[key];
        console.log(`[treeFilter] Found runtime "${key}" as match for "${runtime}"`);
        break;
      }
    }
  }
  if (!runtimeNode) {
    console.log(`[treeFilter] No runtime node found for "${runtime}"`);
    const firstRuntimeKey = Object.keys(tree)[0];
    if (firstRuntimeKey) {
      runtimeNode = tree[firstRuntimeKey];
      console.log(`[treeFilter] Using first runtime found: "${firstRuntimeKey}"`);
    } else {
      return {};
    }
  }
  if (runtimeNode.children) {
    if (runtimeNode.children[testName]) {
      console.log(`[treeFilter] Found test by exact key match: "${testName}"`);
      return filterNodeByTestName(runtimeNode.children[testName], testName);
    }
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const normalizedChildKey = normalizeTestName(childKey);
      const childBaseName = getTestBaseName(childKey);
      if (normalizedChildKey === normalizedTestName || childBaseName === testBaseName || childKey.includes(testName) || testName.includes(childKey) || normalizedChildKey.includes(normalizedTestName) || normalizedTestName.includes(normalizedChildKey)) {
        console.log(`[treeFilter] Found test by pattern match: "${childKey}" for "${testName}"`);
        return filterNodeByTestName(childNode, testName);
      }
    }
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const node = childNode;
      if (node.type === "directory" && node.children) {
        for (const [fileKey, fileNode] of Object.entries(node.children)) {
          const normalizedFileKey = normalizeTestName(fileKey);
          if (normalizedFileKey === normalizedTestName || normalizedFileKey.includes(normalizedTestName) || normalizedTestName.includes(normalizedFileKey)) {
            console.log(`[treeFilter] Found test in directory "${childKey}": "${fileKey}"`);
            return filterNodeByTestName(node, testName);
          }
        }
      }
    }
  } else if (runtimeNode.type === "directory" && runtimeNode.children) {
    const filteredChildren = {};
    for (const [childKey, childNode] of Object.entries(runtimeNode.children)) {
      const childrenForTest = filterNodeByTestName(childNode, testName);
      if (Object.keys(childrenForTest).length > 0) {
        filteredChildren[childKey] = {
          ...childNode,
          children: childrenForTest
        };
      }
    }
    return filteredChildren;
  }
  console.log(`[treeFilter] No test node found for "${testName}" in runtime "${runtime}"`);
  return {};
}
function filterNodeByTestName(node, testName) {
  if (!node || typeof node !== "object") {
    return {};
  }
  const children = node.children || {};
  const filteredChildren = {};
  for (const [childName, childNode] of Object.entries(children)) {
    if (childNode.type === "file") {
      if (childNode.testName === testName) {
        filteredChildren[childName] = childNode;
      } else if (childNode.path && childNode.path.includes(testName)) {
        filteredChildren[childName] = childNode;
      }
    } else if (childNode.type === "directory" && childNode.children) {
      const filteredDirChildren = filterNodeByTestName(childNode, testName);
      if (Object.keys(filteredDirChildren).length > 0) {
        filteredChildren[childName] = {
          ...childNode,
          children: filteredDirChildren
        };
      }
    } else if (childNode.testName === testName) {
      filteredChildren[childName] = childNode;
    }
  }
  return filteredChildren;
}

// src/vscode/providers/utils/testTree/treeConverter.ts
import * as vscode5 from "vscode";

// src/vscode/providers/utils/testTree/nodeConverter.ts
import * as vscode6 from "vscode";
function convertNodeToItem(name, node, runtime, testName, parentPath) {
  const currentPath = parentPath ? `${parentPath}/${name}` : name;
  if (node.type === "file") {
    const collapsibleState = vscode6.TreeItemCollapsibleState.None;
    let fileUri;
    const workspaceFolders = vscode6.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      let filePath = node.path;
      if (filePath.startsWith("/")) {
        fileUri = vscode6.Uri.file(filePath);
      } else {
        const fullPath = vscode6.Uri.joinPath(workspaceRoot, filePath);
        fileUri = fullPath;
      }
    }
    let icon;
    if (node.fileType === "input") {
      icon = new vscode6.ThemeIcon(
        "arrow-down",
        new vscode6.ThemeColor("testing.iconQueued")
      );
    } else if (node.fileType === "output") {
      icon = new vscode6.ThemeIcon(
        "arrow-up",
        new vscode6.ThemeColor("testing.iconPassed")
      );
    } else if (node.fileType === "both") {
      icon = new vscode6.ThemeIcon(
        "arrow-both",
        new vscode6.ThemeColor("testing.iconUnset")
      );
    } else if (node.fileType === "log") {
      if (node.exitCodeColor) {
        let colorId;
        switch (node.exitCodeColor) {
          case "green":
            colorId = "testing.iconPassed";
            break;
          case "yellow":
            colorId = "testing.iconQueued";
            break;
          case "red":
            colorId = "testing.iconFailed";
            break;
          default:
            colorId = "testing.iconUnset";
        }
        icon = new vscode6.ThemeIcon("output", new vscode6.ThemeColor(colorId));
      } else {
        icon = new vscode6.ThemeIcon("output");
      }
    } else if (node.fileType === "source") {
      icon = new vscode6.ThemeIcon("file-code");
    } else if (node.fileType === "documentation") {
      icon = new vscode6.ThemeIcon("book");
    } else {
      icon = new vscode6.ThemeIcon("file-text");
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
        fileType: node.fileType,
        exitCode: node.exitCode,
        exitCodeColor: node.exitCodeColor
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
      } else if (node.fileType === "log") {
        typeLabel = "Log";
        if (node.exitCode !== void 0) {
          typeLabel += ` (exit code: ${node.exitCode})`;
        }
      } else if (node.fileType === "source") {
        typeLabel = "Source";
      } else if (node.fileType === "documentation") {
        typeLabel = "Documentation";
      }
      treeItem.tooltip = `${typeLabel} file: ${node.path}`;
    }
    return treeItem;
  } else if (node.type === "directory") {
    const collapsibleState = vscode6.TreeItemCollapsibleState.Collapsed;
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
      new vscode6.ThemeIcon("folder")
    );
    treeItem.children = Object.entries(node.children || {}).map(
      ([childName, childNode]) => convertNodeToItem(
        childName,
        childNode,
        runtime,
        testName,
        currentPath
      )
    ).filter((item) => item !== null);
    return treeItem;
  } else if (node.type === "feature") {
    console.log(
      `[DEBUG] Converting feature node: ${name}, feature: ${node.feature}`
    );
    const collapsibleState = vscode6.TreeItemCollapsibleState.None;
    const icon = new vscode6.ThemeIcon("symbol-string");
    const treeItem = new TestTreeItem(
      node.name || name,
      2 /* File */,
      collapsibleState,
      {
        runtime,
        testName,
        isFeature: true,
        feature: node.feature,
        status: node.status || "unknown",
        clickable: false
      },
      void 0,
      icon
    );
    treeItem.tooltip = `Feature: ${node.feature}
Status: ${node.status}`;
    return treeItem;
  }
  return null;
}

// src/vscode/providers/utils/testTree/treeNavigator.ts
async function getDirectoryChildren(runtime, testName, dirPath) {
  try {
    const response = await fetch(ApiUtils.getCollatedFilesUrl());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    const collatedFilesResponse = data;
    const tree = collatedFilesResponse.tree || {};
    const filteredTree = filterTreeForRuntimeAndTest(
      tree,
      runtime,
      testName
    );
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
      const item = convertNodeToItem(
        name,
        node,
        runtime,
        testName,
        dirPath
      );
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

// src/vscode/providers/createErrorItems.ts
import * as vscode7 from "vscode";
var createErrorItems = (runtimeKey, testName, error) => {
  return [
    new TestTreeItem(
      "Error loading files",
      3 /* Info */,
      vscode7.TreeItemCollapsibleState.None,
      {
        description: error?.message || "Unknown error",
        runtimeKey,
        testName
      },
      void 0,
      new vscode7.ThemeIcon("error")
    )
  ];
};

// src/vscode/providers/TestTreeDataProvider.ts
var TestTreeDataProvider = class extends BaseTreeDataProvider {
  configWatcher;
  constructor() {
    super();
    console.log("[TestTreeDataProvider] CONSTRUCTOR CALLED - LOGGING FROM TestTreeDataProvider.ts");
    try {
      vscode8.window.showInformationMessage("TestTreeDataProvider constructor called!");
    } catch (error) {
      console.log("[TestTreeDataProvider] Could not show information message:", error);
    }
    console.log("[TestTreeDataProvider] Calling super() completed");
    fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    console.log("[TestTreeDataProvider] Setting up config watcher...");
    this.setupConfigWatcher();
    console.log("[TestTreeDataProvider] Constructor completed");
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    vscode8.window.withProgress({
      location: vscode8.ProgressLocation.Notification,
      title: "Refreshing Testeranto...",
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0 });
      try {
        await fetchConfigsViaHttp();
        progress.report({ increment: 100 });
        this._onDidChangeTreeData.fire();
        vscode8.window.showInformationMessage("Testeranto refreshed successfully");
      } catch (error) {
        console.error("[TestTreeDataProvider] HTTP refresh failed:", error);
        vscode8.window.showErrorMessage(`Failed to refresh: ${error.message}`);
        this._onDidChangeTreeData.fire();
      }
    });
  }
  setupConfigWatcher() {
    const workspaceFolders = vscode8.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode8.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
    this.configWatcher = vscode8.workspace.createFileSystemWatcher(configPattern);
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
    console.log("[TestTreeDataProvider] getTreeItem called with element:", element ? `type: ${element.type}, label: ${element.label}` : "undefined");
    if (element === null || element === void 0) {
      console.error("[TestTreeDataProvider] getTreeItem called with null/undefined element");
      const item = new vscode8.TreeItem("Error: Invalid element", vscode8.TreeItemCollapsibleState.None);
      item.tooltip = "This item could not be loaded";
      return item;
    }
    if (typeof element !== "object" || element === null) {
      console.error("[TestTreeDataProvider] getTreeItem called with non-object element:", element);
      const item = new vscode8.TreeItem("Invalid element", vscode8.TreeItemCollapsibleState.None);
      item.tooltip = "This item is corrupted";
      return item;
    }
    if (!("type" in element)) {
      console.error("[TestTreeDataProvider] getTreeItem called with element missing type property:", element);
      const item = new vscode8.TreeItem("Invalid element", vscode8.TreeItemCollapsibleState.None);
      item.tooltip = "This item is corrupted";
      return item;
    }
    console.log("[TestTreeDataProvider] Returning valid element");
    return element;
  }
  getChildren(element) {
    console.log("[TestTreeDataProvider] getChildren called with element:", element ? `type: ${element.type}, label: ${element.label}` : "undefined");
    if (element === null || element === void 0) {
      console.log("[TestTreeDataProvider] No element, returning runtime items");
      return this.getRuntimeItems();
    }
    if (typeof element !== "object" || element === null) {
      console.error("[TestTreeDataProvider] Element is not an object:", element);
      return Promise.resolve([]);
    }
    if (element.type === void 0) {
      console.error("[TestTreeDataProvider] Element type is undefined:", element);
      return Promise.resolve([]);
    }
    switch (element.type) {
      case 0 /* Runtime */:
        console.log("[TestTreeDataProvider] Handling Runtime element");
        const runtimeKeyFromRuntime = element.data?.runtime;
        return this.getTestItems(runtimeKeyFromRuntime);
      case 1 /* Test */:
        console.log("[TestTreeDataProvider] Handling Test element");
        const { runtimeKey, testName } = element.data || {};
        return this.getTestFileItems(runtimeKey, testName);
      case 3 /* Info */:
        console.log(`[TestTreeDataProvider] Handling Info folder: ${element.label}`);
        console.log(`[TestTreeDataProvider] getChildren for Info folder: ${element.label}, children count: ${element.children?.length || 0}`);
        if (element.children && element.children.length > 0) {
          console.log(`[TestTreeDataProvider] Returning children for ${element.label}:`, element.children.map((c) => c.label));
          return Promise.resolve(element.children);
        }
        console.log(`[TestTreeDataProvider] No children for ${element.label}`);
        return Promise.resolve([]);
      case 2 /* File */:
        console.log(`[TestTreeDataProvider] Handling File element: ${element.label}`);
        const {
          runtime: fileRuntime,
          testName: fileTestName,
          path: path3,
          isFile
        } = element.data || {};
        console.log(`[TestTreeDataProvider] File data:`, { fileRuntime, fileTestName, path: path3, isFile });
        if (isFile) {
          console.log(`[TestTreeDataProvider] File is a leaf, returning empty array`);
          return Promise.resolve([]);
        }
        if (element.children && element.children.length > 0) {
          console.log(`[TestTreeDataProvider] File has pre-populated children`);
          return Promise.resolve(element.children);
        }
        console.log(`[TestTreeDataProvider] Expanding directory for file`);
        return getDirectoryChildren(fileRuntime, fileTestName, path3 || "");
      default:
        console.warn("[TestTreeDataProvider] Unknown element type:", element.type);
        return Promise.resolve([]);
    }
  }
  async getRuntimeItems() {
    console.log("[TestTreeDataProvider] getRuntimeItems called - MINIMAL TEST");
    const items = [];
    items.push(new TestTreeItem(
      "Testeranto Test Item",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description: "Test item to show extension works"
      },
      void 0,
      new vscode8.ThemeIcon("check")
    ));
    items.push(this.createConfigFileItem());
    items.push(createRefreshItem());
    const connectionStatusItem = this.createConnectionStatusItem();
    items.push(connectionStatusItem);
    items.push(new TestTreeItem(
      "Open Server Report",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description: "View HTML report in webview",
        webview: true
      },
      {
        command: "testeranto.openServerWebview",
        title: "Open Server Webview",
        arguments: []
      },
      new vscode8.ThemeIcon("globe")
    ));
    try {
      const response = await fetch(ApiUtils.getUnifiedTestTreeUrl());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const unifiedTree = data.tree || {};
      if (Object.keys(unifiedTree).length > 0) {
        items.push(new TestTreeItem(
          `Runtimes (${Object.keys(unifiedTree).length})`,
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "Available test runtimes",
            count: Object.keys(unifiedTree).length
          },
          void 0,
          new vscode8.ThemeIcon("symbol-namespace")
        ));
        for (const [runtimeKey, runtimeEntry] of Object.entries(unifiedTree)) {
          const runtime = runtimeEntry;
          const testCount = Object.keys(runtime.tests || {}).length;
          items.push(new TestTreeItem(
            runtimeKey,
            0 /* Runtime */,
            testCount > 0 ? vscode8.TreeItemCollapsibleState.Collapsed : vscode8.TreeItemCollapsibleState.None,
            {
              runtime: runtimeKey,
              description: `${testCount} test(s)`,
              testsCount: testCount
            },
            void 0,
            new vscode8.ThemeIcon("symbol-namespace")
          ));
        }
      } else {
        items.push(new TestTreeItem(
          "No tests configured",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "Add tests to testeranto/testeranto.ts"
          },
          {
            command: "testeranto.openTesterantoConfig",
            title: "Open Config",
            arguments: []
          },
          new vscode8.ThemeIcon("info")
        ));
      }
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching unified tree:", error);
      try {
        const configData2 = await fetchConfigsViaHttp();
        if (configData2?.configs?.runtimes) {
          const runtimes = configData2.configs.runtimes;
          const runtimeEntries = Object.entries(runtimes);
          if (runtimeEntries.length > 0) {
            items.push(createRuntimeCountItem(runtimeEntries.length));
            for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
              const config = runtimeConfig;
              if (config?.runtime) {
                items.push(createRuntimeItem(runtimeKey, config));
              }
            }
          } else {
            items.push(new TestTreeItem(
              "No tests configured",
              3 /* Info */,
              vscode8.TreeItemCollapsibleState.None,
              {
                description: "Add tests to testeranto/testeranto.ts"
              },
              {
                command: "testeranto.openTesterantoConfig",
                title: "Open Config",
                arguments: []
              },
              new vscode8.ThemeIcon("info")
            ));
          }
        } else {
          items.push(new TestTreeItem(
            "Server returned empty configuration",
            3 /* Info */,
            vscode8.TreeItemCollapsibleState.None,
            {
              description: "Check server logs"
            },
            {
              command: "testeranto.startServer",
              title: "Start Server",
              arguments: []
            },
            new vscode8.ThemeIcon("warning")
          ));
        }
      } catch (configError) {
        console.error("[TestTreeDataProvider] Error fetching configs:", configError);
        items.push(new TestTreeItem(
          "Cannot connect to server",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "Click to start the server",
            startServer: true,
            error: configError.message
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode8.ThemeIcon("error")
        ));
        items.push(new TestTreeItem(
          "Need help?",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "Check the output channel for details"
          },
          {
            command: "testeranto.testLogging",
            title: "Test Logging",
            arguments: []
          },
          new vscode8.ThemeIcon("question")
        ));
      }
    }
    return items;
  }
  createConnectionStatusItem() {
    const isConnected = this.isConnected;
    const description = isConnected ? "WebSocket connected" : "WebSocket disconnected";
    const icon = isConnected ? new vscode8.ThemeIcon("radio-tower", new vscode8.ThemeColor("testing.iconPassed")) : new vscode8.ThemeIcon("radio-tower", new vscode8.ThemeColor("testing.iconFailed"));
    return new TestTreeItem(
      "Connection Status",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description,
        connected: isConnected,
        disconnected: !isConnected
      },
      {
        command: "testeranto.retryConnection",
        title: "Retry Connection",
        arguments: [this]
      },
      icon
    );
  }
  createConfigFileItem() {
    const item = new TestTreeItem(
      "testeranto/testeranto.ts",
      2 /* File */,
      vscode8.TreeItemCollapsibleState.None,
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
      new vscode8.ThemeIcon("settings-gear")
    );
    item.tooltip = "Click to open the main Testeranto configuration file";
    return item;
  }
  async getTestItems(runtime) {
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
      return Object.keys(tests).map((testName) => {
        return new TestTreeItem(
          testName,
          1 /* Test */,
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey: runtime,
            testName,
            runtime,
            test: testName
          },
          void 0,
          new vscode8.ThemeIcon("beaker")
        );
      });
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching unified tree for tests:", error);
      const configData2 = getConfigData();
      if (configData2?.configs?.runtimes) {
        const runtimes = configData2.configs.runtimes;
        for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
          const config = runtimeConfig;
          if (config?.runtime === runtime) {
            const tests = Array.isArray(config.tests) ? config.tests : [];
            return tests.map((testName) => {
              return createTestItem(runtimeKey, testName);
            });
          }
        }
      }
      return [];
    }
  }
  async getTestFileItems(runtimeKey, testName) {
    console.log(`[TestTreeDataProvider] getTestFileItems START for ${runtimeKey}/${testName} using unified tree`);
    try {
      console.log(`[TestTreeDataProvider] Fetching unified test tree from server...`);
      const response = await fetch(ApiUtils.getUnifiedTestTreeUrl());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const unifiedTree = data.tree || {};
      const runtimeEntry = unifiedTree[runtimeKey];
      if (!runtimeEntry) {
        return [];
      }
      const tests = runtimeEntry.tests || {};
      const testEntry = tests[testName];
      if (!testEntry) {
        return [];
      }
      const items = [];
      if (testEntry.sourceFiles && testEntry.sourceFiles.length > 0) {
        const sourceFilesItem = new TestTreeItem(
          "Source Files",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            description: `${testEntry.sourceFiles.length} file(s)`,
            count: testEntry.sourceFiles.length
          },
          void 0,
          new vscode8.ThemeIcon("file-code")
        );
        sourceFilesItem.children = testEntry.sourceFiles.map((file) => {
          return new TestTreeItem(
            file.path,
            2 /* File */,
            vscode8.TreeItemCollapsibleState.None,
            {
              fileName: file.path,
              runtime: runtimeKey,
              testName,
              isFile: true,
              fileType: file.type || "source"
            },
            {
              command: "testeranto.openFile",
              title: "Open File",
              arguments: [{ fileName: file.path, runtime: runtimeKey, testName, isFile: true }]
            },
            new vscode8.ThemeIcon("file")
          );
        });
        items.push(sourceFilesItem);
      }
      if (testEntry.logs && testEntry.logs.length > 0) {
        const logsItem = new TestTreeItem(
          "Logs",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            description: `${testEntry.logs.length} log file(s)`,
            count: testEntry.logs.length
          },
          void 0,
          new vscode8.ThemeIcon("output")
        );
        logsItem.children = testEntry.logs.map((logPath) => {
          return new TestTreeItem(
            logPath.split("/").pop() || logPath,
            2 /* File */,
            vscode8.TreeItemCollapsibleState.None,
            {
              fileName: logPath,
              runtime: runtimeKey,
              testName,
              isFile: true,
              fileType: "log"
            },
            {
              command: "testeranto.openFile",
              title: "Open Log File",
              arguments: [{ fileName: logPath, runtime: runtimeKey, testName, isFile: true }]
            },
            new vscode8.ThemeIcon("output")
          );
        });
        items.push(logsItem);
      }
      if (testEntry.outputFiles && testEntry.outputFiles.length > 0) {
        const outputFilesItem = new TestTreeItem(
          "Output Files",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            description: `${testEntry.outputFiles.length} file(s)`,
            count: testEntry.outputFiles.length
          },
          void 0,
          new vscode8.ThemeIcon("folder-opened")
        );
        outputFilesItem.children = testEntry.outputFiles.map((filePath) => {
          return new TestTreeItem(
            filePath.split("/").pop() || filePath,
            2 /* File */,
            vscode8.TreeItemCollapsibleState.None,
            {
              fileName: filePath,
              runtime: runtimeKey,
              testName,
              isFile: true,
              fileType: "output"
            },
            {
              command: "testeranto.openFile",
              title: "Open Output File",
              arguments: [{ fileName: filePath, runtime: runtimeKey, testName, isFile: true }]
            },
            new vscode8.ThemeIcon("file")
          );
        });
        items.push(outputFilesItem);
      }
      if (testEntry.results) {
        items.push(new TestTreeItem(
          "Test Results",
          2 /* File */,
          vscode8.TreeItemCollapsibleState.None,
          {
            fileName: testEntry.results,
            runtime: runtimeKey,
            testName,
            isFile: true,
            fileType: "test-results"
          },
          {
            command: "testeranto.openFile",
            title: "Open Test Results",
            arguments: [{ fileName: testEntry.results, runtime: runtimeKey, testName, isFile: true }]
          },
          new vscode8.ThemeIcon("graph")
        ));
      }
      console.log(`[TestTreeDataProvider] Built ${items.length} top-level items for ${runtimeKey}/${testName}`);
      return items;
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching unified test tree:", error);
      return createErrorItems(runtimeKey, testName);
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
          fetchConfigsViaHttp().catch((error) => {
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

// src/vscode/providers/DockerProcessTreeDataProvider.ts
import * as vscode9 from "vscode";
var DockerProcessTreeDataProvider = class extends BaseTreeDataProvider {
  processes = [];
  refreshInterval = null;
  constructor() {
    super();
    this.startAutoRefresh();
  }
  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 5e3);
  }
  async refresh() {
    try {
      await this.fetchProcesses();
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Error refreshing processes:", error);
    }
  }
  async fetchProcesses() {
    try {
      const response = await fetch(ApiUtils.getProcessesUrl(), {
        signal: AbortSignal.timeout(3e3)
        // 3 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const processesResponse = data;
      const rawProcesses = Array.isArray(processesResponse.processes) ? processesResponse.processes : [];
      this.processes = rawProcesses.filter(
        (process) => process && typeof process === "object"
      ).map((process) => {
        return {
          ...process,
          // For backward compatibility, set id to processId if not present
          id: process.id || process.processId,
          // Ensure all required fields are present
          processId: process.processId || process.id || "unknown",
          containerId: process.containerId || "unknown",
          command: process.command || "",
          image: process.image || "",
          timestamp: process.timestamp || "",
          status: process.status || "",
          state: process.state || "unknown",
          ports: process.ports || "",
          exitCode: process.exitCode,
          startedAt: process.startedAt || "",
          finishedAt: process.finishedAt || "",
          isActive: process.isActive || false,
          health: process.health || "unknown",
          // Optional fields
          name: process.name,
          runtime: process.runtime,
          testName: process.testName,
          serviceName: process.serviceName,
          lastPass: process.lastPass,
          lastFail: process.lastFail
        };
      });
      if (this.processes.length > 0) {
        console.log(
          "[DockerProcessTreeDataProvider] First process structure:",
          JSON.stringify(this.processes[0], null, 2)
        );
      }
      this.processes.forEach((process) => {
        if (!process || typeof process !== "object") return;
        if (process.state === "exited") {
          if (process.exitCode === 0) {
            process.lastPass = true;
            process.lastFail = false;
          } else if (process.exitCode !== void 0 && process.exitCode !== 0) {
            process.lastPass = false;
            process.lastFail = true;
          }
        }
      });
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Error fetching processes:", error);
      this.processes = [];
    }
  }
  getChildren(element) {
    if (!element) {
      return this.getRootItems();
    }
    if (element.children && element.children.length > 0) {
      return Promise.resolve(element.children);
    }
    return Promise.resolve([]);
  }
  getTreeItem(element) {
    return element;
  }
  async getRootItems() {
    const items = [];
    items.push(new TestTreeItem(
      "Docker Processes",
      3 /* Info */,
      vscode9.TreeItemCollapsibleState.None,
      {
        description: `${this.processes.length} processes`,
        count: this.processes.length
      },
      void 0,
      new vscode9.ThemeIcon("server")
    ));
    items.push(new TestTreeItem(
      "Refresh now",
      3 /* Info */,
      vscode9.TreeItemCollapsibleState.None,
      {
        description: "Update process list",
        refresh: true
      },
      {
        command: "testeranto.refreshDockerProcesses",
        title: "Refresh Docker Processes",
        arguments: []
      },
      new vscode9.ThemeIcon("refresh")
    ));
    if (this.processes.length === 0) {
      items.push(new TestTreeItem(
        "No processes found",
        3 /* Info */,
        vscode9.TreeItemCollapsibleState.None,
        {
          description: "Server may not be running"
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode9.ThemeIcon("info")
      ));
    } else {
      const groupedByRuntime = this.groupProcessesByRuntime();
      for (const [runtime, processes] of Object.entries(groupedByRuntime)) {
        if (!processes || processes.length === 0) continue;
        if (runtime === "unknown") {
          processes.forEach((process) => {
            if (process) {
              items.push(this.createProcessItem(process));
            }
          });
        } else {
          const runtimeItem = new TestTreeItem(
            runtime,
            0 /* Runtime */,
            vscode9.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              description: `${processes.length} processes`,
              count: processes.length
            },
            void 0,
            new vscode9.ThemeIcon("symbol-namespace")
          );
          runtimeItem.children = processes.filter((process) => process).map((process) => this.createProcessItem(process));
          items.push(runtimeItem);
        }
      }
    }
    return items;
  }
  groupProcessesByRuntime() {
    const groups = {};
    this.processes.forEach((process) => {
      if (!process || typeof process !== "object") return;
      let runtime = "unknown";
      const runtimeValue = process.runtime;
      if (runtimeValue && typeof runtimeValue === "string") {
        runtime = runtimeValue.toLowerCase();
      } else if (process.processId) {
        const processId = String(process.processId).toLowerCase();
        if (processId.includes("golang") || processId.includes("go-")) {
          runtime = "golang";
        } else if (processId.includes("node") || processId.includes("js-") || processId.includes("ts-")) {
          runtime = "node";
        } else if (processId.includes("python") || processId.includes("py-")) {
          runtime = "python";
        } else if (processId.includes("rust")) {
          runtime = "rust";
        } else if (processId.includes("builder")) {
          runtime = "builder";
        } else if (processId.includes("web")) {
          runtime = "web";
        }
      } else if (process.serviceName) {
        const serviceName = String(process.serviceName).toLowerCase();
        if (serviceName.includes("golang")) {
          runtime = "golang";
        } else if (serviceName.includes("node")) {
          runtime = "node";
        } else if (serviceName.includes("python")) {
          runtime = "python";
        } else if (serviceName.includes("rust")) {
          runtime = "rust";
        } else if (serviceName.includes("web")) {
          runtime = "web";
        }
      }
      if (!runtime) {
        runtime = "unknown";
      }
      if (!groups[runtime]) {
        groups[runtime] = [];
      }
      groups[runtime].push(process);
    });
    return groups;
  }
  createProcessItem(process) {
    const processId = process?.id?.trim() || "unknown";
    const processName = process?.name?.trim() || "Unnamed Process";
    const processStatus = process?.status || "unknown";
    const safeProcessId = processId || "unknown";
    const hasRealName = processName !== "Unnamed Process" && processName !== "";
    const label = hasRealName ? processName : safeProcessId.substring(0, Math.min(safeProcessId.length, 12));
    let description = processStatus;
    if (process?.exitCode !== void 0) {
      description += ` (exit: ${process.exitCode})`;
    }
    if (process?.serviceName) {
      description += ` \u2022 ${process.serviceName}`;
    }
    let icon;
    if (process?.state === "running") {
      icon = new vscode9.ThemeIcon("play-circle", new vscode9.ThemeColor("testing.iconPassed"));
    } else if (process?.lastPass) {
      icon = new vscode9.ThemeIcon("check", new vscode9.ThemeColor("testing.iconPassed"));
    } else if (process?.lastFail) {
      icon = new vscode9.ThemeIcon("error", new vscode9.ThemeColor("testing.iconFailed"));
    } else if (process?.state === "exited") {
      icon = new vscode9.ThemeIcon("circle-slash", new vscode9.ThemeColor("testing.iconUnset"));
    } else if (process?.state === "paused") {
      icon = new vscode9.ThemeIcon("debug-pause", new vscode9.ThemeColor("testing.iconQueued"));
    } else if (process?.state === "created") {
      icon = new vscode9.ThemeIcon("circle-outline", new vscode9.ThemeColor("testing.iconQueued"));
    } else {
      icon = new vscode9.ThemeIcon("circle-outline", new vscode9.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode9.TreeItemCollapsibleState.None,
      {
        description,
        status: processStatus,
        exitCode: process?.exitCode,
        runtime: process?.runtime,
        testName: process?.testName,
        serviceName: process?.serviceName
      },
      {
        command: "testeranto.showProcessLogs",
        title: "Show Process Logs",
        arguments: [safeProcessId, processName]
      },
      icon
    );
    let tooltip = `Process ID: ${safeProcessId}
`;
    tooltip += `Container ID: ${process?.containerId || "unknown"}
`;
    tooltip += `State: ${process?.state || "unknown"}
`;
    tooltip += `Status: ${process?.status || "unknown"}
`;
    if (process?.exitCode !== void 0) {
      tooltip += `Exit Code: ${process.exitCode}
`;
    }
    tooltip += `Image: ${process?.image || "unknown"}
`;
    tooltip += `Command: ${process?.command || "unknown"}
`;
    if (process?.startedAt && process.startedAt !== "0001-01-01T00:00:00Z") {
      tooltip += `Started: ${process.startedAt}
`;
    }
    if (process?.finishedAt && process.finishedAt !== "0001-01-01T00:00:00Z") {
      tooltip += `Finished: ${process.finishedAt}
`;
    }
    tooltip += `Active: ${process?.isActive ? "Yes" : "No"}
`;
    tooltip += `Health: ${process?.health || "unknown"}
`;
    if (process?.runtime) {
      tooltip += `Runtime: ${process.runtime}
`;
    }
    if (process?.testName) {
      tooltip += `Test: ${process.testName}
`;
    }
    if (process?.serviceName) {
      tooltip += `Service: ${process.serviceName}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged" && message.url === "/~/processes") {
      this.refresh();
    }
  }
  dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    super.dispose();
  }
};

// src/vscode/providers/AiderProcessTreeDataProvider.ts
import * as vscode10 from "vscode";
var AiderProcessTreeDataProvider = class extends BaseTreeDataProvider {
  processes = [];
  refreshInterval = null;
  constructor() {
    super();
    this.startAutoRefresh();
  }
  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 1e4);
  }
  async refresh() {
    try {
      await this.fetchProcesses();
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error("[AiderProcessTreeDataProvider] Error refreshing processes:", error);
    }
  }
  async fetchProcesses() {
    try {
      const response = await fetch(ApiUtils.getAiderProcessesUrl(), {
        signal: AbortSignal.timeout(3e3)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const aiderResponse = data;
      const rawProcesses = Array.isArray(aiderResponse.aiderProcesses) ? aiderResponse.aiderProcesses : [];
      this.processes = rawProcesses.filter(
        (process) => process && typeof process === "object"
      ).map((process) => ({
        id: process.id || process.containerId || "unknown",
        containerId: process.containerId || "unknown",
        containerName: process.containerName || "unknown",
        runtime: process.runtime || "unknown",
        testName: process.testName || "unknown",
        configKey: process.configKey || "unknown",
        isActive: process.isActive || false,
        status: process.status || "stopped",
        exitCode: process.exitCode,
        startedAt: process.startedAt || "",
        lastActivity: process.lastActivity
      }));
      if (this.processes.length > 0) {
        console.log("[AiderProcessTreeDataProvider] Found", this.processes.length, "aider processes");
      }
    } catch (error) {
      console.error("[AiderProcessTreeDataProvider] Error fetching aider processes:", error);
      this.processes = [];
    }
  }
  getChildren(element) {
    if (!element) {
      return this.getRootItems();
    }
    if (element.children && element.children.length > 0) {
      return Promise.resolve(element.children);
    }
    return Promise.resolve([]);
  }
  getTreeItem(element) {
    return element;
  }
  async getRootItems() {
    const items = [];
    items.push(new TestTreeItem(
      "Aider Processes",
      3 /* Info */,
      vscode10.TreeItemCollapsibleState.None,
      {
        description: `${this.processes.length} processes`,
        count: this.processes.length
      },
      void 0,
      new vscode10.ThemeIcon("comment-discussion")
    ));
    items.push(new TestTreeItem(
      "Refresh now",
      3 /* Info */,
      vscode10.TreeItemCollapsibleState.None,
      {
        description: "Update aider process list",
        refresh: true
      },
      {
        command: "testeranto.refreshAiderProcesses",
        title: "Refresh Aider Processes",
        arguments: []
      },
      new vscode10.ThemeIcon("refresh")
    ));
    if (this.processes.length === 0) {
      items.push(new TestTreeItem(
        "No aider processes found",
        3 /* Info */,
        vscode10.TreeItemCollapsibleState.None,
        {
          description: "Run tests to create aider processes"
        },
        {
          command: "testeranto.showTests",
          title: "Show Tests",
          arguments: []
        },
        new vscode10.ThemeIcon("info")
      ));
    } else {
      const groupedByRuntime = this.groupProcessesByRuntime();
      for (const [runtime, processes] of Object.entries(groupedByRuntime)) {
        if (!processes || processes.length === 0) continue;
        if (runtime === "unknown") {
          processes.forEach((process) => {
            if (process) {
              items.push(this.createProcessItem(process));
            }
          });
        } else {
          const runtimeItem = new TestTreeItem(
            runtime,
            0 /* Runtime */,
            vscode10.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              description: `${processes.length} processes`,
              count: processes.length
            },
            void 0,
            new vscode10.ThemeIcon("symbol-namespace")
          );
          runtimeItem.children = processes.filter((process) => process).map((process) => this.createProcessItem(process));
          items.push(runtimeItem);
        }
      }
    }
    return items;
  }
  groupProcessesByRuntime() {
    const groups = {};
    this.processes.forEach((process) => {
      if (!process || typeof process !== "object") return;
      const runtime = process.runtime || "unknown";
      if (!groups[runtime]) {
        groups[runtime] = [];
      }
      groups[runtime].push(process);
    });
    return groups;
  }
  createProcessItem(process) {
    const label = `${process.testName} (${process.runtime})`;
    let description = process.status;
    if (process.exitCode !== void 0) {
      description += ` (exit: ${process.exitCode})`;
    }
    if (!process.isActive) {
      description += " \u2022 inactive";
    }
    let icon;
    if (process.status === "running" && process.isActive) {
      icon = new vscode10.ThemeIcon("play-circle", new vscode10.ThemeColor("testing.iconPassed"));
    } else if (process.status === "exited") {
      if (process.exitCode === 0) {
        icon = new vscode10.ThemeIcon("check", new vscode10.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode10.ThemeIcon("error", new vscode10.ThemeColor("testing.iconFailed"));
      }
    } else if (process.status === "stopped") {
      icon = new vscode10.ThemeIcon("circle-slash", new vscode10.ThemeColor("testing.iconUnset"));
    } else {
      icon = new vscode10.ThemeIcon("circle-outline", new vscode10.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode10.TreeItemCollapsibleState.None,
      {
        description,
        status: process.status,
        exitCode: process.exitCode,
        runtime: process.runtime,
        testName: process.testName,
        configKey: process.configKey,
        containerId: process.containerId,
        containerName: process.containerName,
        isActive: process.isActive
      },
      {
        command: "testeranto.openAiderTerminal",
        title: "Open Aider Terminal",
        arguments: [process.runtime, process.testName, process.containerId]
      },
      icon
    );
    let tooltip = `Test: ${process.testName}
`;
    tooltip += `Runtime: ${process.runtime}
`;
    tooltip += `Config: ${process.configKey}
`;
    tooltip += `Status: ${process.status}
`;
    tooltip += `Active: ${process.isActive ? "Yes" : "No"}
`;
    if (process.exitCode !== void 0) {
      tooltip += `Exit Code: ${process.exitCode}
`;
    }
    tooltip += `Container: ${process.containerName}
`;
    tooltip += `Container ID: ${process.containerId}
`;
    if (process.startedAt) {
      tooltip += `Started: ${process.startedAt}
`;
    }
    if (process.lastActivity) {
      tooltip += `Last Activity: ${process.lastActivity}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged" && message.url === "/~/aider-processes") {
      this.refresh();
    }
  }
  dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    super.dispose();
  }
};

// src/vscode/statusBarManager.ts
import * as vscode11 from "vscode";
var StatusBarManager = class {
  mainStatusBarItem;
  serverStatusBarItem;
  constructor() {
    this.mainStatusBarItem = vscode11.window.createStatusBarItem(vscode11.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode11.window.createStatusBarItem(vscode11.StatusBarAlignment.Right, 99);
  }
  initialize() {
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode11.ThemeColor("statusBarItem.warningBackground");
    this.serverStatusBarItem.show();
  }
  async updateServerStatus() {
    try {
      const workspaceFolders = vscode11.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode11.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode11.workspace.fs.readFile(configUri);
          const configText = Buffer.from(fileContent).toString("utf-8");
          const config = JSON.parse(configText);
          if (config.serverStarted === true) {
            this.serverStatusBarItem.text = "$(check) Server";
            this.serverStatusBarItem.tooltip = "Testeranto server is running. Click to restart.";
            this.serverStatusBarItem.backgroundColor = void 0;
            console.log("[Testeranto] Server status: Running (config indicates server is started)");
            if (config.processes && config.processes.length > 0) {
              const runningProcesses = config.processes.filter((p) => p.isActive === true);
              const stoppedProcesses = config.processes.filter((p) => p.isActive !== true);
              if (runningProcesses.length > 0) {
                this.serverStatusBarItem.text = `$(check) Server (${runningProcesses.length} running)`;
                if (stoppedProcesses.length > 0) {
                  this.serverStatusBarItem.tooltip = `Testeranto server is running. ${runningProcesses.length} containers running, ${stoppedProcesses.length} stopped.`;
                }
              } else {
                this.serverStatusBarItem.text = "$(check) Server (0 running)";
                if (stoppedProcesses.length > 0) {
                  this.serverStatusBarItem.tooltip = `Testeranto server is running. All ${stoppedProcesses.length} containers are stopped.`;
                }
              }
            }
          } else {
            this.serverStatusBarItem.text = "$(circle-slash) Server";
            this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
            this.serverStatusBarItem.backgroundColor = new vscode11.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          this.serverStatusBarItem.text = "$(circle-slash) Server";
          this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          this.serverStatusBarItem.backgroundColor = new vscode11.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode11.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode11.ThemeColor("statusBarItem.errorBackground");
    }
  }
  getMainStatusBarItem() {
    return this.mainStatusBarItem;
  }
  getServerStatusBarItem() {
    return this.serverStatusBarItem;
  }
  dispose() {
    this.mainStatusBarItem.dispose();
    this.serverStatusBarItem.dispose();
  }
};

// src/vscode/commandManager.ts
import * as vscode16 from "vscode";

// src/vscode/registerCommands.tsx
import * as vscode15 from "vscode";

// src/vscode/getFallbackHtmlContent.tsx
function getFallbackHtmlContent() {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Testeranto - Stakeholder Report</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }
                #root {
                    min-height: 100vh;
                }
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-size: 1.2rem;
                    color: #666;
                }
                .error-container {
                    padding: 40px;
                    text-align: center;
                }
                .error-title {
                    color: #d32f2f;
                    margin-bottom: 20px;
                }
                .refresh-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background-color: #007acc;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .refresh-button:hover {
                    background-color: #005a9e;
                }
            </style>
        </head>
        <body>
            <div id="root">
                <div class="error-container">
                    <h1 class="error-title">Report Not Found</h1>
                    <p>The Testeranto report file could not be found.</p>
                    <p>Please make sure the server is running and has generated the report files.</p>
                    <button class="refresh-button" onclick="refreshReport()">Refresh Report</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                
                function refreshReport() {
                    vscode.postMessage({
                        command: 'refresh'
                    });
                }
                
                // Try to start the server if not running
                setTimeout(() => {
                    vscode.postMessage({
                        command: 'alert',
                        text: 'Report not found. Please start the server first.'
                    });
                }, 1000);
            </script>
        </body>
        </html>
    `;
}

// src/vscode/showProcessLogs.ts
import * as vscode12 from "vscode";
var showProcessLogs = () => {
  return vscode12.commands.registerCommand(
    "testeranto.showProcessLogs",
    async (processId, processName) => {
      try {
        const outputChannel = vscode12.window.createOutputChannel(`Process: ${processName || processId}`);
        outputChannel.show(true);
        const response = await fetch(ApiUtils.getProcessLogsUrl(processId));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
        outputChannel.appendLine(`Process ID: ${processId}`);
        outputChannel.appendLine(`
=== End of logs ===`);
      } catch (err) {
        vscode12.window.showErrorMessage(`Error fetching process logs: ${err}`);
      }
    }
  );
};

// src/vscode/openFile.ts
import * as vscode13 from "vscode";
import * as path from "path";
var openFile = () => {
  return vscode13.commands.registerCommand(
    "testeranto.openFile",
    async (arg) => {
      console.log("[CommandManager] openFile called with arg:", arg);
      let fileName;
      let itemLabel;
      if (arg && typeof arg === "object") {
        if ("type" in arg && arg.type === 2 /* File */) {
          const item = arg;
          fileName = item.data?.fileName || item.label;
          itemLabel = item.label;
        } else if ("fileName" in arg) {
          fileName = arg.fileName;
          itemLabel = arg.fileName;
        }
      }
      if (!fileName) {
        console.error("[CommandManager] openFile called with invalid argument:", arg);
        vscode13.window.showErrorMessage("Cannot open file: Invalid argument");
        return;
      }
      console.log("[CommandManager] Opening file:", fileName);
      const workspaceFolders = vscode13.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        let fileUri;
        if (fileName.startsWith("/")) {
          fileUri = vscode13.Uri.file(fileName);
        } else {
          fileUri = vscode13.Uri.joinPath(workspaceRoot, fileName);
        }
        console.log("[CommandManager] File URI:", fileUri.toString());
        try {
          const doc = await vscode13.workspace.openTextDocument(fileUri);
          await vscode13.window.showTextDocument(doc);
          console.log("[CommandManager] File opened successfully");
        } catch (err) {
          console.error("[CommandManager] Error opening file:", err);
          const files = await vscode13.workspace.findFiles(`**/${path.basename(fileName)}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode13.workspace.openTextDocument(files[0]);
            await vscode13.window.showTextDocument(doc);
          } else {
            vscode13.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      } else {
        vscode13.window.showWarningMessage("No workspace folder open");
      }
    }
  );
};

// src/vscode/openServerWebview.ts
import * as vscode14 from "vscode";
var openServerWebview = () => {
  return vscode14.commands.registerCommand("testeranto.openServerWebview", async () => {
    try {
      const workspaceFolders = vscode14.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode14.window.showErrorMessage("No workspace folder open");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri;
      const reportHtmlUri = vscode14.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.html");
      try {
        await vscode14.workspace.fs.stat(reportHtmlUri);
      } catch (error) {
        vscode14.window.showWarningMessage("Report file not found. Starting server to generate it...");
        await vscode14.commands.executeCommand("testeranto.startServer");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      }
      const panel = vscode14.window.createWebviewPanel(
        "testerantoServer",
        "Testeranto Server Report",
        vscode14.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode14.Uri.joinPath(workspaceRoot, "testeranto", "reports")]
        }
      );
      let htmlContent;
      try {
        const fileContent = await vscode14.workspace.fs.readFile(reportHtmlUri);
        htmlContent = Buffer.from(fileContent).toString("utf-8");
      } catch (error) {
        htmlContent = getFallbackHtmlContent();
      }
      const reportJsUri = panel.webview.asWebviewUri(
        vscode14.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.js")
      );
      const updatedHtmlContent = htmlContent.replace(
        /<script type="module">[\s\S]*?<\/script>/,
        `<script type="module">
                            // Wait for the stakeholder app to be loaded
                            async function initApp() {
                                const root = document.getElementById('root');
                                try {
                                    // Import the stakeholder app module using webview URI
                                    const { renderApp } = await import('${reportJsUri}');
                                    renderApp(root);
                                } catch (error) {
                                    console.error('Failed to load stakeholder report:', error);
                                    root.innerHTML = \`
                                        <div style="padding: 40px; text-align: center;">
                                            <h1 style="color: #d32f2f;">Error Loading Report</h1>
                                            <p>\${error.message}</p>
                                            <p>Please make sure the Testeranto server has generated the report files.</p>
                                            <details style="text-align: left; max-width: 800px; margin: 20px auto;">
                                                <summary>Technical Details</summary>
                                                <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">\${error.stack}</pre>
                                            </details>
                                        </div>
                                    \`;
                                }
                            }
                            
                            // Start the app when the DOM is ready
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', initApp);
                            } else {
                                initApp();
                            }
                        </script>`
      );
      panel.webview.html = updatedHtmlContent;
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "alert":
              vscode14.window.showErrorMessage(message.text);
              return;
            case "refresh":
              vscode14.workspace.fs.readFile(reportHtmlUri).then((fileContent) => {
                const newHtmlContent = Buffer.from(fileContent).toString("utf-8");
                const updatedNewHtmlContent = newHtmlContent.replace(
                  /<script type="module">[\s\S]*?<\/script>/,
                  `<script type="module">
                                                // Wait for the stakeholder app to be loaded
                                                async function initApp() {
                                                    const root = document.getElementById('root');
                                                    try {
                                                        // Import the stakeholder app module using webview URI
                                                        const { renderApp } = await import('${reportJsUri}');
                                                        renderApp(root);
                                                    } catch (error) {
                                                        console.error('Failed to load stakeholder report:', error);
                                                        root.innerHTML = \`
                                                            <div style="padding: 40px; text-align: center;">
                                                                <h1 style="color: #d32f2f;">Error Loading Report</h1>
                                                                <p>\${error.message}</p>
                                                                <p>Please make sure the Testeranto server has generated the report files.</p>
                                                                <details style="text-align: left; max-width: 800px; margin: 20px auto;">
                                                                    <summary>Technical Details</summary>
                                                                    <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">\${error.stack}</pre>
                                                                </details>
                                                            </div>
                                                        \`;
                                                    }
                                                }
                                                
                                                // Start the app when the DOM is ready
                                                if (document.readyState === 'loading') {
                                                    document.addEventListener('DOMContentLoaded', initApp);
                                                } else {
                                                    initApp();
                                                }
                                            </script>`
                );
                panel.webview.html = updatedNewHtmlContent;
              });
              return;
          }
        }
        // undefined,
        // disposables
      );
    } catch (error) {
      vscode14.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
    }
  });
};

// src/vscode/registerCommands.tsx
var registerCommands = (context, terminalManager, runtimeProvider, statusBarManager, dockerProcessProvider, aiderProcessProvider) => {
  const disposables = [];
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.showTests",
      () => {
        vscode15.window.showInformationMessage("Showing Testeranto Dashboard");
        vscode15.commands.executeCommand("testeranto.unifiedView.focus");
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.runTest",
      async (item) => {
        if (item.type === 1 /* Test */) {
          const { runtime, testName } = item.data || {};
          vscode15.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
          const terminal = terminalManager.showTerminal(runtime, testName);
          if (terminal) {
            vscode15.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
          } else {
            vscode15.window.showWarningMessage(`Terminal for ${testName} not found`);
          }
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.launchAiderTerminal",
      async (data) => {
        let runtime;
        let testName;
        if (data && typeof data === "object") {
          runtime = data.runtimeKey || data.runtime;
          testName = data.testName;
        } else {
          vscode15.window.showErrorMessage("Cannot launch aider: Invalid test data");
          return;
        }
        if (!runtime || !testName) {
          vscode15.window.showErrorMessage("Cannot launch aider: Missing runtime or test name");
          return;
        }
        vscode15.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
        const terminal = await terminalManager.createAiderTerminal(runtime, testName);
        terminal.show();
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.openConfig",
      async () => {
        try {
          const uri = vscode15.Uri.file("allTests.ts");
          const doc = await vscode15.workspace.openTextDocument(uri);
          await vscode15.window.showTextDocument(doc);
        } catch (err) {
          vscode15.window.showWarningMessage("Could not open allTests.ts configuration file");
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.openTesterantoConfig",
      async () => {
        try {
          const workspaceFolders = vscode15.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri;
            const configUri = vscode15.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
            try {
              const doc = await vscode15.workspace.openTextDocument(configUri);
              await vscode15.window.showTextDocument(doc);
            } catch (err) {
              const alternativePaths = [
                vscode15.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                vscode15.Uri.file("testeranto/testeranto.ts"),
                vscode15.Uri.file("testeranto.ts")
              ];
              let opened = false;
              for (const uri of alternativePaths) {
                try {
                  const doc = await vscode15.workspace.openTextDocument(uri);
                  await vscode15.window.showTextDocument(doc);
                  opened = true;
                  break;
                } catch (e) {
                }
              }
              if (!opened) {
                const files = await vscode15.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                if (files.length > 0) {
                  const doc = await vscode15.workspace.openTextDocument(files[0]);
                  await vscode15.window.showTextDocument(doc);
                } else {
                  vscode15.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                }
              }
            }
          } else {
            vscode15.window.showWarningMessage("No workspace folder open");
          }
        } catch (err) {
          vscode15.window.showErrorMessage(`Error opening testeranto config: ${err}`);
        }
      }
    )
  );
  disposables.push(
    openFile()
  );
  disposables.push(
    vscode15.commands.registerCommand("testeranto.refresh", async () => {
      vscode15.window.showInformationMessage("Refreshing all Testeranto views...");
      await statusBarManager.updateServerStatus();
      if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
        runtimeProvider.refresh();
      }
    })
  );
  disposables.push(
    vscode15.commands.registerCommand("testeranto.retryConnection", (provider) => {
      vscode15.window.showInformationMessage("Retrying connection to server...");
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
        vscode15.window.showWarningMessage("Provider does not support WebSocket reconnection");
      }
    })
  );
  disposables.push(
    vscode15.commands.registerCommand("testeranto.startServer", async () => {
      vscode15.window.showInformationMessage("Starting Testeranto server...");
      const terminal = vscode15.window.createTerminal("Testeranto Server");
      terminal.show();
      const workspaceFolders = vscode15.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        terminal.sendText(`cd "${workspacePath}" && npm start`);
      } else {
        terminal.sendText("npm start");
      }
      vscode15.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
      setTimeout(async () => {
        await statusBarManager.updateServerStatus();
        if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
          runtimeProvider.refresh();
        }
      }, 5e3);
    })
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.refreshDockerProcesses",
      async () => {
        try {
          if (dockerProcessProvider && typeof dockerProcessProvider.refresh === "function") {
            await dockerProcessProvider.refresh();
            vscode15.window.showInformationMessage("Docker processes refreshed");
          } else {
            vscode15.window.showWarningMessage("Docker process provider not available");
          }
        } catch (err) {
          vscode15.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.refreshAiderProcesses",
      async () => {
        try {
          if (aiderProcessProvider && typeof aiderProcessProvider.refresh === "function") {
            await aiderProcessProvider.refresh();
            vscode15.window.showInformationMessage("Aider processes refreshed");
          } else {
            vscode15.window.showWarningMessage("Aider process provider not available");
          }
        } catch (err) {
          vscode15.window.showErrorMessage(`Error refreshing aider processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.openAiderTerminal",
      async (runtime, testName, containerId) => {
        try {
          vscode15.window.showInformationMessage(`Opening aider terminal for ${testName} (${runtime})...`);
          const terminal = await terminalManager.createAiderTerminal(runtime, testName);
          terminal.show();
        } catch (err) {
          vscode15.window.showErrorMessage(`Error opening aider terminal: ${err}`);
        }
      }
    )
  );
  disposables.push(
    showProcessLogs()
  );
  disposables.push(
    vscode15.commands.registerCommand("testeranto.checkServerStatus", async () => {
      try {
        const response = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 2e3);
        if (response.ok) {
          vscode15.window.showInformationMessage("\u2705 Server is running and reachable");
        } else {
          vscode15.window.showWarningMessage(`\u26A0\uFE0F Server responded with status: ${response.status}`);
        }
      } catch (error) {
        vscode15.window.showErrorMessage(`\u274C Cannot connect to server: ${error.message}`);
      }
    })
  );
  disposables.push(
    openServerWebview()
  );
  return disposables;
};

// src/vscode/commandManager.ts
var CommandManager = class {
  terminalManager;
  statusBarManager;
  runtimeProvider;
  dockerProcessProvider;
  aiderProcessProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
    this.aiderProcessProvider = null;
  }
  setRuntimeProvider(provider) {
    this.runtimeProvider = provider;
  }
  setDockerProcessProvider(provider) {
    this.dockerProcessProvider = provider;
  }
  setAiderProcessProvider(provider) {
    this.aiderProcessProvider = provider;
  }
  registerCommands(context) {
    const disposables = registerCommands(context, this.terminalManager, this.dockerProcessProvider);
    const testCommand = vscode16.commands.registerCommand("testeranto.testLogging", () => {
      vscode16.window.showInformationMessage("Testeranto test command works!");
      console.log("[Testeranto] Test command executed successfully");
    });
    disposables.push(testCommand);
    return disposables;
  }
};

// src/vscode/extension.ts
async function activate(context) {
  console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");
  const outputChannel = vscode17.window.createOutputChannel("Testeranto");
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");
  try {
    vscode17.window.showInformationMessage("Testeranto extension is loading...");
    const workspaceFolders = vscode17.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      outputChannel.appendLine("[Testeranto] ERROR: No workspace folder open");
      vscode17.window.showErrorMessage("Testeranto: No workspace folder open. Please open a workspace folder first.");
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    outputChannel.appendLine(`[Testeranto] Workspace root: ${workspaceRoot}`);
    const graphDataPath = path2.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
    if (!fs.existsSync(graphDataPath)) {
      outputChannel.appendLine(`[Testeranto] WARNING: graph-data.json not found at ${graphDataPath}`);
      outputChannel.appendLine("[Testeranto] The graph-based data file is not available. Starting in fallback mode.");
      vscode17.window.showWarningMessage("Testeranto: Graph data not found. Some features may be limited.");
    } else {
      outputChannel.appendLine(`[Testeranto] Found graph-data.json at ${graphDataPath}`);
      try {
        const graphData = JSON.parse(fs.readFileSync(graphDataPath, "utf-8"));
        outputChannel.appendLine(`[Testeranto] Graph data loaded: ${graphData.data?.unifiedGraph?.nodes?.length || 0} nodes`);
      } catch (error) {
        outputChannel.appendLine(`[Testeranto] ERROR loading graph-data.json: ${error}`);
      }
    }
    outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
    const terminalManager = new TerminalManager();
    terminalManager.createAllTerminals();
    outputChannel.appendLine("[Testeranto] TerminalManager created");
    outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
    const statusBarManager = new StatusBarManager();
    statusBarManager.initialize();
    outputChannel.appendLine("[Testeranto] StatusBarManager created");
    outputChannel.appendLine("[Testeranto] Updating server status...");
    statusBarManager.updateServerStatus();
    outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
    const runtimeProvider = new TestTreeDataProvider();
    outputChannel.appendLine("[Testeranto] TestTreeDataProvider created successfully");
    outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
    const dockerProcessProvider = new DockerProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created successfully");
    outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
    const aiderProcessProvider = new AiderProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created successfully");
    outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
    const requiredMethods = ["getChildren", "getTreeItem"];
    for (const [name, provider] of Object.entries({
      runtimeProvider,
      dockerProcessProvider,
      aiderProcessProvider
    })) {
      outputChannel.appendLine(`[Testeranto] Checking provider: ${name}`);
      for (const method of requiredMethods) {
        if (typeof provider[method] !== "function") {
          const errorMsg = `${name} does not implement required method: ${method}`;
          outputChannel.appendLine(`[Testeranto] ERROR: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        outputChannel.appendLine(`[Testeranto] \u2713 ${name} implements ${method}`);
      }
    }
    outputChannel.appendLine("[Testeranto] Creating CommandManager...");
    const commandManager = new CommandManager(terminalManager, statusBarManager);
    commandManager.setRuntimeProvider(runtimeProvider);
    commandManager.setDockerProcessProvider(dockerProcessProvider);
    commandManager.setAiderProcessProvider(aiderProcessProvider);
    const commandDisposables = commandManager.registerCommands(context);
    outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");
    vscode17.window.showInformationMessage("Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.");
    outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
    vscode17.window.registerTreeDataProvider("testeranto.runtimeView", runtimeProvider);
    vscode17.window.registerTreeDataProvider("testeranto.dockerProcessView", dockerProcessProvider);
    vscode17.window.registerTreeDataProvider("testeranto.aiderProcessView", aiderProcessProvider);
    outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");
    outputChannel.appendLine("[Testeranto] Creating tree views...");
    const runtimeTreeView = vscode17.window.createTreeView("testeranto.runtimeView", {
      treeDataProvider: runtimeProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");
    const dockerProcessTreeView = vscode17.window.createTreeView("testeranto.dockerProcessView", {
      treeDataProvider: dockerProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");
    const aiderProcessTreeView = vscode17.window.createTreeView("testeranto.aiderProcessView", {
      treeDataProvider: aiderProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");
    outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
    context.subscriptions.push(
      runtimeTreeView,
      dockerProcessTreeView,
      aiderProcessTreeView
    );
    outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");
    outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
    try {
      const runtimeChildren = await runtimeProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] runtimeProvider.getChildren() returned ${runtimeChildren?.length || 0} items`);
      const dockerChildren = await dockerProcessProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);
      const aiderChildren = await aiderProcessProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] aiderProcessProvider.getChildren() returned ${aiderChildren?.length || 0} items`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] ERROR testing providers: ${error}`);
    }
    outputChannel.appendLine("[Testeranto] Refreshing tree data providers...");
    if (typeof runtimeProvider.refresh === "function") {
      outputChannel.appendLine("[Testeranto] Refreshing runtimeProvider...");
      runtimeProvider.refresh();
    }
    if (typeof dockerProcessProvider.refresh === "function") {
      outputChannel.appendLine("[Testeranto] Refreshing dockerProcessProvider...");
      dockerProcessProvider.refresh();
    }
    if (typeof aiderProcessProvider.refresh === "function") {
      outputChannel.appendLine("[Testeranto] Refreshing aiderProcessProvider...");
      aiderProcessProvider.refresh();
    }
    outputChannel.appendLine("[Testeranto] Tree data providers refreshed");
    context.subscriptions.push({
      dispose: () => {
        outputChannel.appendLine("[Testeranto] Extension deactivating...");
        terminalManager.disposeAll();
        runtimeProvider.dispose?.();
        dockerProcessProvider.dispose?.();
        aiderProcessProvider.dispose?.();
        statusBarManager.dispose();
        outputChannel.dispose();
      }
    });
    outputChannel.appendLine("[Testeranto] Registering all disposables...");
    context.subscriptions.push(
      outputChannel,
      ...commandDisposables,
      statusBarManager.getMainStatusBarItem(),
      statusBarManager.getServerStatusBarItem()
    );
    outputChannel.appendLine("[Testeranto] Extension activated successfully");
    outputChannel.appendLine("[Testeranto] Test command 'testeranto.testLogging' registered");
    console.log("[Testeranto] Extension activated successfully");
  } catch (error) {
    outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
    outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
    vscode17.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
    console.error("[Testeranto] Extension activation failed:", error);
  }
  outputChannel.appendLine("[Testeranto] Extension activation function completed");
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
