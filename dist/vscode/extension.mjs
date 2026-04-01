// src/vscode/extension.ts
import * as vscode11 from "vscode";

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
  // Test file management
  getInputFiles: {
    method: "GET",
    path: "/~/inputfiles",
    description: "Get input files for a test",
    query: {
      runtime: "string",
      testName: "string"
    },
    response: {}
  },
  getOutputFiles: {
    method: "GET",
    path: "/~/outputfiles",
    description: "Get output files for a test",
    query: {
      runtime: "string",
      testName: "string"
    },
    response: {}
  },
  // Test results
  getTestResults: {
    method: "GET",
    path: "/~/testresults",
    description: "Get test results",
    query: {
      runtime: "string?",
      testName: "string?"
    },
    response: {}
  },
  getCollatedTestResults: {
    method: "GET",
    path: "/~/collated-testresults",
    description: "Get collated test results",
    response: {}
  },
  getCollatedInputFiles: {
    method: "GET",
    path: "/~/collated-inputfiles",
    description: "Get collated input files",
    response: {}
  },
  getCollatedFiles: {
    method: "GET",
    path: "/~/collated-files",
    description: "Get collated files tree",
    response: {}
  },
  // Documentation
  getCollatedDocumentation: {
    method: "GET",
    path: "/~/collated-documentation",
    description: "Get collated documentation",
    response: {}
  },
  getDocumentation: {
    method: "GET",
    path: "/~/documentation",
    description: "Get documentation files",
    response: {}
  },
  // Reports
  getReports: {
    method: "GET",
    path: "/~/reports",
    description: "Get reports tree",
    response: {}
  },
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
  static getInputFilesUrl(runtime, testName) {
    const query = {};
    if (runtime) query.runtime = runtime;
    if (testName) query.testName = testName;
    return this.getUrl("getInputFiles", void 0, query);
  }
  static getOutputFilesUrl(runtime, testName) {
    const query = {};
    if (runtime) query.runtime = runtime;
    if (testName) query.testName = testName;
    return this.getUrl("getOutputFiles", void 0, query);
  }
  static getTestResultsUrl(runtime, testName) {
    const query = {};
    if (runtime) query.runtime = runtime;
    if (testName) query.testName = testName;
    return this.getUrl("getTestResults", void 0, query);
  }
  static getCollatedTestResultsUrl() {
    return this.getUrl("getCollatedTestResults");
  }
  static getCollatedInputFilesUrl() {
    return this.getUrl("getCollatedInputFiles");
  }
  static getCollatedFilesUrl() {
    return this.getUrl("getCollatedFiles");
  }
  static getCollatedDocumentationUrl() {
    return this.getUrl("getCollatedDocumentation");
  }
  static getDocumentationUrl() {
    return this.getUrl("getDocumentation");
  }
  static getReportsUrl() {
    return this.getUrl("getReports");
  }
  static getHtmlReportUrl() {
    return this.getUrl("getHtmlReport");
  }
  static getAppStateUrl() {
    return this.getUrl("getAppState");
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
import * as vscode7 from "vscode";

// src/vscode/TestTreeItem.ts
import * as vscode2 from "vscode";
var TestTreeItem = class extends vscode2.TreeItem {
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
import * as vscode3 from "vscode";
function createRefreshItem() {
  return new TestTreeItem(
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
    new vscode3.ThemeIcon(
      "refresh",
      new vscode3.ThemeColor("testing.iconQueued")
    )
  );
}
function createRuntimeCountItem(count) {
  return new TestTreeItem(
    `\u{1F4CA} ${count} Runtime(s)`,
    3 /* Info */,
    vscode3.TreeItemCollapsibleState.None,
    {
      description: "From HTTP /~/configs endpoint",
      count
    },
    void 0,
    new vscode3.ThemeIcon(
      "server",
      new vscode3.ThemeColor("testing.iconUnset")
    )
  );
}
function createRuntimeItem(runtimeKey, config) {
  return new TestTreeItem(
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
  );
}
function createTestItem(runtimeKey, testName) {
  const item = new TestTreeItem(
    testName,
    1 /* Test */,
    vscode3.TreeItemCollapsibleState.Collapsed,
    { runtimeKey, testName },
    {
      command: "testeranto.launchAiderTerminal",
      title: "Launch Aider",
      arguments: [{ runtimeKey, testName }]
    },
    new vscode3.ThemeIcon("beaker"),
    "testItemWithAider"
  );
  item.tooltip = `Click to launch aider for this test.`;
  return item;
}
function createNoFilesItem(runtimeKey, testName) {
  return [
    new TestTreeItem(
      "No files found for this test",
      2 /* File */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtimeKey,
        testName,
        description: `Check server logs for ${runtimeKey}/${testName}`
      },
      void 0,
      new vscode3.ThemeIcon("info")
    ),
    new TestTreeItem(
      "Click to refresh",
      3 /* Info */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtimeKey,
        testName,
        refresh: true
      },
      {
        command: "testeranto.refresh",
        title: "Refresh",
        arguments: []
      },
      new vscode3.ThemeIcon("refresh")
    )
  ];
}
function createErrorItems(runtimeKey, testName, error) {
  return [
    new TestTreeItem(
      "Error loading files",
      2 /* File */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtimeKey,
        testName,
        description: error.message
      },
      void 0,
      new vscode3.ThemeIcon("error")
    ),
    new TestTreeItem(
      "Check if server is running",
      3 /* Info */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtimeKey,
        testName,
        serverCheck: true
      },
      {
        command: "testeranto.startServer",
        title: "Start Server",
        arguments: []
      },
      new vscode3.ThemeIcon("server")
    )
  ];
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
import * as vscode4 from "vscode";
import * as path from "path";
function convertTreeToItems(tree, runtime, testName) {
  const items = [];
  const createFileItem = (file) => {
    if (!file || typeof file !== "object") {
      console.error("[treeConverter] Invalid file object:", file);
      return new TestTreeItem(
        "Invalid file",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          isFile: true,
          fileType: "unknown"
        },
        void 0,
        new vscode4.ThemeIcon("error")
      );
    }
    const filePath = file.path || "";
    const fileName = path.basename(filePath);
    let fileUri;
    const workspaceFolders = vscode4.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      if (filePath.startsWith("/")) {
        fileUri = vscode4.Uri.file(filePath);
      } else {
        fileUri = vscode4.Uri.joinPath(workspaceRoot, filePath);
      }
    }
    let icon;
    const fileType = file.fileType || "";
    if (fileType === "source") {
      icon = new vscode4.ThemeIcon("file-code");
    } else if (fileType === "documentation") {
      icon = new vscode4.ThemeIcon("book");
    } else if (fileType === "log") {
      if (file.exitCodeColor) {
        let colorId;
        switch (file.exitCodeColor) {
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
        icon = new vscode4.ThemeIcon("output", new vscode4.ThemeColor(colorId));
      } else {
        icon = new vscode4.ThemeIcon("output");
      }
    } else if (fileType === "test-results") {
      icon = new vscode4.ThemeIcon("json");
    } else if (fileType === "input") {
      icon = new vscode4.ThemeIcon(
        "arrow-down",
        new vscode4.ThemeColor("testing.iconQueued")
      );
    } else if (fileType === "output") {
      icon = new vscode4.ThemeIcon(
        "arrow-up",
        new vscode4.ThemeColor("testing.iconPassed")
      );
    } else {
      icon = new vscode4.ThemeIcon("file-text");
    }
    const treeItem = new TestTreeItem(
      fileName,
      2 /* File */,
      vscode4.TreeItemCollapsibleState.None,
      {
        runtime,
        testName,
        fileName: file.path,
        path: file.path,
        isFile: true,
        fileType: file.fileType,
        exitCode: file.exitCode,
        exitCodeColor: file.exitCodeColor
      },
      fileUri ? {
        command: "vscode.open",
        title: "Open File",
        arguments: [fileUri]
      } : void 0,
      icon
    );
    let typeLabel = "File";
    if (file.fileType === "source") {
      typeLabel = "Source";
    } else if (file.fileType === "documentation") {
      typeLabel = "Documentation";
    } else if (file.fileType === "log") {
      typeLabel = "Log";
      if (file.exitCode !== void 0) {
        typeLabel += ` (exit code: ${file.exitCode})`;
      }
    } else if (file.fileType === "test-results") {
      typeLabel = "Test Results";
    } else if (file.fileType === "input") {
      typeLabel = "Input";
    } else if (file.fileType === "output") {
      typeLabel = "Output";
    }
    treeItem.tooltip = `${typeLabel}: ${file.path}`;
    return treeItem;
  };
  const createDirectoryItem = (name, node) => {
    const treeItem = new TestTreeItem(
      name,
      2 /* File */,
      vscode4.TreeItemCollapsibleState.Collapsed,
      {
        runtime,
        testName,
        path: name,
        isFile: false
      },
      void 0,
      new vscode4.ThemeIcon("folder")
    );
    treeItem.children = [];
    for (const [childName, childNode] of Object.entries(
      node.children || {}
    )) {
      if (childNode.type === "file") {
        treeItem.children.push(createFileItem(childNode));
      } else if (childNode.type === "directory") {
        treeItem.children.push(createDirectoryItem(childName, childNode));
      } else if (childNode.type === "feature") {
        treeItem.children.push(createFeatureItem(childName, childNode));
      }
    }
    return treeItem;
  };
  const createFeatureItem = (name, feature) => {
    const treeItem = new TestTreeItem(
      feature.name || name,
      2 /* File */,
      vscode4.TreeItemCollapsibleState.None,
      {
        runtime,
        testName,
        isFeature: true,
        feature: feature.feature,
        status: feature.status || "unknown",
        clickable: false
      },
      void 0,
      new vscode4.ThemeIcon("symbol-string")
    );
    treeItem.tooltip = `Feature: ${feature.feature}
Status: ${feature.status}`;
    return treeItem;
  };
  const processNode = (node, nodeName) => {
    console.log(`[DEBUG] Processing node: ${nodeName}, type: ${node.type}`);
    if (node.type === "file") {
      console.log(`[DEBUG] Adding file: ${nodeName}`);
      items.push(createFileItem(node));
    } else if (node.type === "feature") {
      console.log(
        `[DEBUG] Adding feature: ${nodeName}, feature: ${node.feature}`
      );
      items.push(createFeatureItem(nodeName, node));
    } else if (node.type === "directory" && node.children) {
      console.log(
        `[DEBUG] Processing directory: ${nodeName} with ${Object.keys(node.children).length} children`
      );
      if (nodeName === "source" || nodeName === "output" || nodeName === "logs") {
        let displayName = nodeName;
        if (nodeName === "source") displayName = "Source Files";
        else if (nodeName === "output") displayName = "Output Files";
        else if (nodeName === "logs") displayName = "Logs";
        console.log(
          `[DEBUG] Creating directory item for ${displayName}`
        );
        items.push(
          createDirectoryItem(
            displayName,
            node
          )
        );
      } else {
        console.log(
          `[DEBUG] Processing children of ${nodeName}:`,
          Object.keys(node.children)
        );
        for (const [childName, childNode] of Object.entries(node.children)) {
          processNode(childNode, childName);
        }
      }
    } else {
      console.log(
        `[DEBUG] Unknown node type or structure: ${nodeName}, type: ${node.type}`
      );
    }
  };
  for (const [name, node] of Object.entries(tree)) {
    processNode(node, name);
  }
  if (items.length === 0) {
    items.push(
      new TestTreeItem(
        "No files found",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          isFile: false
        },
        void 0,
        new vscode4.ThemeIcon("info")
      )
    );
  }
  return items;
}

// src/vscode/providers/utils/testTree/nodeConverter.ts
import * as vscode5 from "vscode";
function convertNodeToItem(name, node, runtime, testName, parentPath) {
  const currentPath = parentPath ? `${parentPath}/${name}` : name;
  if (node.type === "file") {
    const collapsibleState = vscode5.TreeItemCollapsibleState.None;
    let fileUri;
    const workspaceFolders = vscode5.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      let filePath = node.path;
      if (filePath.startsWith("/")) {
        fileUri = vscode5.Uri.file(filePath);
      } else {
        const fullPath = vscode5.Uri.joinPath(workspaceRoot, filePath);
        fileUri = fullPath;
      }
    }
    let icon;
    if (node.fileType === "input") {
      icon = new vscode5.ThemeIcon(
        "arrow-down",
        new vscode5.ThemeColor("testing.iconQueued")
      );
    } else if (node.fileType === "output") {
      icon = new vscode5.ThemeIcon(
        "arrow-up",
        new vscode5.ThemeColor("testing.iconPassed")
      );
    } else if (node.fileType === "both") {
      icon = new vscode5.ThemeIcon(
        "arrow-both",
        new vscode5.ThemeColor("testing.iconUnset")
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
        icon = new vscode5.ThemeIcon("output", new vscode5.ThemeColor(colorId));
      } else {
        icon = new vscode5.ThemeIcon("output");
      }
    } else if (node.fileType === "source") {
      icon = new vscode5.ThemeIcon("file-code");
    } else if (node.fileType === "documentation") {
      icon = new vscode5.ThemeIcon("book");
    } else {
      icon = new vscode5.ThemeIcon("file-text");
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
    const collapsibleState = vscode5.TreeItemCollapsibleState.Collapsed;
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
      new vscode5.ThemeIcon("folder")
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
    const collapsibleState = vscode5.TreeItemCollapsibleState.None;
    const icon = new vscode5.ThemeIcon("symbol-string");
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

// src/vscode/providers/BaseTreeDataProvider.ts
import * as vscode6 from "vscode";
var BaseTreeDataProvider = class {
  _onDidChangeTreeData = new vscode6.EventEmitter();
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

// src/vscode/providers/TestTreeDataProvider.ts
var TestTreeDataProvider = class extends BaseTreeDataProvider {
  configWatcher;
  constructor() {
    super();
    vscode7.window.showInformationMessage("TestTreeDataProvider constructor called!");
    console.log("[TestTreeDataProvider] CONSTRUCTOR CALLED - LOGGING FROM TestTreeDataProvider.ts");
    fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.setupConfigWatcher();
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    vscode7.window.withProgress({
      location: vscode7.ProgressLocation.Notification,
      title: "Refreshing Testeranto...",
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0 });
      try {
        await fetchConfigsViaHttp();
        progress.report({ increment: 100 });
        this._onDidChangeTreeData.fire();
        vscode7.window.showInformationMessage("Testeranto refreshed successfully");
      } catch (error) {
        console.error("[TestTreeDataProvider] HTTP refresh failed:", error);
        vscode7.window.showErrorMessage(`Failed to refresh: ${error.message}`);
        this._onDidChangeTreeData.fire();
      }
    });
  }
  setupConfigWatcher() {
    const workspaceFolders = vscode7.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode7.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
    this.configWatcher = vscode7.workspace.createFileSystemWatcher(configPattern);
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
      return this.getRuntimeItems();
    } else if (element.type === 0 /* Runtime */) {
      const runtime = element.data?.runtime;
      return Promise.resolve(this.getTestItems(runtime));
    } else if (element.type === 1 /* Test */) {
      const { runtimeKey, testName } = element.data || {};
      return this.getTestFileItems(runtimeKey, testName);
    } else if (element.type === 2 /* File */) {
      const {
        runtime,
        testName,
        path: path3,
        isFile
      } = element.data || {};
      if (isFile) {
        return Promise.resolve([]);
      }
      if (element.children && element.children.length > 0) {
        return Promise.resolve(element.children);
      }
      return getDirectoryChildren(runtime, testName, path3 || "");
    }
    return Promise.resolve([]);
  }
  async getRuntimeItems() {
    const items = [];
    items.push(this.createConfigFileItem());
    items.push(createRefreshItem());
    const connectionStatusItem = this.createConnectionStatusItem();
    items.push(connectionStatusItem);
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
            vscode7.TreeItemCollapsibleState.None,
            {
              description: "Add tests to testeranto/testeranto.ts"
            },
            {
              command: "testeranto.openTesterantoConfig",
              title: "Open Config",
              arguments: []
            },
            new vscode7.ThemeIcon("info")
          ));
        }
      } else {
        items.push(new TestTreeItem(
          "Server returned empty configuration",
          3 /* Info */,
          vscode7.TreeItemCollapsibleState.None,
          {
            description: "Check server logs"
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode7.ThemeIcon("warning")
        ));
      }
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching configs:", error);
      items.push(new TestTreeItem(
        "Cannot connect to server",
        3 /* Info */,
        vscode7.TreeItemCollapsibleState.None,
        {
          description: "Click to start the server",
          startServer: true,
          error: error.message
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode7.ThemeIcon("error")
      ));
    }
    return items;
  }
  createConnectionStatusItem() {
    const isConnected = this.isConnected;
    const description = isConnected ? "WebSocket connected" : "WebSocket disconnected";
    const icon = isConnected ? new vscode7.ThemeIcon("radio-tower", new vscode7.ThemeColor("testing.iconPassed")) : new vscode7.ThemeIcon("radio-tower", new vscode7.ThemeColor("testing.iconFailed"));
    return new TestTreeItem(
      "Connection Status",
      3 /* Info */,
      vscode7.TreeItemCollapsibleState.None,
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
      vscode7.TreeItemCollapsibleState.None,
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
      new vscode7.ThemeIcon("settings-gear")
    );
    item.tooltip = "Click to open the main Testeranto configuration file";
    return item;
  }
  getTestItems(runtime) {
    if (!runtime) {
      return [];
    }
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
  async getTestFileItems(runtimeKey, testName) {
    console.log(`[TestTreeDataProvider] getTestFileItems START for ${runtimeKey}/${testName}`);
    try {
      console.log(`[TestTreeDataProvider] Fetching collated files from server...`);
      const response = await fetch(ApiUtils.getCollatedFilesUrl());
      console.log(`[TestTreeDataProvider] Fetch response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const collatedFilesResponse = data;
      console.log(`[TestTreeDataProvider] Received collated files data, has tree: ${!!collatedFilesResponse.tree}`);
      const tree = collatedFilesResponse.tree || {};
      console.log(`[TestTreeDataProvider] Tree has ${Object.keys(tree).length} top-level keys:`, Object.keys(tree));
      console.log(`[TestTreeDataProvider] Looking for runtime "${runtimeKey}" in tree keys:`);
      Object.keys(tree).forEach((key) => {
        console.log(`  - "${key}"`);
      });
      const safeRuntime = runtimeKey || "";
      const safeTestName = testName || "";
      let filteredTree = {};
      try {
        filteredTree = filterTreeForRuntimeAndTest(
          tree,
          safeRuntime,
          safeTestName
        );
      } catch (filterError) {
        console.error(`[TestTreeDataProvider] Error in filterTreeForRuntimeAndTest:`, filterError);
        return createErrorItems(runtimeKey, testName, filterError);
      }
      console.log(`[TestTreeDataProvider] After filtering, got tree with ${Object.keys(filteredTree).length} keys`);
      if (Object.keys(filteredTree).length === 0) {
        console.log(`[TestTreeDataProvider] No files found for ${runtimeKey}/${testName}`);
        console.log(`[TestTreeDataProvider] This could mean:`);
        console.log(`  1. The test hasn't been run yet`);
        console.log(`  2. The test name doesn't match the tree structure`);
        console.log(`  3. The server hasn't generated files for this test`);
        try {
          const configResponse = await fetch(ApiUtils.getConfigsUrl());
          if (configResponse.ok) {
            const configData2 = await configResponse.json();
            console.log(`[TestTreeDataProvider] Available configs:`, Object.keys(configData2.configs?.runtimes || {}));
          }
        } catch (configError) {
          console.log(`[TestTreeDataProvider] Could not fetch configs:`, configError);
        }
      } else {
        console.log(`[TestTreeDataProvider] Filtered tree keys:`, Object.keys(filteredTree));
      }
      let fileItems = [];
      try {
        fileItems = convertTreeToItems(
          filteredTree,
          runtimeKey,
          testName
        );
      } catch (convertError) {
        console.error(`[TestTreeDataProvider] Error in convertTreeToItems:`, convertError);
        return createErrorItems(runtimeKey, testName, convertError);
      }
      console.log(`[TestTreeDataProvider] Converted ${fileItems.length} file items`);
      if (fileItems.length > 0) {
        return fileItems;
      }
      return createNoFilesItem(runtimeKey, testName);
    } catch (error) {
      console.error("[TestTreeDataProvider] Error fetching collated files:", error);
      return createErrorItems(runtimeKey, testName, error);
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
import * as vscode8 from "vscode";
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
      vscode8.TreeItemCollapsibleState.None,
      {
        description: `${this.processes.length} processes`,
        count: this.processes.length
      },
      void 0,
      new vscode8.ThemeIcon("server")
    ));
    items.push(new TestTreeItem(
      "Refresh now",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description: "Update process list",
        refresh: true
      },
      {
        command: "testeranto.refreshDockerProcesses",
        title: "Refresh Docker Processes",
        arguments: []
      },
      new vscode8.ThemeIcon("refresh")
    ));
    if (this.processes.length === 0) {
      items.push(new TestTreeItem(
        "No processes found",
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Server may not be running"
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode8.ThemeIcon("info")
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
            vscode8.TreeItemCollapsibleState.Collapsed,
            {
              runtime,
              description: `${processes.length} processes`,
              count: processes.length
            },
            void 0,
            new vscode8.ThemeIcon("symbol-namespace")
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
      icon = new vscode8.ThemeIcon("play-circle", new vscode8.ThemeColor("testing.iconPassed"));
    } else if (process?.lastPass) {
      icon = new vscode8.ThemeIcon("check", new vscode8.ThemeColor("testing.iconPassed"));
    } else if (process?.lastFail) {
      icon = new vscode8.ThemeIcon("error", new vscode8.ThemeColor("testing.iconFailed"));
    } else if (process?.state === "exited") {
      icon = new vscode8.ThemeIcon("circle-slash", new vscode8.ThemeColor("testing.iconUnset"));
    } else if (process?.state === "paused") {
      icon = new vscode8.ThemeIcon("debug-pause", new vscode8.ThemeColor("testing.iconQueued"));
    } else if (process?.state === "created") {
      icon = new vscode8.ThemeIcon("circle-outline", new vscode8.ThemeColor("testing.iconQueued"));
    } else {
      icon = new vscode8.ThemeIcon("circle-outline", new vscode8.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
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

// src/vscode/statusBarManager.ts
import * as vscode9 from "vscode";
var StatusBarManager = class {
  mainStatusBarItem;
  serverStatusBarItem;
  constructor() {
    this.mainStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 99);
  }
  initialize() {
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
    this.serverStatusBarItem.show();
  }
  async updateServerStatus() {
    try {
      const workspaceFolders = vscode9.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode9.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode9.workspace.fs.readFile(configUri);
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
            this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          this.serverStatusBarItem.text = "$(circle-slash) Server";
          this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.errorBackground");
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
import * as vscode10 from "vscode";
import * as path2 from "path";
var CommandManager = class {
  terminalManager;
  statusBarManager;
  runtimeProvider;
  dockerProcessProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
  }
  setRuntimeProvider(provider) {
    this.runtimeProvider = provider;
  }
  setDockerProcessProvider(provider) {
    this.dockerProcessProvider = provider;
  }
  registerCommands(context) {
    const disposables = [];
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.showTests",
        () => {
          vscode10.window.showInformationMessage("Showing Testeranto Dashboard");
          vscode10.commands.executeCommand("testeranto.unifiedView.focus");
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.runTest",
        async (item) => {
          if (item.type === 1 /* Test */) {
            const { runtime, testName } = item.data || {};
            vscode10.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
            const terminal = this.terminalManager.showTerminal(runtime, testName);
            if (terminal) {
              vscode10.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
            } else {
              vscode10.window.showWarningMessage(`Terminal for ${testName} not found`);
            }
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.launchAiderTerminal",
        async (data) => {
          let runtime;
          let testName;
          if (data && typeof data === "object") {
            runtime = data.runtimeKey || data.runtime;
            testName = data.testName;
          } else {
            vscode10.window.showErrorMessage("Cannot launch aider: Invalid test data");
            return;
          }
          if (!runtime || !testName) {
            vscode10.window.showErrorMessage("Cannot launch aider: Missing runtime or test name");
            return;
          }
          vscode10.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
          const terminal = await this.terminalManager.createAiderTerminal(runtime, testName);
          terminal.show();
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.openConfig",
        async () => {
          try {
            const uri = vscode10.Uri.file("allTests.ts");
            const doc = await vscode10.workspace.openTextDocument(uri);
            await vscode10.window.showTextDocument(doc);
          } catch (err) {
            vscode10.window.showWarningMessage("Could not open allTests.ts configuration file");
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.openTesterantoConfig",
        async () => {
          try {
            const workspaceFolders = vscode10.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
              const workspaceRoot = workspaceFolders[0].uri;
              const configUri = vscode10.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
              try {
                const doc = await vscode10.workspace.openTextDocument(configUri);
                await vscode10.window.showTextDocument(doc);
              } catch (err) {
                const alternativePaths = [
                  vscode10.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                  vscode10.Uri.file("testeranto/testeranto.ts"),
                  vscode10.Uri.file("testeranto.ts")
                ];
                let opened = false;
                for (const uri of alternativePaths) {
                  try {
                    const doc = await vscode10.workspace.openTextDocument(uri);
                    await vscode10.window.showTextDocument(doc);
                    opened = true;
                    break;
                  } catch (e) {
                  }
                }
                if (!opened) {
                  const files = await vscode10.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                  if (files.length > 0) {
                    const doc = await vscode10.workspace.openTextDocument(files[0]);
                    await vscode10.window.showTextDocument(doc);
                  } else {
                    vscode10.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                  }
                }
              }
            } else {
              vscode10.window.showWarningMessage("No workspace folder open");
            }
          } catch (err) {
            vscode10.window.showErrorMessage(`Error opening testeranto config: ${err}`);
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.openFile",
        async (item) => {
          if (item.type === 2 /* File */) {
            const fileName = item.data?.fileName || item.label;
            const workspaceFolders = vscode10.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
              const workspaceRoot = workspaceFolders[0].uri;
              let fileUri;
              if (fileName.startsWith("/")) {
                fileUri = vscode10.Uri.file(fileName);
              } else {
                fileUri = vscode10.Uri.joinPath(workspaceRoot, fileName);
              }
              try {
                const doc = await vscode10.workspace.openTextDocument(fileUri);
                await vscode10.window.showTextDocument(doc);
              } catch (err) {
                const files = await vscode10.workspace.findFiles(`**/${path2.basename(fileName)}`, null, 1);
                if (files.length > 0) {
                  const doc = await vscode10.workspace.openTextDocument(files[0]);
                  await vscode10.window.showTextDocument(doc);
                } else {
                  vscode10.window.showWarningMessage(`Could not open file: ${fileName}`);
                }
              }
            } else {
              vscode10.window.showWarningMessage("No workspace folder open");
            }
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand("testeranto.refresh", async () => {
        vscode10.window.showInformationMessage("Refreshing all Testeranto views...");
        await this.statusBarManager.updateServerStatus();
        if (this.runtimeProvider && typeof this.runtimeProvider.refresh === "function") {
          this.runtimeProvider.refresh();
        }
      })
    );
    disposables.push(
      vscode10.commands.registerCommand("testeranto.retryConnection", (provider) => {
        vscode10.window.showInformationMessage("Retrying connection to server...");
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
          vscode10.window.showWarningMessage("Provider does not support WebSocket reconnection");
        }
      })
    );
    disposables.push(
      vscode10.commands.registerCommand("testeranto.startServer", async () => {
        vscode10.window.showInformationMessage("Starting Testeranto server...");
        const terminal = vscode10.window.createTerminal("Testeranto Server");
        terminal.show();
        const workspaceFolders = vscode10.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspacePath = workspaceFolders[0].uri.fsPath;
          terminal.sendText(`cd "${workspacePath}" && npm start`);
        } else {
          terminal.sendText("npm start");
        }
        vscode10.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
        setTimeout(async () => {
          await this.statusBarManager.updateServerStatus();
          if (this.runtimeProvider && typeof this.runtimeProvider.refresh === "function") {
            this.runtimeProvider.refresh();
          }
        }, 5e3);
      })
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.refreshDockerProcesses",
        async () => {
          try {
            if (this.dockerProcessProvider && typeof this.dockerProcessProvider.refresh === "function") {
              await this.dockerProcessProvider.refresh();
              vscode10.window.showInformationMessage("Docker processes refreshed");
            } else {
              vscode10.window.showWarningMessage("Docker process provider not available");
            }
          } catch (err) {
            vscode10.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand(
        "testeranto.showProcessLogs",
        async (processId, processName) => {
          try {
            const outputChannel = vscode10.window.createOutputChannel(`Process: ${processName || processId}`);
            outputChannel.show(true);
            const response = await fetch(ApiUtils.getProcessLogsUrl(processId));
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const processLogsResponse = data;
            outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
            outputChannel.appendLine(`Process ID: ${processId}`);
            outputChannel.appendLine(`Status: ${processLogsResponse.status || "unknown"}`);
            outputChannel.appendLine(`Exit Code: ${processLogsResponse.exitCode || "N/A"}`);
            outputChannel.appendLine(`
--- Logs ---
`);
            if (processLogsResponse.logs && Array.isArray(processLogsResponse.logs)) {
              processLogsResponse.logs.forEach((log) => {
                outputChannel.appendLine(log);
              });
            } else {
              outputChannel.appendLine("No logs available");
            }
            outputChannel.appendLine(`
=== End of logs ===`);
          } catch (err) {
            vscode10.window.showErrorMessage(`Error fetching process logs: ${err}`);
          }
        }
      )
    );
    disposables.push(
      vscode10.commands.registerCommand("testeranto.checkServerStatus", async () => {
        try {
          const response = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 2e3);
          if (response.ok) {
            vscode10.window.showInformationMessage("\u2705 Server is running and reachable");
          } else {
            vscode10.window.showWarningMessage(`\u26A0\uFE0F Server responded with status: ${response.status}`);
          }
        } catch (error) {
          vscode10.window.showErrorMessage(`\u274C Cannot connect to server: ${error.message}`);
        }
      })
    );
    return disposables;
  }
};

// src/vscode/extension.ts
function activate(context) {
  const outputChannel = vscode11.window.createOutputChannel("Testeranto");
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating...");
  const terminalManager = new TerminalManager();
  terminalManager.createAllTerminals();
  const statusBarManager = new StatusBarManager();
  statusBarManager.initialize();
  statusBarManager.updateServerStatus();
  outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
  const runtimeProvider = new TestTreeDataProvider();
  outputChannel.appendLine("[Testeranto] TestTreeDataProvider created");
  outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
  const dockerProcessProvider = new DockerProcessTreeDataProvider();
  outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created");
  outputChannel.appendLine("[Testeranto] Creating CommandManager...");
  const commandManager = new CommandManager(terminalManager, statusBarManager);
  commandManager.setRuntimeProvider(runtimeProvider);
  commandManager.setDockerProcessProvider(dockerProcessProvider);
  const commandDisposables = commandManager.registerCommands(context);
  outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");
  const runtimeTreeView = vscode11.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: runtimeProvider,
    showCollapseAll: true
  });
  const dockerProcessTreeView = vscode11.window.createTreeView("testeranto.dockerProcessView", {
    treeDataProvider: dockerProcessProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      terminalManager.disposeAll();
      runtimeProvider.dispose();
      dockerProcessProvider.dispose();
      statusBarManager.dispose();
      outputChannel.dispose();
    }
  });
  const testCommand = vscode11.commands.registerCommand("testeranto.testLogging", () => {
    outputChannel.appendLine("[Testeranto] Test logging command executed at " + (/* @__PURE__ */ new Date()).toISOString());
    vscode11.window.showInformationMessage("Test logging command executed! Check Testeranto output channel.");
  });
  context.subscriptions.push(
    outputChannel,
    ...commandDisposables,
    runtimeTreeView,
    dockerProcessTreeView,
    statusBarManager.getMainStatusBarItem(),
    statusBarManager.getServerStatusBarItem(),
    testCommand
  );
  outputChannel.appendLine("[Testeranto] Extension activated successfully");
  outputChannel.appendLine("[Testeranto] Test command 'testeranto.testLogging' registered");
  console.log("[Testeranto] Extension activated successfully");
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
