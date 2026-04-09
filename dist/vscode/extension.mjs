// src/vscode/extension.ts
import * as vscode24 from "vscode";

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
  async fetchAiderProcesses() {
    try {
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
    if (configKey) {
      const containerName = this.getAiderContainerName(configKey, testName);
      const script = `echo "Checking container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container is running. Attaching...";
  case "${containerName}" in
    *-builder)
      echo "Container is a builder container. Showing logs...";
      docker logs -f ${containerName}
      ;;
    *)
      echo "Container is not a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} is not running.";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "To start the container, run:";
  echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}";
  echo "";
fi
echo "Starting interactive shell...";
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec sh -i
fi`;
      terminal.sendText(script);
    } else {
      const script = `bash -c '
set +e  # Continue on errors
echo "Could not find configuration for ${testName} (${runtime})"
echo "Aider and agent services are created as Docker services at server startup."
echo ""
echo "Available containers:"
docker ps --format "{{.Names}}"
echo ""
# Always start an interactive shell to keep terminal open
echo "Starting interactive shell..."
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec bash -i
fi
'`.trim();
      terminal.sendText(script);
    }
    terminal.show();
    return terminal;
  }
  // Open a terminal to a specific container
  async openContainerTerminal(containerName, label, agentName) {
    const key = `container:${containerName}`;
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      terminal.show();
      return terminal;
    }
    const terminalName = agentName ? `Aider: ${agentName}` : `Container: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    let script;
    script = `echo "Checking container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container is running. Attaching...";
  case "${containerName}" in
    *-builder)
      echo "Container is a builder container. Showing logs...";
      docker logs -f ${containerName}
      ;;
    *)
      echo "Container is not a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} is not running.";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "To start the container, run:";
  echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}";
  echo "";
fi
echo "Starting interactive shell...";
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec sh -i
fi`;
    terminal.sendText(script);
    terminal.show();
    return terminal;
  }
  // Restart a specific aider process
  async restartAiderProcess(runtime, testName) {
    try {
      const key = this.getTerminalKey(runtime, testName);
      let terminal = this.terminals.get(key);
      if (!terminal || terminal.exitStatus !== void 0) {
        terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
        this.terminals.set(key, terminal);
      }
      terminal.sendText(`echo "To restart aider process for ${testName}, please use the server API"`);
      terminal.sendText(`echo "The server manages all aider processes and graph updates"`);
      terminal.show();
      vscode.window.showInformationMessage(`Aider processes are managed by the server. Check the Aider Processes view.`);
    } catch (error) {
      console.error("Failed to handle aider process restart:", error);
      vscode.window.showErrorMessage(`Failed to handle aider process: ${error}`);
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
  // Open a terminal to a Docker process using the server API
  async openProcessTerminal(nodeId, label, containerId, serviceName) {
    const key = `process:${nodeId}`;
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      terminal.show();
      return terminal;
    }
    const terminalName = `Process: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    try {
      const response = await fetch("http://localhost:3000/~/open-process-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nodeId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorScript = `echo "Error: ${errorData.error || "Failed to open terminal"}";
echo "Server response: ${JSON.stringify(errorData)}";
# Keep terminal open for debugging
exec $SHELL || exec bash -i`;
        terminal.sendText(errorScript);
        terminal.show();
        return terminal;
      }
      const data = await response.json();
      if (data.success) {
        const containerIdentifier = data.containerIdentifier;
        const containerStatus = data.containerStatus;
        let script;
        script = `echo "Opening terminal to container: ${containerIdentifier}";
echo "Node ID: ${nodeId}";
echo "Type: ${data.nodeType}";
echo "";
case "${containerIdentifier}" in
  *-builder)
    echo "Container is a builder container. Showing logs (Ctrl+C to stop):";
    docker logs -f ${containerIdentifier}
    ;;
  *agent-*|*aider*)
    echo "Container is an agent or aider container. Attaching (Ctrl+P, Ctrl+Q to detach):";
    docker attach ${containerIdentifier}
    ;;
  *)
    echo "Container is not a builder/agent/aider container. Attaching:";
    docker exec -it ${containerIdentifier} /bin/sh
    ;;
esac`;
        terminal.sendText(script);
      } else {
        const errorScript = `echo "Server reported failure: ${data.error || "Unknown error"}";
# Keep terminal open for debugging
exec $SHELL || exec sh -i`;
        terminal.sendText(errorScript);
      }
    } catch (error) {
      const errorScript = `echo "Error calling server API: ${error.message}";
echo "Cannot open terminal without server connection.";
exec $SHELL || exec sh -i`;
      terminal.sendText(errorScript);
    }
    terminal.show();
    return terminal;
  }
  // Open a terminal to an aider container
  async openAiderTerminal(containerName, label, agentName) {
    if (!containerName) {
      const terminal2 = vscode.window.createTerminal(`Aider: ${label}`);
      terminal2.sendText(`echo "Error: No container name provided for aider terminal"`);
      terminal2.sendText(`echo "Available containers:"`);
      terminal2.sendText(`docker ps --format "{{.Names}}"`);
      terminal2.sendText(`exec $SHELL || exec bash -i`);
      terminal2.show();
      return terminal2;
    }
    const key = `aider:${containerName}`;
    let terminal = this.terminals.get(key);
    if (terminal && terminal.exitStatus === void 0) {
      terminal.show();
      return terminal;
    }
    const terminalName = agentName ? `Aider: ${agentName}` : `Aider: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    let script;
    script = `echo "Opening terminal to container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container found. Attaching...";
  case "${containerName}" in
    *agent-*|*aider*)
      echo "Container is an agent or aider container. Using docker attach to connect to aider process...";
      echo "Note: To detach, use Ctrl+P, Ctrl+Q";
      docker attach ${containerName}
      ;;
    *-builder)
      echo "Container is a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
    *)
      echo "Container is not an agent/aider/builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} not found";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "Starting host shell...";
  exec $SHELL || exec sh -i
fi`;
    terminal.sendText(script);
    terminal.show();
    return terminal;
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
import * as vscode5 from "vscode";
import * as path from "path";

// src/vscode/TestTreeItem.ts
import * as vscode2 from "vscode";

// src/vscode/types.ts
var TreeItemType = /* @__PURE__ */ ((TreeItemType2) => {
  TreeItemType2[TreeItemType2["Runtime"] = 0] = "Runtime";
  TreeItemType2[TreeItemType2["Test"] = 1] = "Test";
  TreeItemType2[TreeItemType2["File"] = 2] = "File";
  TreeItemType2[TreeItemType2["Info"] = 3] = "Info";
  TreeItemType2[TreeItemType2["Config"] = 4] = "Config";
  return TreeItemType2;
})(TreeItemType || {});

// src/vscode/TestTreeItem.ts
var TestTreeItem2 = class extends vscode2.TreeItem {
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
import * as vscode4 from "vscode";

// src/vscode/providers/utils/apiUtils.ts
import * as vscode3 from "vscode";

// src/api/vscodeExtensionHttp.ts
var vscodeHttpAPI = {
  getConfigs: {
    method: "GET",
    path: "/~/configs",
    description: "Get all configuration data",
    params: {},
    query: {},
    response: {}
  },
  getProcesses: {
    method: "GET",
    path: "/~/processes",
    description: "Get all running processes",
    params: {},
    query: {},
    response: {}
  },
  getProcessLogs: {
    method: "GET",
    path: "/~/processes/:processId/logs",
    description: "Get logs for a specific process",
    params: { processId: "" },
    query: {},
    response: {}
  },
  getAiderProcesses: {
    method: "GET",
    path: "/~/aider-processes",
    description: "Get all aider processes",
    params: {},
    query: {},
    response: {}
  },
  getHtmlReport: {
    method: "GET",
    path: "/~/html-report",
    description: "Get the HTML report",
    params: {},
    query: {},
    response: {}
  },
  getAppState: {
    method: "GET",
    path: "/~/app-state",
    description: "Get the application state",
    params: {},
    query: {},
    response: {}
  },
  getUnifiedTestTree: {
    method: "GET",
    path: "/~/unified-test-tree",
    description: "Get the unified test tree",
    params: {},
    query: {},
    response: {}
  },
  getLockStatus: {
    method: "GET",
    path: "/~/lock-status",
    description: "Get lock status for files",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "lock-status" && request.method === "GET";
    }
  },
  // Note: According to tickets/chat.md, we no longer need POST endpoint for chat
  // Chat is now handled via WebSocket messages
  launchAgent: {
    method: "POST",
    path: "/~/agents/:agentName",
    description: "Launch a new agent instance",
    params: {
      agentName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("agents/") && request.method === "POST";
    }
  },
  getAgents: {
    method: "GET",
    path: "/~/agents",
    description: "Get all agents",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "agents" && request.method === "GET";
    }
  },
  getUserAgents: {
    method: "GET",
    path: "/~/user-agents",
    description: "Get user-defined agents from config",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "user-agents" && request.method === "GET";
    }
  },
  getAgentSlice: {
    method: "GET",
    path: "/~/agents/:agentName",
    description: "Get agent slice data",
    params: {
      agentName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("agents/") && request.method === "GET";
    }
  },
  getFiles: {
    method: "GET",
    path: "/~/files",
    description: "Get files and folders slice",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "files" && request.method === "GET";
    }
  },
  getProcess: {
    method: "GET",
    path: "/~/process",
    description: "Get processes slice",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "process" && request.method === "GET";
    }
  },
  getAider: {
    method: "GET",
    path: "/~/aider",
    description: "Get aider slice",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "aider" && request.method === "GET";
    }
  },
  getRuntime: {
    method: "GET",
    path: "/~/runtime",
    description: "Get runtime slice",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "runtime" && request.method === "GET";
    }
  },
  getVscodeView: {
    method: "GET",
    path: "/~/vscode-views/:viewName",
    description: "Get vscode view data",
    params: {
      viewName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("vscode-views/") && request.method === "GET";
    }
  },
  getStakeholderView: {
    method: "GET",
    path: "/~/stakeholder-views/:viewName",
    description: "Get stakeholder view data",
    params: {
      viewName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("stakeholder-views/") && request.method === "GET";
    }
  },
  gitStatus: {
    method: "GET",
    path: "/~/git/status",
    description: "Get git status",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/status" && request.method === "GET";
    }
  },
  gitSwitchBranch: {
    method: "POST",
    path: "/~/git/switch-branch",
    description: "Switch git branch",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/switch-branch" && request.method === "POST";
    }
  },
  gitCommit: {
    method: "POST",
    path: "/~/git/commit",
    description: "Commit changes",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/commit" && request.method === "POST";
    }
  },
  gitMerge: {
    method: "POST",
    path: "/~/git/merge",
    description: "Merge branch",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/merge" && request.method === "POST";
    }
  },
  gitConflicts: {
    method: "GET",
    path: "/~/git/conflicts",
    description: "Get merge conflicts",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/conflicts" && request.method === "GET";
    }
  },
  gitResolveConflict: {
    method: "POST",
    path: "/~/git/resolve-conflict",
    description: "Resolve merge conflict",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "git/resolve-conflict" && request.method === "POST";
    }
  },
  down: {
    method: "POST",
    path: "/~/down",
    description: "Stop services and lock files",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "down" && request.method === "POST";
    }
  },
  up: {
    method: "POST",
    path: "/~/up",
    description: "Start services and unlock files",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "up" && request.method === "POST";
    }
  },
  openProcessTerminal: {
    method: "POST",
    path: "/~/open-process-terminal",
    description: "Open a terminal to a process container",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "open-process-terminal" && request.method === "POST";
    }
  }
};

// src/vscode/providers/utils/apiUtils.ts
var ApiUtils2 = class {
  static getBaseUrl() {
    try {
      const config = vscode3.workspace.getConfiguration("testeranto");
      const serverPort = config.get("serverPort") || 3e3;
      const baseUrl = `http://localhost:${serverPort}`;
      console.log(`[ApiUtils] Using server URL: ${baseUrl}`);
      return baseUrl;
    } catch (error) {
      console.log("[ApiUtils] Using default server URL");
      return "http://localhost:3000";
    }
  }
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
    const url = `${this.getBaseUrl()}${path3}`;
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
  static getLockStatusUrl() {
    return this.getUrl("getLockStatus");
  }
  static getChatUrl(agent, message) {
    return this.getUrl("sendChatMessage", {}, { agent, message });
  }
  static getLaunchAgentUrl(agentName) {
    return this.getUrl("launchAgent", { agentName });
  }
  static getAgentSliceUrl(agentName) {
    return this.getUrl("getAgentSlice", { agentName });
  }
  static getAgentsUrl() {
    return this.getUrl("getAgents");
  }
  static getWebSocketUrl() {
    const httpUrl = this.getBaseUrl();
    if (httpUrl.startsWith("http://")) {
      return httpUrl.replace("http://", "ws://");
    } else if (httpUrl.startsWith("https://")) {
      return httpUrl.replace("https://", "wss://");
    }
    return "ws://localhost:3000";
  }
  // New methods for slice endpoints
  static getRuntimeSliceUrl() {
    return `${this.getBaseUrl()}/~/runtime`;
  }
  static getProcessSliceUrl() {
    return `${this.getBaseUrl()}/~/process`;
  }
  static getAiderSliceUrl() {
    return `${this.getBaseUrl()}/~/aider`;
  }
  static getFilesSliceUrl() {
    return `${this.getBaseUrl()}/~/files`;
  }
};

// src/vscode/providers/BaseTreeDataProvider.ts
var BaseTreeDataProvider = class {
  _onDidChangeTreeData = new vscode4.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  ws = null;
  isConnected = false;
  subscribedSlices = /* @__PURE__ */ new Set();
  constructor() {
    console.log("[BaseTreeDataProvider] Constructor called");
    this.setupWebSocket();
    console.log("[BaseTreeDataProvider] Constructor completed");
  }
  getTreeItem(element) {
    if (element === null || element === void 0) {
      console.error("[BaseTreeDataProvider] getTreeItem called with null/undefined element");
      const item = new vscode4.TreeItem("Invalid item", vscode4.TreeItemCollapsibleState.None);
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
        this.subscribeToGraphUpdates();
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
        this.subscribedSlices.clear();
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
  subscribeToGraphUpdates() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("[BaseTreeDataProvider] WebSocket not ready for subscription");
      return;
    }
    const subscribeMessage = {
      type: "subscribeToSlice",
      slicePath: "/graph"
    };
    this.ws.send(JSON.stringify(subscribeMessage));
    this.subscribedSlices.add("/graph");
    console.log("[BaseTreeDataProvider] Subscribed to graph updates");
  }
  subscribeToSlice(slicePath) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`[BaseTreeDataProvider] WebSocket not ready for subscription to ${slicePath}`);
      return;
    }
    if (this.subscribedSlices.has(slicePath)) {
      console.log(`[BaseTreeDataProvider] Already subscribed to ${slicePath}`);
      return;
    }
    const subscribeMessage = {
      type: "subscribeToSlice",
      slicePath
    };
    this.ws.send(JSON.stringify(subscribeMessage));
    this.subscribedSlices.add(slicePath);
    console.log(`[BaseTreeDataProvider] Subscribed to ${slicePath}`);
  }
  handleWebSocketMessage(message) {
    if (message.type === "resourceChanged") {
      console.log(`[BaseTreeDataProvider] resourceChanged received for ${message.url}, refreshing`);
      this.refresh();
    } else if (message.type === "graphUpdated") {
      console.log(`[BaseTreeDataProvider] graphUpdated received, refreshing`);
      this.refresh();
    } else if (message.type === "filesLocked" || message.type === "filesUnlocked" || message.type === "lockStatusChanged") {
      console.log(`[BaseTreeDataProvider] ${message.type} received, refreshing for lock status`);
      this.refresh();
    } else if (message.type === "subscribedToSlice") {
      console.log(`[BaseTreeDataProvider] Successfully subscribed to slice: ${message.slicePath}`);
    } else if (message.type === "error") {
      console.error(`[BaseTreeDataProvider] WebSocket error: ${message.message}`);
    }
  }
  dispose() {
    if (this.ws) {
      for (const slicePath of this.subscribedSlices) {
        const unsubscribeMessage = {
          type: "unsubscribeFromSlice",
          slicePath
        };
        this.ws.send(JSON.stringify(unsubscribeMessage));
      }
      this.subscribedSlices.clear();
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
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadGraphData() {
    try {
      console.log("[TestTreeDataProvider] Loading graph data from runtime slice");
      const response = await fetch(ApiUtils2.getRuntimeSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      console.log("[TestTreeDataProvider] Loaded graph data:", this.graphData?.nodes?.length, "nodes");
    } catch (error) {
      console.error("[TestTreeDataProvider] Failed to load graph data:", error);
      this.graphData = null;
    }
  }
  refresh() {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[TestTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
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
    items.push(new TestTreeItem2(
      "Refresh",
      3 /* Info */,
      vscode5.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refresh",
        title: "Refresh",
        arguments: []
      },
      new vscode5.ThemeIcon("refresh")
    ));
    for (const [runtimeKey, data] of runtimeMap.entries()) {
      items.push(new TestTreeItem2(
        runtimeKey,
        0 /* Runtime */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${data.count} config(s)`,
          count: data.count
        },
        void 0,
        new vscode5.ThemeIcon("symbol-namespace")
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
      return new TestTreeItem2(
        node.label || node.id,
        1 /* Test */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId: node.id,
          description: node.description,
          // Mark this as an entrypoint item, not a test item
          isEntrypoint: true
        },
        void 0,
        new vscode5.ThemeIcon("file-text")
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
      return new TestTreeItem2(
        node.label || node.id,
        1 /* Test */,
        vscode5.TreeItemCollapsibleState.Collapsed,
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
        const item = new TestTreeItem2(
          node.label || path.basename(node.metadata?.filePath || node.id),
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
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
          new vscode5.ThemeIcon("arrow-down")
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
      const inputFolder = new TestTreeItem2(
        "Input Files",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "input-files"
        },
        void 0,
        new vscode5.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem2(
        "Output Files",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "output-files"
        },
        void 0,
        new vscode5.ThemeIcon("folder-opened")
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
        const item = new TestTreeItem2(
          node.label || path.basename(node.metadata?.filePath || node.id),
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
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
          new vscode5.ThemeIcon("arrow-down")
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
      const inputFolder = new TestTreeItem2(
        "Input Files",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "test-input-files"
        },
        void 0,
        new vscode5.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem2(
        "Output Files",
        3 /* Info */,
        vscode5.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "test-output-files"
        },
        void 0,
        new vscode5.ThemeIcon("folder-opened")
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, testId);
      items.push(outputFolder);
    }
    return items;
  }
  buildFileTree(filePaths) {
    const root = { type: "directory", children: {} };
    for (const { node, path: path3 } of filePaths) {
      const parts = path3.split(/[\\/]/).filter((part) => part.length > 0);
      let current = root.children;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!current[part]) {
          if (isLast) {
            current[part] = {
              type: "file",
              path: path3,
              node,
              label: node.label || path3.basename(path3) || part,
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
            path: path3,
            node,
            label: node.label || path3.basename(path3) || part,
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
        const folderItem = new TestTreeItem2(
          name,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey,
            testId,
            isFile: false,
            fileType: "folder"
          },
          void 0,
          new vscode5.ThemeIcon("folder")
        );
        folderItem.children = this.convertTreeToItems(typedNode, runtimeKey, testId);
        items.push(folderItem);
      } else if (typedNode.type === "file") {
        const fileItem = new TestTreeItem2(
          name,
          2 /* File */,
          vscode5.TreeItemCollapsibleState.None,
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
          new vscode5.ThemeIcon("arrow-up")
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
      return new vscode5.ThemeIcon("error", new vscode5.ThemeColor("testing.iconFailed"));
    } else if (failed === false || status === "done") {
      return new vscode5.ThemeIcon("check", new vscode5.ThemeColor("testing.iconPassed"));
    } else {
      return new vscode5.ThemeIcon("circle-outline", new vscode5.ThemeColor("testing.iconUnset"));
    }
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[TestTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/runtime" || message.url === "/~/graph") {
        console.log("[TestTreeDataProvider] Relevant update, refreshing");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[TestTreeDataProvider] Graph updated, refreshing");
      this.refresh();
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/runtime");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/DockerProcessTreeDataProvider.ts
import * as vscode6 from "vscode";
var DockerProcessTreeDataProvider = class extends BaseTreeDataProvider {
  graphData = null;
  constructor() {
    super();
    console.log("[DockerProcessTreeDataProvider] Constructor called");
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadGraphData() {
    try {
      console.log("[DockerProcessTreeDataProvider] Loading graph data from process slice");
      const response = await fetch(ApiUtils2.getProcessSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      console.log("[DockerProcessTreeDataProvider] Loaded graph data:", this.graphData?.nodes?.length, "nodes");
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Failed to load graph data:", error);
      this.graphData = null;
    }
  }
  refresh() {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[DockerProcessTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.graphData) {
      await this.loadGraphData();
    }
    if (!element) {
      return this.getDockerProcessItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }
  getDockerProcessItems() {
    if (!this.graphData) {
      console.log("[DockerProcessTreeDataProvider] No graph data available");
      return [];
    }
    console.log(`[DockerProcessTreeDataProvider] Processing graph with ${this.graphData.nodes.length} nodes, ${this.graphData.edges.length} edges`);
    const dockerProcessNodes = this.graphData.nodes.filter(
      (node) => node.type === "docker_process" || node.type === "bdd_process" || node.type === "check_process" || node.type === "builder_process" || node.type === "aider_process"
    );
    console.log(`[DockerProcessTreeDataProvider] Found ${dockerProcessNodes.length} docker process nodes`);
    const items = [];
    items.push(new TestTreeItem2(
      "Refresh",
      3 /* Info */,
      vscode6.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshDockerProcesses",
        title: "Refresh",
        arguments: []
      },
      new vscode6.ThemeIcon("refresh")
    ));
    if (dockerProcessNodes.length === 0) {
      items.push(new TestTreeItem2(
        "No docker processes found",
        3 /* Info */,
        vscode6.TreeItemCollapsibleState.None,
        {
          description: "No docker processes in graph"
        },
        void 0,
        new vscode6.ThemeIcon("info")
      ));
      return items;
    }
    const processGroups = /* @__PURE__ */ new Map();
    for (const processNode of dockerProcessNodes) {
      const incomingEdges = this.graphData.edges.filter(
        (edge) => edge.target === processNode.id
      );
      let parentNode = null;
      let groupType = "unknown";
      for (const edge of incomingEdges) {
        const sourceNode = this.graphData.nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === "config") {
            parentNode = sourceNode;
            groupType = "config";
            break;
          } else if (sourceNode.type === "entrypoint") {
            parentNode = sourceNode;
            groupType = "entrypoint";
            break;
          }
        }
      }
      const groupKey = parentNode ? parentNode.id : "ungrouped";
      if (!processGroups.has(groupKey)) {
        processGroups.set(groupKey, {
          parentNode,
          processes: [],
          type: groupType
        });
      }
      processGroups.get(groupKey).processes.push(processNode);
    }
    for (const [groupKey, group] of processGroups.entries()) {
      let groupLabel = "Ungrouped Processes";
      let groupDescription = `${group.processes.length} process(es)`;
      if (group.parentNode) {
        if (group.type === "config") {
          groupLabel = `Config: ${group.parentNode.label || group.parentNode.id}`;
          groupDescription = `${group.processes.length} builder process(es)`;
        } else if (group.type === "entrypoint") {
          groupLabel = `Entrypoint: ${group.parentNode.label || group.parentNode.id}`;
          groupDescription = `${group.processes.length} test process(es)`;
        }
      }
      const groupItem = new TestTreeItem2(
        groupLabel,
        3 /* Info */,
        vscode6.TreeItemCollapsibleState.Collapsed,
        {
          description: groupDescription,
          count: group.processes.length,
          groupKey,
          groupType: group.type
        },
        void 0,
        group.type === "config" ? new vscode6.ThemeIcon("settings-gear") : group.type === "entrypoint" ? new vscode6.ThemeIcon("file-text") : new vscode6.ThemeIcon("server")
      );
      groupItem.children = group.processes.map((node) => this.createProcessItem(node));
      items.push(groupItem);
    }
    return items;
  }
  createProcessItem(node) {
    const metadata = node.metadata || {};
    const state = metadata.state || metadata.status || "unknown";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const serviceName = metadata.serviceName || metadata.containerName || metadata.name || "unknown";
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
    if (node.type === "aider_process") {
      description += " \u2022 aider";
    }
    let icon;
    if (node.type === "aider_process") {
      icon = new vscode6.ThemeIcon("comment-discussion", new vscode6.ThemeColor("testing.iconPassed"));
    } else if (state === "running" && isActive) {
      icon = new vscode6.ThemeIcon("play-circle", new vscode6.ThemeColor("testing.iconPassed"));
    } else if (state === "exited") {
      if (exitCode === 0) {
        icon = new vscode6.ThemeIcon("check", new vscode6.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode6.ThemeIcon("error", new vscode6.ThemeColor("testing.iconFailed"));
      }
    } else if (state === "stopped") {
      icon = new vscode6.ThemeIcon("circle-slash", new vscode6.ThemeColor("testing.iconUnset"));
    } else {
      icon = new vscode6.ThemeIcon("circle-outline", new vscode6.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem2(
      label,
      3 /* Info */,
      vscode6.TreeItemCollapsibleState.None,
      {
        description,
        status: state,
        exitCode,
        containerId,
        serviceName,
        processType: node.type,
        isActive,
        nodeId: node.id,
        // Add aider-specific fields
        agentName: metadata.agentName,
        isAgentAider: metadata.isAgentAider
      },
      {
        command: "testeranto.openProcessTerminal",
        title: "Open Process Terminal",
        arguments: [node.id, label, containerId, serviceName]
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
    if (node.type === "aider_process") {
      if (metadata.agentName) {
        tooltip += `Agent: ${metadata.agentName}
`;
      }
      if (metadata.isAgentAider) {
        tooltip += `Agent Aider: Yes
`;
      }
    }
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
        (edge) => edge.target === node.id && (edge.attributes.type === "hasProcess" || edge.attributes.type === "hasBddProcess" || edge.attributes.type === "hasCheckProcess" || edge.attributes.type === "hasBuilderProcess" || edge.attributes.type === "hasAiderProcess")
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
          } else if (sourceNode.type === "agent") {
            tooltip += `
Connected to agent: ${sourceNode.label || sourceNode.id}`;
          }
        }
      }
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[DockerProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/process" || message.url === "/~/graph") {
        console.log("[DockerProcessTreeDataProvider] Relevant update, refreshing");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[DockerProcessTreeDataProvider] Graph updated, refreshing");
      this.refresh();
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/process");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/AiderProcessTreeDataProvider.ts
import * as vscode9 from "vscode";

// src/vscode/providers/utils/AiderGraphLoader.ts
var AiderGraphLoader = class {
  static async loadGraphData() {
    try {
      console.log("[AiderGraphLoader] Loading graph data from aider slice and agents");
      const aiderResponse = await fetch(ApiUtils2.getAiderSliceUrl());
      if (!aiderResponse.ok) {
        throw new Error(`HTTP error! status: ${aiderResponse.status}`);
      }
      const aiderData = await aiderResponse.json();
      const agentsData = await this.loadAgentData();
      const graphData2 = {
        nodes: [...aiderData.nodes || [], ...agentsData.nodes || []],
        edges: [...aiderData.edges || [], ...agentsData.edges || []]
      };
      console.log(
        "[AiderGraphLoader] Loaded graph data:",
        graphData2?.nodes?.length,
        "nodes,",
        graphData2?.edges?.length,
        "edges,",
        agentsData.agents?.length,
        "agents"
      );
      return { graphData: graphData2, agents: agentsData.agents };
    } catch (error) {
      console.error("[AiderGraphLoader] Failed to load graph data:", error);
      return { graphData: null, agents: [] };
    }
  }
  static async loadAgentData() {
    try {
      const agentsResponse = await fetch(ApiUtils2.getUserAgentsUrl());
      if (!agentsResponse.ok) {
        throw new Error(`HTTP error! status: ${agentsResponse.status}`);
      }
      const agentsData = await agentsResponse.json();
      const agents = agentsData.userAgents || [];
      if (agents.length === 0) {
        return { nodes: [], edges: [], agents: [] };
      }
      const allNodes = [];
      const allEdges = [];
      for (const agent of agents) {
        const agentName = agent.name;
        try {
          const agentResponse = await fetch(ApiUtils2.getAgentSliceUrl(agentName));
          if (agentResponse.ok) {
            const agentSliceData = await agentResponse.json();
            if (agentSliceData.nodes && Array.isArray(agentSliceData.nodes)) {
              allNodes.push(...agentSliceData.nodes);
            }
            if (agentSliceData.edges && Array.isArray(agentSliceData.edges)) {
              allEdges.push(...agentSliceData.edges);
            }
          }
        } catch (error) {
          console.error(`[AiderGraphLoader] Failed to load data for agent ${agentName}:`, error);
        }
      }
      return { nodes: allNodes, edges: allEdges, agents };
    } catch (error) {
      console.error("[AiderGraphLoader] Failed to load agent data:", error);
      return { nodes: [], edges: [], agents: [] };
    }
  }
};

// src/vscode/providers/utils/AiderTreeItemCreator.ts
import * as vscode7 from "vscode";
var AiderTreeItemCreator = class {
  static createAiderProcessItem(node, entrypointNode) {
    const metadata = node.metadata || {};
    const status = metadata.status || "stopped";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const containerName = metadata.aiderServiceName || metadata.containerName || "unknown";
    const runtime = metadata.runtime || "unknown";
    const testName = metadata.testName || "unknown";
    const configKey = metadata.configKey || "unknown";
    const agentName = metadata.agentName;
    const isAgentAider = metadata.isAgentAider || false;
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
    if (isAgentAider) {
      description += " \u2022 agent";
    }
    let icon;
    if (isAgentAider) {
      icon = new vscode7.ThemeIcon("person", new vscode7.ThemeColor("testing.iconPassed"));
    } else if (status === "running" && isActive) {
      icon = new vscode7.ThemeIcon("play-circle", new vscode7.ThemeColor("testing.iconPassed"));
    } else if (status === "exited") {
      if (exitCode === 0) {
        icon = new vscode7.ThemeIcon("check", new vscode7.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode7.ThemeIcon("error", new vscode7.ThemeColor("testing.iconFailed"));
      }
    } else if (status === "stopped") {
      icon = new vscode7.ThemeIcon("circle-slash", new vscode7.ThemeColor("testing.iconUnset"));
    } else {
      icon = new vscode7.ThemeIcon("circle-outline", new vscode7.ThemeColor("testing.iconUnset"));
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode7.TreeItemCollapsibleState.None,
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
        aiderId: node.id,
        agentName,
        isAgentAider
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
    if (isAgentAider && agentName) {
      tooltip += `Agent: ${agentName}
`;
    }
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
    if (!isAgentAider) {
      tooltip += `Runtime: ${runtime}
`;
      tooltip += `Test: ${testName}
`;
      tooltip += `Config: ${configKey}
`;
    }
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
};

// src/vscode/providers/utils/AiderDataGrouper.ts
import * as vscode8 from "vscode";
var AiderDataGrouper = class {
  static getAiderProcessItems(graphData2, agents) {
    const items = [];
    items.push(new TestTreeItem2(
      "Refresh",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshAiderProcesses",
        title: "Refresh",
        arguments: []
      },
      new vscode8.ThemeIcon("refresh")
    ));
    if (agents.length > 0) {
      items.push(new TestTreeItem2(
        `Agents (${agents.length})`,
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "User-defined agents with aider",
          count: agents.length
        },
        void 0,
        new vscode8.ThemeIcon("server")
      ));
      for (const agent of agents) {
        const agentName = agent.name;
        const agentNodes = graphData2?.nodes?.filter(
          (node) => node.type === "agent" && node.metadata?.agentName === agentName
        ) || [];
        const agentAiderNodes = graphData2?.nodes?.filter(
          (node) => node.type === "aider_process" && node.metadata?.agentName === agentName
        ) || [];
        const agentItem = new TestTreeItem2(
          agentName,
          0 /* Runtime */,
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            agentName,
            description: `${agentAiderNodes.length} aider process(es)`,
            count: agentAiderNodes.length
          },
          void 0,
          new vscode8.ThemeIcon("person")
        );
        agentItem.children = agentAiderNodes.map((node) => AiderTreeItemCreator.createAiderProcessItem(node, null));
        items.push(agentItem);
      }
    } else {
      items.push(new TestTreeItem2(
        "No agents configured",
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "No user-defined agents found"
        },
        void 0,
        new vscode8.ThemeIcon("info")
      ));
    }
    if (graphData2) {
      const aiderNodes = graphData2.nodes.filter(
        (node) => (node.type === "aider" || node.type === "aider_process") && !node.metadata?.agentName
      );
      if (aiderNodes.length > 0) {
        items.push(new TestTreeItem2(
          `Aider Processes (${aiderNodes.length})`,
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "Regular aider processes for tests",
            count: aiderNodes.length
          },
          void 0,
          new vscode8.ThemeIcon("symbol-namespace")
        ));
        const entrypointMap = /* @__PURE__ */ new Map();
        for (const aiderNode of aiderNodes) {
          const connectedEdges = graphData2.edges.filter(
            (edge) => edge.target === aiderNode.id && edge.attributes.type === "hasAider"
          );
          let entrypointId = "ungrouped";
          for (const edge of connectedEdges) {
            const entrypointNode = graphData2.nodes.find((n) => n.id === edge.source);
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
            entrypointNode = graphData2.nodes.find((n) => n.id === entrypointId);
            entrypointLabel = entrypointNode?.label || entrypointId;
          }
          const entrypointItem = new TestTreeItem2(
            entrypointLabel,
            0 /* Runtime */,
            vscode8.TreeItemCollapsibleState.Collapsed,
            {
              entrypointId,
              description: `${aiderNodes2.length} aider process(es)`,
              count: aiderNodes2.length
            },
            void 0,
            new vscode8.ThemeIcon("file-text")
          );
          entrypointItem.children = aiderNodes2.map((node) => AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode));
          items.push(entrypointItem);
        }
      } else if (agents.length === 0) {
        items.push(new TestTreeItem2(
          "No aider processes found",
          3 /* Info */,
          vscode8.TreeItemCollapsibleState.None,
          {
            description: "No aider processes in graph"
          },
          void 0,
          new vscode8.ThemeIcon("info")
        ));
      }
    }
    return items;
  }
  static getAiderProcessesForEntrypoint(graphData2, entrypointId) {
    const connectedEdges = graphData2.edges.filter(
      (edge) => edge.source === entrypointId && edge.attributes.type === "hasAider"
    );
    const aiderNodes = [];
    for (const edge of connectedEdges) {
      const aiderNode = graphData2.nodes.find((n) => n.id === edge.target);
      if (aiderNode && (aiderNode.type === "aider" || aiderNode.type === "aider_process")) {
        aiderNodes.push(aiderNode);
      }
    }
    const entrypointNode = graphData2.nodes.find((n) => n.id === entrypointId);
    return aiderNodes.map((node) => AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode));
  }
};

// src/vscode/providers/AiderProcessTreeDataProvider.ts
var AiderProcessTreeDataProvider = class extends BaseTreeDataProvider {
  graphData = null;
  agents = [];
  constructor() {
    super();
    console.log("[AiderProcessTreeDataProvider] Constructor called");
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      }).catch((error) => {
        console.error("[AiderProcessTreeDataProvider] Initial load failed:", error);
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadGraphData() {
    try {
      const result = await AiderGraphLoader.loadGraphData();
      this.graphData = result.graphData;
      this.agents = result.agents;
    } catch (error) {
      console.error("[AiderProcessTreeDataProvider] Error loading graph data:", error);
      await this.fetchAgentsDirectly();
      await this.fetchAiderProcessesDirectly();
    }
  }
  async fetchAgentsDirectly() {
    this.agents = [];
  }
  async fetchAiderProcessesDirectly() {
    try {
      const response = await fetch("http://localhost:3000/~/aider", {
        method: "GET"
      });
      if (response.ok) {
        const data = await response.json();
        this.graphData = this.graphData || { nodes: [], edges: [] };
        const existingIds = new Set(this.graphData.nodes.map((n) => n.id));
        const aiderProcessNodes = data.nodes?.filter(
          (node) => node.type === "aider_process"
        ) || [];
        const agentNodes = data.nodes?.filter(
          (node) => node.type === "agent"
        ) || [];
        aiderProcessNodes.forEach((node) => {
          if (!existingIds.has(node.id)) {
            this.graphData.nodes.push({
              id: node.id,
              type: node.type,
              label: node.label,
              metadata: node.metadata
            });
          }
        });
        this.agents = agentNodes.map((node) => ({
          name: node.metadata?.agentName,
          ...node.metadata
        }));
        console.log(`[AiderProcessTreeDataProvider] Successfully fetched ${aiderProcessNodes.length} aider processes and ${agentNodes.length} agents from /~/aider`);
        return;
      } else {
        console.warn(`[AiderProcessTreeDataProvider] Failed to fetch from /~/aider:`, response.status);
      }
    } catch (error) {
      console.error(`[AiderProcessTreeDataProvider] Error fetching from /~/aider:`, error);
    }
  }
  refresh() {
    console.log("[AiderProcessTreeDataProvider] Manual refresh triggered");
    this.graphData = null;
    this.agents = [];
    this._onDidChangeTreeData.fire();
    const loadPromise = this.loadGraphData();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Loading timeout after 10 seconds")), 1e4);
    });
    Promise.race([loadPromise, timeoutPromise]).then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[AiderProcessTreeDataProvider] Error in refresh:", error);
      return Promise.allSettled([
        this.fetchAgentsDirectly(),
        this.fetchAiderProcessesDirectly()
      ]).then(() => {
        this._onDidChangeTreeData.fire();
      });
    });
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
    const items = [];
    items.push(
      new TestTreeItem2(
        "Refresh",
        TreeItemType.Action,
        vscode9.TreeItemCollapsibleState.None,
        {
          action: "refresh",
          info: "Refresh the view to try loading data again."
        },
        {
          command: "testeranto.refreshAiderProcesses",
          title: "Refresh",
          arguments: []
        },
        new vscode9.ThemeIcon("refresh")
      )
    );
    if (!this.graphData || this.graphData.nodes.length === 0) {
      items.push(
        new TestTreeItem2(
          "No aider data available",
          3 /* Info */,
          vscode9.TreeItemCollapsibleState.None,
          {
            info: 'The server may not be running or the /~/aider endpoint may be unavailable. Try running "Testeranto: Start Server" or check if the server is running on port 3000.'
          },
          void 0,
          new vscode9.ThemeIcon("info")
        )
      );
      return items;
    }
    const aiderProcessNodes = this.graphData.nodes.filter(
      (node) => node.type === "aider_process"
    );
    const agentNodes = this.graphData.nodes.filter(
      (node) => node.type === "agent"
    );
    if (aiderProcessNodes.length === 0) {
      items.push(
        new TestTreeItem2(
          "No aider processes found",
          3 /* Info */,
          vscode9.TreeItemCollapsibleState.None,
          {
            info: agentNodes.length > 0 ? "Agents are running but no aider processes are active." : "No agents or aider processes found."
          },
          void 0,
          new vscode9.ThemeIcon("info")
        )
      );
      return items;
    }
    const aiderByAgent = /* @__PURE__ */ new Map();
    for (const aiderNode of aiderProcessNodes) {
      const edge = this.graphData.edges.find(
        (e) => e.target === aiderNode.id && e.attributes.type === "hasAiderProcess"
      );
      if (edge) {
        const agentId = edge.source;
        if (!aiderByAgent.has(agentId)) {
          aiderByAgent.set(agentId, []);
        }
        aiderByAgent.get(agentId).push(aiderNode);
      } else {
        if (!aiderByAgent.has("ungrouped")) {
          aiderByAgent.set("ungrouped", []);
        }
        aiderByAgent.get("ungrouped").push(aiderNode);
      }
    }
    for (const [agentId, aiderNodes] of aiderByAgent.entries()) {
      let groupLabel = "Ungrouped Aider Processes";
      let groupIcon = new vscode9.ThemeIcon("server");
      if (agentId !== "ungrouped") {
        const agentNode = agentNodes.find((n) => n.id === agentId);
        if (agentNode) {
          groupLabel = `Agent: ${agentNode.metadata?.agentName || agentNode.label || agentId}`;
          groupIcon = new vscode9.ThemeIcon("person");
        } else {
          groupLabel = `Agent: ${agentId}`;
          groupIcon = new vscode9.ThemeIcon("person");
        }
      }
      const groupItem = new TestTreeItem2(
        groupLabel,
        3 /* Info */,
        vscode9.TreeItemCollapsibleState.Collapsed,
        {
          description: `${aiderNodes.length} aider process(es)`,
          groupId: agentId,
          isGroup: true
        },
        void 0,
        groupIcon
      );
      groupItem.children = aiderNodes.map((node) => {
        const metadata = node.metadata || {};
        const containerName = metadata.containerName || "";
        const agentName = metadata.agentName || "";
        const label = node.label || "Aider Process";
        const status = node.status || "unknown";
        let icon;
        if (status === "running") {
          icon = new vscode9.ThemeIcon("play-circle", new vscode9.ThemeColor("testing.iconPassed"));
        } else if (status === "stopped") {
          icon = new vscode9.ThemeIcon("circle-slash", new vscode9.ThemeColor("testing.iconUnset"));
        } else {
          icon = new vscode9.ThemeIcon("circle-outline", new vscode9.ThemeColor("testing.iconUnset"));
        }
        const item = new TestTreeItem2(
          label,
          3 /* Info */,
          vscode9.TreeItemCollapsibleState.None,
          {
            description: `Status: ${status}`,
            status,
            containerName,
            agentName,
            metadata,
            isAiderProcess: true,
            nodeId: node.id
          },
          {
            command: "testeranto.openAiderTerminal",
            title: "Open Aider Terminal",
            arguments: [containerName, label, agentName]
          },
          icon
        );
        let tooltip = `Type: ${node.type}
`;
        tooltip += `ID: ${node.id}
`;
        tooltip += `Container: ${containerName}
`;
        tooltip += `Status: ${status}
`;
        tooltip += `Agent: ${agentName || "None"}
`;
        if (metadata.containerId) {
          tooltip += `Container ID: ${metadata.containerId}
`;
        }
        if (metadata.timestamp) {
          tooltip += `Created: ${metadata.timestamp}
`;
        }
        item.tooltip = tooltip;
        return item;
      });
      items.push(groupItem);
    }
    return items;
  }
  getAiderProcessesForEntrypoint(entrypointId) {
    if (!this.graphData) return [];
    return AiderDataGrouper.getAiderProcessesForEntrypoint(this.graphData, entrypointId);
  }
  createAiderProcessItem(node, entrypointNode) {
    return AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode);
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/aider" || message.url === "/~/agents" || message.url === "/~/graph") {
        console.log("[AiderProcessTreeDataProvider] Relevant update, refreshing");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[AiderProcessTreeDataProvider] Graph updated, refreshing");
      this.refresh();
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/aider");
    this.subscribeToSlice("/agents");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/FileTreeDataProvider.ts
import * as vscode10 from "vscode";

// src/vscode/providers/logic/FileTreeLogic.ts
var FileTreeLogic = class {
  graphData = null;
  setGraphData(data) {
    this.graphData = data;
  }
  getGraphData() {
    return this.graphData;
  }
  hasGraphData() {
    return this.graphData !== null;
  }
  filterFolderNodes(graphData2) {
    return graphData2.nodes.filter(
      (node) => node.type === "folder" || node.type === "domain"
    );
  }
  filterFileNodes(graphData2) {
    return graphData2.nodes.filter(
      (node) => node.type === "file" || node.type === "input_file"
    );
  }
  filterFolderNodesByPath(graphData2, folderPath) {
    return graphData2.nodes.filter(
      (node) => (node.type === "folder" || node.type === "domain") && (node.metadata?.path === folderPath || node.metadata?.path?.startsWith(folderPath + "/"))
    );
  }
  filterFileNodesByPath(graphData2, folderPath) {
    return graphData2.nodes.filter(
      (node) => (node.type === "file" || node.type === "input_file") && node.metadata?.filePath?.startsWith(folderPath + "/")
    );
  }
  getFolderName(folder) {
    return folder.label || this.basename(folder.metadata?.path || "");
  }
  getFileName(file) {
    return this.basename(file.metadata?.filePath || file.label || "");
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
      const fileName = this.basename(filePath);
      const dirPath = this.dirname(filePath);
      const parts = dirPath.split("/").filter((p) => p.length > 0);
      let current = tree.children;
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
        return { id: "file-code" };
      case "log":
        return { id: "output" };
      case "documentation":
        return { id: "book" };
      case "config":
        return { id: "settings-gear" };
      default:
        return { id: "file" };
    }
  }
  basename(path3) {
    const parts = path3.split("/").filter((p) => p.length > 0);
    return parts.length > 0 ? parts[parts.length - 1] : "";
  }
  dirname(path3) {
    const parts = path3.split("/").filter((p) => p.length > 0);
    if (parts.length <= 1) return "";
    return parts.slice(0, parts.length - 1).join("/");
  }
};

// src/vscode/providers/logic/FileTreeDataFetcher.ts
var FileTreeDataFetcher = class {
  async fetchGraphData() {
    try {
      console.log("[FileTreeDataFetcher] Loading graph data from files slice");
      const url = ApiUtils2.getFilesSliceUrl();
      console.log(`[FileTreeDataFetcher] Fetching from URL: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e3);
      const response = await fetch(url, {
        signal: controller.signal
      }).catch((error) => {
        console.log(`[FileTreeDataFetcher] Fetch error: ${error.message}`);
        if (error.name === "AbortError") {
          throw new Error(`Connection timeout to server at ${url}. Make sure the Testeranto server is running.`);
        } else {
          throw new Error(`Cannot connect to server at ${url}: ${error.message}`);
        }
      }).finally(() => {
        clearTimeout(timeoutId);
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[FileTreeDataFetcher] Failed to load graph data:", error);
      throw error;
    }
  }
};

// src/vscode/providers/FileTreeDataProvider.ts
var FileTreeDataProvider = class extends BaseTreeDataProvider {
  logic;
  fetcher;
  constructor() {
    super();
    console.log("[FileTreeDataProvider] Constructor called");
    this.fetcher = new FileTreeDataFetcher();
    this.logic = new FileTreeLogic();
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadGraphData() {
    try {
      const graphData2 = await this.fetcher.fetchGraphData();
      this.logic.setGraphData(graphData2);
      console.log("[FileTreeDataProvider] Loaded graph data:", graphData2?.nodes?.length, "nodes");
    } catch (error) {
      console.error("[FileTreeDataProvider] Failed to load graph data:", error);
      this.logic.setGraphData(null);
    }
  }
  refresh() {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[FileTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.logic.hasGraphData()) {
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
    const items = [];
    items.push(new TestTreeItem2(
      "Refresh",
      3 /* Info */,
      vscode10.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshFileTree",
        title: "Refresh",
        arguments: []
      },
      new vscode10.ThemeIcon("refresh")
    ));
    if (!this.logic.hasGraphData()) {
      items.push(new TestTreeItem2(
        "Server not connected",
        3 /* Info */,
        vscode10.TreeItemCollapsibleState.None,
        {
          description: "Click to start server",
          startServer: true
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode10.ThemeIcon("warning")
      ));
      return items;
    }
    const graphData2 = this.logic.getGraphData();
    if (!graphData2) {
      return items;
    }
    const folderNodes = this.logic.filterFolderNodes(graphData2);
    const fileNodes = this.logic.filterFileNodes(graphData2);
    console.log(`[FileTreeDataProvider] Found ${folderNodes.length} folders, ${fileNodes.length} files`);
    if (folderNodes.length === 0 && fileNodes.length === 0) {
      items.push(new TestTreeItem2(
        "No files or folders found",
        3 /* Info */,
        vscode10.TreeItemCollapsibleState.None,
        {
          description: "No file data in graph"
        },
        void 0,
        new vscode10.ThemeIcon("info")
      ));
      return items;
    }
    const tree = this.logic.buildTreeStructure(folderNodes, fileNodes);
    const rootItems = this.convertTreeToItems(tree);
    items.push(...rootItems);
    return items;
  }
  convertTreeToItems(tree) {
    const items = [];
    for (const [name, node] of Object.entries(tree.children || {})) {
      const typedNode = node;
      if (typedNode.type === "folder") {
        const folderItem = new TestTreeItem2(
          name,
          2 /* File */,
          vscode10.TreeItemCollapsibleState.Collapsed,
          {
            isFolder: true,
            folderPath: typedNode.path,
            folderId: typedNode.node?.id,
            description: "Folder",
            fileCount: this.logic.countFilesInTree(typedNode)
          },
          void 0,
          new vscode10.ThemeIcon("folder")
        );
        folderItem.children = this.convertTreeToItems(typedNode);
        items.push(folderItem);
      } else if (typedNode.type === "file") {
        const fileItem = new TestTreeItem2(
          name,
          2 /* File */,
          vscode10.TreeItemCollapsibleState.None,
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
          this.logic.getFileIcon(typedNode)
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
    const graphData2 = this.logic.getGraphData();
    if (!graphData2) return [];
    const folderNodes = this.logic.filterFolderNodesByPath(graphData2, folderPath);
    const fileNodes = this.logic.filterFileNodesByPath(graphData2, folderPath);
    const items = [];
    for (const folder of folderNodes) {
      const folderName = this.logic.getFolderName(folder);
      const item = new TestTreeItem2(
        folderName,
        2 /* File */,
        vscode10.TreeItemCollapsibleState.Collapsed,
        {
          isFolder: true,
          folderPath: folder.metadata?.path,
          folderId: folder.id,
          description: "Folder"
        },
        void 0,
        new vscode10.ThemeIcon("folder")
      );
      items.push(item);
    }
    for (const file of fileNodes) {
      const fileName = this.logic.getFileName(file);
      const item = new TestTreeItem2(
        fileName,
        2 /* File */,
        vscode10.TreeItemCollapsibleState.None,
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
        this.logic.getFileIcon(file)
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
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/files" || message.url === "/~/graph") {
        console.log("[FileTreeDataProvider] Relevant update, refreshing");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[FileTreeDataProvider] Graph updated, refreshing");
      this.refresh();
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/files");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/ChatTreeDataProvider.ts
import * as vscode11 from "vscode";

// src/vscode/statusBarManager.ts
import * as vscode12 from "vscode";
var StatusBarManager = class _StatusBarManager {
  mainStatusBarItem;
  serverStatusBarItem;
  lockStatusBarItem;
  // New status bar item for lock status
  static instance = null;
  constructor() {
    this.mainStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 99);
    this.lockStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 98);
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
      this.mainStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 100);
    }
    if (!this.serverStatusBarItem) {
      this.serverStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 99);
    }
    if (!this.lockStatusBarItem) {
      this.lockStatusBarItem = vscode12.window.createStatusBarItem(vscode12.StatusBarAlignment.Right, 98);
    }
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.warningBackground");
    this.serverStatusBarItem.show();
    this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
    this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
    this.lockStatusBarItem.command = "testeranto.checkLockStatus";
    this.lockStatusBarItem.show();
  }
  updateFromGraphData(graphData2) {
    if (!this.serverStatusBarItem || !this.lockStatusBarItem) {
      this.initialize();
    }
    const serverNodes = graphData2?.nodes?.filter(
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
      this.serverStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.warningBackground");
    }
    this.updateLockStatusFromGraph(graphData2);
  }
  updateLockStatusFromGraph(graphData2) {
    if (!graphData2?.nodes) {
      this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
      this.lockStatusBarItem.tooltip = "Lock status unknown";
      this.lockStatusBarItem.backgroundColor = void 0;
      return;
    }
    const lockedFiles = graphData2.nodes.filter(
      (node) => node.type === "file" && node.locked === true
    );
    const lockedCount = lockedFiles.length;
    if (lockedCount > 0) {
      this.lockStatusBarItem.text = `$(lock) Files: ${lockedCount} locked`;
      this.lockStatusBarItem.tooltip = `${lockedCount} file(s) are locked. Click for details.`;
      this.lockStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.warningBackground");
      let tooltipDetails = `${lockedCount} file(s) are locked:

`;
      lockedFiles.forEach((file, index) => {
        const owner = file.lockOwner || "unknown";
        const type = file.lockType || "unknown";
        const time = file.lockTimestamp ? new Date(file.lockTimestamp).toLocaleTimeString() : "unknown";
        tooltipDetails += `${index + 1}. ${file.label || file.id}
`;
        tooltipDetails += `   Owner: ${owner}
`;
        tooltipDetails += `   Type: ${type}
`;
        tooltipDetails += `   Since: ${time}

`;
      });
      this.lockStatusBarItem.tooltip = tooltipDetails;
    } else {
      this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
      this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
      this.lockStatusBarItem.backgroundColor = void 0;
    }
  }
  async updateServerStatus() {
    if (!this.serverStatusBarItem || !this.lockStatusBarItem) {
      this.initialize();
    }
    try {
      const workspaceFolders = vscode12.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
      } else {
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.warningBackground");
        this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
        this.lockStatusBarItem.tooltip = "Lock status unknown (no workspace)";
        this.lockStatusBarItem.backgroundColor = void 0;
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.errorBackground");
      this.lockStatusBarItem.text = "$(error) Lock Error";
      this.lockStatusBarItem.tooltip = "Error checking lock status";
      this.lockStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.errorBackground");
    }
  }
  getMainStatusBarItem() {
    return this.mainStatusBarItem;
  }
  getServerStatusBarItem() {
    return this.serverStatusBarItem;
  }
  getLockStatusBarItem() {
    return this.lockStatusBarItem;
  }
  dispose() {
    this.mainStatusBarItem.dispose();
    this.serverStatusBarItem.dispose();
    this.lockStatusBarItem.dispose();
    _StatusBarManager.instance = null;
  }
  static updateFromGraph(graphData2) {
    const instance = _StatusBarManager.getInstance();
    instance.updateFromGraphData(graphData2);
  }
  static async updateServerStatusSafe() {
    const instance = _StatusBarManager.getInstance();
    await instance.updateServerStatus();
  }
  // New method to update lock status specifically
  updateLockStatus(hasLockedFiles, lockedCount = 0) {
    if (!this.lockStatusBarItem) {
      this.initialize();
    }
    if (hasLockedFiles && lockedCount > 0) {
      this.lockStatusBarItem.text = `$(lock) Files: ${lockedCount} locked`;
      this.lockStatusBarItem.tooltip = `${lockedCount} file(s) are locked for system restart`;
      this.lockStatusBarItem.backgroundColor = new vscode12.ThemeColor("statusBarItem.warningBackground");
    } else {
      this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
      this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
      this.lockStatusBarItem.backgroundColor = void 0;
    }
  }
};

// src/vscode/commandManager.ts
import * as vscode23 from "vscode";

// src/vscode/providers/utils/registerCommands.tsx
import "vscode";

// src/vscode/commands/testCommands.ts
import * as vscode13 from "vscode";
var registerTestCommands = (terminalManager) => {
  const disposables = [];
  disposables.push(
    vscode13.commands.registerCommand(
      "testeranto.showTests",
      () => {
        vscode13.window.showInformationMessage("Showing Testeranto Dashboard");
        vscode13.commands.executeCommand("testeranto.unifiedView.focus");
      }
    )
  );
  disposables.push(
    vscode13.commands.registerCommand(
      "testeranto.runTest",
      async (item) => {
        if (item.type === 1 /* Test */) {
          const { runtime, testName } = item.data || {};
          vscode13.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
          const terminal = terminalManager.showTerminal(runtime, testName);
          if (terminal) {
            vscode13.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
          } else {
            vscode13.window.showWarningMessage(`Terminal for ${testName} not found`);
          }
        }
      }
    )
  );
  disposables.push(
    vscode13.commands.registerCommand(
      "testeranto.launchAiderTerminal",
      async (data) => {
        let runtime;
        let testName;
        if (data && typeof data === "object") {
          runtime = data.runtimeKey || data.runtime;
          testName = data.testName;
        } else {
          vscode13.window.showErrorMessage("Cannot launch aider: Invalid test data");
          return;
        }
        if (!runtime || !testName) {
          vscode13.window.showErrorMessage("Cannot launch aider: Missing runtime or test name");
          return;
        }
        vscode13.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
        const terminal = await terminalManager.createAiderTerminal(runtime, testName);
        terminal.show();
      }
    )
  );
  disposables.push(
    vscode13.commands.registerCommand(
      "testeranto.openAiderTerminal",
      async (containerName, label, agentName) => {
        try {
          vscode13.window.showInformationMessage(`Opening aider terminal for ${label || "Aider"}...`);
          const terminal = await terminalManager.openAiderTerminal(containerName || "", label || "Aider", agentName);
          terminal.show();
        } catch (err) {
          vscode13.window.showErrorMessage(`Error opening aider terminal: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/processCommands.ts
import * as vscode14 from "vscode";
var registerProcessCommands = (dockerProcessProvider, aiderProcessProvider, fileTreeProvider) => {
  const disposables = [];
  disposables.push(
    vscode14.commands.registerCommand(
      "testeranto.refreshDockerProcesses",
      async () => {
        try {
          if (dockerProcessProvider && typeof dockerProcessProvider.refresh === "function") {
            await dockerProcessProvider.refresh();
            vscode14.window.showInformationMessage("Docker processes refreshed");
          } else {
            vscode14.window.showWarningMessage("Docker process provider not available");
          }
        } catch (err) {
          vscode14.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode14.commands.registerCommand(
      "testeranto.refreshAiderProcesses",
      async () => {
        try {
          if (aiderProcessProvider && typeof aiderProcessProvider.refresh === "function") {
            await aiderProcessProvider.refresh();
            vscode14.window.showInformationMessage("Aider processes refreshed");
          } else {
            vscode14.window.showWarningMessage("Aider process provider not available");
          }
        } catch (err) {
          vscode14.window.showErrorMessage(`Error refreshing aider processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode14.commands.registerCommand(
      "testeranto.refreshFileTree",
      async () => {
        try {
          if (fileTreeProvider && typeof fileTreeProvider.refresh === "function") {
            await fileTreeProvider.refresh();
            vscode14.window.showInformationMessage("File tree refreshed");
          } else {
            vscode14.window.showWarningMessage("File tree provider not available");
          }
        } catch (err) {
          vscode14.window.showErrorMessage(`Error refreshing file tree: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/agentCommands.ts
import * as vscode15 from "vscode";
var registerAgentCommands = (agentProvider, chatProvider) => {
  const disposables = [];
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.refreshAgents",
      async () => {
        try {
          if (agentProvider && typeof agentProvider.refresh === "function") {
            await agentProvider.refresh();
            vscode15.window.showInformationMessage("Agents refreshed");
          } else {
            vscode15.window.showWarningMessage("Agent provider not available");
          }
        } catch (err) {
          vscode15.window.showErrorMessage(`Error refreshing agents: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.launchAgent",
      async (agentName) => {
        try {
          vscode15.window.showInformationMessage(`Launching ${agentName} agent...`);
          const url = ApiUtils2.getUrl("launchAgent", { agentName });
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (response.ok) {
            const data = await response.json();
            vscode15.window.showInformationMessage(`${agentName} agent launched with suffix: ${data.suffix}`);
            if (agentProvider && typeof agentProvider.refresh === "function") {
              await agentProvider.refresh();
            }
          } else {
            vscode15.window.showErrorMessage(`Failed to launch ${agentName} agent: ${response.statusText}`);
          }
        } catch (err) {
          vscode15.window.showErrorMessage(`Error launching agent: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode15.commands.registerCommand(
      "testeranto.openAgentWebview",
      async (agentName, suffix) => {
        try {
          const baseUrl = ApiUtils2.getBaseUrl();
          const url = `${baseUrl}/${agentName}`;
          if (suffix && suffix !== "undefined") {
            const instanceUrl = `${baseUrl}/${agentName}/${suffix}`;
            vscode15.env.openExternal(vscode15.Uri.parse(instanceUrl));
          } else {
            vscode15.env.openExternal(vscode15.Uri.parse(url));
          }
          vscode15.window.showInformationMessage(`Opening ${agentName} agent in browser...`);
        } catch (err) {
          vscode15.window.showErrorMessage(`Error opening agent webview: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/serverCommands.ts
import * as vscode16 from "vscode";
var registerServerCommands = (statusBarManager, runtimeProvider) => {
  const disposables = [];
  disposables.push(
    vscode16.commands.registerCommand("testeranto.refresh", async () => {
      vscode16.window.showInformationMessage("Refreshing all Testeranto views...");
      await statusBarManager.updateServerStatus();
      if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
        runtimeProvider.refresh();
      }
    })
  );
  disposables.push(
    vscode16.commands.registerCommand("testeranto.retryConnection", (provider) => {
      vscode16.window.showInformationMessage("Retrying connection to server...");
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
        vscode16.window.showWarningMessage("Provider does not support WebSocket reconnection");
      }
    })
  );
  disposables.push(
    vscode16.commands.registerCommand("testeranto.startServer", async () => {
      vscode16.window.showInformationMessage("Starting Testeranto server...");
      const terminal = vscode16.window.createTerminal("Testeranto Server");
      terminal.show();
      const workspaceFolders = vscode16.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        terminal.sendText(`cd "${workspacePath}" && npm start`);
      } else {
        terminal.sendText("npm start");
      }
      vscode16.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
      setTimeout(async () => {
        await statusBarManager.updateServerStatus();
        if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
          runtimeProvider.refresh();
        }
      }, 5e3);
    })
  );
  disposables.push(
    vscode16.commands.registerCommand("testeranto.checkServerStatus", async () => {
      try {
        const response = await ApiUtils2.fetchWithTimeout(ApiUtils2.getConfigsUrl(), {}, 2e3);
        if (response.ok) {
          vscode16.window.showInformationMessage("\u2705 Server is running and reachable");
        } else {
          vscode16.window.showWarningMessage(`\u26A0\uFE0F Server responded with status: ${response.status}`);
        }
      } catch (error) {
        vscode16.window.showErrorMessage(`\u274C Cannot connect to server: ${error.message}`);
      }
    })
  );
  disposables.push(
    vscode16.commands.registerCommand("testeranto.checkLockStatus", async () => {
      try {
        const url = ApiUtils2.getUrl("getLockStatus");
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.hasLockedFiles) {
            vscode16.window.showInformationMessage(
              `Files are locked: ${data.lockedCount} file(s) locked for system restart`,
              { modal: false }
            );
          } else {
            vscode16.window.showInformationMessage(
              "All files are unlocked and available for testing",
              { modal: false }
            );
          }
        } else {
          vscode16.window.showErrorMessage("Failed to fetch lock status from server");
        }
      } catch (err) {
        vscode16.window.showErrorMessage(`Error checking lock status: ${err}`);
      }
    })
  );
  return disposables;
};

// src/vscode/commands/configCommands.ts
import * as vscode17 from "vscode";
var registerConfigCommands = () => {
  const disposables = [];
  disposables.push(
    vscode17.commands.registerCommand(
      "testeranto.openConfig",
      async () => {
        try {
          const uri = vscode17.Uri.file("allTests.ts");
          const doc = await vscode17.workspace.openTextDocument(uri);
          await vscode17.window.showTextDocument(doc);
        } catch (err) {
          vscode17.window.showWarningMessage("Could not open allTests.ts configuration file");
        }
      }
    )
  );
  disposables.push(
    vscode17.commands.registerCommand(
      "testeranto.openTesterantoConfig",
      async () => {
        try {
          const workspaceFolders = vscode17.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri;
            const configUri = vscode17.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
            try {
              const doc = await vscode17.workspace.openTextDocument(configUri);
              await vscode17.window.showTextDocument(doc);
            } catch (err) {
              const alternativePaths = [
                vscode17.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                vscode17.Uri.file("testeranto/testeranto.ts"),
                vscode17.Uri.file("testeranto.ts")
              ];
              let opened = false;
              for (const uri of alternativePaths) {
                try {
                  const doc = await vscode17.workspace.openTextDocument(uri);
                  await vscode17.window.showTextDocument(doc);
                  opened = true;
                  break;
                } catch (e) {
                }
              }
              if (!opened) {
                const files = await vscode17.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                if (files.length > 0) {
                  const doc = await vscode17.workspace.openTextDocument(files[0]);
                  await vscode17.window.showTextDocument(doc);
                } else {
                  vscode17.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                }
              }
            }
          } else {
            vscode17.window.showWarningMessage("No workspace folder open");
          }
        } catch (err) {
          vscode17.window.showErrorMessage(`Error opening testeranto config: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/chatCommands.ts
import "vscode";
var registerChatCommands = (chatProvider) => {
  const disposables = [];
  return disposables;
};

// src/vscode/providers/utils/showProcessLogs.ts
import * as vscode19 from "vscode";
var showProcessLogs = () => {
  return vscode19.commands.registerCommand(
    "testeranto.showProcessLogs",
    async (processId, processName) => {
      try {
        const outputChannel = vscode19.window.createOutputChannel(`Process: ${processName || processId}`);
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
        vscode19.window.showErrorMessage(`Error fetching process logs: ${err}`);
      }
    }
  );
};

// src/vscode/providers/utils/openFile.ts
import * as vscode20 from "vscode";
import * as path2 from "path";
var openFile = () => {
  return vscode20.commands.registerCommand(
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
        vscode20.window.showErrorMessage("Cannot open file: Invalid argument");
        return;
      }
      console.log("[CommandManager] Opening file:", fileName);
      const workspaceFolders = vscode20.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        let fileUri;
        if (fileName.startsWith("/")) {
          fileUri = vscode20.Uri.file(fileName);
        } else {
          fileUri = vscode20.Uri.joinPath(workspaceRoot, fileName);
        }
        console.log("[CommandManager] File URI:", fileUri.toString());
        try {
          const doc = await vscode20.workspace.openTextDocument(fileUri);
          await vscode20.window.showTextDocument(doc);
          console.log("[CommandManager] File opened successfully");
        } catch (err) {
          console.error("[CommandManager] Error opening file:", err);
          const files = await vscode20.workspace.findFiles(`**/${path2.basename(fileName)}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode20.workspace.openTextDocument(files[0]);
            await vscode20.window.showTextDocument(doc);
          } else {
            vscode20.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      } else {
        vscode20.window.showWarningMessage("No workspace folder open");
      }
    }
  );
};

// src/vscode/providers/utils/openServerWebview.ts
import * as vscode21 from "vscode";

// src/vscode/providers/utils/getFallbackHtmlContent.tsx
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

// src/vscode/providers/utils/openServerWebview.ts
var openServerWebview = () => {
  return vscode21.commands.registerCommand("testeranto.openServerWebview", async () => {
    try {
      const workspaceFolders = vscode21.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode21.window.showErrorMessage("No workspace folder open");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri;
      const reportHtmlUri = vscode21.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.html");
      try {
        await vscode21.workspace.fs.stat(reportHtmlUri);
      } catch (error) {
        vscode21.window.showWarningMessage("Report file not found. Starting server to generate it...");
        await vscode21.commands.executeCommand("testeranto.startServer");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      }
      const panel = vscode21.window.createWebviewPanel(
        "testerantoServer",
        "Testeranto Server Report",
        vscode21.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode21.Uri.joinPath(workspaceRoot, "testeranto", "reports")]
        }
      );
      let htmlContent;
      try {
        const fileContent = await vscode21.workspace.fs.readFile(reportHtmlUri);
        htmlContent = Buffer.from(fileContent).toString("utf-8");
      } catch (error) {
        htmlContent = getFallbackHtmlContent();
      }
      const reportJsUri = panel.webview.asWebviewUri(
        vscode21.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.js")
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
              vscode21.window.showErrorMessage(message.text);
              return;
            case "refresh":
              vscode21.workspace.fs.readFile(reportHtmlUri).then((fileContent) => {
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
      vscode21.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
    }
  });
};

// src/vscode/providers/utils/registerCommands.tsx
var registerCommands = (context, terminalManager, runtimeProvider, statusBarManager, dockerProcessProvider, aiderProcessProvider, fileTreeProvider, agentProvider, chatProvider) => {
  console.log("[VS Code] Registering commands");
  const disposables = [];
  disposables.push(...registerTestCommands(terminalManager));
  disposables.push(...registerProcessCommands(dockerProcessProvider, aiderProcessProvider, fileTreeProvider));
  disposables.push(...registerAgentCommands(agentProvider, chatProvider));
  disposables.push(...registerServerCommands(statusBarManager, runtimeProvider));
  disposables.push(...registerConfigCommands());
  disposables.push(...registerChatCommands(chatProvider));
  disposables.push(openFile());
  disposables.push(showProcessLogs());
  disposables.push(openServerWebview());
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
  agentProvider;
  chatProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
    this.aiderProcessProvider = null;
    this.fileTreeProvider = null;
    this.agentProvider = null;
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
  setAgentProvider(provider) {
    this.agentProvider = provider;
  }
  setChatProvider(provider) {
    this.chatProvider = provider;
  }
  registerCommands(context) {
    const disposables = registerCommands(
      context,
      this.terminalManager,
      this.runtimeProvider,
      this.statusBarManager,
      this.dockerProcessProvider,
      this.aiderProcessProvider,
      this.fileTreeProvider,
      this.agentProvider
    );
    const testCommand = vscode23.commands.registerCommand("testeranto.testLogging", () => {
      vscode23.window.showInformationMessage("Testeranto test command works!");
      console.log("[Testeranto] Test command executed successfully");
    });
    disposables.push(testCommand);
    return disposables;
  }
};

// src/vscode/extension.ts
async function activate(context) {
  console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");
  const outputChannel = vscode24.window.createOutputChannel("Testeranto");
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");
  try {
    vscode24.window.showInformationMessage("Testeranto extension is loading...");
    outputChannel.appendLine("[Testeranto] =========================================");
    outputChannel.appendLine("[Testeranto] Extension activation started");
    outputChannel.appendLine("[Testeranto] =========================================");
    outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
    const terminalManager = new TerminalManager();
    outputChannel.appendLine("[Testeranto] TerminalManager created");
    outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
    const statusBarManager = new StatusBarManager();
    statusBarManager.initialize();
    outputChannel.appendLine("[Testeranto] StatusBarManager created");
    outputChannel.appendLine("[Testeranto] Updating server status...");
    statusBarManager.updateServerStatus();
    outputChannel.appendLine("[Testeranto] Skipping automatic terminal creation");
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
    commandManager.setFileTreeProvider(fileTreeProvider);
    const commandDisposables = commandManager.registerCommands(
      context,
      terminalManager,
      runtimeProvider,
      statusBarManager,
      dockerProcessProvider,
      aiderProcessProvider,
      fileTreeProvider
    );
    outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");
    vscode24.window.showInformationMessage("Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.");
    const checkServerCommand = vscode24.commands.registerCommand("testeranto.checkServer", async () => {
      try {
        const response = await fetch("http://localhost:3000/~/configs", {
          method: "GET",
          signal: AbortSignal.timeout?.(3e3) || (() => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 3e3);
            return controller.signal;
          })()
        });
        if (response.ok) {
          vscode24.window.showInformationMessage("\u2705 Testeranto server is running");
        } else {
          vscode24.window.showWarningMessage("\u26A0\uFE0F Server responded with error: " + response.status);
        }
      } catch (error) {
        vscode24.window.showErrorMessage("\u274C Cannot connect to Testeranto server. Make sure it is running on port 3000.");
      }
    });
    context.subscriptions.push(checkServerCommand);
    const openProcessTerminalCommand = vscode24.commands.registerCommand("testeranto.openProcessTerminal", async (nodeId, label, containerId, serviceName) => {
      try {
        outputChannel.appendLine(`[Testeranto] Opening terminal for process: ${nodeId || "unknown"}`);
        if (!nodeId) {
          vscode24.window.showWarningMessage("No process node ID provided");
          return;
        }
        await terminalManager.openProcessTerminal(nodeId, label || "Process", containerId || "", serviceName || "");
      } catch (error) {
        outputChannel.appendLine(`[Testeranto] Error opening process terminal: ${error.message}`);
        vscode24.window.showErrorMessage(`Failed to open process terminal: ${error.message}`);
      }
    });
    context.subscriptions.push(openProcessTerminalCommand);
    outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
    vscode24.window.registerTreeDataProvider("testeranto.runtimeView", runtimeProvider);
    vscode24.window.registerTreeDataProvider("testeranto.dockerProcessView", dockerProcessProvider);
    vscode24.window.registerTreeDataProvider("testeranto.aiderProcessView", aiderProcessProvider);
    vscode24.window.registerTreeDataProvider("testeranto.fileTreeView", fileTreeProvider);
    outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");
    outputChannel.appendLine("[Testeranto] Creating tree views...");
    const runtimeTreeView = vscode24.window.createTreeView("testeranto.runtimeView", {
      treeDataProvider: runtimeProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");
    const dockerProcessTreeView = vscode24.window.createTreeView("testeranto.dockerProcessView", {
      treeDataProvider: dockerProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");
    const aiderProcessTreeView = vscode24.window.createTreeView("testeranto.aiderProcessView", {
      treeDataProvider: aiderProcessProvider,
      showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");
    const fileTreeView = vscode24.window.createTreeView("testeranto.fileTreeView", {
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
      // agentTreeView
    );
    outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");
    outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
    try {
      const runtimeChildren = await runtimeProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] runtimeProvider.getChildren() returned ${runtimeChildren?.length || 0} items`);
      if (runtimeChildren && runtimeChildren.length > 0) {
        runtimeChildren.forEach((item, index) => {
          outputChannel.appendLine(`[Testeranto]   Item ${index}: ${item.label} (${item.type})`);
        });
      }
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] ERROR testing runtimeProvider: ${error}`);
    }
    try {
      const dockerChildren = await dockerProcessProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] dockerProcessProvider error (non-fatal): ${error}`);
    }
    try {
      const fileChildren = await fileTreeProvider.getChildren();
      outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] fileTreeProvider error (non-fatal): ${error}`);
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
        fileTreeProvider.dispose?.();
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
    vscode24.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
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
