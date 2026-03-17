// src/vscode/extension.ts
import * as vscode9 from "vscode";
import * as fs2 from "fs";
import * as path2 from "path";

// src/vscode/TerminalManager.ts
import * as vscode from "vscode";
var TerminalManager = class {
  terminals = /* @__PURE__ */ new Map();
  getTerminalKey(runtime2, testName) {
    return `${runtime2}:${testName}`;
  }
  createTerminal(runtime2, testName) {
    const key = this.getTerminalKey(runtime2, testName);
    const terminal = vscode.window.createTerminal(`Testeranto: ${testName} (${runtime2})`);
    this.terminals.set(key, terminal);
    return terminal;
  }
  getTerminal(runtime2, testName) {
    const key = this.getTerminalKey(runtime2, testName);
    return this.terminals.get(key);
  }
  showTerminal(runtime2, testName) {
    const terminal = this.getTerminal(runtime2, testName);
    if (terminal) {
      terminal.show();
    }
    return terminal;
  }
  sendTextToTerminal(runtime2, testName, text) {
    const terminal = this.getTerminal(runtime2, testName);
    if (terminal) {
      terminal.sendText(text);
    }
  }
  disposeTerminal(runtime2, testName) {
    const key = this.getTerminalKey(runtime2, testName);
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
      const response = await fetch("http://localhost:3000/~/aider-processes");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aiderProcesses || [];
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
      for (const process2 of aiderProcesses) {
        console.log(`Aider process available: ${process2.testName} (${process2.runtime}) - ${process2.isActive ? "running" : "stopped"}`);
      }
    } catch (error) {
      console.error("Failed to fetch aider processes:", error);
    }
  }
  async createAiderTerminal(runtimeKey, testName) {
    const extractString = (value, isRuntime = false) => {
      if (typeof value === "string") {
        return value;
      }
      if (value && typeof value === "object") {
        if (isRuntime) {
          return value.runtimeKey || value.data?.runtimeKey || value.label || value.name || String(value);
        } else {
          return value.testName || value.data?.testName || value.label || value.name || String(value);
        }
      }
      return String(value || "unknown");
    };
    const runtimeStr = runtimeKey;
    const testNameStr = extractString(testName, false);
    console.log(`[TerminalManager] createAiderTerminal called with runtime: "${runtimeStr}", testName: "${testNameStr}"`);
    console.log(`[TerminalManager] Original runtime:`, runtimeKey);
    console.log(`[TerminalManager] Original testName:`, testName);
    const key = this.getTerminalKey(runtimeStr, testNameStr);
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      terminal.show();
      return terminal;
    }
    terminal = vscode.window.createTerminal(`Aider: ${testNameStr} (${runtimeStr})`);
    this.terminals.set(key, terminal);
    terminal.sendText(`cd Code/testeranto-example-project`);
    const tname = `nodetests-src_ts_calculator-test-ts-aider`;
    terminal.sendText(`docker compose -f "testeranto/docker-compose.yml" run -it ${tname} aider`);
    terminal.show();
    return terminal;
  }
  // Restart a specific aider process
  async restartAiderProcess(runtime2, testName) {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      const process2 = aiderProcesses.find(
        (p) => p.runtime === runtime2 && p.testName === testName
      );
      if (process2) {
        const key = this.getTerminalKey(runtime2, testName);
        let terminal = this.terminals.get(key);
        if (!terminal || terminal.exitStatus !== void 0) {
          terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime2})`);
          this.terminals.set(key, terminal);
        }
        terminal.sendText(`docker restart ${process2.containerId}`);
        terminal.sendText(`sleep 2 && docker exec -it ${process2.containerId} /bin/bash`);
        terminal.show();
      } else {
        vscode.window.showErrorMessage(`No aider process found for ${testName} (${runtime2})`);
      }
    } catch (error) {
      console.error("Failed to restart aider process:", error);
      vscode.window.showErrorMessage(`Failed to restart aider process: ${error}`);
    }
  }
  createAllTerminals() {
    this.createAiderTerminals().catch((error) => {
      console.error("Error in createAllTerminals:", error);
    });
  }
};

// src/vscode/providers/TesterantoTreeDataProvider.ts
import * as vscode4 from "vscode";
import * as path from "path";
import * as fs from "fs";

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

// src/vscode/providers/TesterantoTreeDataProviderUtils.ts
var TesterantoTreeDataProviderUtils = class {
  static async loadDocumentationFiles() {
    try {
      const response = await fetch("http://localhost:3000/~/collated-documentation");
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error("Error loading collated documentation:", error);
      const response = await fetch("http://localhost:3000/~/documentation");
      const data = await response.json();
      return data.files || [];
    }
  }
  static buildTreeFromPaths(filePaths) {
    const root = {
      name: "",
      children: /* @__PURE__ */ new Map(),
      fullPath: "",
      isFile: false
    };
    for (const filePath of filePaths) {
      const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
      const parts = normalizedPath.split("/").filter((part) => part.length > 0 && part !== ".");
      if (parts.length === 0) continue;
      let currentNode = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!currentNode.children.has(part)) {
          currentNode.children.set(part, {
            name: part,
            children: /* @__PURE__ */ new Map(),
            fullPath: parts.slice(0, i + 1).join("/"),
            isFile: isLast,
            originalPath: isLast ? filePath : void 0
          });
        }
        currentNode = currentNode.children.get(part);
      }
    }
    return root;
  }
  static async loadTestInputFiles() {
    const testInputFiles = /* @__PURE__ */ new Map();
    try {
      const response = await fetch("http://localhost:3000/~/collated-inputfiles");
      const data = await response.json();
      if (data.fsTree) {
        this.processFilesystemTree(data.fsTree, testInputFiles);
      } else if (data.collatedInputFiles) {
        for (const [runtimeKey, runtimeData] of Object.entries(data.collatedInputFiles)) {
          const runtimeInfo = runtimeData;
          const tests = runtimeInfo.tests || {};
          const testEntries = [];
          for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo;
            testEntries.push({
              testName,
              files: info.inputFiles || [],
              count: info.count || 0
            });
          }
          if (testEntries.length > 0) {
            testInputFiles.set(runtimeKey, testEntries);
          }
        }
      } else {
        console.log("Collated input files not available, falling back to individual requests");
        const configsResponse = await fetch("http://localhost:3000/~/configs");
        const configsData = await configsResponse.json();
        const configs = configsData.configs;
        if (configs?.runtimes) {
          for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
            const config = runtimeConfig;
            const tests = config.tests || [];
            for (const testName of tests) {
              try {
                const inputResponse = await fetch(
                  `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`
                );
                const inputData = await inputResponse.json();
                const files = inputData.inputFiles || [];
                if (!testInputFiles.has(runtimeKey)) {
                  testInputFiles.set(runtimeKey, []);
                }
                testInputFiles.get(runtimeKey).push({
                  testName,
                  files
                });
              } catch (error) {
                console.error(`Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading collated test input files:", error);
    }
    return testInputFiles;
  }
  static processFilesystemTree(tree, testInputFiles) {
    const processNode = (node, path3 = "") => {
      if (!node) return;
      if (node.type === "test") {
        const runtime2 = node.runtime || "unknown";
        const testName = node.path || path3;
        const inputFiles = node.inputFiles || [];
        if (!testInputFiles.has(runtime2)) {
          testInputFiles.set(runtime2, []);
        }
        testInputFiles.get(runtime2).push({
          testName,
          files: inputFiles,
          count: node.count || 0
        });
      }
      if (node.children) {
        for (const [childName, childNode] of Object.entries(node.children)) {
          const childPath = path3 ? `${path3}/${childName}` : childName;
          processNode(childNode, childPath);
        }
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          processNode(item, path3);
        }
      }
    };
    for (const [key, value] of Object.entries(tree)) {
      processNode(value, key);
    }
  }
  static async loadTestResults() {
    const testResults = /* @__PURE__ */ new Map();
    try {
      const response = await fetch("http://localhost:3000/~/collated-testresults");
      if (response.ok) {
        const data = await response.json();
        if (data.collatedTestResults) {
          for (const [configKey, configData] of Object.entries(data.collatedTestResults)) {
            const configInfo = configData;
            const tests = configInfo.tests || {};
            for (const [testName, testInfo] of Object.entries(tests)) {
              const info = testInfo;
              const results = info.results || [];
              if (!testResults.has(testName)) {
                testResults.set(testName, []);
              }
              const resultsWithConfig = results.map((result) => ({
                ...result,
                configKey,
                runtime: configInfo.runtime,
                runtimeType: configInfo.runtime
              }));
              testResults.get(testName).push(...resultsWithConfig);
            }
          }
          return testResults;
        }
      }
      const fallbackResponse = await fetch("http://localhost:3000/~/testresults");
      if (!fallbackResponse.ok) {
        return testResults;
      }
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.testResults && Array.isArray(fallbackData.testResults)) {
        for (const testResult of fallbackData.testResults) {
          let testName = testResult.testName || testResult.result?.name || testResult.file?.replace(".json", "") || "Unknown";
          if (testResult.runtime && testName.startsWith(`${testResult.runtime}.`)) {
            testName = testName.substring(testResult.runtime.length + 1);
          }
          if (testName === "Unknown" && testResult.file) {
            const fileName = testResult.file;
            const patterns = [
              /^[^\.]+\.(.+)\.json$/,
              /^(.+)\.json$/
            ];
            for (const pattern of patterns) {
              const match = fileName.match(pattern);
              if (match && match[1]) {
                testName = match[1];
                break;
              }
            }
          }
          if (!testResults.has(testName)) {
            testResults.set(testName, []);
          }
          testResults.get(testName).push(testResult);
        }
      }
    } catch (error) {
      console.error("Error loading test results:", error);
    }
    return testResults;
  }
  static async loadProcesses() {
    try {
      const response = await fetch("http://localhost:3000/~/processes");
      const data = await response.json();
      return data.processes || [];
    } catch (error) {
      console.error("Error loading processes:", error);
      return [];
    }
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

// src/vscode/providers/TesterantoTreeDataProvider.ts
var TesterantoTreeDataProvider = class extends BaseTreeDataProvider {
  documentationFiles = [];
  documentationTree = {};
  testInputFiles = /* @__PURE__ */ new Map();
  inputFilesTree = {};
  testResults = /* @__PURE__ */ new Map();
  collatedTestResults = {};
  processes = [];
  constructor() {
    super();
    const workspaceFolders = vscode4.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.loadInitialData();
    }
    this.setupWorkspaceWatcher();
  }
  refresh() {
    this.loadInitialData();
    super.refresh();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }
    const data = element.data;
    if (data?.section === "documentation") {
      return Promise.resolve(this.getDocumentationItems());
    } else if (data?.section === "test-inputs") {
      return Promise.resolve(this.getTestInputItems());
    } else if (data?.section === "test-inputs-runtime") {
      return Promise.resolve(this.getTestInputRuntimeItems(data.runtime));
    } else if (data?.section === "test-inputs-test") {
      return Promise.resolve(this.getTestInputTestItems(data.runtime, data.testName));
    } else if (data?.section === "test-results") {
      return Promise.resolve(this.getTestResultItems());
    } else if (data?.testName && data?.section === void 0) {
      return Promise.resolve(this.getTestResultChildren(data.testName));
    } else if (data?.testName && data?.runtime && data?.section === void 0) {
      return Promise.resolve(this.getTestResultRuntimeChildren(data.testName, data.runtime));
    } else if (data?.section === "processes") {
      return Promise.resolve(this.getProcessItems());
    } else if (data?.section === "reports") {
      return Promise.resolve(this.getReportItems());
    } else if (data?.section === "test-results-config") {
      return Promise.resolve(this.getTestResultsConfigItems(data.configKey));
    } else if (data?.section === "test-results-directory") {
      return Promise.resolve(this.getTestResultsDirectoryItems(data.path, data.parentRuntime));
    } else if (data?.filePath && data?.context === "documentation") {
      return Promise.resolve(this.getDocumentationChildren(data.filePath));
    } else if (data?.filePath && data?.context === "test-inputs") {
      return Promise.resolve(this.getTestInputChildren(data.filePath));
    } else if (data?.filePath) {
      return Promise.resolve(this.getFileChildren(data.filePath));
    }
    return Promise.resolve([]);
  }
  getTestInputChildren(filePath) {
    const parts = filePath.split("/").filter((part) => part.length > 0);
    let currentNode = this.inputFilesTree;
    for (const part of parts) {
      if (currentNode[part]) {
        const node = currentNode[part];
        if (node.type === "directory" && node.children) {
          currentNode = node.children;
        } else if (Array.isArray(node)) {
          return [];
        } else {
          return [];
        }
      } else {
        return [];
      }
    }
    return this.buildTreeItemsFromInputFilesTree(currentNode, "test-inputs", filePath);
  }
  async loadInitialData() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Promise.all([
      this.loadDocumentationFiles(),
      this.loadTestInputFiles(),
      this.loadTestResults(),
      this.loadProcesses()
    ]);
  }
  async loadDocumentationFiles() {
    console.log("[TesterantoTreeDataProvider] Loading documentation files...");
    try {
      const response = await fetch("http://localhost:3000/~/collated-documentation");
      const data = await response.json();
      if (data.tree) {
        console.log("[TesterantoTreeDataProvider] Loaded collated documentation tree");
        this.documentationTree = data.tree;
        this.documentationFiles = data.files || [];
      } else {
        const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
        console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
        this.documentationFiles = files;
      }
    } catch (error) {
      console.error("[TesterantoTreeDataProvider] Error loading collated documentation:", error);
      const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
      console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
      this.documentationFiles = files;
    }
  }
  async loadTestInputFiles() {
    console.log("[TesterantoTreeDataProvider] Loading test input files...");
    try {
      const response = await fetch("http://localhost:3000/~/collated-inputfiles");
      const data = await response.json();
      if (data.fsTree) {
        console.log(`[TesterantoTreeDataProvider] Loaded filesystem tree for input files`);
        this.inputFilesTree = data.fsTree;
        const testInputFiles = /* @__PURE__ */ new Map();
        TesterantoTreeDataProviderUtils.processFilesystemTree(data.fsTree, testInputFiles);
        this.testInputFiles = testInputFiles;
      } else if (data.collatedInputFiles) {
        console.log(`[TesterantoTreeDataProvider] Loaded collated input files for ${Object.keys(data.collatedInputFiles).length} runtimes`);
        const testInputFiles = /* @__PURE__ */ new Map();
        for (const [runtimeKey, runtimeData] of Object.entries(data.collatedInputFiles)) {
          const runtimeInfo = runtimeData;
          const tests = runtimeInfo.tests || {};
          const testEntries = [];
          for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo;
            testEntries.push({
              testName,
              files: info.inputFiles || [],
              count: info.count || 0
            });
          }
          if (testEntries.length > 0) {
            testInputFiles.set(runtimeKey, testEntries);
          }
        }
        this.testInputFiles = testInputFiles;
      } else {
        this.testInputFiles = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
        console.log(`[TesterantoTreeDataProvider] Loaded ${this.testInputFiles.size} runtimes with test input files`);
      }
    } catch (error) {
      console.error("[TesterantoTreeDataProvider] Error loading collated input files:", error);
      this.testInputFiles = await TesterantoTreeDataProviderUtils.loadTestInputFiles();
      console.log(`[TesterantoTreeDataProvider] Loaded ${this.testInputFiles.size} runtimes with test input files`);
    }
  }
  async loadTestResults() {
    console.log("[TesterantoTreeDataProvider] Loading test results...");
    try {
      const response = await fetch("http://localhost:3000/~/collated-testresults");
      const data = await response.json();
      if (data.collatedTestResults) {
        console.log(`[TesterantoTreeDataProvider] Loaded collated test results for ${Object.keys(data.collatedTestResults).length} runtimes`);
        this.collatedTestResults = data.collatedTestResults;
        const testResults = /* @__PURE__ */ new Map();
        for (const [configKey, configData] of Object.entries(data.collatedTestResults)) {
          const configInfo = configData;
          const tests = configInfo.tests || {};
          for (const [testName, testInfo] of Object.entries(tests)) {
            const info = testInfo;
            const results = info.results || [];
            if (!testResults.has(testName)) {
              testResults.set(testName, []);
            }
            const resultsWithConfig = results.map((result) => ({
              ...result,
              configKey,
              runtime: configInfo.runtime,
              runtimeType: configInfo.runtime
            }));
            testResults.get(testName).push(...resultsWithConfig);
          }
        }
        this.testResults = testResults;
      } else {
        this.testResults = await TesterantoTreeDataProviderUtils.loadTestResults();
        console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests from regular endpoint`);
      }
    } catch (error) {
      console.error("[TesterantoTreeDataProvider] Error loading collated test results:", error);
      this.testResults = await TesterantoTreeDataProviderUtils.loadTestResults();
      console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests from fallback`);
    }
  }
  async loadProcesses() {
    console.log("[TesterantoTreeDataProvider] Loading processes...");
    this.processes = await TesterantoTreeDataProviderUtils.loadProcesses();
    console.log(`[TesterantoTreeDataProvider] Loaded ${this.processes.length} processes`);
  }
  getRootItems() {
    const items = [
      new TestTreeItem(
        "\u{1F4DA} Documentation",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          section: "documentation",
          description: `${this.documentationFiles.length} files`
        },
        void 0,
        new vscode4.ThemeIcon("book")
      ),
      new TestTreeItem(
        "\u{1F9EA} Test Inputs",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          section: "test-inputs",
          description: "Source files for tests"
        },
        void 0,
        new vscode4.ThemeIcon("beaker")
      ),
      new TestTreeItem(
        "\u{1F4CA} Test Results",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          section: "test-results",
          description: `${this.testResults.size} tests`
        },
        void 0,
        new vscode4.ThemeIcon("graph")
      ),
      new TestTreeItem(
        "\u{1F433} Docker Processes",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.Collapsed,
        {
          section: "processes",
          description: `${this.processes.length} containers`
        },
        void 0,
        new vscode4.ThemeIcon("server")
      ),
      new TestTreeItem(
        "\u{1F310} HTML Report",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          section: "reports",
          description: "Static report for stakeholders"
        },
        {
          command: "testeranto.generateHtmlReport",
          title: "Generate and Open HTML Report"
        },
        new vscode4.ThemeIcon("globe")
      )
    ];
    return items;
  }
  getDocumentationItems() {
    if (this.documentationFiles.length === 0) {
      return [
        new TestTreeItem(
          "No documentation files found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Configure documentationGlob in testeranto config"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      ];
    }
    if (Object.keys(this.documentationTree).length > 0) {
      return this.buildTreeItemsFromCollatedTree(this.documentationTree, "documentation");
    }
    const treeRoot = TesterantoTreeDataProviderUtils.buildTreeFromPaths(this.documentationFiles);
    return this.buildTreeItemsFromNode(treeRoot, "documentation");
  }
  buildTreeItemsFromCollatedTree(tree, context, parentPath = "") {
    const items = [];
    const keys = Object.keys(tree).sort((a, b) => {
      const aIsDir = tree[a].type === "directory";
      const bIsDir = tree[b].type === "directory";
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const node = tree[key];
      const isFile = node.type === "file";
      const collapsibleState = isFile ? vscode4.TreeItemCollapsibleState.None : vscode4.TreeItemCollapsibleState.Collapsed;
      let command;
      if (isFile && node.path) {
        const workspaceFolders = vscode4.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const cwd = process.cwd();
          let fullPath;
          if (path.isAbsolute(node.path)) {
            fullPath = node.path;
          } else {
            fullPath = path.join(workspaceRoot, node.path);
            if (!fs.existsSync(fullPath)) {
              fullPath = path.join(cwd, node.path);
            }
          }
          command = {
            command: "vscode.open",
            title: "Open File",
            arguments: [vscode4.Uri.file(fullPath)]
          };
        }
      }
      const treeItem = new TestTreeItem(
        key,
        2 /* File */,
        collapsibleState,
        {
          filePath: parentPath ? `${parentPath}/${key}` : key,
          originalPath: node.path,
          isFile,
          context,
          description: isFile ? path.dirname(node.path || "") : ""
        },
        command,
        isFile ? new vscode4.ThemeIcon("markdown") : new vscode4.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  buildTreeItemsFromNode(node, context) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode4.TreeItemCollapsibleState.None : vscode4.TreeItemCollapsibleState.Collapsed;
      let command;
      if (child.isFile && child.originalPath) {
        const workspaceFolders = vscode4.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const cwd = process.cwd();
          let fullPath;
          if (path.isAbsolute(child.originalPath)) {
            fullPath = child.originalPath;
          } else {
            fullPath = path.join(workspaceRoot, child.originalPath);
            if (!fs.existsSync(fullPath)) {
              fullPath = path.join(cwd, child.originalPath);
            }
          }
          command = {
            command: "vscode.open",
            title: "Open File",
            arguments: [vscode4.Uri.file(fullPath)]
          };
        }
      }
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
        collapsibleState,
        {
          filePath: child.fullPath,
          originalPath: child.originalPath,
          isFile: child.isFile,
          context,
          description: child.isFile ? path.dirname(child.originalPath || "") : ""
        },
        command,
        child.isFile ? new vscode4.ThemeIcon("markdown") : new vscode4.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  getTestInputItems() {
    const items = [];
    if (this.testInputFiles.size === 0) {
      items.push(
        new TestTreeItem(
          "No test input files found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate input files"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      return items;
    }
    if (Object.keys(this.inputFilesTree).length > 0) {
      return this.buildTreeItemsFromInputFilesTree(this.inputFilesTree, "test-inputs");
    }
    for (const [runtime2, testEntries] of this.testInputFiles.entries()) {
      let totalFiles = 0;
      for (const entry of testEntries) {
        totalFiles += entry.files.length;
      }
      items.push(
        new TestTreeItem(
          runtime2,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.Collapsed,
          {
            section: "test-inputs-runtime",
            runtime: runtime2,
            description: `${testEntries.length} tests, ${totalFiles} files`
          },
          void 0,
          new vscode4.ThemeIcon("symbol-namespace")
        )
      );
    }
    return items;
  }
  buildTreeItemsFromInputFilesTree(tree, context, parentPath = "") {
    const items = [];
    const keys = Object.keys(tree).sort((a, b) => {
      const aNode = tree[a];
      const bNode = tree[b];
      const aIsArray = Array.isArray(aNode);
      const bIsArray = Array.isArray(bNode);
      if (aIsArray || bIsArray) {
        if (aIsArray && !bIsArray) return 1;
        if (!aIsArray && bIsArray) return -1;
      }
      const aIsDir = !aIsArray && aNode.type === "directory";
      const bIsDir = !bIsArray && bNode.type === "directory";
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const node = tree[key];
      if (Array.isArray(node)) {
        for (const item of node) {
          const isTest2 = item.type === "test";
          const isFile2 = item.type === "file";
          const collapsibleState2 = vscode4.TreeItemCollapsibleState.None;
          let description2 = "";
          if (isTest2) {
            description2 = `Test (${item.count || 0} input files)`;
          } else if (isFile2) {
            description2 = `Input file for ${item.testName || "unknown test"}`;
          }
          const treeItem2 = new TestTreeItem(
            key,
            2 /* File */,
            collapsibleState2,
            {
              filePath: parentPath ? `${parentPath}/${key}` : key,
              originalPath: item.path,
              isFile: true,
              context,
              description: description2,
              runtime: item.runtime,
              testName: item.testName,
              inputFiles: item.inputFiles,
              count: item.count
            },
            void 0,
            isTest2 ? new vscode4.ThemeIcon("beaker") : new vscode4.ThemeIcon("file")
          );
          items.push(treeItem2);
        }
        continue;
      }
      const isDir = node.type === "directory";
      const isTest = node.type === "test";
      const isFile = node.type === "file";
      const collapsibleState = isDir ? vscode4.TreeItemCollapsibleState.Collapsed : vscode4.TreeItemCollapsibleState.None;
      let description = "";
      if (isTest) {
        description = `Test (${node.count || 0} input files)`;
      } else if (isFile) {
        description = `Input file for ${node.testName || "unknown test"}`;
      } else if (isDir) {
        description = "Directory";
      }
      const treeItem = new TestTreeItem(
        key,
        2 /* File */,
        collapsibleState,
        {
          filePath: parentPath ? `${parentPath}/${key}` : key,
          originalPath: node.path,
          isFile: !isDir,
          context,
          description,
          runtime: node.runtime,
          testName: node.testName,
          inputFiles: node.inputFiles,
          count: node.count
        },
        void 0,
        isTest ? new vscode4.ThemeIcon("beaker") : isFile ? new vscode4.ThemeIcon("file") : new vscode4.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  getTestResultItems() {
    const items = [];
    if (Object.keys(this.collatedTestResults).length > 0) {
      return this.buildTestResultsTree();
    }
    if (this.testResults.size === 0) {
      items.push(
        new TestTreeItem(
          "No test results found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate results"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      items.push(
        new TestTreeItem(
          "Refresh Test Results",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Check for new test results"
          },
          {
            command: "testeranto.refresh",
            title: "Refresh Test Results"
          },
          new vscode4.ThemeIcon("refresh")
        )
      );
      return items;
    }
    for (const [testName, results] of this.testResults.entries()) {
      let passed = 0;
      let failed = 0;
      let total = results.length;
      for (const result of results) {
        const status = result.result?.status;
        const failedFlag = result.result?.failed;
        if (status === true || failedFlag === false) {
          passed++;
        } else {
          failed++;
        }
      }
      const description = `${passed} passed, ${failed} failed (${total} total)`;
      const icon = failed === 0 ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          testName,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.Collapsed,
          {
            testName,
            description,
            passed,
            failed,
            total
          },
          void 0,
          icon
        )
      );
    }
    items.sort((a, b) => {
      const aFailed = a.data?.failed || 0;
      const bFailed = b.data?.failed || 0;
      if (aFailed === 0 && bFailed > 0) return -1;
      if (aFailed > 0 && bFailed === 0) return 1;
      return a.label.localeCompare(b.label);
    });
    return items;
  }
  buildTestResultsTree() {
    const items = [];
    if (Object.keys(this.collatedTestResults).length === 0) {
      items.push(
        new TestTreeItem(
          "No test results found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate results"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      return items;
    }
    const treeRoot = {};
    for (const [configKey, configData] of Object.entries(this.collatedTestResults)) {
      const configInfo = configData;
      const tests = configInfo.tests || {};
      const files = configInfo.files || [];
      if (!treeRoot[configKey]) {
        treeRoot[configKey] = {
          type: "config",
          configKey,
          runtime: configInfo.runtime,
          children: {},
          files
        };
      }
      for (const [testName, testInfo] of Object.entries(tests)) {
        const info = testInfo;
        const results = info.results || [];
        const testFiles = info.files || [];
        let passed = 0;
        let failed = 0;
        for (const result of results) {
          const status = result?.status;
          const failedFlag = result?.failed;
          if (status === true || failedFlag === false) {
            passed++;
          } else {
            failed++;
          }
        }
        const parts = testName.split("/").filter((part) => part.length > 0);
        let currentNode = treeRoot[configKey].children;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!currentNode[part]) {
            if (isLast) {
              currentNode[part] = {
                type: "test",
                name: part,
                fullPath: testName,
                configKey,
                runtime: configInfo.runtime,
                passed,
                failed,
                total: results.length,
                results,
                files: testFiles,
                fileCount: info.fileCount || 0
              };
            } else {
              currentNode[part] = {
                type: "directory",
                name: part,
                children: {}
              };
            }
          } else if (isLast) {
            currentNode[part].passed = passed;
            currentNode[part].failed = failed;
            currentNode[part].total = results.length;
            currentNode[part].results = results;
            currentNode[part].files = testFiles;
            currentNode[part].fileCount = info.fileCount || 0;
          }
          if (!isLast && currentNode[part].type === "directory") {
            currentNode = currentNode[part].children;
          }
        }
      }
      const otherFiles = configInfo.otherFiles || [];
      if (otherFiles.length > 0) {
        if (!treeRoot[configKey].children["other"]) {
          treeRoot[configKey].children["other"] = {
            type: "directory",
            name: "other",
            children: {}
          };
        }
        for (const file of otherFiles) {
          const fileName = file.name;
          treeRoot[configKey].children["other"].children[fileName] = {
            type: "file",
            name: fileName,
            path: file.path,
            isJson: file.isJson,
            size: file.size,
            modified: file.modified
          };
        }
      }
    }
    return this.buildTreeItemsFromTestResultsTree(treeRoot);
  }
  buildTreeItemsFromTestResultsTree(tree) {
    const items = [];
    const keys = Object.keys(tree).sort((a, b) => {
      const aNode = tree[a];
      const bNode = tree[b];
      const aIsDir = aNode.type === "directory" || aNode.type === "runtime";
      const bIsDir = bNode.type === "directory" || bNode.type === "runtime";
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const node = tree[key];
      if (node.type === "config") {
        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;
        const calculateStats = (currentNode) => {
          if (currentNode.type === "test") {
            totalPassed += currentNode.passed || 0;
            totalFailed += currentNode.failed || 0;
            totalTests += currentNode.total || 0;
          } else if (currentNode.type === "directory" && currentNode.children) {
            for (const childKey in currentNode.children) {
              calculateStats(currentNode.children[childKey]);
            }
          }
        };
        for (const childKey in node.children) {
          calculateStats(node.children[childKey]);
        }
        const description = `${totalPassed} passed, ${totalFailed} failed (${totalTests} total)`;
        const icon = totalFailed === 0 ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
        items.push(
          new TestTreeItem(
            `${key} (${node.runtime})`,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              section: "test-results-config",
              configKey: key,
              runtime: node.runtime,
              description,
              passed: totalPassed,
              failed: totalFailed,
              total: totalTests
            },
            void 0,
            icon
          )
        );
      } else if (node.type === "directory") {
        items.push(
          new TestTreeItem(
            key,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              section: "test-results-directory",
              path: key,
              description: "Directory"
            },
            void 0,
            new vscode4.ThemeIcon("folder")
          )
        );
      } else if (node.type === "test") {
        const description = `${node.passed} passed, ${node.failed} failed (${node.total} total) - ${node.fileCount || 0} files`;
        const icon = node.failed === 0 ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
        items.push(
          new TestTreeItem(
            key,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              testName: node.fullPath,
              runtime: node.runtime,
              description,
              passed: node.passed,
              failed: node.failed,
              total: node.total,
              results: node.results,
              files: node.files,
              fileCount: node.fileCount || 0
            },
            void 0,
            icon
          )
        );
      } else if (node.type === "file") {
        const description = `${node.isJson ? "JSON" : "File"} - ${node.size} bytes`;
        const icon = node.isJson ? new vscode4.ThemeIcon("json") : new vscode4.ThemeIcon("file");
        items.push(
          new TestTreeItem(
            key,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.None,
            {
              fileName: node.name,
              filePath: node.path,
              isJson: node.isJson,
              size: node.size,
              modified: node.modified,
              description
            },
            void 0,
            icon
          )
        );
      }
    }
    return items;
  }
  getProcessItems() {
    if (this.processes.length === 0) {
      return [
        new TestTreeItem(
          "No Docker processes found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Start the Testeranto server"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      ];
    }
    return this.processes.map((process2) => {
      const isActive = process2.isActive === true;
      return new TestTreeItem(
        process2.name || process2.containerId,
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          processId: process2.containerId,
          status: process2.status,
          isActive,
          runtime: process2.runtime,
          description: `${process2.status} - ${process2.runtime}`
        },
        void 0,
        isActive ? new vscode4.ThemeIcon("play", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("stop", new vscode4.ThemeColor("testing.iconFailed"))
      );
    });
  }
  getReportItems() {
    return [
      new TestTreeItem(
        "Generate HTML Report",
        2 /* File */,
        vscode4.TreeItemCollapsibleState.None,
        {
          description: "Create static report for stakeholders"
        },
        {
          command: "testeranto.generateHtmlReport",
          title: "Generate Report"
        },
        new vscode4.ThemeIcon("file-code")
      )
    ];
  }
  getTestInputRuntimeItems(runtime2) {
    const items = [];
    const testEntries = this.testInputFiles.get(runtime2);
    if (!testEntries || testEntries.length === 0) {
      items.push(
        new TestTreeItem(
          "No tests found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "This runtime has no tests configured"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      return items;
    }
    for (const entry of testEntries) {
      items.push(
        new TestTreeItem(
          entry.testName,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.Collapsed,
          {
            section: "test-inputs-test",
            runtime: runtime2,
            testName: entry.testName,
            description: `${entry.files.length} files`
          },
          void 0,
          new vscode4.ThemeIcon("beaker")
        )
      );
    }
    return items;
  }
  getTestInputTestItems(runtime2, testName) {
    const items = [];
    const testEntries = this.testInputFiles.get(runtime2);
    if (!testEntries) {
      return items;
    }
    const entry = testEntries.find((e) => e.testName === testName);
    if (!entry || entry.files.length === 0) {
      items.push(
        new TestTreeItem(
          "No files found",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "This test has no input files"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      return items;
    }
    const treeRoot = TesterantoTreeDataProviderUtils.buildTreeFromPaths(entry.files);
    return this.buildTreeItemsFromNode(treeRoot, "test-input");
  }
  getTestResultChildren(testName) {
    const items = [];
    const results = this.testResults.get(testName);
    if (!results || results.length === 0) {
      items.push(
        new TestTreeItem(
          "No detailed results available",
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            description: "Test result details not found"
          },
          void 0,
          new vscode4.ThemeIcon("info")
        )
      );
      return items;
    }
    const resultsByRuntime = /* @__PURE__ */ new Map();
    for (const result of results) {
      const runtime2 = result.runtime || "unknown";
      if (!resultsByRuntime.has(runtime2)) {
        resultsByRuntime.set(runtime2, []);
      }
      resultsByRuntime.get(runtime2).push(result);
    }
    for (const [runtime2, runtimeResults] of resultsByRuntime.entries()) {
      let passed = 0;
      let failed = 0;
      for (const result of runtimeResults) {
        const status = result.result?.status;
        const failedFlag = result.result?.failed;
        if (status === true || failedFlag === false) {
          passed++;
        } else {
          failed++;
        }
      }
      const description = `${passed} passed, ${failed} failed`;
      const icon = failed === 0 ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          runtime2,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.Collapsed,
          {
            testName,
            runtime: runtime2,
            description,
            passed,
            failed,
            total: runtimeResults.length
          },
          void 0,
          icon
        )
      );
    }
    return items;
  }
  getTestResultsConfigItems(configKey) {
    const items = [];
    if (!this.collatedTestResults[configKey]) {
      return items;
    }
    const configData = this.collatedTestResults[configKey];
    const tests = configData.tests || {};
    const treeRoot = {};
    for (const [testName, testInfo] of Object.entries(tests)) {
      const info = testInfo;
      const results = info.results || [];
      let passed = 0;
      let failed = 0;
      for (const result of results) {
        const status = result?.status;
        const failedFlag = result?.failed;
        if (status === true || failedFlag === false) {
          passed++;
        } else {
          failed++;
        }
      }
      const parts = testName.split("/").filter((part) => part.length > 0);
      let currentNode = treeRoot;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!currentNode[part]) {
          if (isLast) {
            currentNode[part] = {
              type: "test",
              name: part,
              fullPath: testName,
              configKey,
              runtime: configData.runtime,
              passed,
              failed,
              total: results.length,
              results
            };
          } else {
            currentNode[part] = {
              type: "directory",
              name: part,
              children: {}
            };
          }
        } else if (isLast) {
          currentNode[part].passed = passed;
          currentNode[part].failed = failed;
          currentNode[part].total = results.length;
          currentNode[part].results = results;
        }
        if (!isLast && currentNode[part].type === "directory") {
          currentNode = currentNode[part].children;
        }
      }
    }
    return this.buildTreeItemsFromTestResultsTreeForConfig(treeRoot, configKey);
  }
  buildTreeItemsFromTestResultsTreeForConfig(tree, configKey) {
    const items = [];
    const keys = Object.keys(tree).sort((a, b) => {
      const aNode = tree[a];
      const bNode = tree[b];
      const aIsDir = aNode.type === "directory";
      const bIsDir = bNode.type === "directory";
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const node = tree[key];
      if (node.type === "directory") {
        items.push(
          new TestTreeItem(
            key,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              section: "test-results-directory",
              path: key,
              parentRuntime: runtime,
              description: "Directory"
            },
            void 0,
            new vscode4.ThemeIcon("folder")
          )
        );
      } else if (node.type === "test") {
        const description = `${node.passed} passed, ${node.failed} failed (${node.total} total)`;
        const icon = node.failed === 0 ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
        items.push(
          new TestTreeItem(
            key,
            2 /* File */,
            vscode4.TreeItemCollapsibleState.Collapsed,
            {
              testName: node.fullPath,
              runtime,
              description,
              passed: node.passed,
              failed: node.failed,
              total: node.total,
              results: node.results
            },
            void 0,
            icon
          )
        );
      }
    }
    return items;
  }
  getTestResultsDirectoryItems(path3, parentRuntime) {
    return [];
  }
  getTestResultRuntimeChildren(testName, runtime2) {
    const items = [];
    const results = this.testResults.get(testName);
    if (!results) {
      return items;
    }
    const runtimeResults = results.filter((r) => r.runtime === runtime2);
    for (const result of runtimeResults) {
      const status = result.result?.status;
      const failedFlag = result.result?.failed;
      const isPassed = status === true || failedFlag === false;
      const fileName = result.file || "Unknown file";
      const description = isPassed ? "PASSED" : "FAILED";
      const icon = isPassed ? new vscode4.ThemeIcon("check", new vscode4.ThemeColor("testing.iconPassed")) : new vscode4.ThemeIcon("error", new vscode4.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          fileName,
          2 /* File */,
          vscode4.TreeItemCollapsibleState.None,
          {
            testName,
            runtime: runtime2,
            fileName,
            description,
            isPassed,
            result: result.result
          },
          void 0,
          icon
        )
      );
    }
    return items;
  }
  getDocumentationChildren(filePath) {
    const parts = filePath.split("/").filter((part) => part.length > 0);
    let currentNode = this.documentationTree;
    for (const part of parts) {
      if (currentNode[part] && currentNode[part].type === "directory") {
        currentNode = currentNode[part].children;
      } else {
        return [];
      }
    }
    return this.buildTreeItemsFromCollatedTree(currentNode, "documentation", filePath);
  }
  getFileChildren(filePath) {
    return [];
  }
  handleWebSocketMessage(message) {
    console.log(`[TesterantoTreeDataProvider] WebSocket message: ${message.type}`);
    if (message.type === "resourceChanged") {
      console.log(`[TesterantoTreeDataProvider] Resource changed: ${message.url}`);
      this.loadInitialData().then(() => {
        this.refresh();
      });
    }
  }
  dispose() {
    super.dispose();
  }
  setupWorkspaceWatcher() {
    vscode4.workspace.onDidChangeWorkspaceFolders((event) => {
      if (event.added.length > 0) {
        this.loadInitialData();
        this.setupWebSocket();
      } else if (event.removed.length > 0) {
        this.documentationFiles = [];
        this.testInputFiles.clear();
        this.testResults.clear();
        this.processes = [];
        this._onDidChangeTreeData.fire();
      }
    });
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode5 from "vscode";

// src/vscode/providers/TestTreeDataProviderUtils.ts
var TestTreeDataProviderUtils = class {
  static async fetchConfigsViaHttp() {
    const response = await fetch("http://localhost:3000/~/configs");
    return response.json();
  }
};

// src/vscode/providers/TestTreeDataProvider.ts
var TestTreeDataProvider = class extends BaseTreeDataProvider {
  connectionAttempts = 0;
  maxConnectionAttempts = 5;
  reconnectTimeout = null;
  configData = null;
  configWatcher;
  constructor() {
    super();
    this.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.setupConfigWatcher();
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    this.fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] HTTP refresh failed:", error);
    });
  }
  setupConfigWatcher() {
    const workspaceFolders = vscode5.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri;
    const configPattern = new vscode5.RelativePattern(workspaceRoot, "testeranto/extension-config.json");
    this.configWatcher = vscode5.workspace.createFileSystemWatcher(configPattern);
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
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
      const runtime2 = element.data?.runtime;
      return Promise.resolve(this.getTestItems(runtime2));
    } else if (element.type === 1 /* Test */) {
      const { runtime: runtime2, testName } = element.data || {};
      return this.getTestFileItems(runtime2, testName);
    } else if (element.type === 2 /* File */) {
      const { runtime: runtime2, testName, path: path3, isFile } = element.data || {};
      if (isFile) {
        return Promise.resolve([]);
      }
      return this.getDirectoryChildren(runtime2, testName, path3);
    }
    return Promise.resolve([]);
  }
  async getRuntimeItems() {
    const items = [];
    items.push(
      new TestTreeItem(
        "Refresh now",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.None,
        {
          description: "Update configuration from server",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode5.ThemeIcon("refresh", new vscode5.ThemeColor("testing.iconQueued"))
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
            vscode5.TreeItemCollapsibleState.None,
            {
              description: "From HTTP /~/configs endpoint",
              count: runtimeEntries.length
            },
            void 0,
            new vscode5.ThemeIcon("server", new vscode5.ThemeColor("testing.iconUnset"))
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
                vscode5.TreeItemCollapsibleState.Collapsed,
                {
                  runtime: config.runtime,
                  runtimeKey,
                  testsCount: config.tests?.length || 0
                },
                void 0,
                new vscode5.ThemeIcon("symbol-namespace")
              )
            );
          }
        }
        return items;
      }
    }
  }
  getTestItems(runtime2) {
    if (!runtime2) {
      return [];
    }
    if (this.configData && this.configData.configs && this.configData.configs.runtimes) {
      const runtimes = this.configData.configs.runtimes;
      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig;
        if (config.runtime === runtime2) {
          const tests = config.tests || [];
          console.log(`[TestTreeDataProvider] Found ${tests.length} tests for ${runtime2} from HTTP endpoint`);
          return tests.map((testName) => {
            const item = new TestTreeItem(
              testName,
              1 /* Test */,
              vscode5.TreeItemCollapsibleState.Collapsed,
              { runtimeKey, testName },
              {
                command: "testeranto.launchAiderTerminal",
                title: "Launch Aider Terminal",
                arguments: [runtimeKey, testName]
              },
              new vscode5.ThemeIcon("terminal"),
              "testWithAider"
            );
            item.tooltip = `Click to launch aider terminal for ${testName}`;
            return item;
          });
        }
      }
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
    const response = await fetch("http://localhost:3000/~/configs");
    this.configData = await response.json();
    this._onDidChangeTreeData.fire();
  }
  async getTestFileItems(runtime2, testName) {
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`),
      fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`)
    ]);
    const inputData = await inputResponse.json();
    const outputData = await outputResponse.json();
    const inputFiles = inputData.inputFiles || [];
    const outputFiles = outputData.outputFiles || [];
    const allFiles = [...inputFiles, ...outputFiles];
    if (allFiles.length === 0) {
      return [
        new TestTreeItem(
          "No files available",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          { runtime: runtime2, testName },
          void 0,
          new vscode5.ThemeIcon("info")
        )
      ];
    }
    const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
    for (const filePath of allFiles) {
      const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
      const parts = normalizedPath.split("/").filter((part) => part.length > 0 && part !== ".");
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
    return TestTreeDataProviderUtils.buildTreeItemsFromNode(treeRoot, runtime2, testName);
  }
  async getInputFileItems(runtime2, testName) {
    console.log(`[TestTreeDataProvider] Fetching input files for ${runtime2}/${testName}`);
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [
          new TestTreeItem(
            "No input files found",
            2 /* File */,
            vscode5.TreeItemCollapsibleState.None,
            {
              description: "Server returned error",
              runtime: runtime2,
              testName,
              fileType: "input"
            },
            void 0,
            new vscode5.ThemeIcon("warning")
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
            vscode5.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't been built yet",
              runtime: runtime2,
              testName,
              fileType: "input"
            },
            void 0,
            new vscode5.ThemeIcon("info")
          )
        ];
      }
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of inputFiles) {
        const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0 && part !== ".");
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
      return this.buildTreeItemsFromNode(treeRoot, runtime2, testName, "input");
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to fetch input files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch input files",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime: runtime2,
            testName,
            fileType: "input"
          },
          void 0,
          new vscode5.ThemeIcon("error")
        )
      ];
    }
  }
  async getOutputFileItems(runtime2, testName) {
    console.log(`[TestTreeDataProvider] Fetching output files for ${runtime2}/${testName}`);
    try {
      const response = await fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        console.error(`[TestTreeDataProvider] HTTP error! status: ${response.status}`);
        return [
          new TestTreeItem(
            "No output files found",
            2 /* File */,
            vscode5.TreeItemCollapsibleState.None,
            {
              description: "Server returned error",
              runtime: runtime2,
              testName,
              fileType: "output"
            },
            void 0,
            new vscode5.ThemeIcon("warning")
          )
        ];
      }
      const data = await response.json();
      let outputFiles = [];
      if (Array.isArray(data.outputFiles)) {
        outputFiles = data.outputFiles;
      } else if (data.outputFiles && typeof data.outputFiles === "object") {
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
            2 /* File */,
            vscode5.TreeItemCollapsibleState.None,
            {
              description: "The test hasn't generated output yet",
              runtime: runtime2,
              testName,
              fileType: "output"
            },
            void 0,
            new vscode5.ThemeIcon("info")
          )
        ];
      }
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of outputFiles) {
        const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0 && part !== ".");
        if (parts.length === 0) continue;
        let currentNode = treeRoot;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              children: /* @__PURE__ */ new Map(),
              // Reconstruct full path without leading '.'
              fullPath: parts.slice(0, i + 1).join("/"),
              isFile: isLast
            });
          }
          currentNode = currentNode.children.get(part);
        }
      }
      return this.buildTreeItemsFromNode(treeRoot, runtime2, testName, "output");
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to fetch output files:`, error);
      return [
        new TestTreeItem(
          "Failed to fetch output files",
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
          {
            description: error.message,
            runtime: runtime2,
            testName,
            fileType: "output"
          },
          void 0,
          new vscode5.ThemeIcon("error")
        )
      ];
    }
  }
  buildTreeItemsFromNode(node, runtime2, testName) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode5.TreeItemCollapsibleState.None : vscode5.TreeItemCollapsibleState.Collapsed;
      const workspaceFolders = vscode5.workspace.workspaceFolders;
      let fileUri;
      if (child.isFile && workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (child.fullPath.startsWith("/")) {
          fileUri = vscode5.Uri.file(child.fullPath);
        } else {
          fileUri = vscode5.Uri.joinPath(workspaceRoot, child.fullPath);
        }
      }
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
        collapsibleState,
        {
          runtime: runtime2,
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
        child.isFile ? new vscode5.ThemeIcon("file-text") : new vscode5.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
  async getDirectoryChildren(runtime2, testName, dirPath) {
    try {
      const [inputResponse, outputResponse] = await Promise.all([
        fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`),
        fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`)
      ]);
      let allFiles = [];
      if (inputResponse.ok) {
        const inputData = await inputResponse.json();
        let inputFiles = [];
        if (Array.isArray(inputData.inputFiles)) {
          inputFiles = inputData.inputFiles;
        } else if (inputData.inputFiles && typeof inputData.inputFiles === "object") {
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
      if (outputResponse.ok) {
        const outputData = await outputResponse.json();
        let outputFiles = [];
        if (Array.isArray(outputData.outputFiles)) {
          outputFiles = outputData.outputFiles;
        } else if (outputData.outputFiles && typeof outputData.outputFiles === "object") {
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
      const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
      for (const filePath of allFiles) {
        const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        const parts = normalizedPath.split("/").filter((part) => part.length > 0 && part !== ".");
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
      return this.buildTreeItemsFromNode(currentNode, runtime2, testName);
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to get directory children:`, error);
      return [];
    }
  }
  async getFileTreeItems(runtime2, testName) {
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime2)}&testName=${encodeURIComponent(testName)}`);
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
          if (!part || part.trim().length === 0 || part === ".") {
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
      return this.buildTreeItems(treeRoot, runtime2, testName);
    } catch (error) {
      console.error(`[TestTreeDataProvider] Failed to get file tree items:`, error);
      return [];
    }
  }
  buildTreeItems(node, runtime2, testName, workspaceRoot) {
    const items = [];
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.isFile && !b.isFile) return 1;
      if (!a.isFile && b.isFile) return -1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sortedChildren) {
      const collapsibleState = child.isFile ? vscode5.TreeItemCollapsibleState.None : vscode5.TreeItemCollapsibleState.Collapsed;
      const fullPath = workspaceRoot ? vscode5.Uri.joinPath(workspaceRoot, child.fullPath).fsPath : child.fullPath;
      const treeItem = new TestTreeItem(
        child.name,
        2 /* File */,
        collapsibleState,
        {
          runtime: runtime2,
          testName,
          fileName: child.fullPath,
          path: child.fullPath
        },
        child.isFile ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [vscode5.Uri.file(fullPath)]
        } : void 0,
        child.isFile ? new vscode5.ThemeIcon("file") : new vscode5.ThemeIcon("folder")
      );
      items.push(treeItem);
    }
    return items;
  }
};

// src/vscode/providers/FeaturesTreeDataProvider.ts
import * as vscode6 from "vscode";
var FeaturesTreeDataProvider = class extends BaseTreeDataProvider {
  allFilesTree = {};
  constructor() {
    super();
    this.loadAllFiles();
  }
  refresh() {
    this.loadAllFiles();
    super.refresh();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }
    const data = element.data;
    if (data?.filePath) {
      return Promise.resolve(this.getFileChildren(data.filePath));
    }
    return Promise.resolve([]);
  }
  async loadAllFiles() {
    try {
      const [docs, inputs, results, reports] = await Promise.all([
        this.fetchDocumentationFiles(),
        this.fetchInputFiles(),
        this.fetchTestResultFiles(),
        this.fetchReportFiles()
      ]);
      this.allFilesTree = this.mergeTrees([docs, inputs, results, reports]);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error("[FeaturesTreeDataProvider] Error loading files:", error);
    }
  }
  async fetchDocumentationFiles() {
    try {
      const response = await fetch("http://localhost:3000/~/collated-documentation");
      const data = await response.json();
      return data.tree || {};
    } catch (error) {
      console.error("[FeaturesTreeDataProvider] Error fetching documentation:", error);
      return {};
    }
  }
  async fetchInputFiles() {
    try {
      const response = await fetch("http://localhost:3000/~/collated-inputfiles");
      const data = await response.json();
      return data.fsTree || {};
    } catch (error) {
      console.error("[FeaturesTreeDataProvider] Error fetching input files:", error);
      return {};
    }
  }
  async fetchTestResultFiles() {
    try {
      const response = await fetch("http://localhost:3000/~/collated-testresults");
      const data = await response.json();
      return this.extractFilesFromTestResults(data.collatedTestResults || {});
    } catch (error) {
      console.error("[FeaturesTreeDataProvider] Error fetching test results:", error);
      return {};
    }
  }
  async fetchReportFiles() {
    try {
      const response = await fetch("http://localhost:3000/~/reports");
      const data = await response.json();
      return data.tree || {};
    } catch (error) {
      console.error("[FeaturesTreeDataProvider] Error fetching reports:", error);
      return {};
    }
  }
  extractFilesFromTestResults(testResults) {
    const tree = {};
    for (const [configKey, configData] of Object.entries(testResults)) {
      const configInfo = configData;
      const files = configInfo.files || [];
      for (const file of files) {
        const parts = file.path.split("/").filter((p) => p.length > 0);
        let currentNode = tree;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (!currentNode[part]) {
            currentNode[part] = isLast ? { type: "file", path: file.path, isJson: file.isJson } : { type: "directory", children: {} };
          }
          if (!isLast && currentNode[part].type === "directory") {
            currentNode = currentNode[part].children;
          }
        }
      }
    }
    return tree;
  }
  mergeTrees(trees) {
    const merged = {};
    for (const tree of trees) {
      this.mergeNode(merged, tree);
    }
    return merged;
  }
  mergeNode(target, source) {
    for (const [key, sourceNode] of Object.entries(source)) {
      if (!target[key]) {
        target[key] = { ...sourceNode };
        if (sourceNode.children) {
          target[key].children = {};
        }
      } else if (sourceNode.type === "directory" && target[key].type === "directory") {
        if (sourceNode.children) {
          if (!target[key].children) {
            target[key].children = {};
          }
          this.mergeNode(target[key].children, sourceNode.children);
        }
      }
    }
  }
  getRootItems() {
    if (Object.keys(this.allFilesTree).length === 0) {
      return [
        new TestTreeItem(
          "Loading files...",
          2 /* File */,
          vscode6.TreeItemCollapsibleState.None,
          { description: "Fetching all files from server" },
          void 0,
          new vscode6.ThemeIcon("loading")
        )
      ];
    }
    return this.buildTreeItemsFromNode(this.allFilesTree, "");
  }
  getFileChildren(filePath) {
    const parts = filePath.split("/").filter((part) => part.length > 0);
    let currentNode = this.allFilesTree;
    for (const part of parts) {
      if (currentNode[part] && currentNode[part].type === "directory") {
        currentNode = currentNode[part].children;
      } else {
        return [];
      }
    }
    return this.buildTreeItemsFromNode(currentNode, filePath);
  }
  buildTreeItemsFromNode(node, parentPath) {
    const items = [];
    const keys = Object.keys(node).sort((a, b) => {
      const aNode = node[a];
      const bNode = node[b];
      if (aNode.type === "directory" && bNode.type !== "directory") return -1;
      if (aNode.type !== "directory" && bNode.type === "directory") return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const nodeData = node[key];
      const isDirectory = nodeData.type === "directory";
      const collapsibleState = isDirectory ? vscode6.TreeItemCollapsibleState.Collapsed : vscode6.TreeItemCollapsibleState.None;
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      let icon;
      let description = "";
      if (isDirectory) {
        icon = new vscode6.ThemeIcon("folder");
        description = "Directory";
      } else {
        if (nodeData.isJson) {
          icon = new vscode6.ThemeIcon("json");
          description = "JSON file";
        } else if (nodeData.path?.endsWith(".md")) {
          icon = new vscode6.ThemeIcon("markdown");
          description = "Documentation";
        } else if (nodeData.path?.endsWith(".html")) {
          icon = new vscode6.ThemeIcon("globe");
          description = "HTML report";
        } else {
          icon = new vscode6.ThemeIcon("file");
          description = "File";
        }
      }
      let command;
      if (!isDirectory && nodeData.path) {
        command = {
          command: "vscode.open",
          title: "Open File",
          arguments: [vscode6.Uri.file(nodeData.path)]
        };
      }
      items.push(
        new TestTreeItem(
          key,
          2 /* File */,
          collapsibleState,
          {
            filePath: fullPath,
            originalPath: nodeData.path,
            isFile: !isDirectory,
            description
          },
          command,
          icon
        )
      );
    }
    return items;
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged") {
      this.loadAllFiles();
    }
  }
};

// src/vscode/providers/ProcessesTreeDataProvider.ts
import * as vscode7 from "vscode";
var ProcessesTreeDataProvider = class extends BaseTreeDataProvider {
  processes = [];
  constructor() {
    super();
    this.fetchProcesses();
  }
  refresh() {
    this.fetchProcesses();
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
  async fetchProcesses() {
    const response = await fetch("http://localhost:3000/~/processes");
    const data = await response.json();
    this.processes = data.processes;
    this._onDidChangeTreeData.fire();
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged" && message.url === "/~/processes") {
      this.fetchProcesses();
    }
  }
  getProcessItems() {
    const items = [];
    items.push(
      new TestTreeItem(
        this.isConnected ? "\u2705 Connected via WebSocket" : "\u26A0\uFE0F Not connected",
        2 /* File */,
        vscode7.TreeItemCollapsibleState.None,
        {
          description: this.isConnected ? "Receiving real-time updates" : "Click to retry WebSocket connection",
          connected: this.isConnected
        },
        !this.isConnected ? {
          command: "testeranto.retryConnection",
          title: "Retry Connection",
          arguments: [this]
        } : void 0,
        this.isConnected ? new vscode7.ThemeIcon("radio-tower", new vscode7.ThemeColor("testing.iconPassed")) : new vscode7.ThemeIcon("warning", new vscode7.ThemeColor("testing.iconFailed"))
      )
    );
    items.push(
      new TestTreeItem(
        "Refresh now",
        2 /* File */,
        vscode7.TreeItemCollapsibleState.None,
        {
          description: "Update Docker container list",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode7.ThemeIcon("refresh", new vscode7.ThemeColor("testing.iconQueued"))
      )
    );
    if (this.processes.length > 0) {
      items.push(
        new TestTreeItem(
          `\u{1F4E6} ${this.processes.length} Docker container(s)`,
          2 /* File */,
          vscode7.TreeItemCollapsibleState.None,
          {
            description: "Active and stopped containers",
            count: this.processes.length
          },
          void 0,
          new vscode7.ThemeIcon("package", new vscode7.ThemeColor("testing.iconUnset"))
        )
      );
      for (const process2 of this.processes) {
        const isActive = process2.isActive === true;
        const icon = isActive ? new vscode7.ThemeIcon("play", new vscode7.ThemeColor("testing.iconPassed")) : new vscode7.ThemeIcon("stop", new vscode7.ThemeColor("testing.iconFailed"));
        const containerName = process2.processId || process2.name || "Unknown";
        const label = `${isActive ? "\u25B6 " : "\u25A0 "}${containerName}`;
        let description = process2.command || process2.image || "";
        const status = process2.status || "";
        const runtime2 = process2.runtime || "unknown";
        if (status) {
          description = `${description} - ${status}`;
        }
        description = `${description} [${runtime2}]`;
        items.push(
          new TestTreeItem(
            label,
            2 /* File */,
            vscode7.TreeItemCollapsibleState.None,
            {
              description,
              status,
              isActive,
              processId: process2.processId,
              runtime: runtime2,
              ports: process2.ports,
              exitCode: process2.exitCode,
              containerName
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
          vscode7.TreeItemCollapsibleState.None,
          {
            description: "Make sure the Testeranto server is running on port 3000",
            noProcesses: true
          },
          void 0,
          new vscode7.ThemeIcon("info", new vscode7.ThemeColor("testing.iconUnset"))
        )
      );
      items.push(
        new TestTreeItem(
          "Start Testeranto Server",
          2 /* File */,
          vscode7.TreeItemCollapsibleState.None,
          {
            description: "Launch the server in a terminal",
            startServer: true
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode7.ThemeIcon("play", new vscode7.ThemeColor("testing.iconPassed"))
        )
      );
    }
    return items;
  }
  dispose() {
    super.dispose();
  }
};

// src/vscode/providers/HtmlReportProvider.ts
import * as vscode8 from "vscode";
var HtmlReportProvider = class extends BaseTreeDataProvider {
  constructor() {
    super();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.getReportItems());
    }
    return Promise.resolve([]);
  }
  getReportItems() {
    return [
      new TestTreeItem(
        "\u{1F310} Generate & View Report",
        2 /* File */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Create and open HTML report for stakeholders",
          action: "generate-report"
        },
        {
          command: "testeranto.generateHtmlReport",
          title: "Generate HTML Report"
        },
        new vscode8.ThemeIcon("globe")
      ),
      new TestTreeItem(
        "\u{1F4CA} Report Preview",
        2 /* File */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Documentation + Test Results (no source code)"
        },
        void 0,
        new vscode8.ThemeIcon("preview")
      ),
      new TestTreeItem(
        "\u{1F3AF} Stakeholder Focused",
        2 /* File */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Business-facing, no implementation details"
        },
        void 0,
        new vscode8.ThemeIcon("eye")
      ),
      new TestTreeItem(
        "\u{1F4C1} Static HTML File",
        2 /* File */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Can be checked into git and hosted on GitHub"
        },
        void 0,
        new vscode8.ThemeIcon("file-code")
      ),
      new TestTreeItem(
        "\u{1F504} Auto-refresh",
        2 /* File */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Updates when tests run"
        },
        void 0,
        new vscode8.ThemeIcon("refresh")
      )
    ];
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged") {
      this.refresh();
    }
  }
};

// src/vscode/extension.ts
function activate(context) {
  console.log("[Testeranto] Extension activating...");
  const convertLocalPathsToWebviewUris = (htmlContent, webview, workspaceRoot) => {
    let modifiedHtml = htmlContent;
    modifiedHtml = modifiedHtml.replace(
      /(href|src)=["']([^"']+\.(css|js|png|jpg|gif|svg))["']/gi,
      (match, attr, filePath) => {
        const fullPath = path2.join(workspaceRoot, "testeranto", "reports", filePath);
        const uri = webview.asWebviewUri(vscode9.Uri.file(fullPath));
        return `${attr}="${uri}"`;
      }
    );
    return modifiedHtml;
  };
  const terminalManager = new TerminalManager();
  terminalManager.createAllTerminals();
  console.log("[Testeranto] Created terminals for all tests");
  const mainStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 100);
  mainStatusBarItem.text = "$(beaker) Testeranto";
  mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
  mainStatusBarItem.command = "testeranto.showTests";
  mainStatusBarItem.show();
  const serverStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 99);
  serverStatusBarItem.text = "$(circle-slash) Server";
  serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
  serverStatusBarItem.command = "testeranto.startServer";
  serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
  serverStatusBarItem.show();
  const updateServerStatus = async () => {
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
            serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          serverStatusBarItem.text = "$(circle-slash) Server";
          serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        serverStatusBarItem.text = "$(circle-slash) Server";
        serverStatusBarItem.tooltip = "No workspace folder open";
        serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      serverStatusBarItem.text = "$(error) Server Error";
      serverStatusBarItem.tooltip = "Error checking server status";
      serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.errorBackground");
    }
  };
  updateServerStatus();
  const unifiedProvider = new TesterantoTreeDataProvider();
  const runtimeProvider = new TestTreeDataProvider();
  const resultsProvider = new FeaturesTreeDataProvider();
  const processProvider = new ProcessesTreeDataProvider();
  const reportProvider = new HtmlReportProvider();
  const showTestsCommand = vscode9.commands.registerCommand(
    "testeranto.showTests",
    () => {
      vscode9.window.showInformationMessage("Showing Testeranto Dashboard");
      vscode9.commands.executeCommand("testeranto.unifiedView.focus");
    }
  );
  const runTestCommand = vscode9.commands.registerCommand(
    "testeranto.runTest",
    async (item) => {
      if (item.type === 1 /* Test */) {
        const { runtime: runtime2, testName } = item.data || {};
        vscode9.window.showInformationMessage(`Running ${testName} for ${runtime2}...`);
        const terminal = terminalManager.showTerminal(runtime2, testName);
        if (terminal) {
          vscode9.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
        } else {
          vscode9.window.showWarningMessage(`Terminal for ${testName} not found`);
        }
      }
    }
  );
  const aiderCommand = vscode9.commands.registerCommand(
    "testeranto.aider",
    async (...args) => {
      console.log("[Testeranto] Aider command triggered with args:", args);
      let runtime2;
      let testName;
      if (args.length === 0) {
        vscode9.window.showErrorMessage("Cannot connect to aider: No arguments provided");
        return;
      }
      const firstArg = args[0];
      if (firstArg && typeof firstArg === "object" && firstArg.type !== void 0) {
        if (firstArg.type === 1 /* Test */) {
          console.log("[Testeranto] Item label:", firstArg.label);
          console.log("[Testeranto] Item data:", JSON.stringify(firstArg.data, null, 2));
          runtime2 = firstArg.data?.runtime;
          testName = firstArg.data?.testName;
          if (!runtime2) {
            runtime2 = firstArg.data?.runtimeKey;
          }
          if (!testName) {
            testName = firstArg.label;
          }
        } else {
          vscode9.window.showErrorMessage(`Cannot connect to aider: Item is not a test (type: ${firstArg.type})`);
          return;
        }
      } else if (args.length >= 2) {
        runtime2 = args[0];
        testName = args[1];
        console.log("[Testeranto] Using direct parameters:", runtime2, testName);
      } else {
        runtime2 = firstArg;
        testName = "unknown";
        console.log("[Testeranto] Using single parameter:", runtime2);
      }
      console.log("[Testeranto] Extracted runtime:", runtime2, "type:", typeof runtime2);
      console.log("[Testeranto] Extracted testName:", testName, "type:", typeof testName);
      if (!runtime2 || !testName) {
        vscode9.window.showErrorMessage(`Cannot connect to aider: Missing runtime or test name. Runtime: ${runtime2}, Test: ${testName}`);
        return;
      }
      console.log("[Testeranto] Calling createAiderTerminal with raw values");
      vscode9.window.showInformationMessage(`Connecting to aider process for ${testName || "unknown"} (${runtime2 || "unknown"})...`);
      try {
        const aiderTerminal = await terminalManager.createAiderTerminal(runtime2, testName);
        aiderTerminal.show();
        let processedTestName = testName || "";
        processedTestName = processedTestName?.replace(/\.[^/.]+$/, "") || "";
        processedTestName = processedTestName.replace(/^example\//, "");
        const sanitizedTestName = processedTestName ? processedTestName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-") : "";
        const containerName = `${runtime2}-${sanitizedTestName}-aider`;
        aiderTerminal.sendText("clear");
        setTimeout(() => {
          aiderTerminal.sendText(`echo "Connecting to aider container: ${containerName}"`);
          aiderTerminal.sendText(`docker exec -it ${containerName} /bin/bash`);
        }, 500);
      } catch (error) {
        vscode9.window.showErrorMessage(`Failed to create aider terminal: ${error.message}`);
        console.error("[Testeranto] Error creating aider terminal:", error);
        return;
      }
    }
  );
  const launchAiderTerminalCommand = vscode9.commands.registerCommand(
    "testeranto.launchAiderTerminal",
    async (...args) => {
      console.log("[Testeranto] launchAiderTerminal called with args:", args);
      let runtime2;
      let testName;
      if (args.length === 0) {
        vscode9.window.showErrorMessage("Cannot launch aider terminal: No arguments provided");
        return;
      }
      const firstArg = args[0];
      if (firstArg && typeof firstArg === "object" && firstArg.type !== void 0) {
        runtime2 = firstArg.data?.runtime;
        testName = firstArg.data?.testName;
        console.log("[Testeranto] Extracted from TestTreeItem - runtime:", runtime2, "type:", typeof runtime2);
        console.log("[Testeranto] Extracted from TestTreeItem - testName:", testName, "type:", typeof testName);
        console.log("[Testeranto] Full data object:", JSON.stringify(firstArg.data, null, 2));
      } else if (args.length >= 2) {
        runtime2 = args[0];
        testName = args[1];
        console.log("[Testeranto] Using direct arguments:", runtime2, testName);
      } else {
        runtime2 = firstArg;
        testName = "unknown";
        console.log("[Testeranto] Using single argument:", runtime2);
      }
      console.log("[Testeranto] Raw values - runtime:", runtime2, "type:", typeof runtime2);
      console.log("[Testeranto] Raw values - testName:", testName, "type:", typeof testName);
      vscode9.window.showInformationMessage(`Launching aider terminal for ${testName || "unknown"} (${runtime2 || "unknown"})...`);
      try {
        const terminal = await terminalManager.createAiderTerminal(runtime2, testName);
        terminal.show();
        vscode9.window.showInformationMessage(`Aider terminal launched for ${testName || "unknown"} (${runtime2 || "unknown"})`);
      } catch (error) {
        console.error("Failed to launch aider terminal:", error);
        vscode9.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
      }
    }
  );
  const openConfigCommand = vscode9.commands.registerCommand(
    "testeranto.openConfig",
    async () => {
      try {
        const uri = vscode9.Uri.file("allTests.ts");
        const doc = await vscode9.workspace.openTextDocument(uri);
        await vscode9.window.showTextDocument(doc);
      } catch (err) {
        vscode9.window.showWarningMessage("Could not open allTests.ts configuration file");
      }
    }
  );
  const openFileCommand = vscode9.commands.registerCommand(
    "testeranto.openFile",
    async (item) => {
      if (item.type === 2 /* File */) {
        const fileName = item.data?.fileName || item.label;
        const uri = vscode9.Uri.file(fileName);
        try {
          const doc = await vscode9.workspace.openTextDocument(uri);
          await vscode9.window.showTextDocument(doc);
        } catch (err) {
          const files = await vscode9.workspace.findFiles(`**/${fileName}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode9.workspace.openTextDocument(files[0]);
            await vscode9.window.showTextDocument(doc);
          } else {
            vscode9.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      }
    }
  );
  const refreshCommand = vscode9.commands.registerCommand("testeranto.refresh", async () => {
    vscode9.window.showInformationMessage("Refreshing all Testeranto views...");
    await updateServerStatus();
    unifiedProvider.refresh();
    runtimeProvider.refresh();
    resultsProvider.refresh();
    processProvider.refresh();
    reportProvider.refresh();
  });
  const retryConnectionCommand = vscode9.commands.registerCommand("testeranto.retryConnection", (provider) => {
    vscode9.window.showInformationMessage("Retrying connection to server...");
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
      vscode9.window.showWarningMessage("Provider does not support WebSocket reconnection");
    }
  });
  const startServerCommand = vscode9.commands.registerCommand("testeranto.startServer", async () => {
    vscode9.window.showInformationMessage("Starting Testeranto server...");
    const terminal = vscode9.window.createTerminal("Testeranto Server");
    terminal.show();
    const workspaceFolders = vscode9.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      terminal.sendText(`cd "${workspacePath}" && npm start`);
    } else {
      terminal.sendText("npm start");
    }
    vscode9.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
    setTimeout(async () => {
      await updateServerStatus();
      testerantoTreeDataProvider.refresh();
    }, 5e3);
  });
  const generateHtmlReportCommand = vscode9.commands.registerCommand(
    "testeranto.generateHtmlReport",
    async () => {
      vscode9.window.showInformationMessage("Generating stakeholder HTML report...");
      try {
        const response = await fetch("http://localhost:3000/~/html-report");
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        vscode9.window.showInformationMessage(`HTML report generated: ${data.message}`);
        const panel = vscode9.window.createWebviewPanel(
          "testerantoReport",
          "Testeranto Stakeholder Report",
          vscode9.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
              vscode9.Uri.file(path2.join(process.cwd(), "testeranto", "reports"))
            ]
          }
        );
        const workspaceFolders = vscode9.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const reportPath = path2.join(workspaceRoot, "testeranto", "reports", "index.html");
          if (fs2.existsSync(reportPath)) {
            const htmlContent = fs2.readFileSync(reportPath, "utf-8");
            const webviewHtml = convertLocalPathsToWebviewUris(htmlContent, panel.webview, workspaceRoot);
            panel.webview.html = webviewHtml;
          } else {
            panel.webview.html = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body { 
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                                        padding: 40px;
                                        background: #f5f5f5;
                                    }
                                    .container {
                                        max-width: 800px;
                                        margin: 0 auto;
                                        background: white;
                                        padding: 30px;
                                        border-radius: 8px;
                                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                    }
                                    h1 { color: #333; margin-bottom: 20px; }
                                    .error { 
                                        color: #f44336; 
                                        background: #ffebee;
                                        padding: 15px;
                                        border-radius: 4px;
                                        border-left: 4px solid #f44336;
                                    }
                                    .info { 
                                        color: #2196f3; 
                                        background: #e3f2fd;
                                        padding: 15px;
                                        border-radius: 4px;
                                        border-left: 4px solid #2196f3;
                                    }
                                    button {
                                        background: #667eea;
                                        color: white;
                                        border: none;
                                        padding: 10px 20px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        margin-top: 20px;
                                    }
                                    button:hover {
                                        background: #764ba2;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h1>\u{1F4CA} Testeranto Stakeholder Report</h1>
                                    <p class="error">The HTML report file was not found at: ${reportPath}</p>
                                    <p class="info">Try generating the report again by clicking the button below.</p>
                                    <button onclick="generateReport()">Generate Report</button>
                                </div>
                                <script>
                                    const vscode = acquireVsCodeApi();
                                    function generateReport() {
                                        vscode.postMessage({
                                            command: 'generateReport'
                                        });
                                    }
                                </script>
                            </body>
                            </html>
                        `;
            panel.webview.onDidReceiveMessage(
              (message) => {
                switch (message.command) {
                  case "generateReport":
                    vscode9.commands.executeCommand("testeranto.generateHtmlReport");
                    break;
                }
              },
              void 0,
              context.subscriptions
            );
          }
        }
      } catch (error) {
        vscode9.window.showErrorMessage(`${JSON.stringify(error)}`);
      }
    }
  );
  const unifiedTreeView = vscode9.window.createTreeView("testeranto.unifiedView", {
    treeDataProvider: unifiedProvider,
    showCollapseAll: true
  });
  const runtimeTreeView = vscode9.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: runtimeProvider,
    showCollapseAll: true
  });
  const resultsTreeView = vscode9.window.createTreeView("testeranto.resultsView", {
    treeDataProvider: resultsProvider,
    showCollapseAll: true
  });
  const processTreeView = vscode9.window.createTreeView("testeranto.processView", {
    treeDataProvider: processProvider,
    showCollapseAll: true
  });
  const reportTreeView = vscode9.window.createTreeView("testeranto.reportView", {
    treeDataProvider: reportProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      terminalManager.disposeAll();
      unifiedProvider.dispose();
      runtimeProvider.dispose();
      resultsProvider.dispose();
      processProvider.dispose();
      reportProvider.dispose();
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
    generateHtmlReportCommand,
    unifiedTreeView,
    runtimeTreeView,
    resultsTreeView,
    processTreeView,
    reportTreeView,
    mainStatusBarItem,
    serverStatusBarItem
  );
  console.log("[Testeranto] Commands registered");
  console.log("[Testeranto] Unified tree view registered");
  vscode9.commands.getCommands().then((commands2) => {
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
