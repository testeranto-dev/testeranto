// src/vscode/extension.ts
import * as vscode4 from "vscode";
import * as path2 from "path";

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
  async restartAiderProcess(runtime, testName) {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      const process2 = aiderProcesses.find(
        (p) => p.runtime === runtime && p.testName === testName
      );
      if (process2) {
        const key = this.getTerminalKey(runtime, testName);
        let terminal = this.terminals.get(key);
        if (!terminal || terminal.exitStatus !== void 0) {
          terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
          this.terminals.set(key, terminal);
        }
        terminal.sendText(`docker restart ${process2.containerId}`);
        terminal.sendText(`sleep 2 && docker exec -it ${process2.containerId} /bin/bash`);
        terminal.show();
      } else {
        vscode.window.showErrorMessage(`No aider process found for ${testName} (${runtime})`);
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
import * as vscode3 from "vscode";
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
    const response = await fetch("http://localhost:3000/~/documentation");
    const data = await response.json();
    return data.files || [];
  }
};

// src/vscode/providers/TesterantoTreeDataProvider.ts
var TesterantoTreeDataProvider = class {
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  documentationFiles = [];
  testInputFiles = /* @__PURE__ */ new Map();
  testResults = /* @__PURE__ */ new Map();
  processes = [];
  ws = null;
  constructor() {
    const workspaceFolders = vscode3.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.loadInitialData();
      this.connectWebSocket();
    }
    this.setupWorkspaceWatcher();
  }
  refresh() {
    this.loadInitialData();
    this._onDidChangeTreeData.fire();
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
    } else if (data?.filePath) {
      return Promise.resolve(this.getFileChildren(data.filePath));
    }
    return Promise.resolve([]);
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
    const files = await TesterantoTreeDataProviderUtils.loadDocumentationFiles();
    console.log(`[TesterantoTreeDataProvider] Loaded ${files.length} documentation files:`, files);
    this.documentationFiles = files;
  }
  async loadTestInputFiles() {
    console.log("[TesterantoTreeDataProvider] Loading test input files...");
    try {
      const response = await fetch("http://localhost:3000/~/configs");
      const data = await response.json();
      const configs = data.configs;
      if (configs?.runtimes) {
        console.log(`[TesterantoTreeDataProvider] Found ${Object.keys(configs.runtimes).length} runtimes`);
        this.testInputFiles.clear();
        for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
          const config = runtimeConfig;
          const tests = config.tests || [];
          console.log(`[TesterantoTreeDataProvider] Runtime ${runtimeKey} has ${tests.length} tests`);
          for (const testName of tests) {
            console.log(`[TesterantoTreeDataProvider] Fetching input files for ${runtimeKey}/${testName}`);
            try {
              const inputResponse = await fetch(
                `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`
              );
              const inputData = await inputResponse.json();
              const files = inputData.inputFiles || [];
              console.log(`[TesterantoTreeDataProvider] Found ${files.length} input files for ${runtimeKey}/${testName}`);
              if (!this.testInputFiles.has(runtimeKey)) {
                this.testInputFiles.set(runtimeKey, []);
              }
              this.testInputFiles.get(runtimeKey).push({
                testName,
                files
              });
            } catch (error) {
              console.error(`[TesterantoTreeDataProvider] Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("[TesterantoTreeDataProvider] Error loading test input files:", error);
    }
  }
  async loadTestResults() {
    try {
      console.log("[TesterantoTreeDataProvider] Loading test results...");
      const response = await fetch("http://localhost:3000/~/testresults");
      if (!response.ok) {
        console.error(`[TesterantoTreeDataProvider] Failed to fetch test results: ${response.status} ${response.statusText}`);
        const allResponse = await fetch("http://localhost:3000/~/testresults");
        if (allResponse.ok) {
          const allData = await allResponse.json();
          this.processTestResults(allData);
        }
        return;
      }
      const data = await response.json();
      console.log(`[TesterantoTreeDataProvider] Received test results data:`, data);
      this.processTestResults(data);
    } catch (error) {
      console.error("[TesterantoTreeDataProvider] Error loading test results:", error);
    }
  }
  processTestResults(data) {
    this.testResults.clear();
    if (data.testResults && Array.isArray(data.testResults)) {
      console.log(`[TesterantoTreeDataProvider] Processing ${data.testResults.length} test results`);
      for (const testResult of data.testResults) {
        let testName = testResult.testName || testResult.result?.name || testResult.file?.replace(".json", "") || "Unknown";
        if (testResult.runtime && testName.startsWith(`${testResult.runtime}.`)) {
          testName = testName.substring(testResult.runtime.length + 1);
        }
        if (testName === "Unknown" && testResult.file) {
          const fileName = testResult.file;
          const patterns = [
            /^[^\.]+\.(.+)\.json$/,
            // runtime.testname.json
            /^(.+)\.json$/
            // testname.json
          ];
          for (const pattern of patterns) {
            const match = fileName.match(pattern);
            if (match && match[1]) {
              testName = match[1];
              break;
            }
          }
        }
        console.log(`[TesterantoTreeDataProvider] Processing test result for: ${testName}`);
        if (!this.testResults.has(testName)) {
          this.testResults.set(testName, []);
        }
        this.testResults.get(testName).push(testResult);
      }
    } else {
      console.log("[TesterantoTreeDataProvider] No testResults array found in response");
    }
    console.log(`[TesterantoTreeDataProvider] Loaded ${this.testResults.size} unique tests`);
  }
  async loadProcesses() {
    const response = await fetch("http://localhost:3000/~/processes");
    const data = await response.json();
    this.processes = data.processes;
  }
  getRootItems() {
    const items = [
      new TestTreeItem(
        "\u{1F4DA} Documentation",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.Collapsed,
        {
          section: "documentation",
          description: `${this.documentationFiles.length} files`
        },
        void 0,
        new vscode3.ThemeIcon("book")
      ),
      new TestTreeItem(
        "\u{1F9EA} Test Inputs",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.Collapsed,
        {
          section: "test-inputs",
          description: "Source files for tests"
        },
        void 0,
        new vscode3.ThemeIcon("beaker")
      ),
      new TestTreeItem(
        "\u{1F4CA} Test Results",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.Collapsed,
        {
          section: "test-results",
          description: `${this.testResults.size} tests`
        },
        void 0,
        new vscode3.ThemeIcon("graph")
      ),
      new TestTreeItem(
        "\u{1F433} Docker Processes",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.Collapsed,
        {
          section: "processes",
          description: `${this.processes.length} containers`
        },
        void 0,
        new vscode3.ThemeIcon("server")
      ),
      new TestTreeItem(
        "\u{1F310} HTML Report",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.None,
        {
          section: "reports",
          description: "Static report for stakeholders"
        },
        {
          command: "testeranto.generateHtmlReport",
          title: "Generate and Open HTML Report"
        },
        new vscode3.ThemeIcon("globe")
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
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Configure documentationGlob in testeranto config"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      ];
    }
    const workspaceFolders = vscode3.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [
        new TestTreeItem(
          "No workspace folder open",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Open a workspace to view documentation"
          },
          void 0,
          new vscode3.ThemeIcon("warning")
        )
      ];
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const cwd = process.cwd();
    return this.documentationFiles.map((file) => {
      const fileName = path.basename(file);
      let fullPath;
      if (path.isAbsolute(file)) {
        fullPath = file;
      } else {
        fullPath = path.join(workspaceRoot, file);
        if (!fs.existsSync(fullPath)) {
          fullPath = path.join(cwd, file);
        }
      }
      const description = path.dirname(file);
      return new TestTreeItem(
        fileName,
        2 /* File */,
        vscode3.TreeItemCollapsibleState.None,
        {
          filePath: file,
          description: description !== "." ? description : ""
        },
        {
          command: "vscode.open",
          title: "Open File",
          arguments: [vscode3.Uri.file(fullPath)]
        },
        new vscode3.ThemeIcon("markdown")
      );
    });
  }
  getTestInputItems() {
    const items = [];
    if (this.testInputFiles.size === 0) {
      items.push(
        new TestTreeItem(
          "No test input files found",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate input files"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      );
      return items;
    }
    for (const [runtime, testEntries] of this.testInputFiles.entries()) {
      let totalFiles = 0;
      for (const entry of testEntries) {
        totalFiles += entry.files.length;
      }
      items.push(
        new TestTreeItem(
          runtime,
          2 /* File */,
          vscode3.TreeItemCollapsibleState.Collapsed,
          {
            section: "test-inputs-runtime",
            runtime,
            description: `${testEntries.length} tests, ${totalFiles} files`
          },
          void 0,
          new vscode3.ThemeIcon("symbol-namespace")
        )
      );
    }
    return items;
  }
  getTestResultItems() {
    const items = [];
    if (this.testResults.size === 0) {
      items.push(
        new TestTreeItem(
          "No test results found",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Run tests to generate results"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      );
      items.push(
        new TestTreeItem(
          "Refresh Test Results",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Check for new test results"
          },
          {
            command: "testeranto.refresh",
            title: "Refresh Test Results"
          },
          new vscode3.ThemeIcon("refresh")
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
      const icon = failed === 0 ? new vscode3.ThemeIcon("check", new vscode3.ThemeColor("testing.iconPassed")) : new vscode3.ThemeIcon("error", new vscode3.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          testName,
          2 /* File */,
          vscode3.TreeItemCollapsibleState.Collapsed,
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
  getProcessItems() {
    if (this.processes.length === 0) {
      return [
        new TestTreeItem(
          "No Docker processes found",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Start the Testeranto server"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      ];
    }
    return this.processes.map((process2) => {
      const isActive = process2.isActive === true;
      return new TestTreeItem(
        process2.name || process2.containerId,
        2 /* File */,
        vscode3.TreeItemCollapsibleState.None,
        {
          processId: process2.containerId,
          status: process2.status,
          isActive,
          runtime: process2.runtime,
          description: `${process2.status} - ${process2.runtime}`
        },
        void 0,
        isActive ? new vscode3.ThemeIcon("play", new vscode3.ThemeColor("testing.iconPassed")) : new vscode3.ThemeIcon("stop", new vscode3.ThemeColor("testing.iconFailed"))
      );
    });
  }
  getReportItems() {
    return [
      new TestTreeItem(
        "Generate HTML Report",
        2 /* File */,
        vscode3.TreeItemCollapsibleState.None,
        {
          description: "Create static report for stakeholders"
        },
        {
          command: "testeranto.generateHtmlReport",
          title: "Generate Report"
        },
        new vscode3.ThemeIcon("file-code")
      )
    ];
  }
  getTestInputRuntimeItems(runtime) {
    const items = [];
    const testEntries = this.testInputFiles.get(runtime);
    if (!testEntries || testEntries.length === 0) {
      items.push(
        new TestTreeItem(
          "No tests found",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "This runtime has no tests configured"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      );
      return items;
    }
    for (const entry of testEntries) {
      items.push(
        new TestTreeItem(
          entry.testName,
          2 /* File */,
          vscode3.TreeItemCollapsibleState.Collapsed,
          {
            section: "test-inputs-test",
            runtime,
            testName: entry.testName,
            description: `${entry.files.length} files`
          },
          void 0,
          new vscode3.ThemeIcon("beaker")
        )
      );
    }
    return items;
  }
  getTestInputTestItems(runtime, testName) {
    const items = [];
    const testEntries = this.testInputFiles.get(runtime);
    if (!testEntries) {
      return items;
    }
    const entry = testEntries.find((e) => e.testName === testName);
    if (!entry || entry.files.length === 0) {
      items.push(
        new TestTreeItem(
          "No files found",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "This test has no input files"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      );
      return items;
    }
    const treeRoot = { name: "", children: /* @__PURE__ */ new Map(), fullPath: "", isFile: false };
    for (const filePath of entry.files) {
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
    const workspaceFolders = vscode3.workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : process.cwd();
    const buildItems = (node) => {
      const items2 = [];
      const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
        if (!a.isFile && b.isFile) return -1;
        if (a.isFile && !b.isFile) return 1;
        return a.name.localeCompare(b.name);
      });
      for (const child of sortedChildren) {
        const collapsibleState = child.isFile ? vscode3.TreeItemCollapsibleState.None : vscode3.TreeItemCollapsibleState.Collapsed;
        let fileUri;
        if (child.isFile) {
          const fullPath = path.isAbsolute(child.fullPath) ? child.fullPath : path.join(workspaceRoot, child.fullPath);
          fileUri = vscode3.Uri.file(fullPath);
        }
        const treeItem = new TestTreeItem(
          child.name,
          2 /* File */,
          collapsibleState,
          {
            filePath: child.fullPath,
            isFile: child.isFile,
            runtime,
            testName
          },
          child.isFile && fileUri ? {
            command: "vscode.open",
            title: "Open File",
            arguments: [fileUri]
          } : void 0,
          child.isFile ? new vscode3.ThemeIcon("file-text") : new vscode3.ThemeIcon("folder")
        );
        items2.push(treeItem);
      }
      return items2;
    };
    return buildItems(treeRoot);
  }
  getTestResultChildren(testName) {
    const items = [];
    const results = this.testResults.get(testName);
    if (!results || results.length === 0) {
      items.push(
        new TestTreeItem(
          "No detailed results available",
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            description: "Test result details not found"
          },
          void 0,
          new vscode3.ThemeIcon("info")
        )
      );
      return items;
    }
    const resultsByRuntime = /* @__PURE__ */ new Map();
    for (const result of results) {
      const runtime = result.runtime || "unknown";
      if (!resultsByRuntime.has(runtime)) {
        resultsByRuntime.set(runtime, []);
      }
      resultsByRuntime.get(runtime).push(result);
    }
    for (const [runtime, runtimeResults] of resultsByRuntime.entries()) {
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
      const icon = failed === 0 ? new vscode3.ThemeIcon("check", new vscode3.ThemeColor("testing.iconPassed")) : new vscode3.ThemeIcon("error", new vscode3.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          runtime,
          2 /* File */,
          vscode3.TreeItemCollapsibleState.Collapsed,
          {
            testName,
            runtime,
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
  getTestResultRuntimeChildren(testName, runtime) {
    const items = [];
    const results = this.testResults.get(testName);
    if (!results) {
      return items;
    }
    const runtimeResults = results.filter((r) => r.runtime === runtime);
    for (const result of runtimeResults) {
      const status = result.result?.status;
      const failedFlag = result.result?.failed;
      const isPassed = status === true || failedFlag === false;
      const fileName = result.file || "Unknown file";
      const description = isPassed ? "PASSED" : "FAILED";
      const icon = isPassed ? new vscode3.ThemeIcon("check", new vscode3.ThemeColor("testing.iconPassed")) : new vscode3.ThemeIcon("error", new vscode3.ThemeColor("testing.iconFailed"));
      items.push(
        new TestTreeItem(
          fileName,
          2 /* File */,
          vscode3.TreeItemCollapsibleState.None,
          {
            testName,
            runtime,
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
  getFileChildren(filePath) {
    return [];
  }
  connectWebSocket() {
    this.ws = new WebSocket("ws://localhost:3000");
    this.ws.onopen = () => {
      console.log("[TesterantoTreeDataProvider] WebSocket connected");
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "resourceChanged") {
          console.log(`[TesterantoTreeDataProvider] Resource changed: ${message.url}`);
          this.loadInitialData().then(() => {
            this._onDidChangeTreeData.fire();
          });
        }
      } catch (error) {
        console.error("[TesterantoTreeDataProvider] Error handling WebSocket message:", error);
      }
    };
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    this.ws.onclose = () => {
      console.log("WebSocket closed");
    };
  }
  dispose() {
    if (this.ws) {
      this.ws.close();
    }
  }
  setupWorkspaceWatcher() {
    vscode3.workspace.onDidChangeWorkspaceFolders((event) => {
      if (event.added.length > 0) {
        this.loadInitialData();
        this.connectWebSocket();
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

// src/vscode/extension.ts
function activate(context) {
  console.log("[Testeranto] Extension activating...");
  const terminalManager = new TerminalManager();
  terminalManager.createAllTerminals();
  console.log("[Testeranto] Created terminals for all tests");
  const mainStatusBarItem = vscode4.window.createStatusBarItem(vscode4.StatusBarAlignment.Right, 100);
  mainStatusBarItem.text = "$(beaker) Testeranto";
  mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
  mainStatusBarItem.command = "testeranto.showTests";
  mainStatusBarItem.show();
  const serverStatusBarItem = vscode4.window.createStatusBarItem(vscode4.StatusBarAlignment.Right, 99);
  serverStatusBarItem.text = "$(circle-slash) Server";
  serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
  serverStatusBarItem.command = "testeranto.startServer";
  serverStatusBarItem.backgroundColor = new vscode4.ThemeColor("statusBarItem.warningBackground");
  serverStatusBarItem.show();
  const updateServerStatus = async () => {
    try {
      const workspaceFolders = vscode4.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode4.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode4.workspace.fs.readFile(configUri);
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
            serverStatusBarItem.backgroundColor = new vscode4.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          serverStatusBarItem.text = "$(circle-slash) Server";
          serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          serverStatusBarItem.backgroundColor = new vscode4.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
        serverStatusBarItem.text = "$(circle-slash) Server";
        serverStatusBarItem.tooltip = "No workspace folder open";
        serverStatusBarItem.backgroundColor = new vscode4.ThemeColor("statusBarItem.warningBackground");
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      serverStatusBarItem.text = "$(error) Server Error";
      serverStatusBarItem.tooltip = "Error checking server status";
      serverStatusBarItem.backgroundColor = new vscode4.ThemeColor("statusBarItem.errorBackground");
    }
  };
  updateServerStatus();
  const testerantoTreeDataProvider = new TesterantoTreeDataProvider();
  const showTestsCommand = vscode4.commands.registerCommand(
    "testeranto.showTests",
    () => {
      vscode4.window.showInformationMessage("Showing Testeranto");
      vscode4.commands.executeCommand("testerantoView.focus");
    }
  );
  const runTestCommand = vscode4.commands.registerCommand(
    "testeranto.runTest",
    async (item) => {
      if (item.type === 1 /* Test */) {
        const { runtime, testName } = item.data || {};
        vscode4.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
        const terminal = terminalManager.showTerminal(runtime, testName);
        if (terminal) {
          vscode4.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
        } else {
          vscode4.window.showWarningMessage(`Terminal for ${testName} not found`);
        }
      }
    }
  );
  const aiderCommand = vscode4.commands.registerCommand(
    "testeranto.aider",
    async (...args) => {
      console.log("[Testeranto] Aider command triggered with args:", args);
      let runtime;
      let testName;
      if (args.length === 0) {
        vscode4.window.showErrorMessage("Cannot connect to aider: No arguments provided");
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
          vscode4.window.showErrorMessage(`Cannot connect to aider: Item is not a test (type: ${firstArg.type})`);
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
        vscode4.window.showErrorMessage(`Cannot connect to aider: Missing runtime or test name. Runtime: ${runtime}, Test: ${testName}`);
        return;
      }
      console.log("[Testeranto] Calling createAiderTerminal with raw values");
      vscode4.window.showInformationMessage(`Connecting to aider process for ${testName || "unknown"} (${runtime || "unknown"})...`);
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
        vscode4.window.showErrorMessage(`Failed to create aider terminal: ${error.message}`);
        console.error("[Testeranto] Error creating aider terminal:", error);
        return;
      }
    }
  );
  const launchAiderTerminalCommand = vscode4.commands.registerCommand(
    "testeranto.launchAiderTerminal",
    async (...args) => {
      console.log("[Testeranto] launchAiderTerminal called with args:", args);
      let runtime;
      let testName;
      if (args.length === 0) {
        vscode4.window.showErrorMessage("Cannot launch aider terminal: No arguments provided");
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
      vscode4.window.showInformationMessage(`Launching aider terminal for ${testName || "unknown"} (${runtime || "unknown"})...`);
      try {
        const terminal = await terminalManager.createAiderTerminal(runtime, testName);
        terminal.show();
        vscode4.window.showInformationMessage(`Aider terminal launched for ${testName || "unknown"} (${runtime || "unknown"})`);
      } catch (error) {
        console.error("Failed to launch aider terminal:", error);
        vscode4.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
      }
    }
  );
  const openConfigCommand = vscode4.commands.registerCommand(
    "testeranto.openConfig",
    async () => {
      try {
        const uri = vscode4.Uri.file("allTests.ts");
        const doc = await vscode4.workspace.openTextDocument(uri);
        await vscode4.window.showTextDocument(doc);
      } catch (err) {
        vscode4.window.showWarningMessage("Could not open allTests.ts configuration file");
      }
    }
  );
  const openFileCommand = vscode4.commands.registerCommand(
    "testeranto.openFile",
    async (item) => {
      if (item.type === 2 /* File */) {
        const fileName = item.data?.fileName || item.label;
        const uri = vscode4.Uri.file(fileName);
        try {
          const doc = await vscode4.workspace.openTextDocument(uri);
          await vscode4.window.showTextDocument(doc);
        } catch (err) {
          const files = await vscode4.workspace.findFiles(`**/${fileName}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode4.workspace.openTextDocument(files[0]);
            await vscode4.window.showTextDocument(doc);
          } else {
            vscode4.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      }
    }
  );
  const refreshCommand = vscode4.commands.registerCommand("testeranto.refresh", async () => {
    vscode4.window.showInformationMessage("Refreshing Testeranto view...");
    await updateServerStatus();
    testerantoTreeDataProvider.refresh();
  });
  const retryConnectionCommand = vscode4.commands.registerCommand("testeranto.retryConnection", (provider) => {
    vscode4.window.showInformationMessage("Retrying connection to server...");
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
      vscode4.window.showWarningMessage("Provider does not support WebSocket reconnection");
    }
  });
  const startServerCommand = vscode4.commands.registerCommand("testeranto.startServer", async () => {
    vscode4.window.showInformationMessage("Starting Testeranto server...");
    const terminal = vscode4.window.createTerminal("Testeranto Server");
    terminal.show();
    const workspaceFolders = vscode4.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      terminal.sendText(`cd "${workspacePath}" && npm start`);
    } else {
      terminal.sendText("npm start");
    }
    vscode4.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
    setTimeout(async () => {
      await updateServerStatus();
      testerantoTreeDataProvider.refresh();
    }, 5e3);
  });
  const generateHtmlReportCommand = vscode4.commands.registerCommand(
    "testeranto.generateHtmlReport",
    async () => {
      vscode4.window.showInformationMessage("Generating HTML report via server...");
      try {
        const response = await fetch("http://localhost:3000/~/html-report");
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        vscode4.window.showInformationMessage(`HTML report generated: ${data.message}`);
        const workspaceFolders = vscode4.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const reportPath = path2.join(workspaceRoot, "testeranto", "reports", "index.html");
          const uri = vscode4.Uri.file(reportPath);
          const doc = await vscode4.workspace.openTextDocument(uri);
          await vscode4.window.showTextDocument(doc);
        }
      } catch (error) {
        vscode4.window.showErrorMessage(`Failed to generate HTML report: ${error.message}`);
      }
    }
  );
  const testerantoTreeView = vscode4.window.createTreeView("testerantoView", {
    treeDataProvider: testerantoTreeDataProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      terminalManager.disposeAll();
      testerantoTreeDataProvider.dispose();
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
    testerantoTreeView,
    mainStatusBarItem,
    serverStatusBarItem
  );
  console.log("[Testeranto] Commands registered");
  console.log("[Testeranto] Unified tree view registered");
  vscode4.commands.getCommands().then((commands2) => {
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
