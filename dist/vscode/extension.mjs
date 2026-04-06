// src/vscode/extension.ts
import * as vscode14 from "vscode";
import * as path7 from "path";
import * as fs6 from "fs";

// src/vscode/TerminalManager.ts
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
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
  // Fetch aider processes from graph-data.json
  async fetchAiderProcesses() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
      if (!fs.existsSync(graphDataPath)) {
        return [];
      }
      const graphDataContent = fs.readFileSync(graphDataPath, "utf-8");
      const graphData = JSON.parse(graphDataContent);
      const aiderNodes = graphData.data?.unifiedGraph?.nodes?.filter(
        (node) => node.type === "aider" || node.type === "aider_process"
      ) || [];
      return aiderNodes.map((node) => {
        const metadata = node.metadata || {};
        return {
          id: node.id,
          containerId: metadata.containerId || "unknown",
          containerName: metadata.aiderServiceName || metadata.containerName || "unknown",
          runtime: metadata.runtime || "unknown",
          testName: metadata.testName || "unknown",
          configKey: metadata.configKey || "unknown",
          isActive: metadata.isActive || false,
          status: metadata.status || "stopped",
          exitCode: metadata.exitCode,
          startedAt: metadata.startedAt || "",
          lastActivity: metadata.lastActivity
        };
      });
    } catch (error) {
      console.error("Failed to fetch aider processes from graph:", error);
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
import * as vscode4 from "vscode";
import * as path2 from "path";
import * as fs2 from "fs";

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

// src/api/vscodeExtensionHttp.ts
var vscodeHttpAPI = {
  // Get the current graph state
  getGraph: {
    method: "GET",
    path: "/~/graph",
    description: "Get current graph state",
    response: {}
  },
  // Update graph with operations
  updateGraph: {
    method: "POST",
    path: "/~/graph",
    description: "Update graph with operations",
    response: {}
  }
};

// src/vscode/providers/utils/apiUtils.ts
var ApiUtils2 = class {
  static baseUrl = "http://localhost:3000";
  static getUrl(endpointKey, params, query) {
    const endpoint = vscodeHttpAPI[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in vscodeHttpAPI`);
    }
    let path8 = endpoint.path;
    if (params && endpoint.params) {
      for (const [key, value] of Object.entries(params)) {
        if (endpoint.params[key]) {
          path8 = path8.replace(`:${key}`, value);
        }
      }
    }
    const url = `${this.baseUrl}${path8}`;
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

// src/vscode/providers/BaseTreeDataProvider.ts
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
      const wsUrl = ApiUtils2.getWebSocketUrl();
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
          console.log("[BaseTreeDataProvider] WebSocket message received:", message.type, message);
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
    if (message.type === "resourceChanged" || message.type === "graphUpdated") {
      console.log(`[BaseTreeDataProvider] ${message.type} received, refreshing`);
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
  graphData = null;
  graphDataPath = null;
  constructor() {
    super();
    console.log("[TestTreeDataProvider] Constructor called");
    this.loadGraphData();
  }
  loadGraphData() {
    try {
      const workspaceFolders = vscode4.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.graphDataPath = path2.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
      if (fs2.existsSync(this.graphDataPath)) {
        const content = fs2.readFileSync(this.graphDataPath, "utf-8");
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[TestTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error("[TestTreeDataProvider] Error loading graph data:", error);
    }
  }
  refresh() {
    this.loadGraphData();
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.graphData) {
      this.loadGraphData();
    }
    if (!element) {
      return this.getRuntimeItems();
    }
    const elementType = element.type;
    const elementData = element.data || {};
    switch (elementType) {
      case 0 /* Runtime */:
        return this.getEntrypointItems(elementData.runtimeKey);
      case 1 /* Test */:
        if (elementData.testId) {
          return this.getFileItems(elementData.testId, elementData.runtimeKey);
        }
        return this.getTestItems(elementData.entrypointId, elementData.runtimeKey);
      case 3 /* Info */:
        if (elementData.section === "input-files" || elementData.section === "output-files" || elementData.section === "test-input-files" || elementData.section === "test-output-files") {
          return element.children || [];
        }
        return [];
      case 2 /* File */:
        return [];
      default:
        return [];
    }
  }
  getRuntimeItems() {
    if (!this.graphData) return [];
    const configNodes = this.graphData.nodes.filter(
      (node) => node.type === "config" || node.metadata?.configKey && node.metadata?.runtime
    );
    const runtimeMap = /* @__PURE__ */ new Map();
    for (const node of configNodes) {
      const runtimeKey = node.metadata?.configKey || node.metadata?.runtime || "unknown";
      const current = runtimeMap.get(runtimeKey) || { count: 0, nodes: [] };
      current.count++;
      current.nodes.push(node);
      runtimeMap.set(runtimeKey, current);
    }
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode4.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refresh",
        title: "Refresh",
        arguments: []
      },
      new vscode4.ThemeIcon("refresh")
    ));
    for (const [runtimeKey, data] of runtimeMap.entries()) {
      items.push(new TestTreeItem(
        runtimeKey,
        0 /* Runtime */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${data.count} config(s)`,
          count: data.count
        },
        void 0,
        new vscode4.ThemeIcon("symbol-namespace")
      ));
    }
    return items;
  }
  getEntrypointItems(runtimeKey) {
    if (!this.graphData) return [];
    const entrypointNodes = this.graphData.nodes.filter(
      (node) => node.type === "entrypoint" && node.metadata?.configKey === runtimeKey
    );
    return entrypointNodes.map((node) => {
      return new TestTreeItem(
        node.label || node.id,
        1 /* Test */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId: node.id,
          description: node.description,
          // Mark this as an entrypoint item, not a test item
          isEntrypoint: true
        },
        void 0,
        new vscode4.ThemeIcon("file-text")
      );
    });
  }
  getTestItems(entrypointId, runtimeKey) {
    if (!this.graphData) return [];
    const testEdges = this.graphData.edges.filter(
      (edge) => edge.source === entrypointId && edge.attributes.type === "belongsTo"
    );
    const testNodes = [];
    for (const edge of testEdges) {
      const testNode = this.graphData.nodes.find((node) => node.id === edge.target);
      if (testNode && testNode.type === "test") {
        testNodes.push(testNode);
      }
    }
    const testItems = testNodes.map((node) => {
      return new TestTreeItem(
        node.label || node.id,
        1 /* Test */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId: node.id,
          entrypointId,
          description: node.description,
          status: node.metadata?.status
        },
        void 0,
        this.getTestIcon(node)
      );
    });
    const fileItems = this.getEntrypointFileItems(entrypointId, runtimeKey);
    return [...testItems, ...fileItems];
  }
  getEntrypointFileItems(entrypointId, runtimeKey) {
    if (!this.graphData) return [];
    const fileEdges = this.graphData.edges.filter(
      (edge) => (edge.source === entrypointId || edge.target === entrypointId) && (edge.attributes.type === "associatedWith" || edge.attributes.type === "locatedIn")
    );
    const fileNodes = [];
    for (const edge of fileEdges) {
      const fileNodeId = edge.source === entrypointId ? edge.target : edge.source;
      const fileNode = this.graphData.nodes.find((node) => node.id === fileNodeId);
      if (fileNode && (fileNode.type === "file" || fileNode.type === "input_file")) {
        fileNodes.push(fileNode);
      }
    }
    const inputFiles = [];
    const outputFilePaths = [];
    for (const node of fileNodes) {
      const isInput = node.type === "input_file" || node.metadata?.isInputFile === true || node.metadata?.filePath && (node.metadata.filePath.includes("input") || node.metadata.filePath.includes("source"));
      if (isInput) {
        const item = new TestTreeItem(
          node.label || path2.basename(node.metadata?.filePath || node.id),
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            entrypointId,
            fileName: node.metadata?.filePath,
            isFile: true,
            fileType: "input"
          },
          node.metadata?.filePath ? {
            command: "testeranto.openFile",
            title: "Open File",
            arguments: [{ fileName: node.metadata.filePath, runtime: runtimeKey }]
          } : void 0,
          new vscode4.ThemeIcon("arrow-down")
        );
        inputFiles.push(item);
      } else {
        const filePath = node.metadata?.filePath || node.label || node.id;
        if (filePath) {
          outputFilePaths.push({ node, path: filePath });
        }
      }
    }
    const items = [];
    if (inputFiles.length > 0) {
      const inputFolder = new TestTreeItem(
        "Input Files",
        3 /* Info */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "input-files"
        },
        void 0,
        new vscode4.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        "Output Files",
        3 /* Info */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "output-files"
        },
        void 0,
        new vscode4.ThemeIcon("folder-opened")
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, entrypointId);
      items.push(outputFolder);
    }
    return items;
  }
  getFileItems(testId, runtimeKey) {
    if (!this.graphData) return [];
    const fileEdges = this.graphData.edges.filter(
      (edge) => (edge.source === testId || edge.target === testId) && (edge.attributes.type === "associatedWith" || edge.attributes.type === "locatedIn")
    );
    const fileNodes = [];
    for (const edge of fileEdges) {
      const fileNodeId = edge.source === testId ? edge.target : edge.source;
      const fileNode = this.graphData.nodes.find((node) => node.id === fileNodeId);
      if (fileNode && (fileNode.type === "file" || fileNode.type === "input_file")) {
        fileNodes.push(fileNode);
      }
    }
    const inputFiles = [];
    const outputFilePaths = [];
    for (const node of fileNodes) {
      const isInput = node.type === "input_file" || node.metadata?.isInputFile === true || node.metadata?.filePath && (node.metadata.filePath.includes("input") || node.metadata.filePath.includes("source"));
      if (isInput) {
        const item = new TestTreeItem(
          node.label || path2.basename(node.metadata?.filePath || node.id),
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            testId,
            fileName: node.metadata?.filePath,
            isFile: true,
            fileType: "input"
          },
          node.metadata?.filePath ? {
            command: "testeranto.openFile",
            title: "Open File",
            arguments: [{ fileName: node.metadata.filePath, runtime: runtimeKey }]
          } : void 0,
          new vscode4.ThemeIcon("arrow-down")
        );
        inputFiles.push(item);
      } else {
        const filePath = node.metadata?.filePath || node.label || node.id;
        if (filePath) {
          outputFilePaths.push({ node, path: filePath });
        }
      }
    }
    const items = [];
    if (inputFiles.length > 0) {
      const inputFolder = new TestTreeItem(
        "Input Files",
        3 /* Info */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "test-input-files"
        },
        void 0,
        new vscode4.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        "Output Files",
        3 /* Info */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "test-output-files"
        },
        void 0,
        new vscode4.ThemeIcon("folder-opened")
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, testId);
      items.push(outputFolder);
    }
    return items;
  }
  buildFileTree(filePaths) {
    const root = { type: "directory", children: {} };
    for (const { node, path: path8 } of filePaths) {
      const parts = path8.split(/[\\/]/).filter((part) => part.length > 0);
      let current = root.children;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!current[part]) {
          if (isLast) {
            current[part] = {
              type: "file",
              path: path8,
              node,
              label: node.label || path8.basename(path8) || part,
              metadata: node.metadata
            };
          } else {
            current[part] = {
              type: "directory",
              children: {}
            };
          }
        } else if (isLast) {
          current[part] = {
            type: "file",
            path: path8,
            node,
            label: node.label || path8.basename(path8) || part,
            metadata: node.metadata
          };
        }
        if (!isLast) {
          current = current[part].children;
        }
      }
    }
    return root;
  }
  convertTreeToItems(tree, runtimeKey, testId) {
    const items = [];
    for (const [name, node] of Object.entries(tree.children || {})) {
      const typedNode = node;
      if (typedNode.type === "directory") {
        const folderItem = new TestTreeItem(
          name,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey,
            testId,
            isFile: false,
            fileType: "folder"
          },
          void 0,
          new vscode4.ThemeIcon("folder")
        );
        folderItem.children = this.convertTreeToItems(typedNode, runtimeKey, testId);
        items.push(folderItem);
      } else if (typedNode.type === "file") {
        const fileItem = new TestTreeItem(
          name,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            testId,
            fileName: typedNode.path,
            isFile: true,
            fileType: "output"
          },
          typedNode.path ? {
            command: "testeranto.openFile",
            title: "Open File",
            arguments: [{ fileName: typedNode.path, runtime: runtimeKey }]
          } : void 0,
          new vscode4.ThemeIcon("arrow-up")
        );
        items.push(fileItem);
      }
    }
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFile === false;
      const bIsFolder = b.data?.isFile === false;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label.toString().localeCompare(b.label.toString());
    });
    return items;
  }
  getTestIcon(node) {
    const status = node.metadata?.status;
    const failed = node.metadata?.failed;
    if (failed === true || status === "blocked") {
      return new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
    } else if (failed === false || status === "done") {
      return new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed"));
    } else {
      return new vscode4.ThemeIcon("circle-outline", new vscode4.ThemeColor("testing.iconUnset"));
    }
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    if (message.type === "graphUpdated") {
      this.refresh();
    }
  }
};

// src/vscode/providers/DockerProcessTreeDataProvider.ts
import * as vscode5 from "vscode";
import * as path3 from "path";
import * as fs3 from "fs";
var DockerProcessTreeDataProvider = class extends BaseTreeDataProvider {
  graphData = null;
  constructor() {
    super();
    console.log("[DockerProcessTreeDataProvider] Constructor called");
    this.loadGraphData();
  }
  loadGraphData() {
    try {
      const workspaceFolders = vscode5.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path3.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
      if (fs3.existsSync(graphDataPath)) {
        const content = fs3.readFileSync(graphDataPath, "utf-8");
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[DockerProcessTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Error loading graph data:", error);
    }
  }
  refresh() {
    this.loadGraphData();
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.graphData) {
      this.loadGraphData();
    }
    if (!element) {
      return this.getDockerProcessItems();
    }
    return [];
  }
  getDockerProcessItems() {
    if (!this.graphData) return [];
    const dockerProcessNodes = this.graphData.nodes.filter(
      (node) => node.type === "docker_process" || node.type === "bdd_process" || node.type === "check_process" || node.type === "builder_process"
    );
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode5.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshDockerProcesses",
        title: "Refresh",
        arguments: []
      },
      new vscode5.ThemeIcon("refresh")
    ));
    if (dockerProcessNodes.length === 0) {
      items.push(new TestTreeItem(
        "No docker processes found",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.None,
        {
          description: "No docker processes in graph"
        },
        void 0,
        new vscode5.ThemeIcon("info")
      ));
    } else {
      items.push(new TestTreeItem(
        `Docker Processes (${dockerProcessNodes.length})`,
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.None,
        {
          description: "Flat list of all docker processes",
          count: dockerProcessNodes.length
        },
        void 0,
        new vscode5.ThemeIcon("server")
      ));
      for (const node of dockerProcessNodes) {
        items.push(this.createProcessItem(node));
      }
    }
    return items;
  }
  createProcessItem(node) {
    const metadata = node.metadata || {};
    const state = metadata.state || "unknown";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const serviceName = metadata.serviceName || metadata.name || "unknown";
    let label = node.label || serviceName;
    if (label === "unknown" && node.id) {
      const parts = node.id.split(":");
      label = parts[parts.length - 1] || node.id;
    }
    let description = `${state}`;
    if (exitCode !== void 0) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += " \u2022 inactive";
    }
    let icon;
    if (state === "running" && isActive) {
      icon = new vscode5.ThemeIcon("play-circle", new vscode5.ThemeColor("testing.iconPassed"));
    } else if (state === "exited") {
      if (exitCode === 0) {
        icon = new vscode5.ThemeIcon("check", new vscode5.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode5.ThemeIcon("error", new vscode5.ThemeColor("testing.iconFailed"));
      }
    } else if (state === "stopped") {
      icon = new vscode5.ThemeIcon("circle-slash", new vscode5.ThemeColor("testing.iconUnset"));
    } else {
      icon = new vscode5.ThemeIcon("circle-outline", new vscode5.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode5.TreeItemCollapsibleState.None,
      {
        description,
        status: state,
        exitCode,
        containerId,
        serviceName,
        processType: node.type,
        isActive
      },
      {
        command: "testeranto.showProcessLogs",
        title: "Show Process Logs",
        arguments: [node.id, label]
      },
      icon
    );
    let tooltip = `Type: ${node.type}
`;
    tooltip += `ID: ${node.id}
`;
    tooltip += `Container: ${containerId}
`;
    tooltip += `State: ${state}
`;
    tooltip += `Active: ${isActive ? "Yes" : "No"}
`;
    if (exitCode !== void 0) {
      tooltip += `Exit Code: ${exitCode}
`;
    }
    if (metadata.image) {
      tooltip += `Image: ${metadata.image}
`;
    }
    if (metadata.command) {
      tooltip += `Command: ${metadata.command}
`;
    }
    if (metadata.startedAt) {
      tooltip += `Started: ${metadata.startedAt}
`;
    }
    if (metadata.finishedAt) {
      tooltip += `Finished: ${metadata.finishedAt}
`;
    }
    if (this.graphData) {
      const connectedEdges = this.graphData.edges.filter(
        (edge) => edge.target === node.id && (edge.attributes.type === "hasProcess" || edge.attributes.type === "hasBddProcess" || edge.attributes.type === "hasCheckProcess" || edge.attributes.type === "hasBuilderProcess")
      );
      for (const edge of connectedEdges) {
        const sourceNode = this.graphData.nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === "entrypoint") {
            tooltip += `
Connected to entrypoint: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceNode.type === "config") {
            tooltip += `
Connected to config: ${sourceNode.label || sourceNode.id}`;
          }
        }
      }
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    if (message.type === "graphUpdated") {
      this.refresh();
    }
  }
};

// src/vscode/providers/AiderProcessTreeDataProvider.ts
import * as vscode6 from "vscode";
import * as path4 from "path";
import * as fs4 from "fs";
var AiderProcessTreeDataProvider = class extends BaseTreeDataProvider {
  graphData = null;
  constructor() {
    super();
    console.log("[AiderProcessTreeDataProvider] Constructor called");
    this.loadGraphData();
  }
  loadGraphData() {
    try {
      const workspaceFolders = vscode6.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path4.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
      if (fs4.existsSync(graphDataPath)) {
        const content = fs4.readFileSync(graphDataPath, "utf-8");
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[AiderProcessTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error("[AiderProcessTreeDataProvider] Error loading graph data:", error);
    }
  }
  refresh() {
    this.loadGraphData();
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.graphData) {
      this.loadGraphData();
    }
    if (!element) {
      return this.getAiderProcessItems();
    }
    const elementType = element.type;
    const elementData = element.data || {};
    if (elementType === 0 /* Runtime */) {
      return this.getAiderProcessesForEntrypoint(elementData.entrypointId);
    }
    return [];
  }
  getAiderProcessItems() {
    if (!this.graphData) return [];
    const aiderNodes = this.graphData.nodes.filter(
      (node) => node.type === "aider" || node.type === "aider_process"
    );
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode6.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshAiderProcesses",
        title: "Refresh",
        arguments: []
      },
      new vscode6.ThemeIcon("refresh")
    ));
    if (aiderNodes.length === 0) {
      items.push(new TestTreeItem(
        "No aider processes found",
        3 /* Info */,
        vscode6.TreeItemCollapsibleState.None,
        {
          description: "No aider processes in graph"
        },
        void 0,
        new vscode6.ThemeIcon("info")
      ));
      return items;
    }
    const entrypointMap = /* @__PURE__ */ new Map();
    for (const aiderNode of aiderNodes) {
      const connectedEdges = this.graphData.edges.filter(
        (edge) => edge.target === aiderNode.id && edge.attributes.type === "hasAider"
      );
      let entrypointId = "ungrouped";
      for (const edge of connectedEdges) {
        const entrypointNode = this.graphData.nodes.find((n) => n.id === edge.source);
        if (entrypointNode && entrypointNode.type === "entrypoint") {
          entrypointId = entrypointNode.id;
          break;
        }
      }
      if (!entrypointMap.has(entrypointId)) {
        entrypointMap.set(entrypointId, []);
      }
      entrypointMap.get(entrypointId).push(aiderNode);
    }
    for (const [entrypointId, aiderNodes2] of entrypointMap.entries()) {
      let entrypointLabel = "Ungrouped Aider Processes";
      let entrypointNode;
      if (entrypointId !== "ungrouped") {
        entrypointNode = this.graphData.nodes.find((n) => n.id === entrypointId);
        entrypointLabel = entrypointNode?.label || entrypointId;
      }
      const entrypointItem = new TestTreeItem(
        entrypointLabel,
        0 /* Runtime */,
        vscode6.TreeItemCollapsibleState.Collapsed,
        {
          entrypointId,
          description: `${aiderNodes2.length} aider process(es)`,
          count: aiderNodes2.length
        },
        void 0,
        new vscode6.ThemeIcon("symbol-namespace")
      );
      entrypointItem.children = aiderNodes2.map((node) => this.createAiderProcessItem(node, entrypointNode));
      items.push(entrypointItem);
    }
    return items;
  }
  getAiderProcessesForEntrypoint(entrypointId) {
    if (!this.graphData) return [];
    const connectedEdges = this.graphData.edges.filter(
      (edge) => edge.source === entrypointId && edge.attributes.type === "hasAider"
    );
    const aiderNodes = [];
    for (const edge of connectedEdges) {
      const aiderNode = this.graphData.nodes.find((n) => n.id === edge.target);
      if (aiderNode && (aiderNode.type === "aider" || aiderNode.type === "aider_process")) {
        aiderNodes.push(aiderNode);
      }
    }
    const entrypointNode = this.graphData.nodes.find((n) => n.id === entrypointId);
    return aiderNodes.map((node) => this.createAiderProcessItem(node, entrypointNode));
  }
  createAiderProcessItem(node, entrypointNode) {
    const metadata = node.metadata || {};
    const status = metadata.status || "stopped";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const containerName = metadata.aiderServiceName || metadata.containerName || "unknown";
    const runtime = metadata.runtime || "unknown";
    const testName = metadata.testName || "unknown";
    const configKey = metadata.configKey || "unknown";
    let label = node.label || containerName;
    if (label === "unknown" && node.id) {
      const parts = node.id.split(":");
      label = parts[parts.length - 1] || node.id;
    }
    let description = `${status}`;
    if (exitCode !== void 0) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += " \u2022 inactive";
    }
    let icon;
    if (status === "running" && isActive) {
      icon = new vscode6.ThemeIcon("play-circle", new vscode6.ThemeColor("testing.iconPassed"));
    } else if (status === "exited") {
      if (exitCode === 0) {
        icon = new vscode6.ThemeIcon("check", new vscode6.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode6.ThemeIcon("error", new vscode6.ThemeColor("testing.iconFailed"));
      }
    } else if (status === "stopped") {
      icon = new vscode6.ThemeIcon("circle-slash", new vscode6.ThemeColor("testing.iconUnset"));
    } else {
      icon = new vscode6.ThemeIcon("circle-outline", new vscode6.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode6.TreeItemCollapsibleState.None,
      {
        description,
        status,
        exitCode,
        runtime,
        testName,
        configKey,
        containerId,
        containerName,
        isActive,
        aiderId: node.id
      },
      {
        command: "testeranto.openAiderTerminal",
        title: "Open Aider Terminal",
        arguments: [runtime, testName, containerId]
      },
      icon
    );
    let tooltip = `Type: ${node.type}
`;
    tooltip += `ID: ${node.id}
`;
    if (entrypointNode) {
      tooltip += `Entrypoint: ${entrypointNode.label || entrypointNode.id}
`;
    }
    tooltip += `Container: ${containerName}
`;
    tooltip += `Container ID: ${containerId}
`;
    tooltip += `Status: ${status}
`;
    tooltip += `Active: ${isActive ? "Yes" : "No"}
`;
    if (exitCode !== void 0) {
      tooltip += `Exit Code: ${exitCode}
`;
    }
    tooltip += `Runtime: ${runtime}
`;
    tooltip += `Test: ${testName}
`;
    tooltip += `Config: ${configKey}
`;
    if (metadata.startedAt) {
      tooltip += `Started: ${metadata.startedAt}
`;
    }
    if (metadata.lastActivity) {
      tooltip += `Last Activity: ${metadata.lastActivity}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    if (message.type === "graphUpdated") {
      this.refresh();
    }
  }
};

// src/vscode/providers/FileTreeDataProvider.ts
import * as vscode7 from "vscode";
import * as path5 from "path";
import * as fs5 from "fs";
var FileTreeDataProvider = class extends BaseTreeDataProvider {
  graphData = null;
  graphDataPath = null;
  constructor() {
    super();
    console.log("[FileTreeDataProvider] Constructor called");
    this.loadGraphData();
  }
  loadGraphData() {
    try {
      const workspaceFolders = vscode7.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.graphDataPath = path5.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
      if (fs5.existsSync(this.graphDataPath)) {
        const content = fs5.readFileSync(this.graphDataPath, "utf-8");
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[FileTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error("[FileTreeDataProvider] Error loading graph data:", error);
    }
  }
  refresh() {
    this.loadGraphData();
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.graphData) {
      this.loadGraphData();
    }
    if (!element) {
      return this.buildFileSystemTree();
    }
    const elementData = element.data || {};
    if (elementData.isFolder) {
      return this.getFolderChildren(elementData.folderPath || "", elementData.folderId || "");
    }
    return [];
  }
  buildFileSystemTree() {
    if (!this.graphData) return [];
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode7.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshFileTree",
        title: "Refresh",
        arguments: []
      },
      new vscode7.ThemeIcon("refresh")
    ));
    const folderNodes = this.graphData.nodes.filter(
      (node) => node.type === "folder" || node.type === "domain"
    );
    const fileNodes = this.graphData.nodes.filter(
      (node) => node.type === "file" || node.type === "input_file"
    );
    console.log(`[FileTreeDataProvider] Found ${folderNodes.length} folders, ${fileNodes.length} files`);
    const tree = this.buildTreeStructure(folderNodes, fileNodes);
    const rootItems = this.convertTreeToItems(tree);
    items.push(...rootItems);
    return items;
  }
  buildTreeStructure(folderNodes, fileNodes) {
    const tree = {
      type: "root",
      children: {}
    };
    for (const folder of folderNodes) {
      const folderPath = folder.metadata?.path || "";
      const folderName = folder.label || folder.id.replace("folder:", "");
      const isRoot = folder.metadata?.isRoot || folder.id === "folder:";
      if (isRoot) {
        tree.children[folderName] = {
          type: "folder",
          node: folder,
          path: folderPath,
          name: folderName,
          children: {}
        };
      } else {
        const parts = folderPath.split("/").filter((p) => p.length > 0);
        let current = tree.children;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!current[part]) {
            if (isLast) {
              current[part] = {
                type: "folder",
                node: folder,
                path: folderPath,
                name: folderName,
                children: {}
              };
            } else {
              current[part] = {
                type: "folder",
                path: parts.slice(0, i + 1).join("/"),
                name: part,
                children: {}
              };
            }
          }
          if (!isLast) {
            current = current[part].children;
          }
        }
      }
    }
    for (const file of fileNodes) {
      const filePath = file.metadata?.filePath || file.label || "";
      const fileName = path5.basename(filePath);
      const dirPath = path5.dirname(filePath);
      const parts = dirPath.split("/").filter((p) => p.length > 0);
      let current = tree.children;
      let found = true;
      for (const part of parts) {
        if (current[part]) {
          current = current[part].children;
        } else {
          current[part] = {
            type: "folder",
            path: dirPath,
            name: part,
            children: {}
          };
          current = current[part].children;
        }
      }
      current[fileName] = {
        type: "file",
        node: file,
        path: filePath,
        name: fileName
      };
    }
    return tree;
  }
  convertTreeToItems(tree) {
    const items = [];
    for (const [name, node] of Object.entries(tree.children || {})) {
      const typedNode = node;
      if (typedNode.type === "folder") {
        const folderItem = new TestTreeItem(
          name,
          2 /* File */,
          vscode7.TreeItemCollapsibleState.Collapsed,
          {
            isFolder: true,
            folderPath: typedNode.path,
            folderId: typedNode.node?.id,
            description: "Folder",
            fileCount: this.countFilesInTree(typedNode)
          },
          void 0,
          new vscode7.ThemeIcon("folder")
        );
        folderItem.children = this.convertTreeToItems(typedNode);
        items.push(folderItem);
      } else if (typedNode.type === "file") {
        const fileItem = new TestTreeItem(
          name,
          2 /* File */,
          vscode7.TreeItemCollapsibleState.None,
          {
            isFile: true,
            fileName: typedNode.path,
            fileType: typedNode.node?.metadata?.fileType || "file",
            description: "File"
          },
          typedNode.path ? {
            command: "testeranto.openFile",
            title: "Open File",
            arguments: [{ fileName: typedNode.path }]
          } : void 0,
          this.getFileIcon(typedNode)
        );
        items.push(fileItem);
      }
    }
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFolder === true;
      const bIsFolder = b.data?.isFolder === true;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label.toString().localeCompare(b.label.toString());
    });
    return items;
  }
  getFolderChildren(folderPath, folderId) {
    if (!this.graphData) return [];
    const folderNodes = this.graphData.nodes.filter(
      (node) => (node.type === "folder" || node.type === "domain") && node.metadata?.path?.startsWith(folderPath + "/")
    );
    const fileNodes = this.graphData.nodes.filter(
      (node) => (node.type === "file" || node.type === "input_file") && node.metadata?.filePath?.startsWith(folderPath + "/")
    );
    const items = [];
    for (const folder of folderNodes) {
      const folderName = folder.label || path5.basename(folder.metadata?.path || "");
      const item = new TestTreeItem(
        folderName,
        2 /* File */,
        vscode7.TreeItemCollapsibleState.Collapsed,
        {
          isFolder: true,
          folderPath: folder.metadata?.path,
          folderId: folder.id,
          description: "Folder"
        },
        void 0,
        new vscode7.ThemeIcon("folder")
      );
      items.push(item);
    }
    for (const file of fileNodes) {
      const fileName = path5.basename(file.metadata?.filePath || file.label || "");
      const item = new TestTreeItem(
        fileName,
        2 /* File */,
        vscode7.TreeItemCollapsibleState.None,
        {
          isFile: true,
          fileName: file.metadata?.filePath,
          fileType: file.metadata?.fileType || "file",
          description: "File"
        },
        file.metadata?.filePath ? {
          command: "testeranto.openFile",
          title: "Open File",
          arguments: [{ fileName: file.metadata.filePath }]
        } : void 0,
        this.getFileIcon(file)
      );
      items.push(item);
    }
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFolder === true;
      const bIsFolder = b.data?.isFolder === true;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label.toString().localeCompare(b.label.toString());
    });
    return items;
  }
  countFilesInTree(node) {
    let count = 0;
    for (const [childName, childNode] of Object.entries(node.children || {})) {
      const typedChild = childNode;
      if (typedChild.type === "file") {
        count++;
      } else if (typedChild.type === "folder") {
        count += this.countFilesInTree(typedChild);
      }
    }
    return count;
  }
  getFileIcon(fileNode) {
    const fileType = fileNode.metadata?.fileType || fileNode.type;
    switch (fileType) {
      case "input_file":
      case "source":
        return new vscode7.ThemeIcon("file-code");
      case "log":
        return new vscode7.ThemeIcon("output");
      case "documentation":
        return new vscode7.ThemeIcon("book");
      case "config":
        return new vscode7.ThemeIcon("settings-gear");
      default:
        return new vscode7.ThemeIcon("file");
    }
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    if (message.type === "graphUpdated") {
      this.refresh();
    }
  }
};

// src/vscode/statusBarManager.ts
import * as vscode8 from "vscode";
var StatusBarManager = class _StatusBarManager {
  mainStatusBarItem;
  serverStatusBarItem;
  static instance = null;
  constructor() {
    this.mainStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 99);
  }
  static getInstance() {
    if (!_StatusBarManager.instance) {
      _StatusBarManager.instance = new _StatusBarManager();
      _StatusBarManager.instance.initialize();
    }
    return _StatusBarManager.instance;
  }
  static initialize() {
    const instance = _StatusBarManager.getInstance();
    return instance;
  }
  initialize() {
    if (!this.mainStatusBarItem) {
      this.mainStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 100);
    }
    if (!this.serverStatusBarItem) {
      this.serverStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 99);
    }
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
    this.serverStatusBarItem.show();
  }
  updateFromGraphData(graphData) {
    if (!this.serverStatusBarItem) {
      this.initialize();
    }
    const serverNodes = graphData?.nodes?.filter(
      (node) => node.type === "docker_process" || node.type === "aider_process" || node.type === "entrypoint"
    ) || [];
    const runningProcesses = serverNodes.filter(
      (node) => node.status === "done" || node.status === "running"
    );
    const totalProcesses = serverNodes.length;
    if (totalProcesses > 0) {
      this.serverStatusBarItem.text = `$(check) Server (${runningProcesses.length}/${totalProcesses})`;
      this.serverStatusBarItem.tooltip = `Testeranto server is running. ${runningProcesses.length} processes active, ${totalProcesses} total.`;
      this.serverStatusBarItem.backgroundColor = void 0;
    } else {
      this.serverStatusBarItem.text = "$(circle-slash) Server";
      this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
      this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
    }
  }
  async updateServerStatus() {
    if (!this.serverStatusBarItem) {
      this.initialize();
    }
    try {
      const workspaceFolders = vscode8.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const graphDataUri = vscode8.Uri.joinPath(workspaceRoot, "testeranto", "reports", "graph-data.json");
        try {
          const fileContent = await vscode8.workspace.fs.readFile(graphDataUri);
          const graphDataText = Buffer.from(fileContent).toString("utf-8");
          const graphData = JSON.parse(graphDataText);
          this.updateFromGraphData(graphData.data?.unifiedGraph || graphData);
          return;
        } catch (graphError) {
          this.serverStatusBarItem.text = "$(circle-slash) Server";
          this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Could not read graph-data.json:", graphError);
        }
      } else {
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.errorBackground");
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
    _StatusBarManager.instance = null;
  }
  static updateFromGraph(graphData) {
    const instance = _StatusBarManager.getInstance();
    instance.updateFromGraphData(graphData);
  }
  static async updateServerStatusSafe() {
    const instance = _StatusBarManager.getInstance();
    await instance.updateServerStatus();
  }
};

// src/vscode/commandManager.ts
import * as vscode13 from "vscode";

// src/vscode/registerCommands.tsx
import * as vscode12 from "vscode";

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
import * as vscode9 from "vscode";
var showProcessLogs = () => {
  return vscode9.commands.registerCommand(
    "testeranto.showProcessLogs",
    async (processId, processName) => {
      try {
        const outputChannel = vscode9.window.createOutputChannel(`Process: ${processName || processId}`);
        outputChannel.show(true);
        const response = await fetch(ApiUtils2.getProcessLogsUrl(processId));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
        outputChannel.appendLine(`Process ID: ${processId}`);
        outputChannel.appendLine(`
=== End of logs ===`);
      } catch (err) {
        vscode9.window.showErrorMessage(`Error fetching process logs: ${err}`);
      }
    }
  );
};

// src/vscode/openFile.ts
import * as vscode10 from "vscode";
import * as path6 from "path";
var openFile = () => {
  return vscode10.commands.registerCommand(
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
        vscode10.window.showErrorMessage("Cannot open file: Invalid argument");
        return;
      }
      console.log("[CommandManager] Opening file:", fileName);
      const workspaceFolders = vscode10.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        let fileUri;
        if (fileName.startsWith("/")) {
          fileUri = vscode10.Uri.file(fileName);
        } else {
          fileUri = vscode10.Uri.joinPath(workspaceRoot, fileName);
        }
        console.log("[CommandManager] File URI:", fileUri.toString());
        try {
          const doc = await vscode10.workspace.openTextDocument(fileUri);
          await vscode10.window.showTextDocument(doc);
          console.log("[CommandManager] File opened successfully");
        } catch (err) {
          console.error("[CommandManager] Error opening file:", err);
          const files = await vscode10.workspace.findFiles(`**/${path6.basename(fileName)}`, null, 1);
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
  );
};

// src/vscode/openServerWebview.ts
import * as vscode11 from "vscode";
var openServerWebview = () => {
  return vscode11.commands.registerCommand("testeranto.openServerWebview", async () => {
    try {
      const workspaceFolders = vscode11.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode11.window.showErrorMessage("No workspace folder open");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri;
      const reportHtmlUri = vscode11.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.html");
      try {
        await vscode11.workspace.fs.stat(reportHtmlUri);
      } catch (error) {
        vscode11.window.showWarningMessage("Report file not found. Starting server to generate it...");
        await vscode11.commands.executeCommand("testeranto.startServer");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      }
      const panel = vscode11.window.createWebviewPanel(
        "testerantoServer",
        "Testeranto Server Report",
        vscode11.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode11.Uri.joinPath(workspaceRoot, "testeranto", "reports")]
        }
      );
      let htmlContent;
      try {
        const fileContent = await vscode11.workspace.fs.readFile(reportHtmlUri);
        htmlContent = Buffer.from(fileContent).toString("utf-8");
      } catch (error) {
        htmlContent = getFallbackHtmlContent();
      }
      const reportJsUri = panel.webview.asWebviewUri(
        vscode11.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.js")
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
              vscode11.window.showErrorMessage(message.text);
              return;
            case "refresh":
              vscode11.workspace.fs.readFile(reportHtmlUri).then((fileContent) => {
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
      vscode11.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
    }
  });
};

// src/vscode/registerCommands.tsx
var registerCommands = (context, terminalManager, runtimeProvider, statusBarManager, dockerProcessProvider, aiderProcessProvider, fileTreeProvider) => {
  console.log("[VS Code] Registering commands");
  const disposables = [];
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.showTests",
      () => {
        vscode12.window.showInformationMessage("Showing Testeranto Dashboard");
        vscode12.commands.executeCommand("testeranto.unifiedView.focus");
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.runTest",
      async (item) => {
        if (item.type === 1 /* Test */) {
          const { runtime, testName } = item.data || {};
          vscode12.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
          const terminal = terminalManager.showTerminal(runtime, testName);
          if (terminal) {
            vscode12.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
          } else {
            vscode12.window.showWarningMessage(`Terminal for ${testName} not found`);
          }
        }
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.launchAiderTerminal",
      async (data) => {
        let runtime;
        let testName;
        if (data && typeof data === "object") {
          runtime = data.runtimeKey || data.runtime;
          testName = data.testName;
        } else {
          vscode12.window.showErrorMessage("Cannot launch aider: Invalid test data");
          return;
        }
        if (!runtime || !testName) {
          vscode12.window.showErrorMessage("Cannot launch aider: Missing runtime or test name");
          return;
        }
        vscode12.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
        const terminal = await terminalManager.createAiderTerminal(runtime, testName);
        terminal.show();
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.openConfig",
      async () => {
        try {
          const uri = vscode12.Uri.file("allTests.ts");
          const doc = await vscode12.workspace.openTextDocument(uri);
          await vscode12.window.showTextDocument(doc);
        } catch (err) {
          vscode12.window.showWarningMessage("Could not open allTests.ts configuration file");
        }
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.openTesterantoConfig",
      async () => {
        try {
          const workspaceFolders = vscode12.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri;
            const configUri = vscode12.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
            try {
              const doc = await vscode12.workspace.openTextDocument(configUri);
              await vscode12.window.showTextDocument(doc);
            } catch (err) {
              const alternativePaths = [
                vscode12.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                vscode12.Uri.file("testeranto/testeranto.ts"),
                vscode12.Uri.file("testeranto.ts")
              ];
              let opened = false;
              for (const uri of alternativePaths) {
                try {
                  const doc = await vscode12.workspace.openTextDocument(uri);
                  await vscode12.window.showTextDocument(doc);
                  opened = true;
                  break;
                } catch (e) {
                }
              }
              if (!opened) {
                const files = await vscode12.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                if (files.length > 0) {
                  const doc = await vscode12.workspace.openTextDocument(files[0]);
                  await vscode12.window.showTextDocument(doc);
                } else {
                  vscode12.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                }
              }
            }
          } else {
            vscode12.window.showWarningMessage("No workspace folder open");
          }
        } catch (err) {
          vscode12.window.showErrorMessage(`Error opening testeranto config: ${err}`);
        }
      }
    )
  );
  disposables.push(
    openFile()
  );
  disposables.push(
    vscode12.commands.registerCommand("testeranto.refresh", async () => {
      vscode12.window.showInformationMessage("Refreshing all Testeranto views...");
      await statusBarManager.updateServerStatus();
      if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
        runtimeProvider.refresh();
      }
    })
  );
  disposables.push(
    vscode12.commands.registerCommand("testeranto.retryConnection", (provider) => {
      vscode12.window.showInformationMessage("Retrying connection to server...");
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
        vscode12.window.showWarningMessage("Provider does not support WebSocket reconnection");
      }
    })
  );
  disposables.push(
    vscode12.commands.registerCommand("testeranto.startServer", async () => {
      vscode12.window.showInformationMessage("Starting Testeranto server...");
      const terminal = vscode12.window.createTerminal("Testeranto Server");
      terminal.show();
      const workspaceFolders = vscode12.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        terminal.sendText(`cd "${workspacePath}" && npm start`);
      } else {
        terminal.sendText("npm start");
      }
      vscode12.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
      setTimeout(async () => {
        await statusBarManager.updateServerStatus();
        if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
          runtimeProvider.refresh();
        }
      }, 5e3);
    })
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.refreshDockerProcesses",
      async () => {
        try {
          if (dockerProcessProvider && typeof dockerProcessProvider.refresh === "function") {
            await dockerProcessProvider.refresh();
            vscode12.window.showInformationMessage("Docker processes refreshed");
          } else {
            vscode12.window.showWarningMessage("Docker process provider not available");
          }
        } catch (err) {
          vscode12.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.refreshAiderProcesses",
      async () => {
        try {
          if (aiderProcessProvider && typeof aiderProcessProvider.refresh === "function") {
            await aiderProcessProvider.refresh();
            vscode12.window.showInformationMessage("Aider processes refreshed");
          } else {
            vscode12.window.showWarningMessage("Aider process provider not available");
          }
        } catch (err) {
          vscode12.window.showErrorMessage(`Error refreshing aider processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.refreshFileTree",
      async () => {
        try {
          if (fileTreeProvider && typeof fileTreeProvider.refresh === "function") {
            await fileTreeProvider.refresh();
            vscode12.window.showInformationMessage("File tree refreshed");
          } else {
            vscode12.window.showWarningMessage("File tree provider not available");
          }
        } catch (err) {
          vscode12.window.showErrorMessage(`Error refreshing file tree: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode12.commands.registerCommand(
      "testeranto.openAiderTerminal",
      async (runtime, testName, containerId) => {
        try {
          vscode12.window.showInformationMessage(`Opening aider terminal for ${testName} (${runtime})...`);
          const terminal = await terminalManager.createAiderTerminal(runtime, testName);
          terminal.show();
        } catch (err) {
          vscode12.window.showErrorMessage(`Error opening aider terminal: ${err}`);
        }
      }
    )
  );
  disposables.push(
    showProcessLogs()
  );
  disposables.push(
    vscode12.commands.registerCommand("testeranto.checkServerStatus", async () => {
      try {
        const response = await ApiUtils2.fetchWithTimeout(ApiUtils2.getConfigsUrl(), {}, 2e3);
        if (response.ok) {
          vscode12.window.showInformationMessage("\u2705 Server is running and reachable");
        } else {
          vscode12.window.showWarningMessage(`\u26A0\uFE0F Server responded with status: ${response.status}`);
        }
      } catch (error) {
        vscode12.window.showErrorMessage(`\u274C Cannot connect to server: ${error.message}`);
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
  fileTreeProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
    this.aiderProcessProvider = null;
    this.fileTreeProvider = null;
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
  setFileTreeProvider(provider) {
    this.fileTreeProvider = provider;
  }
  registerCommands(context) {
    const disposables = registerCommands(
      context,
      this.terminalManager,
      this.runtimeProvider,
      this.statusBarManager,
      this.dockerProcessProvider,
      this.aiderProcessProvider,
      this.fileTreeProvider
    );
    const testCommand = vscode13.commands.registerCommand("testeranto.testLogging", () => {
      vscode13.window.showInformationMessage("Testeranto test command works!");
      console.log("[Testeranto] Test command executed successfully");
    });
    disposables.push(testCommand);
    return disposables;
  }
};

// src/vscode/extension.ts
async function activate(context) {
  console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");
  const outputChannel = vscode14.window.createOutputChannel("Testeranto");
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");
  try {
    vscode14.window.showInformationMessage("Testeranto extension is loading...");
    const workspaceFolders = vscode14.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      outputChannel.appendLine("[Testeranto] ERROR: No workspace folder open");
      vscode14.window.showErrorMessage("Testeranto: No workspace folder open. Please open a workspace folder first.");
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    outputChannel.appendLine(`[Testeranto] Workspace root: ${workspaceRoot}`);
    const graphDataPath = path7.join(workspaceRoot, "testeranto", "reports", "graph-data.json");
    if (!fs6.existsSync(graphDataPath)) {
      outputChannel.appendLine(`[Testeranto] WARNING: graph-data.json not found at ${graphDataPath}`);
      outputChannel.appendLine("[Testeranto] The graph-based data file is not available. Starting in fallback mode.");
      vscode14.window.showWarningMessage("Testeranto: Graph data not found. Some features may be limited.");
    } else {
      outputChannel.appendLine(`[Testeranto] Found graph-data.json at ${graphDataPath}`);
      try {
        const graphData = JSON.parse(fs6.readFileSync(graphDataPath, "utf-8"));
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
    outputChannel.appendLine("[Testeranto] Creating FileTreeDataProvider...");
    const fileTreeProvider = new FileTreeDataProvider();
    outputChannel.appendLine("[Testeranto] FileTreeDataProvider created successfully");
    outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
    const requiredMethods = ["getChildren", "getTreeItem"];
    for (const [name, provider] of Object.entries({
      runtimeProvider,
      dockerProcessProvider,
      aiderProcessProvider,
      fileTreeProvider
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
    vscode14.window.showInformationMessage("Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.");
    outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
    vscode14.window.registerTreeDataProvider("testeranto.runtimeView", runtimeProvider);
    vscode14.window.registerTreeDataProvider("testeranto.dockerProcessView", dockerProcessProvider);
    vscode14.window.registerTreeDataProvider("testeranto.aiderProcessView", aiderProcessProvider);
    vscode14.window.registerTreeDataProvider("testeranto.fileTreeView", fileTreeProvider);
    outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");
    outputChannel.appendLine("[Testeranto] Creating tree views...");
    const runtimeTreeView = vscode14.window.createTreeView("testeranto.runtimeView", {
      treeDataProvider: runtimeProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");
    const dockerProcessTreeView = vscode14.window.createTreeView("testeranto.dockerProcessView", {
      treeDataProvider: dockerProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");
    const aiderProcessTreeView = vscode14.window.createTreeView("testeranto.aiderProcessView", {
      treeDataProvider: aiderProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");
    const fileTreeView = vscode14.window.createTreeView("testeranto.fileTreeView", {
      treeDataProvider: fileTreeProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] File tree view created successfully");
    outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
    context.subscriptions.push(
      runtimeTreeView,
      dockerProcessTreeView,
      aiderProcessTreeView,
      fileTreeView
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
      const fileChildren = await fileTreeProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
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
    if (typeof fileTreeProvider.refresh === "function") {
      outputChannel.appendLine("[Testeranto] Refreshing fileTreeProvider...");
      fileTreeProvider.refresh();
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
    vscode14.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
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
