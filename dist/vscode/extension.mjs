// src/vscode/extension.ts
import "vscode";

// src/vscode/extension/ExtensionActivatorCore.ts
import * as vscode32 from "vscode";

// src/vscode/commands/registerOpenProcessTerminalCommand.ts
import * as vscode from "vscode";
function registerOpenProcessTerminalCommand(context, outputChannel, terminalManager) {
  const openProcessTerminalCommand = vscode.commands.registerCommand("testeranto.openProcessTerminal", async (nodeId, label, containerId, serviceName) => {
    try {
      outputChannel.appendLine(`[Testeranto] Opening terminal for process: ${nodeId || "unknown"}`);
      if (!nodeId) {
        vscode.window.showWarningMessage("No process node ID provided");
        return;
      }
      await terminalManager.openProcessTerminal(nodeId, label || "Process", containerId || "", serviceName || "");
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Error opening process terminal: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to open process terminal: ${error.message}`);
    }
  });
  context.subscriptions.push(openProcessTerminalCommand);
}

// src/vscode/commands/registerOpenAiderTerminalCommand.ts
import "vscode";

// src/vscode/TerminalManager.ts
import * as vscode5 from "vscode";

// src/vscode/utilities/openContainerTerminal.ts
import * as vscode2 from "vscode";

// src/server/serverClasses/v3/utils/vscode/generateTerminalCommand.ts
function generateTerminalCommand(containerId, containerName, label, isAiderProcess) {
  return `docker attach ${containerId}`;
}

// src/vscode/utilities/openContainerTerminal.ts
async function openContainerTerminal(containerName, label, agentName, terminals, getWorkspaceRoot2, containerId) {
  const key = `container:${containerName}`;
  let terminal = terminals.get(key);
  if (terminal && terminal.exitStatus === void 0) {
    terminal.show();
    return terminal;
  }
  const terminalName = agentName ? `Aider: ${agentName}` : `Container: ${label}`;
  terminal = vscode2.window.createTerminal(terminalName);
  terminals.set(key, terminal);
  try {
    const nodeId = `aider_process:agent:${containerName}`;
    const response = await fetch("http://localhost:3000/~/open-process-terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId,
        label,
        containerId: containerId || containerName,
        serviceName: agentName || containerName
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.command) {
        vscode2.commands.executeCommand("workbench.action.terminal.sendSequence", { text: data.command });
      }
    }
  } catch (error) {
    const command = generateTerminalCommand(
      containerId || containerName,
      containerName,
      label,
      !!agentName
    );
    vscode2.commands.executeCommand("workbench.action.terminal.sendSequence", { text: command });
  }
  terminal.show();
  return terminal;
}

// src/vscode/utilities/openAiderTerminal.ts
import * as vscode3 from "vscode";
async function openAiderTerminal(containerName, label, agentName, terminals, getWorkspaceRoot2, containerId) {
  const key = `aider:${containerName}`;
  let terminal = terminals.get(key);
  if (terminal && terminal.exitStatus === void 0) {
    terminal.show();
    return terminal;
  }
  const terminalName = agentName ? `Aider: ${agentName}` : `Aider: ${label}`;
  terminal = vscode3.window.createTerminal(terminalName);
  terminals.set(key, terminal);
  try {
    const nodeId = `aider_process:agent:${containerName}`;
    const response = await fetch("http://localhost:3000/~/open-process-terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId,
        label: label || `Aider: ${containerName}`,
        containerId: containerId || containerName,
        serviceName: agentName || `aider-${containerName}`
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      terminal.sendText(`echo "Error: ${errorText}"`);
    } else {
      const data = await response.json();
      if (data.command) {
        terminal.sendText(data.command);
      } else {
        terminal.sendText(`echo "No command returned from open-process-terminal endpoint"`);
      }
    }
  } catch (error) {
    terminal.sendText(`echo "Error: ${error.message}"`);
  }
  terminal.show();
  return terminal;
}

// src/vscode/utilities/getWorkspaceRoot.ts
import * as vscode4 from "vscode";
function getWorkspaceRoot() {
  const workspaceFolders = vscode4.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
  return null;
}

// src/vscode/TerminalManager.ts
var TerminalManager = class {
  terminals = /* @__PURE__ */ new Map();
  getTerminalKey(runtime, testName) {
    return `${runtime}:${testName}`;
  }
  createTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = vscode5.window.createTerminal(`Testeranto: ${testName} (${runtime})`);
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
  // DEPRECATED
  // We do not use the API in this way
  // All data should be loaded from a json file
  // you will receive WS updates when this file changes
  // async fetchAiderProcesses(): Promise<any[]> {
  //   return fetchAiderProcesses();
  // }
  // Create terminals for all aider processes (but don't automatically start them)
  // async createAiderTerminals(): Promise<void> {
  //   return createAiderTerminalsUtil();
  // }
  async createAiderTerminal(runtime, testName) {
    return (void 0)(
      runtime,
      testName,
      this.terminals,
      this.getTerminalKey.bind(this),
      this.getWorkspaceRoot.bind(this)
    );
  }
  // Open a terminal to a specific container
  async openContainerTerminal(containerName, label, agentName, containerId) {
    return openContainerTerminal(
      containerName,
      label,
      agentName,
      this.terminals,
      this.getWorkspaceRoot.bind(this),
      containerId
    );
  }
  // Restart a specific aider process
  // async restartAiderProcess(runtime: string, testName: string): Promise<void> {
  //   return restartAiderProcessUtil(runtime, testName, this.terminals, this.getTerminalKey.bind(this));
  // }
  // Open a terminal to a Docker process using the server API
  async openProcessTerminal(nodeId, label, containerId, serviceName) {
    return this.openContainerTerminal(containerId, label, void 0, containerId);
  }
  // Open a terminal to an aider container
  async openAiderTerminal(containerName, label, agentName, containerId) {
    return openAiderTerminal(
      containerName,
      label,
      agentName,
      this.terminals,
      this.getWorkspaceRoot.bind(this),
      containerId
    );
  }
  getWorkspaceRoot() {
    return getWorkspaceRoot();
  }
  // createAllTerminals(): void {
  //   // Create terminals for all aider processes
  //   this.createAiderTerminals().catch(error => {
  //     console.error('Error in createAllTerminals:', error);
  //   });
  // }
};

// src/vscode/commands/registerOpenAiderTerminalCommand.ts
function registerOpenAiderTerminalCommand(context, outputChannel, terminalManager) {
  outputChannel.appendLine("[Testeranto] Skipping duplicate registration of testeranto.openAiderTerminal (already registered by CommandManager)");
}

// src/vscode/commands/registerOpenViewCommand.ts
import * as vscode7 from "vscode";

// src/api.ts
var wsApi = {
  // WebSocket broadcasts from server to clients
  resourceChanged: {
    type: "resourceChanged",
    description: "Notify that a resource has changed",
    data: {}
  },
  connected: {
    type: "connected",
    description: "Connection established",
    data: {}
  },
  graphUpdated: {
    type: "graphUpdated",
    description: "Notify that the graph has been updated",
    data: {}
  },
  // Lock-related WebSocket broadcasts
  filesLocked: {
    type: "filesLocked",
    description: "Notify that files have been locked",
    data: {}
  },
  filesUnlocked: {
    type: "filesUnlocked",
    description: "Notify that files have been unlocked",
    data: {}
  },
  lockStatusChanged: {
    type: "lockStatusChanged",
    description: "Notify that lock status has changed",
    data: {}
  },
  // Client to server messages
  subscribeToSlice: {
    type: "subscribeToSlice",
    description: "Subscribe to updates for a specific slice",
    data: {}
  },
  unsubscribeFromSlice: {
    type: "unsubscribeFromSlice",
    description: "Unsubscribe from updates for a specific slice",
    data: {}
  },
  // Server to client messages
  subscribedToSlice: {
    type: "subscribedToSlice",
    description: "Confirmation of subscription to a slice",
    data: {}
  },
  unsubscribedFromSlice: {
    type: "unsubscribedFromSlice",
    description: "Confirmation of unsubscription from a slice",
    data: {}
  },
  // WebSocket slice names (for subscription)
  slices: {
    files: "/files",
    process: "/process",
    aider: "/aider",
    runtime: "/runtime",
    agents: "/agents",
    graph: "/graph",
    views: "/views",
    chat: "/chat"
  },
  error: {
    type: "error",
    description: "Error message",
    data: {}
  },
  // HTTP endpoint definitions with check functions
  // someday, you can list files, edit, create and destroy files
  // but for now, focus on just listing them
  files: {
    type: "files",
    description: "Get files and folders slice",
    data: {},
    check: (routeName, request) => {
      return routeName === "files" && request.method === "GET";
    }
  },
  // you can GET and CREATE files
  processes: {
    type: "processes",
    description: "Get processes slice",
    data: {},
    check: (routeName, request) => {
      return routeName === "process" && request.method === "GET";
    }
  },
  aider: {
    type: "aider",
    description: "Get aider slice",
    data: {},
    check: (routeName, request) => {
      return routeName === "aider" && request.method === "GET";
    }
  },
  runtime: {
    type: "runtime",
    description: "Get runtime slice",
    data: {},
    check: (routeName, request) => {
      return routeName === "runtime" && request.method === "GET";
    }
  }
};
var API = {
  // spawnAgent: {
  //   method: 'POST',
  //   path: '/~/agents/spawn',
  //   description: 'Spawn a new agent container',
  //   params: {
  //     profile: '',
  //     loadFiles: [],
  //     message: '',
  //     model: '',
  //     requestUid: ''
  //   },
  //   query: {},
  //   response: {} as any,
  //   check: (routeName: string, request: { method: string }) => {
  //     return routeName === 'agents/spawn' && request.method === 'POST'
  //   }
  // },
  getConfigs: {
    method: "GET",
    path: "/~/configs",
    description: "Get all configuration data",
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
  // getHtmlReport: {
  //   method: 'GET',
  //   path: '/~/html-report',
  //   description: 'Get the HTML report',
  //   params: {},
  //   query: {},
  //   response: {} as any
  // },
  getAppState: {
    method: "GET",
    path: "/~/app-state",
    description: "Get the application state",
    params: {},
    query: {},
    response: {}
  },
  // getUnifiedTestTree: {
  //   method: 'GET',
  //   path: '/~/unified-test-tree',
  //   description: 'Get the unified test tree',
  //   params: {},
  //   query: {},
  //   response: {} as any
  // },
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
  getAgents: {
    method: "GET",
    path: "/~/agents/:agentName",
    description: "Get a specific agent by name",
    params: {
      agentName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("agents/") && request.method === "GET";
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
  getAllAgents: {
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
  getAllViews: {
    method: "GET",
    path: "/~/views",
    description: "Get all views",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "views" && request.method === "GET";
    }
  },
  getViews: {
    method: "GET",
    path: "/~/views",
    description: "Get all views (alias for getAllViews)",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "views" && request.method === "GET";
    }
  },
  getView: {
    method: "GET",
    path: "/~/views/:viewName",
    description: "Get view data",
    params: {
      viewName: ""
    },
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName.startsWith("views/") && request.method === "GET";
    }
  },
  // getViewWithGraph: {
  //   method: 'GET',
  //   path: '/~/views-with-graph/:viewName',
  //   description: 'Get view data with graph data',
  //   params: {
  //     viewName: ''
  //   },
  //   query: {},
  //   response: {} as any,
  //   check: (routeName: string, request: { method: string }) => {
  //     return routeName.startsWith('views-with-graph/') && request.method === 'GET'
  //   }
  // },
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
  // deprecated
  // openProcessTerminal: {
  //   method: 'POST',
  //   path: '/~/open-process-terminal',
  //   description: 'Open a terminal to a process container',
  //   params: {},
  //   query: {},
  //   response: {} as any,
  //   check: (routeName: string, request: { method: string }) => {
  //     return routeName === 'open-process-terminal' && request.method === 'POST'
  //   }
  // },
  // Chat operations
  postChatMessage: {
    method: "POST",
    path: "/~/chat",
    description: "Add a chat message to the graph",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "chat" && request.method === "POST";
    }
  },
  getChatHistory: {
    method: "GET",
    path: "/~/chat",
    description: "Get chat history",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "chat" && request.method === "GET";
    }
  },
  startProcess: {
    method: "POST",
    path: "/~/start-process",
    description: "Start a Docker process for testing",
    params: {},
    query: {},
    response: {},
    check: (routeName, request) => {
      return routeName === "start-process" && request.method === "POST";
    }
  }
};
var BASE_URL = "http://localhost:3000";
function getApiUrl(endpoint, params) {
  const apiDef = API[endpoint];
  let path = apiDef.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  return `${BASE_URL}${path}`;
}
function getApiPath(endpoint, params) {
  const apiDef = API[endpoint];
  let path = apiDef.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  return path;
}

// src/vscode/commands/registerOpenViewCommand.ts
function registerOpenViewCommand(context, outputChannel) {
  const openViewCommand = vscode7.commands.registerCommand("testeranto.openView", async (viewKey, viewUrl) => {
    try {
      outputChannel.appendLine(`[Testeranto] Opening view: ${viewKey || "unknown"}`);
      if (!viewKey) {
        vscode7.window.showWarningMessage("No view key provided");
        return;
      }
      const actualViewUrl = `${BASE_URL}/testeranto/views/${viewKey}.html`;
      const panel = vscode7.window.createWebviewPanel(
        `testeranto.view.${viewKey}`,
        `View: ${viewKey}`,
        vscode7.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body, html {
                            margin: 0;
                            padding: 0;
                            height: 100%;
                            overflow: hidden;
                        }
                        iframe {
                            width: 100%;
                            height: 100vh;
                            border: none;
                        }
                    </style>
                </head>
                <body>
                    <iframe src="${actualViewUrl}"></iframe>
                </body>
                </html>
            `;
      outputChannel.appendLine(`[Testeranto] Opened view: ${viewKey} at ${actualViewUrl}`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Error opening view: ${error.message}`);
      vscode7.window.showErrorMessage(`Failed to open view: ${error.message}`);
    }
  });
  context.subscriptions.push(openViewCommand);
}

// src/vscode/registerCheckServerCommand.ts
import * as vscode8 from "vscode";
function registerCheckServerCommand(context) {
  const checkServerCommand = vscode8.commands.registerCommand("testeranto.checkServer", async () => {
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
        vscode8.window.showInformationMessage("\u2705 Testeranto server is running");
      } else {
        vscode8.window.showWarningMessage("\u26A0\uFE0F Server responded with error: " + response.status);
      }
    } catch (error) {
      vscode8.window.showErrorMessage("\u274C Cannot connect to Testeranto server. Make sure it is running on port 3000.");
    }
  });
  context.subscriptions.push(checkServerCommand);
}

// src/vscode/extension/createManagers.ts
import "vscode";

// src/vscode/statusBarManager.ts
import * as vscode9 from "vscode";
var StatusBarManager = class _StatusBarManager {
  mainStatusBarItem;
  serverStatusBarItem;
  lockStatusBarItem;
  // New status bar item for lock status
  static instance = null;
  constructor() {
    this.mainStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 99);
    this.lockStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 98);
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
      this.mainStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 100);
    }
    if (!this.serverStatusBarItem) {
      this.serverStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 99);
    }
    if (!this.lockStatusBarItem) {
      this.lockStatusBarItem = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 98);
    }
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
    this.serverStatusBarItem.show();
    this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
    this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
    this.lockStatusBarItem.command = "testeranto.checkLockStatus";
    this.lockStatusBarItem.show();
  }
  updateFromGraphData(graphData) {
    if (!this.serverStatusBarItem || !this.lockStatusBarItem) {
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
      this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
    }
    this.updateLockStatusFromGraph(graphData);
  }
  updateLockStatusFromGraph(graphData) {
    if (!graphData?.nodes) {
      this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
      this.lockStatusBarItem.tooltip = "Lock status unknown";
      this.lockStatusBarItem.backgroundColor = void 0;
      return;
    }
    const lockedFiles = graphData.nodes.filter(
      (node) => node.type === "file" && node.locked === true
    );
    const lockedCount = lockedFiles.length;
    if (lockedCount > 0) {
      this.lockStatusBarItem.text = `$(lock) Files: ${lockedCount} locked`;
      this.lockStatusBarItem.tooltip = `${lockedCount} file(s) are locked. Click for details.`;
      this.lockStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
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
      const workspaceFolders = vscode9.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
      } else {
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
        this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
        this.lockStatusBarItem.tooltip = "Lock status unknown (no workspace)";
        this.lockStatusBarItem.backgroundColor = void 0;
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.errorBackground");
      this.lockStatusBarItem.text = "$(error) Lock Error";
      this.lockStatusBarItem.tooltip = "Error checking lock status";
      this.lockStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.errorBackground");
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
  static updateFromGraph(graphData) {
    const instance = _StatusBarManager.getInstance();
    instance.updateFromGraphData(graphData);
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
      this.lockStatusBarItem.backgroundColor = new vscode9.ThemeColor("statusBarItem.warningBackground");
    } else {
      this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
      this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
      this.lockStatusBarItem.backgroundColor = void 0;
    }
  }
};

// src/vscode/extension/createManagers.ts
function createManagers(outputChannel) {
  outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
  const terminalManager = new TerminalManager();
  outputChannel.appendLine("[Testeranto] TerminalManager created");
  outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
  const statusBarManager = new StatusBarManager();
  statusBarManager.initialize();
  outputChannel.appendLine("[Testeranto] StatusBarManager created");
  outputChannel.appendLine("[Testeranto] Skipping automatic terminal creation");
  return { terminalManager, statusBarManager };
}

// src/vscode/extension/createOutputChannel.ts
import * as vscode11 from "vscode";
function createOutputChannel() {
  return vscode11.window.createOutputChannel("Testeranto");
}

// src/vscode/extension/createProviders.ts
import "vscode";

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode15 from "vscode";

// src/vscode/TestTreeItem.ts
import * as vscode12 from "vscode";

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
var TestTreeItem = class extends vscode12.TreeItem {
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
        return new vscode12.ThemeIcon("symbol-namespace");
      case 1 /* Test */:
        return new vscode12.ThemeIcon("beaker");
      case 2 /* File */:
        return new vscode12.ThemeIcon("file");
      case 3 /* Info */:
        return new vscode12.ThemeIcon("info");
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
import * as vscode14 from "vscode";

// src/vscode/providers/utils/apiUtils.ts
import * as vscode13 from "vscode";
var ApiUtils = class {
  static getBaseUrl() {
    try {
      const config3 = vscode13.workspace.getConfiguration("testeranto");
      const serverPort = config3.get("serverPort") || 3e3;
      const baseUrl = `http://localhost:${serverPort}`;
      console.log(`[ApiUtils] Using server URL: ${baseUrl}`);
      return baseUrl;
    } catch (error) {
      console.log("[ApiUtils] Using default server URL");
      return "http://localhost:3000";
    }
  }
  static getUrl(endpointKey, params, query) {
    const endpoint = API[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in vscodeHttpAPI`);
    }
    let path = endpoint.path;
    if (params && endpoint.params) {
      for (const [key, value] of Object.entries(params)) {
        if (endpoint.params[key]) {
          path = path.replace(`:${key}`, value);
        }
      }
    }
    const url = `${this.getBaseUrl()}${path}`;
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
  _onDidChangeTreeData = new vscode14.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  ws = null;
  isConnected = false;
  subscribedSlices = /* @__PURE__ */ new Set();
  // Map of pending requestUids to their resolve/reject functions
  pendingNotifications = /* @__PURE__ */ new Map();
  constructor() {
    this.setupWebSocket();
  }
  getTreeItem(element) {
    if (element === null || element === void 0) {
      console.error("[BaseTreeDataProvider] getTreeItem called with null/undefined element");
      const item = new vscode14.TreeItem("Invalid item", vscode14.TreeItemCollapsibleState.None);
      item.tooltip = "This item could not be loaded";
      return item;
    }
    return element;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  /**
   * Wait for a WebSocket notification with a matching requestUid.
   * Returns a Promise that resolves with the notification message when received,
   * or rejects after the timeout (default 30 seconds).
   */
  waitForNotification(requestUid, timeoutMs = 3e4) {
    return new Promise((resolve, reject) => {
      if (this.pendingNotifications.has(requestUid)) {
        reject(new Error(`Duplicate requestUid: ${requestUid}`));
        return;
      }
      const timeout = setTimeout(() => {
        this.pendingNotifications.delete(requestUid);
        reject(new Error(`Timeout waiting for notification with requestUid: ${requestUid}`));
      }, timeoutMs);
      this.pendingNotifications.set(requestUid, { resolve, reject, timeout });
    });
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
        this.subscribeToGraphUpdates();
        this._onDidChangeTreeData.fire();
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[BaseTreeDataProvider] WebSocket message received:", message.type, message);
          if (message.requestUid && this.pendingNotifications.has(message.requestUid)) {
            const pending = this.pendingNotifications.get(message.requestUid);
            clearTimeout(pending.timeout);
            this.pendingNotifications.delete(message.requestUid);
            pending.resolve(message);
          }
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
        for (const [uid, pending] of this.pendingNotifications) {
          clearTimeout(pending.timeout);
          pending.reject(new Error("WebSocket connection closed"));
        }
        this.pendingNotifications.clear();
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
    const agentsSubscribeMessage = {
      type: "subscribeToSlice",
      slicePath: "/agents"
    };
    this.ws.send(JSON.stringify(agentsSubscribeMessage));
    this.subscribedSlices.add("/agents");
    console.log("[BaseTreeDataProvider] Subscribed to agents slice");
    const aiderSubscribeMessage = {
      type: "subscribeToSlice",
      slicePath: "/aider"
    };
    this.ws.send(JSON.stringify(aiderSubscribeMessage));
    this.subscribedSlices.add("/aider");
    console.log("[BaseTreeDataProvider] Subscribed to aider slice");
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
    for (const [uid, pending] of this.pendingNotifications) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Provider disposed"));
    }
    this.pendingNotifications.clear();
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
      console.log("[TestTreeDataProvider] Loading graph data from runtime slice API endpoint");
      const response = await fetch(ApiUtils.getRuntimeSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      const runtimeCount = Object.keys(this.graphData?.runtimes || {}).length;
      console.log("[TestTreeDataProvider] Loaded graph data from API:", runtimeCount, "runtimes");
    } catch (error) {
      console.error("[TestTreeDataProvider] Failed to load graph data from API:", error);
      this.graphData = null;
      throw error;
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
      await this.loadGraphData();
    }
    if (!element) {
      return this.getRuntimeItems();
    }
    const elementData = element.data || {};
    switch (element.type) {
      case 0 /* Runtime */:
        return this.getTestItems(elementData.runtimeKey);
      case 1 /* Test */:
        return [];
      default:
        return [];
    }
  }
  getRuntimeItems() {
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode15.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refresh",
        title: "Refresh",
        arguments: []
      },
      new vscode15.ThemeIcon("refresh")
    ));
    if (!this.graphData) {
      items.push(new TestTreeItem(
        "Cannot connect to server",
        3 /* Info */,
        vscode15.TreeItemCollapsibleState.None,
        {
          description: "Testeranto server is not running on port 3000.",
          startServer: true
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode15.ThemeIcon("warning")
      ));
      return items;
    }
    const runtimeKeys = Object.keys(this.graphData.runtimes || {});
    for (const runtimeKey of runtimeKeys) {
      const runtimeData = this.graphData.runtimes[runtimeKey];
      const testCount = runtimeData.tests?.length || 0;
      items.push(new TestTreeItem(
        runtimeKey,
        0 /* Runtime */,
        vscode15.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${testCount} test(s)`,
          count: testCount
        },
        void 0,
        new vscode15.ThemeIcon("symbol-namespace")
      ));
    }
    return items;
  }
  getTestItems(runtimeKey) {
    if (!this.graphData) return [];
    const runtimeData = this.graphData.runtimes?.[runtimeKey];
    if (!runtimeData) return [];
    const testPaths = runtimeData.tests || [];
    const inputFiles = runtimeData.inputFiles || {};
    return testPaths.map((testPath) => {
      const fileName = testPath.split("/").pop() || testPath;
      const testInputFiles = inputFiles[testPath] || [];
      return new TestTreeItem(
        fileName,
        1 /* Test */,
        vscode15.TreeItemCollapsibleState.None,
        {
          runtimeKey,
          testId: testPath,
          description: testPath,
          status: "unknown",
          inputFiles: testInputFiles
        },
        {
          command: "testeranto.runTest",
          title: "Run Test",
          arguments: [runtimeKey, testPath, testInputFiles]
        },
        new vscode15.ThemeIcon("circle-outline", new vscode15.ThemeColor("testing.iconUnset"))
      );
    });
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
import * as vscode16 from "vscode";
var DockerProcessTreeDataProvider = class extends BaseTreeDataProvider {
  processes = [];
  processMap = /* @__PURE__ */ new Map();
  constructor() {
    super();
    console.log("[DockerProcessTreeDataProvider] Constructor called");
    setTimeout(() => {
      this.loadProcesses().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadProcesses() {
    try {
      console.log("[DockerProcessTreeDataProvider] Loading process data from /~/process API endpoint");
      const response = await fetch("http://localhost:3000/~/process");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.processes)) {
        this.processes = data.processes;
        this.processMap.clear();
        for (const proc of data.processes) {
          this.processMap.set(proc.id, proc);
        }
        console.log("[DockerProcessTreeDataProvider] Loaded", data.processes.length, "processes from API");
      } else {
        console.warn("[DockerProcessTreeDataProvider] API response does not contain processes array:", data);
        this.processes = [];
      }
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Failed to load process data from API:", error);
      this.processes = [];
    }
  }
  refresh() {
    this.loadProcesses().then(() => {
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
    if (!element) {
      return this.getDockerProcessItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }
  getDockerProcessItems() {
    const items = [];
    if (this.processes.length === 0) {
      items.push(new TestTreeItem(
        "No docker processes found",
        3 /* Info */,
        vscode16.TreeItemCollapsibleState.None,
        {
          description: "No docker processes available"
        },
        void 0,
        new vscode16.ThemeIcon("info")
      ));
      return items;
    }
    console.log(`[DockerProcessTreeDataProvider] Processing ${this.processes.length} processes`);
    for (const proc of this.processes) {
      items.push(this.createProcessItem(proc));
    }
    return items;
  }
  createProcessItem(node) {
    const metadata = node.metadata || {};
    const status = metadata.status || "unknown";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const isAider = metadata.isAider || false;
    const processType = metadata.processType || "unknown";
    const serviceName = metadata.serviceName || metadata.containerName || metadata.name || "unknown";
    const label = node.label || serviceName;
    let description = "";
    if (isAider) {
      description += "\u{1F916} ";
    }
    switch (status.toLowerCase()) {
      case "running":
        description += "\u25B6\uFE0F Running";
        break;
      case "stopped":
        description += "\u23F9\uFE0F Stopped";
        break;
      case "exited":
        if (exitCode === 0) {
          description += "\u2705 Exited";
        } else {
          description += "\u274C Exited";
        }
        break;
      case "failed":
        description += "\u274C Failed";
        break;
      default:
        description += `\u2753 ${status}`;
    }
    if (exitCode !== void 0) {
      description += ` (exit: ${exitCode})`;
    }
    description += ` \u2022 ${processType}`;
    let icon;
    if (isAider) {
      if (status === "running") {
        icon = new vscode16.ThemeIcon("comment-discussion", new vscode16.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode16.ThemeIcon("comment", new vscode16.ThemeColor("testing.iconUnset"));
      }
    } else {
      if (status === "running") {
        icon = new vscode16.ThemeIcon("play-circle", new vscode16.ThemeColor("testing.iconPassed"));
      } else if (status === "exited") {
        if (exitCode === 0) {
          icon = new vscode16.ThemeIcon("check", new vscode16.ThemeColor("testing.iconPassed"));
        } else {
          icon = new vscode16.ThemeIcon("error", new vscode16.ThemeColor("testing.iconFailed"));
        }
      } else if (status === "stopped") {
        icon = new vscode16.ThemeIcon("circle-slash", new vscode16.ThemeColor("testing.iconUnset"));
      } else if (status === "failed") {
        icon = new vscode16.ThemeIcon("error", new vscode16.ThemeColor("testing.iconFailed"));
      } else {
        icon = new vscode16.ThemeIcon("circle-outline", new vscode16.ThemeColor("testing.iconUnset"));
      }
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode16.TreeItemCollapsibleState.None,
      {
        description,
        status,
        exitCode,
        containerId,
        serviceName,
        processType,
        isActive,
        nodeId: node.id,
        agentName: metadata.agentName,
        isAgentAider: metadata.isAgentAider,
        isAider
      },
      {
        command: "testeranto.openProcessTerminal",
        title: "Open Process Terminal",
        arguments: [node.id, label, containerId, serviceName]
      },
      icon
    );
    let tooltip = `Process: ${label}
`;
    tooltip += `Type: ${processType}${isAider ? " (Aider)" : ""}
`;
    tooltip += `ID: ${node.id}
`;
    tooltip += `Status: ${status}
`;
    tooltip += `Active: ${isActive ? "Yes" : "No"}
`;
    if (containerId && containerId !== "unknown") {
      tooltip += `Container: ${containerId}
`;
    }
    if (serviceName && serviceName !== "unknown") {
      tooltip += `Service: ${serviceName}
`;
    }
    if (isAider) {
      tooltip += `Aider Process: Yes
`;
      if (metadata.agentName) {
        tooltip += `Agent: ${metadata.agentName}
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
    if (metadata.updatedAt) {
      tooltip += `Last Updated: ${metadata.updatedAt}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[DockerProcessTreeDataProvider] Received message type: ${message.type}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/process" || message.url === "/~/graph") {
        console.log("[DockerProcessTreeDataProvider] Process data changed, refreshing from API");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[DockerProcessTreeDataProvider] Graph updated, refreshing from API");
      this.refresh();
    } else if (message.type === "processUpdated") {
      console.log("[DockerProcessTreeDataProvider] Process updated, refreshing from API");
      this.refresh();
    } else if (message.type === "containerStatusChanged") {
      console.log("[DockerProcessTreeDataProvider] Container status changed, refreshing from API");
      this.refresh();
    } else if (message.type === "connected") {
      console.log("[DockerProcessTreeDataProvider] WebSocket connected, refreshing data");
      setTimeout(() => this.refresh(), 1e3);
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/process");
    this.subscribeToSlice("/graph");
    this.subscribeToSlice("/container-status");
  }
};

// src/vscode/providers/FileTreeDataProvider.ts
import * as vscode17 from "vscode";
var FileTreeDataProvider = class extends BaseTreeDataProvider {
  treeData = [];
  constructor() {
    super();
    console.log("[FileTreeDataProvider] Constructor called");
    setTimeout(() => {
      this.loadFiles().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadFiles() {
    try {
      console.log("[FileTreeDataProvider] Loading file data from files API endpoint");
      const filesUrl = getApiUrl("getFiles");
      const response = await fetch(filesUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.tree)) {
        this.treeData = data.tree;
        console.log("[FileTreeDataProvider] Loaded", data.tree.length, "root nodes from API");
      } else {
        console.warn("[FileTreeDataProvider] API response does not contain tree array:", data);
        this.treeData = [];
      }
    } catch (error) {
      console.error("[FileTreeDataProvider] Failed to load file data from API:", error);
      this.treeData = [];
    }
  }
  refresh() {
    this.loadFiles().then(() => {
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
    if (!element) {
      return this.getRootItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }
  getRootItems() {
    const items = [];
    if (this.treeData.length === 0) {
      items.push(new TestTreeItem(
        "No files found",
        3 /* Info */,
        vscode17.TreeItemCollapsibleState.None,
        {
          description: "No files available"
        },
        void 0,
        new vscode17.ThemeIcon("info")
      ));
      return items;
    }
    console.log(`[FileTreeDataProvider] Processing ${this.treeData.length} root nodes`);
    for (const node of this.treeData) {
      const item = this.createTreeItem(node);
      items.push(item);
    }
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFolder === true;
      const bIsFolder = b.data?.isFolder === true;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return (a.label?.toString() || "").localeCompare(b.label?.toString() || "");
    });
    return items;
  }
  createTreeItem(node) {
    const isFolder = node.type === "folder";
    const label = node.name || node.id;
    const filePath = node.path || "";
    const metadata = node.metadata || {};
    let description = "";
    if (isFolder) {
      description += "Folder";
    } else {
      description += "File";
    }
    let icon;
    if (isFolder) {
      icon = new vscode17.ThemeIcon("folder");
    } else {
      const fileType = metadata.fileType || metadata.testPath ? "test" : "file";
      switch (fileType) {
        case "input_file":
        case "source":
          icon = new vscode17.ThemeIcon("file-code");
          break;
        case "log":
          icon = new vscode17.ThemeIcon("output");
          break;
        case "documentation":
          icon = new vscode17.ThemeIcon("book");
          break;
        case "config":
          icon = new vscode17.ThemeIcon("settings-gear");
          break;
        case "test":
          icon = new vscode17.ThemeIcon("beaker");
          break;
        default:
          icon = new vscode17.ThemeIcon("file");
      }
    }
    let children;
    if (isFolder && node.children && node.children.length > 0) {
      children = node.children.map((child) => this.createTreeItem(child));
      children.sort((a, b) => {
        const aIsFolder = a.data?.isFolder === true;
        const bIsFolder = b.data?.isFolder === true;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return (a.label?.toString() || "").localeCompare(b.label?.toString() || "");
      });
    }
    const item = new TestTreeItem(
      label,
      2 /* File */,
      isFolder && children && children.length > 0 ? vscode17.TreeItemCollapsibleState.Collapsed : vscode17.TreeItemCollapsibleState.None,
      {
        description,
        isFolder,
        filePath,
        nodeId: node.id,
        fileName: filePath,
        fileType: isFolder ? "folder" : "file"
      },
      !isFolder && filePath ? {
        command: filePath.endsWith(".md") ? "testeranto.launchMarkdownAgent" : "testeranto.openFile",
        title: filePath.endsWith(".md") ? "Launch as Agent" : "Open File",
        arguments: filePath.endsWith(".md") ? [filePath] : [{ fileName: filePath }]
      } : void 0,
      icon
    );
    item.children = children;
    let tooltip = `${isFolder ? "Folder" : "File"}: ${label}
`;
    tooltip += `Path: ${filePath}
`;
    tooltip += `ID: ${node.id}
`;
    if (metadata.filePath) {
      tooltip += `File Path: ${metadata.filePath}
`;
    }
    if (metadata.localPath) {
      tooltip += `Local Path: ${metadata.localPath}
`;
    }
    if (metadata.url) {
      tooltip += `URL: ${metadata.url}
`;
    }
    if (metadata.testPath) {
      tooltip += `Test Path: ${metadata.testPath}
`;
    }
    if (metadata.configKey) {
      tooltip += `Config Key: ${metadata.configKey}
`;
    }
    if (metadata.runtime) {
      tooltip += `Runtime: ${metadata.runtime}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/files" || message.url === "/~/graph") {
        console.log("[FileTreeDataProvider] File data changed, refreshing from API");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[FileTreeDataProvider] Graph updated, refreshing from API");
      this.refresh();
    } else if (message.type === "fileUpdated") {
      console.log("[FileTreeDataProvider] File updated, refreshing from API");
      this.refresh();
    } else if (message.type === "connected") {
      console.log("[FileTreeDataProvider] WebSocket connected, refreshing data");
      setTimeout(() => this.refresh(), 1e3);
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/files");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/ViewTreeDataProvider.ts
import * as vscode18 from "vscode";
var ViewTreeDataProvider = class extends BaseTreeDataProvider {
  views = [];
  viewMap = /* @__PURE__ */ new Map();
  constructor() {
    super();
    console.log("[ViewTreeDataProvider] Constructor called");
    setTimeout(() => {
      this.loadViews().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadViews() {
    try {
      console.log("[ViewTreeDataProvider] Loading view data from /~/views API endpoint");
      const url = `${BASE_URL}${getApiPath("getViews")}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.views)) {
        this.views = data.views;
        this.viewMap.clear();
        for (const view of data.views) {
          this.viewMap.set(view.id, view);
        }
        console.log("[ViewTreeDataProvider] Loaded", data.views.length, "views from API");
      } else {
        console.warn("[ViewTreeDataProvider] API response does not contain views array:", data);
        this.views = [];
      }
    } catch (error) {
      console.error("[ViewTreeDataProvider] Failed to load view data from API:", error);
      this.views = [];
    }
  }
  refresh() {
    this.loadViews().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[ViewTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!element) {
      return this.getViewItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }
  getViewItems() {
    const items = [];
    if (this.views.length === 0) {
      items.push(new TestTreeItem(
        "No views found",
        3 /* Info */,
        vscode18.TreeItemCollapsibleState.None,
        {
          description: "No views available"
        },
        void 0,
        new vscode18.ThemeIcon("info")
      ));
      return items;
    }
    console.log(`[ViewTreeDataProvider] Processing ${this.views.length} views`);
    for (const view of this.views) {
      items.push(this.createViewItem(view));
    }
    return items;
  }
  createViewItem(node) {
    const metadata = node.metadata || {};
    const viewType = metadata.viewType || "unknown";
    const isActive = metadata.isActive || false;
    const viewId = node.id;
    const viewLabel = node.label || viewId;
    const label = viewLabel;
    let description = "";
    if (isActive) {
      description += "Active";
    } else {
      description += "Inactive";
    }
    description += ` \u2022 ${viewType}`;
    let icon;
    if (viewType === "kanban") {
      icon = new vscode18.ThemeIcon("columns");
    } else if (viewType === "gantt") {
      icon = new vscode18.ThemeIcon("graph");
    } else if (viewType === "eisenhower") {
      icon = new vscode18.ThemeIcon("dashboard");
    } else {
      icon = new vscode18.ThemeIcon("eye");
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode18.TreeItemCollapsibleState.None,
      {
        description,
        viewType,
        isActive,
        nodeId: viewId,
        viewLabel
      },
      {
        command: "testeranto.openView",
        title: "Open View",
        arguments: [viewId, label]
      },
      icon
    );
    let tooltip = `View: ${label}
`;
    tooltip += `Type: ${viewType}
`;
    tooltip += `ID: ${viewId}
`;
    tooltip += `Active: ${isActive ? "Yes" : "No"}
`;
    if (metadata.url) {
      tooltip += `URL: ${metadata.url}
`;
    }
    if (metadata.description) {
      tooltip += `Description: ${metadata.description}
`;
    }
    if (metadata.createdAt) {
      tooltip += `Created: ${metadata.createdAt}
`;
    }
    if (metadata.updatedAt) {
      tooltip += `Last Updated: ${metadata.updatedAt}
`;
    }
    item.tooltip = tooltip;
    return item;
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[ViewTreeDataProvider] Received message type: ${message.type}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/views" || message.url === "/~/graph") {
        console.log("[ViewTreeDataProvider] View data changed, refreshing from API");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[ViewTreeDataProvider] Graph updated, refreshing from API");
      this.refresh();
    } else if (message.type === "viewUpdated") {
      console.log("[ViewTreeDataProvider] View updated, refreshing from API");
      this.refresh();
    } else if (message.type === "connected") {
      console.log("[ViewTreeDataProvider] WebSocket connected, refreshing data");
      setTimeout(() => this.refresh(), 1e3);
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice("/views");
    this.subscribeToSlice("/graph");
  }
};

// src/vscode/providers/AgentTreeDataProvider.ts
import * as vscode19 from "vscode";
var AgentTreeDataProvider = class extends BaseTreeDataProvider {
  runningAgents = [];
  constructor() {
    super();
  }
  async getChildren(element) {
    try {
      if (!element) {
        if (this.runningAgents.length === 0) {
          await this.loadRunningAgents();
        }
        return this.getAgentItems();
      }
      const elementType = element.type;
      const elementData = element.data || {};
      if (elementType === 3 /* Info */ && elementData.agentName) {
        return this.getAgentDetails(elementData.agentName);
      }
      return [];
    } catch (error) {
      console.error("[AgentTreeDataProvider] Error in getChildren:", error);
      return [
        new TestTreeItem(
          "Error loading agents",
          3 /* Info */,
          vscode19.TreeItemCollapsibleState.None,
          {
            info: error instanceof Error ? error.message : "Unknown error"
          },
          void 0,
          new vscode19.ThemeIcon("error")
        ),
        new TestTreeItem(
          "Refresh",
          TreeItemType.Action,
          vscode19.TreeItemCollapsibleState.None,
          {
            action: "refresh",
            info: "Click to retry"
          },
          {
            command: "testeranto.refreshAgents",
            title: "Refresh",
            arguments: []
          },
          new vscode19.ThemeIcon("refresh")
        )
      ];
    }
  }
  getAgentItems() {
    const items = [];
    items.push(
      new TestTreeItem(
        "Refresh",
        TreeItemType.Action,
        vscode19.TreeItemCollapsibleState.None,
        {
          action: "refresh",
          info: "Refresh the view to try loading data again."
        },
        {
          command: "testeranto.refreshAgents",
          title: "Refresh",
          arguments: []
        },
        new vscode19.ThemeIcon("refresh")
      )
    );
    if (this.runningAgents.length === 0) {
      items.push(
        new TestTreeItem(
          "No configured agents",
          3 /* Info */,
          vscode19.TreeItemCollapsibleState.None,
          {
            info: "No agents are configured. Add agent profiles to testeranto config."
          }
        )
      );
      return items;
    }
    for (const agent of this.runningAgents) {
      const agentName = agent.agentName || agent.name || agent.id;
      if (!agentName) {
        continue;
      }
      const status = agent.status || "configured";
      const loadCount = agent.config?.load?.length || 0;
      const item = new TestTreeItem(
        agentName,
        3 /* Info */,
        vscode19.TreeItemCollapsibleState.Collapsed,
        {
          description: `${loadCount} load file(s)`,
          agentName,
          status,
          action: "launchAgent"
        },
        {
          command: "testeranto.launchAgent",
          title: "Launch Agent",
          arguments: [agentName]
        },
        new vscode19.ThemeIcon("person"),
        "agentItem"
      );
      let tooltip = `Agent: ${agentName}
`;
      tooltip += `Status: ${status}
`;
      tooltip += `Load files: ${loadCount}
`;
      if (agent.config?.message) {
        const msgPreview = agent.config.message.substring(0, 100) + (agent.config.message.length > 100 ? "..." : "");
        tooltip += `Message: ${msgPreview}
`;
      }
      item.tooltip = tooltip;
      items.push(item);
    }
    return items;
  }
  async getAgentDetails(agentName) {
    const agent = this.runningAgents.find((a) => (a.agentName || a.name || a.id) === agentName);
    if (!agent) {
      return [];
    }
    const details = [];
    details.push(new TestTreeItem(
      `Name: ${agentName}`,
      3 /* Info */,
      vscode19.TreeItemCollapsibleState.None,
      { info: agentName }
    ));
    details.push(new TestTreeItem(
      `Status: ${agent.status || "configured"}`,
      3 /* Info */,
      vscode19.TreeItemCollapsibleState.None,
      { info: agent.status || "configured" }
    ));
    const loadFiles = agent.config?.load || [];
    if (loadFiles.length > 0) {
      details.push(new TestTreeItem(
        `Load files (${loadFiles.length})`,
        3 /* Info */,
        vscode19.TreeItemCollapsibleState.None,
        { info: loadFiles.join("\n") }
      ));
    }
    const message = agent.config?.message || "";
    if (message) {
      const msgPreview = message.substring(0, 200) + (message.length > 200 ? "..." : "");
      details.push(new TestTreeItem(
        "Message",
        3 /* Info */,
        vscode19.TreeItemCollapsibleState.None,
        { info: msgPreview }
      ));
    }
    details.push(new TestTreeItem(
      "Launch Agent",
      4 /* Config */,
      vscode19.TreeItemCollapsibleState.None,
      {
        agentName,
        action: "launchAgent",
        description: "Click to launch this agent as a Docker container"
      },
      {
        command: "testeranto.launchAgent",
        title: "Launch Agent",
        arguments: [agentName]
      },
      new vscode19.ThemeIcon("play"),
      "agentLaunchItem"
    ));
    return details;
  }
  async loadRunningAgents() {
    console.log("[AgentTreeDataProvider] Loading agents from /~/agents API endpoint");
    const agentsUrl = getApiUrl("getAllAgents");
    const response = await fetch(agentsUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("[AgentTreeDataProvider] Response:", data);
    const agents = data.agents || [];
    this.runningAgents = agents.map((agent) => ({
      agentName: agent.name || agent.key || "unknown",
      containerName: "",
      containerId: "",
      status: "configured",
      id: agent.name || agent.key || "unknown",
      config: agent.config || {}
    }));
    console.log(
      `[AgentTreeDataProvider] Loaded ${this.runningAgents.length} configured agents:`,
      this.runningAgents.map((a) => a.agentName).join(", ")
    );
  }
  refresh() {
    console.log("[AgentTreeDataProvider] Manual refresh triggered");
    this.runningAgents = [];
    this._onDidChangeTreeData.fire();
    this.loadRunningAgents().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[AgentTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[AgentTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      if (message.url === "/~/agents/spawn" || message.url === "/~/agents" || message.url === "/~/aider" || message.url === "/~/graph") {
        console.log("[AgentTreeDataProvider] Relevant update, refreshing");
        this.refresh();
      }
    } else if (message.type === "graphUpdated") {
      console.log("[AgentTreeDataProvider] Graph updated, refreshing");
      this.refresh();
    }
  }
  subscribeToGraphUpdates() {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice(wsApi.slices.agents);
    this.subscribeToSlice(wsApi.slices.aider);
    this.subscribeToSlice(wsApi.slices.graph);
    this.subscribeToSlice("/agents");
  }
};

// src/vscode/extension/createProviders.ts
function createProviders(outputChannel) {
  outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
  const runtimeProvider = new TestTreeDataProvider();
  outputChannel.appendLine("[Testeranto] TestTreeDataProvider created successfully - uses /~/runtime API endpoint");
  outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
  const dockerProcessProvider = new DockerProcessTreeDataProvider();
  outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created successfully - uses /~/process API endpoint");
  outputChannel.appendLine("[Testeranto] Creating FileTreeDataProvider...");
  const fileTreeProvider = new FileTreeDataProvider();
  outputChannel.appendLine("[Testeranto] FileTreeDataProvider created successfully - uses /~/files API endpoint");
  outputChannel.appendLine("[Testeranto] Creating ViewTreeDataProvider...");
  const viewTreeProvider = new ViewTreeDataProvider();
  outputChannel.appendLine("[Testeranto] ViewTreeDataProvider created successfully - uses /~/views API endpoint");
  outputChannel.appendLine("[Testeranto] Creating AgentTreeDataProvider...");
  const agentProvider = new AgentTreeDataProvider();
  outputChannel.appendLine("[Testeranto] AgentTreeDataProvider created successfully - uses /~/agents API endpoint");
  verifyProviders({
    runtimeProvider,
    dockerProcessProvider,
    // aiderProcessProvider,
    fileTreeProvider,
    viewTreeProvider,
    agentProvider
  }, outputChannel);
  return {
    runtimeProvider,
    dockerProcessProvider,
    // aiderProcessProvider,
    fileTreeProvider,
    viewTreeProvider,
    agentProvider
  };
}
function verifyProviders(providers, outputChannel) {
  outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
  const requiredMethods = ["getChildren", "getTreeItem"];
  for (const [name, provider] of Object.entries(providers)) {
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
}

// src/vscode/extension/handleActivationError.ts
import * as vscode21 from "vscode";
function handleActivationError(error, outputChannel) {
  outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
  outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
  vscode21.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
  console.error("[Testeranto] Extension activation failed:", error);
}

// src/vscode/extension/refreshProviders.ts
import "vscode";
function refreshProviders(providers, outputChannel) {
  outputChannel.appendLine("[Testeranto] Refreshing tree data providers...");
  const refreshIfPossible = (provider, name) => {
    if (typeof provider.refresh === "function") {
      outputChannel.appendLine(`[Testeranto] Refreshing ${name}...`);
      provider.refresh();
    }
  };
  refreshIfPossible(providers.runtimeProvider, "runtimeProvider");
  refreshIfPossible(providers.dockerProcessProvider, "dockerProcessProvider");
  refreshIfPossible(providers.fileTreeProvider, "fileTreeProvider");
  refreshIfPossible(providers.viewTreeProvider, "viewTreeProvider");
  refreshIfPossible(providers.agentProvider, "agentProvider");
  outputChannel.appendLine("[Testeranto] Tree data providers refreshed");
}

// src/vscode/extension/registerCommands.ts
import "vscode";

// src/vscode/commandManager.ts
import "vscode";

// src/vscode/providers/utils/registerCommands.ts
import * as vscode25 from "vscode";

// src/vscode/commands/launchMarkdownAgentCommand.ts
import * as vscode24 from "vscode";

// src/vscode/utilities/buildAgentCommand.ts
function buildAgentCommand(profile, personaBody, readFiles, addFiles, personaFilePath, workspaceRoot, model) {
  const imageName = "testeranto-aider:latest";
  const agentName = `${profile}-${Date.now()}`;
  const containerName = `agent-${agentName}`;
  const volumes = [
    `-v "${workspaceRoot}/src:/workspace/src"`,
    `-v "${workspaceRoot}/test:/workspace/test"`,
    `-v "${workspaceRoot}/SOUL.md:/workspace/SOUL.md"`,
    `-v "${workspaceRoot}:/workspace"`,
    `-v "${workspaceRoot}/.aider.conf.yml:/workspace/.aider.conf.yml"`
  ];
  const fileArgs = [];
  const readArgs = [];
  if (personaFilePath) {
    readArgs.push(`--read "${personaFilePath}"`);
  }
  for (const filePath of addFiles) {
    fileArgs.push(`--file "${filePath}"`);
  }
  for (const filePath of readFiles) {
    readArgs.push(`--read "${filePath}"`);
  }
  const aiderArgs = [
    "--no-analytics",
    "--no-show-model-warnings",
    "--no-show-release-notes",
    "--no-check-update",
    ...fileArgs,
    ...readArgs
  ];
  if (personaBody) {
    const escapedMessage = personaBody.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    aiderArgs.push(`--message "${escapedMessage}"`);
  }
  const aiderArgsString = aiderArgs.join(" ");
  const command = `docker run -it --rm --name ${containerName} ${volumes.join(" ")} --add-host host.docker.internal:host-gateway ${imageName} sh -c 'aider ${aiderArgsString}'`;
  return command;
}
function buildRuntimeTestCommand(runtimeName, testFilePath, inputFiles, workspaceRoot, message) {
  const imageName = "testeranto-aider:latest";
  const containerName = `test-${runtimeName}-${Date.now()}`;
  const volumes = [
    `-v "${workspaceRoot}/src:/workspace/src"`,
    `-v "${workspaceRoot}/test:/workspace/test"`,
    `-v "${workspaceRoot}/SOUL.md:/workspace/SOUL.md"`,
    `-v "${workspaceRoot}:/workspace"`,
    `-v "${workspaceRoot}/.aider.conf.yml:/workspace/.aider.conf.yml"`
  ];
  const readArgs = [];
  const normalizePath = (p) => p.startsWith("/") ? p.substring(1) : p;
  const normalizedTestPath = normalizePath(testFilePath);
  readArgs.push(`--read ${normalizedTestPath}`);
  const seenPaths = /* @__PURE__ */ new Set();
  seenPaths.add(normalizedTestPath);
  for (const filePath of inputFiles) {
    const normalizedPath = normalizePath(filePath);
    if (!seenPaths.has(normalizedPath)) {
      seenPaths.add(normalizedPath);
      readArgs.push(`--read ${normalizedPath}`);
    }
  }
  const aiderArgs = [
    "--no-analytics",
    "--no-show-model-warnings",
    "--no-show-release-notes",
    "--no-check-update",
    ...readArgs
  ];
  if (message && message.trim()) {
    const escapedMessage = message.replace(/"/g, '\\"');
    aiderArgs.push(`--message "${escapedMessage}"`);
  }
  const escapedArgs = aiderArgs.map((arg) => arg.replace(/[\\"$`]/g, "\\$&")).join(" ");
  const command = `docker run -it --rm --name ${containerName} ${volumes.join(" ")} --add-host host.docker.internal:host-gateway ${imageName} sh -c "aider ${escapedArgs}"`;
  return command;
}

// src/vscode/utilities/sendCommandToTerminal.ts
import * as vscode23 from "vscode";
function sendCommandToTerminal(command, terminalName) {
  const terminal = vscode23.window.createTerminal(terminalName);
  terminal.show();
  terminal.sendText("", true);
  terminal.sendText(command, true);
}

// src/vscode/commands/launchMarkdownAgentCommand.ts
function parseMarkdownFrontMatter(content) {
  if (!content.startsWith("---")) {
    return {
      personaBody: content,
      readFiles: [],
      addFiles: []
    };
  }
  const endOfFrontmatter = content.indexOf("---", 3);
  if (endOfFrontmatter === -1) {
    return {
      personaBody: content,
      readFiles: [],
      addFiles: []
    };
  }
  const frontmatterRaw = content.slice(3, endOfFrontmatter).trim();
  const body = content.slice(endOfFrontmatter + 3).trim();
  const readFiles = [];
  const addFiles = [];
  const lines = frontmatterRaw.split("\n");
  let currentKey = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("read:")) {
      currentKey = "read";
    } else if (trimmed.startsWith("add:")) {
      currentKey = "add";
    } else if (trimmed.startsWith("- ") && currentKey) {
      const value = trimmed.slice(2).trim();
      if (currentKey === "read") {
        readFiles.push(value);
      } else if (currentKey === "add") {
        addFiles.push(value);
      }
    }
  }
  return {
    personaBody: body,
    readFiles,
    addFiles
  };
}
function launchMarkdownAgentCommand(context, outputChannel) {
  return vscode24.commands.registerCommand("testeranto.launchMarkdownAgent", async (filePath) => {
    outputChannel.appendLine(`[Testeranto] Launching markdown agent from file: ${filePath}`);
    try {
      const uri = vscode24.Uri.file(filePath);
      const fileContent = (await vscode24.workspace.fs.readFile(uri)).toString();
      const { readFiles, addFiles, personaBody } = parseMarkdownFrontMatter(fileContent);
      const workspaceRoot = vscode24.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();
      const profile = filePath.split("/").pop()?.replace(".md", "") || "agent";
      const command = buildAgentCommand(
        profile,
        personaBody,
        readFiles,
        addFiles,
        filePath,
        workspaceRoot
      );
      sendCommandToTerminal(command, `Agent: ${profile}`);
      vscode24.window.showInformationMessage(`Agent command ready for ${profile}. Press Enter in the terminal to start the container.`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Failed to launch markdown agent: ${error.message}`);
      vscode24.window.showErrorMessage(`Failed to launch markdown agent: ${error.message}`);
    }
  });
}

// src/vscode/providers/utils/registerCommands.ts
function registerCommands(context, terminalManager, runtimeProvider, statusBarManager, dockerProcessProvider, fileTreeProvider, agentProvider, viewTreeProvider) {
  const disposables = [];
  const refreshCommand = vscode25.commands.registerCommand("testeranto.refresh", () => {
    if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
      runtimeProvider.refresh();
    }
  });
  const refreshDockerProcessesCommand = vscode25.commands.registerCommand("testeranto.refreshDockerProcesses", () => {
    if (dockerProcessProvider && typeof dockerProcessProvider.refresh === "function") {
      dockerProcessProvider.refresh();
    }
  });
  const refreshFileTreeCommand = vscode25.commands.registerCommand("testeranto.refreshFileTree", () => {
    if (fileTreeProvider && typeof fileTreeProvider.refresh === "function") {
      fileTreeProvider.refresh();
    }
  });
  const refreshViewTreeCommand = vscode25.commands.registerCommand("testeranto.refreshViewTree", () => {
    if (viewTreeProvider && typeof viewTreeProvider.refresh === "function") {
      viewTreeProvider.refresh();
    }
  });
  const refreshAgentsCommand = vscode25.commands.registerCommand("testeranto.refreshAgents", () => {
    if (agentProvider && typeof agentProvider.refresh === "function") {
      agentProvider.refresh();
    }
  });
  const openFileCommand = vscode25.commands.registerCommand("testeranto.openFile", async (args) => {
    try {
      const { fileName, runtime } = args;
      if (!fileName) {
        vscode25.window.showErrorMessage("No file specified");
        return;
      }
      const document = await vscode25.workspace.openTextDocument(fileName);
      await vscode25.window.showTextDocument(document);
    } catch (error) {
      vscode25.window.showErrorMessage(`Error opening file: ${error.message}`);
    }
  });
  const openAiderTerminalCommand = vscode25.commands.registerCommand(
    "testeranto.openAiderTerminal",
    async (containerName, label, agentName, containerId) => {
      console.log(`[openAiderTerminal] Opening terminal for aider: ${label} (${containerName}), agent: ${agentName}, container: ${containerId}`);
      const terminal = await terminalManager.openAiderTerminal(containerName, label, agentName, containerId);
      terminal.show();
    }
  );
  const outputChannel = vscode25.window.createOutputChannel("Testeranto");
  const launchMarkdownAgentDisposable = launchMarkdownAgentCommand(context, outputChannel);
  return [
    refreshCommand,
    refreshDockerProcessesCommand,
    // refreshAiderProcessesCommand,
    refreshFileTreeCommand,
    refreshViewTreeCommand,
    refreshAgentsCommand,
    openFileCommand,
    openAiderTerminalCommand,
    launchMarkdownAgentDisposable
    // restartAiderProcessCommand,
  ];
}

// src/vscode/commandManager.ts
var CommandManager = class {
  terminalManager;
  statusBarManager;
  runtimeProvider;
  dockerProcessProvider;
  // private aiderProcessProvider: vscode.TreeDataProvider<any> | null;
  fileTreeProvider;
  viewTreeProvider;
  agentProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
    this.fileTreeProvider = null;
    this.viewTreeProvider = null;
    this.agentProvider = null;
  }
  setRuntimeProvider(provider) {
    this.runtimeProvider = provider;
  }
  setDockerProcessProvider(provider) {
    this.dockerProcessProvider = provider;
  }
  // public setAiderProcessProvider(provider: vscode.TreeDataProvider<any>): void {
  //     this.aiderProcessProvider = provider;
  // }
  setFileTreeProvider(provider) {
    this.fileTreeProvider = provider;
  }
  setViewTreeProvider(provider) {
    this.viewTreeProvider = provider;
  }
  // Agent functionality is now merged into AiderProcessTreeDataProvider.
  // This setter is kept for compatibility but should not be called.
  setAgentProvider(provider) {
    this.agentProvider = provider;
  }
  registerCommands(context) {
    const disposables = registerCommands(
      context,
      this.terminalManager,
      this.runtimeProvider,
      this.statusBarManager,
      this.dockerProcessProvider,
      // this.aiderProcessProvider,
      this.fileTreeProvider,
      this.agentProvider,
      this.viewTreeProvider
    );
    return disposables;
  }
};

// src/vscode/extension/registerCommands.ts
function registerCommands2(context, terminalManager, statusBarManager, providers, outputChannel) {
  outputChannel.appendLine("[Testeranto] Creating CommandManager...");
  const commandManager = new CommandManager(terminalManager, statusBarManager);
  commandManager.setRuntimeProvider(providers.runtimeProvider);
  commandManager.setDockerProcessProvider(providers.dockerProcessProvider);
  commandManager.setFileTreeProvider(providers.fileTreeProvider);
  commandManager.setViewTreeProvider(providers.viewTreeProvider);
  commandManager.setAgentProvider(providers.agentProvider);
  const commandDisposables = commandManager.registerCommands(
    context,
    terminalManager,
    providers.runtimeProvider,
    statusBarManager,
    providers.dockerProcessProvider,
    // providers.aiderProcessProvider,
    providers.fileTreeProvider
  );
  outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");
  return { commandManager, commandDisposables };
}

// src/vscode/extension/registerTreeViews.ts
import * as vscode28 from "vscode";
function registerTreeViews(providers, context, outputChannel) {
  outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
  vscode28.window.registerTreeDataProvider("testeranto.runtimeView", providers.runtimeProvider);
  vscode28.window.registerTreeDataProvider("testeranto.dockerProcessView", providers.dockerProcessProvider);
  vscode28.window.registerTreeDataProvider("testeranto.fileTreeView", providers.fileTreeProvider);
  vscode28.window.registerTreeDataProvider("testeranto.viewView", providers.viewTreeProvider);
  vscode28.window.registerTreeDataProvider("testeranto.agentView", providers.agentProvider);
  outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");
  outputChannel.appendLine("[Testeranto] Creating tree views...");
  const runtimeTreeView = vscode28.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: providers.runtimeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");
  const dockerProcessTreeView = vscode28.window.createTreeView("testeranto.dockerProcessView", {
    treeDataProvider: providers.dockerProcessProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");
  const fileTreeView = vscode28.window.createTreeView("testeranto.fileTreeView", {
    treeDataProvider: providers.fileTreeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] File tree view created successfully");
  const viewTreeView = vscode28.window.createTreeView("testeranto.viewView", {
    treeDataProvider: providers.viewTreeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] View tree view created successfully");
  const agentTreeView = vscode28.window.createTreeView("testeranto.agentView", {
    treeDataProvider: providers.agentProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Agent tree view created successfully");
  outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
  context.subscriptions.push(
    runtimeTreeView,
    dockerProcessTreeView,
    // aiderProcessTreeView,
    fileTreeView,
    viewTreeView,
    agentTreeView
  );
  outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");
}

// src/vscode/extension/setupCleanup.ts
import "vscode";
function setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables) {
  context.subscriptions.push({
    dispose: () => {
      outputChannel.appendLine("[Testeranto] Extension deactivating...");
      terminalManager.disposeAll();
      providers.runtimeProvider.dispose?.();
      providers.dockerProcessProvider.dispose?.();
      providers.fileTreeProvider.dispose?.();
      providers.viewTreeProvider.dispose?.();
      providers.agentProvider.dispose?.();
      statusBarManager.dispose();
      outputChannel.dispose();
    }
  });
  context.subscriptions.push(
    outputChannel,
    ...commandDisposables,
    statusBarManager.getMainStatusBarItem(),
    statusBarManager.getServerStatusBarItem()
  );
}

// src/vscode/views/defaultViews/Chat.ts
var ChatSlicer = (graphData) => {
  const messages = graphData.nodes.filter((node) => {
    if (node.type && typeof node.type === "object") {
      return node.type.category === "chat" && node.type.type === "chat_message";
    }
    return node.type === "chat_message" || node.attributes?.type && node.attributes.type === "chat_message";
  }).map((node) => ({
    id: node.id,
    content: node.content || node.metadata?.content || node.label || node.id,
    agentName: node.sender || node.agentName || node.metadata?.sender || node.metadata?.agentName,
    timestamp: node.timestamp || node.metadata?.timestamp,
    metadata: node.metadata || node.attributes
  }));
  return {
    messages,
    viewType: "chat",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// src/vscode/views/defaultViews/DebugGraph.ts
var DebugGraphSlicer = (graphData) => {
  const nodes = graphData.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    x: Math.random() * 800,
    // Default positions for sigma.js
    y: Math.random() * 600,
    size: 5,
    color: "#4a90e2",
    attributes: node.attributes
  }));
  const edges = (graphData.edges || []).map((edge) => ({
    source: edge.source,
    target: edge.target,
    type: edge.attributes?.type,
    weight: edge.attributes?.weight,
    attributes: edge.attributes
  }));
  return {
    nodes,
    edges,
    viewType: "debug",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// src/vscode/views/defaultViews/EisenhowerMatrix.ts
var EisenhowerMatrixSlicer = (graphData) => {
  const items = graphData.nodes.filter(
    (node) => node.metadata?.frontmatter?.urgency !== void 0 || node.metadata?.frontmatter?.importance !== void 0
  ).map((node) => ({
    id: node.id,
    label: node.label || node.id,
    urgency: node.metadata?.frontmatter?.urgency,
    importance: node.metadata?.frontmatter?.importance,
    metadata: node.metadata
  }));
  return {
    items,
    viewType: "eisenhower",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// src/vscode/views/defaultViews/Gantt.ts
var GanttSlicer = (graphData) => {
  const items = graphData.nodes.filter(
    (node) => node.timestamp || node.metadata?.frontmatter?.dueDate || node.metadata?.frontmatter?.startDate
  ).map((node) => ({
    id: node.id,
    label: node.label || node.id,
    startDate: node.metadata?.frontmatter?.startDate,
    dueDate: node.metadata?.frontmatter?.dueDate,
    timestamp: node.timestamp,
    metadata: node.metadata
  }));
  return {
    items,
    viewType: "gantt",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// src/vscode/views/defaultViews/KanbanBoard.ts
var KanbanSlicer = (graphData) => {
  const items = graphData.nodes.filter((node) => {
    if (node.type && typeof node.type === "object") {
      if (node.type.category === "file" && node.type.type === "feature") {
        return true;
      }
      if (node.type.category === "file" && node.type.type !== "feature") {
        return false;
      }
    }
    if (typeof node.type === "string") {
      if (node.type === "feature") {
        return true;
      }
      if (["test", "input_file", "output_file", "process", "verb", "agent", "view"].includes(node.type)) {
        return false;
      }
    }
    if (node.id?.startsWith("feature:")) {
      return true;
    }
    if (node.metadata?.feature) {
      return true;
    }
    if (node.metadata?.frontmatter) {
      if (node.metadata.frontmatter.status || node.metadata.frontmatter.priority) {
        return true;
      }
    }
    if (node.id?.includes("test:") || node.id?.includes("entrypoint:") || node.id?.includes("process:") || node.id?.includes("verb:")) {
      return false;
    }
    return false;
  }).map((node) => {
    let status = node.status;
    let priority = node.priority;
    if (node.metadata?.frontmatter) {
      if (node.metadata.frontmatter.status) {
        status = node.metadata.frontmatter.status;
      }
      if (node.metadata.frontmatter.priority) {
        priority = node.metadata.frontmatter.priority;
      }
    }
    if (!status && node.metadata?.status) {
      status = node.metadata.status;
    }
    if (!priority && node.metadata?.priority) {
      priority = node.metadata.priority;
    }
    if (!status) {
      status = "todo";
    }
    let label = node.label || node.id;
    if (label.startsWith("Feature: ")) {
      label = label.substring("Feature: ".length);
    }
    if (node.id?.startsWith("feature:")) {
      const parts = node.id.split(":");
      if (parts.length > 3) {
        label = parts.slice(3).join(":");
      }
    }
    return {
      id: node.id,
      label,
      status,
      priority,
      metadata: node.metadata
    };
  });
  return {
    items,
    viewType: "kanban",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// src/vscode/views/defaultViews/Home.ts
var HomeSlicer = (graphData) => {
  const views = graphData.nodes.filter((node) => {
    if (node.type && typeof node.type === "object") {
      return node.type.category === "view" && node.type.type === "view";
    }
    return false;
  }).map((node) => ({
    id: node.id,
    label: node.label || node.id,
    description: node.description,
    type: "view",
    metadata: node.metadata
  }));
  return {
    views,
    viewType: "home",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};

// testeranto/testeranto.ts
var config = {
  views: {
    Home: {
      slicer: HomeSlicer,
      filePath: "src/vscode/views/defaultViews/HomeView.tsx"
    },
    Kanban: {
      slicer: KanbanSlicer,
      filePath: "src/vscode/views/defaultViews/KanbanBoardView.tsx"
    },
    EisenhowerMatrix: {
      slicer: EisenhowerMatrixSlicer,
      filePath: "src/vscode/views/defaultViews/EisenhowerMatrixView.tsx"
    },
    Gantt: {
      slicer: GanttSlicer,
      filePath: "src/vscode/views/defaultViews/GanttView.tsx"
    },
    Chat: {
      slicer: ChatSlicer,
      filePath: "src/vscode/views/defaultViews/ChatView.tsx"
    },
    DebugGraph: {
      slicer: DebugGraphSlicer,
      filePath: "src/vscode/views/defaultViews/DebugGraphView.tsx"
    },
    DebugGraphV2: {
      slicer: (x) => x,
      filePath: "src/vscode/views/defaultViews/DebugGraphViewV2.tsx"
    }
  },
  agents: {
    "prodirek": {
      persona: `testeranto/agents/prodirek.md`,
      sliceFunction: (graphManager) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;
        const features = allNodes.filter((node) => node.type === "feature").map((node) => ({
          id: node.id,
          label: node.label,
          status: node.status || node.metadata?.frontmatter?.status,
          priority: node.priority || node.metadata?.frontmatter?.priority,
          description: node.description,
          metadata: node.metadata ? {
            frontmatter: node.metadata.frontmatter
          } : void 0
        }));
        const documentation = allNodes.filter((node) => node.type === "documentation").map((node) => ({
          id: node.id,
          label: node.label,
          content: node.metadata?.content ? node.metadata.content.substring(0, 200) + (node.metadata.content.length > 200 ? "..." : "") : void 0
        }));
        const chatMessages = allNodes.filter(
          (node) => node.type && typeof node.type === "object" && node.type.category === "chat" && node.type.type === "chat_message"
        ).map((node) => ({
          id: node.id,
          sender: node.sender || node.metadata?.sender,
          content: node.content || node.metadata?.content,
          timestamp: node.timestamp || node.metadata?.timestamp,
          preview: node.content || node.metadata?.content ? (node.content || node.metadata?.content).substring(0, 100) + ((node.content || node.metadata?.content).length > 100 ? "..." : "") : void 0
        }));
        const agents = allNodes.filter(
          (node) => node.type && typeof node.type === "object" && node.type.category === "agent" && node.type.type === "agent"
        ).map((node) => ({
          id: node.id,
          name: node.agentName || node.metadata?.agentName,
          label: node.label,
          description: node.description,
          message: node.message || node.metadata?.message
        }));
        return {
          viewType: "agent",
          agentName: "prodirek",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: {
            features,
            documentation,
            chatMessages,
            agents,
            summary: {
              totalFeatures: features.length,
              totalDocumentation: documentation.length,
              totalChatMessages: chatMessages.length,
              totalAgents: agents.length
            }
          }
        };
      }
    },
    "arko": {
      persona: `testeranto/agents/arko.md`,
      sliceFunction: (graphManager) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;
        const configs = allNodes.filter((node) => node.type === "config").map((node) => ({
          id: node.id,
          label: node.label,
          key: node.metadata?.configKey,
          runtime: node.metadata?.runtime
        }));
        const entrypoints = allNodes.filter((node) => node.type === "entrypoint").map((node) => ({
          id: node.id,
          label: node.label,
          testName: node.metadata?.testName,
          configKey: node.metadata?.configKey,
          runtime: node.metadata?.runtime
        }));
        const chatMessages = allNodes.filter(
          (node) => node.type && typeof node.type === "object" && node.type.category === "chat" && node.type.type === "chat_message"
        ).map((node) => ({
          id: node.id,
          sender: node.sender || node.metadata?.sender,
          content: node.content || node.metadata?.content,
          timestamp: node.timestamp || node.metadata?.timestamp,
          preview: node.content || node.metadata?.content ? (node.content || node.metadata?.content).substring(0, 100) + ((node.content || node.metadata?.content).length > 100 ? "..." : "") : void 0
        }));
        const agents = allNodes.filter(
          (node) => node.type && typeof node.type === "object" && node.type.category === "agent" && node.type.type === "agent"
        ).map((node) => ({
          id: node.id,
          name: node.agentName || node.metadata?.agentName,
          label: node.label,
          role: "agent",
          message: node.message || node.metadata?.message
        }));
        return {
          viewType: "agent",
          agentName: "arko",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: {
            configs,
            entrypoints,
            chatMessages,
            agents,
            summary: {
              totalConfigs: configs.length,
              totalEntrypoints: entrypoints.length,
              totalChatMessages: chatMessages.length,
              totalAgents: agents.length
            }
          }
        };
      }
    }
  },
  volumes: [
    `${process.cwd()}/src:/workspace/src`,
    `${process.cwd()}/test:/workspace/test`,
    `${process.cwd()}/SOUL.md:/workspace/SOUL.md`
    // Note: node_modules is NOT mounted to avoid platform incompatibility
  ],
  featureIngestor: async function(s) {
    const response = await fetch(s);
    const data = await response.text();
    const url = new URL(s);
    const hostname = url.hostname.replace(/\./g, "_");
    const pathname = url.pathname.replace(/\//g, "_").replace(/\./g, "_") || "index";
    const filename = `${pathname}.md`;
    const filepath = `tickets/web/${hostname}/${filename}`;
    return { data, filepath };
  },
  runtimes: {
    nodetests: {
      runtime: "node",
      tests: [
        "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
        "src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts",
        "src/lib/tiposkripto/tests/circle/Circle.test.ts",
        "src/lib/tiposkripto/tests/Rectangle/Rectangle.test.ts"
        // "src/vscode/providers/AiderProcessTreeDataProvider.test/AiderProcessTreeDataProvider.test.ts",
        // "src/server/serverClasses/Server_GraphMangerCore.test/Server_GraphManagerCore.test.ts",
        // "src/vscode/providers/logic/FileTreeLogic.test.ts",
        // "src/vscode/providers/utils/testTree/treeFilter.test.ts",
        // "src/vscode/providers/utils/testTree/debugTest.js",
        // "src/server/serverClasses/Server_Http/utils/handleCollatedFilesUtils/fileOperations.ts.",
      ],
      checks: [
        // (x) => `yarn eslint ${x.join(" ")} `,
        // (x) => `yarn tsc --noEmit ${x.join(" ")}`,
        // // Run the calculator test
        // (x) => {
        //   const calculatorTest = x.find(f => f.includes("Calculator.test.node.ts"));
        //   if (calculatorTest) {
        //     return `yarn tsx ${calculatorTest}`;
        //   }
        //   return "echo 'No calculator test found'";
        // },
        // // Run Jest tests
        // (x) =>
        //   `yarn jest ${x.filter((f) => f.includes("jest.test")).join(" ")} --passWithNoTests`,
      ],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: []
    },
    webtests: {
      runtime: "web",
      tests: [
        "src/lib/tiposkripto/tests/calculator/Calculator.test.web.ts",
        "src/lib/tiposkripto/tests/calculator/Calculator.test.web.react.ts"
        // We could add a standard web test framework like Vitest here
      ],
      checks: [
        (x) => `yarn eslint ${x.join(" ")} `,
        (x) => `yarn tsc --noEmit ${x.join(" ")}`
      ],
      dockerfile: `testeranto/runtimes/web/web.Dockerfile`,
      buildOptions: `testeranto/runtimes/web/web.ts`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: []
    },
    javatests: {
      runtime: "java",
      tests: [
        "src/java/test/java/com/example/calculator/CalculatorTest.java"
        // "src/java/test/java/com/example/calculator/CalculatorJUnitTest.java", // Standard JUnit test
      ],
      checks: [
        (x) => `javac -cp ".:lib/*" ${x.join(" ")}`,
        // Run JUnit tests
        (x) => `java -cp ".:lib/*:." org.junit.platform.console.ConsoleLauncher --select-class=com.example.calculator.CalculatorJUnitTest`
      ],
      dockerfile: `testeranto/runtimes/java/java.Dockerfile`,
      buildOptions: `testeranto/runtimes/java/java.java`,
      buildKitOptions: {
        cacheMounts: ["/root/.m2", "/root/.gradle"]
      },
      outputs: ["src/lib/kafe/examples/calculator/Calculator.java"]
    },
    rubytests: {
      runtime: "ruby",
      tests: [
        "src/lib/rubeno/examples/calculator/Calculator.test.rb"
      ],
      checks: [
        // Syntax check with proper load path
        // (x) => {
        //   const firstTest = x[0];
        //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
        //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
        //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} -c Calculator.test.rb`;
        // },
        // // Run the calculator test with proper load path
        // (x) => {
        //   const firstTest = x[0];
        //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
        //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
        //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} run_test.rb`;
        // },
      ],
      dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
      buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [
        "test_output",
        "testeranto/reports/rubytests"
      ]
    },
    pythontests: {
      runtime: "python",
      tests: [
        "src/lib/pitono/examples/calculator_test.py"
      ],
      checks: [
        // Python syntax check
        (x) => `python -m py_compile ${x.join(" ")}`,
        // Run the calculator test
        (x) => `cd src/lib/pitono/examples && python calculator_test.py`,
        // Run unittest tests (if any)
        (x) => `python -m unittest ${x.filter((f) => f.includes("unittest.test")).join(" ")}`
      ],
      dockerfile: `testeranto/runtimes/python/python.Dockerfile`,
      buildOptions: `testeranto/runtimes/python/python.py`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [
        "testeranto/reports/pythontests"
      ]
    }
    // golangtests: {
    //   runtime: "golang",
    //   tests: [
    //     // Way 1: Golingvu tests on Testeranto
    //     "src/lib/golingvu/examples/calculator/golingvu_test.go",
    //     // Way 2: Standard Go tests on Testeranto
    //     // "src/lib/golingvu/examples/calculator/native_test.go",
    //     // // Additional test files
    //     // "src/lib/golingvu/golingvu_test.go",
    //     // "src/lib/golingvu/interopt_test.go",
    //     // "src/lib/golingvu/integration_test.go",
    //     // "src/lib/golingvu/package_test.go",
    //   ],
    //   checks: [
    //     // Simple syntax check
    //     () => "go fmt ./...",
    //     // Simple vet check
    //     () => "go vet ./...",
    //     // Run Golingvu tests
    //     (x) => {
    //       const calculatorTest = x.find(f => f.includes("golingvu_test.go"));
    //       if (calculatorTest) {
    //         return `go test -v ${calculatorTest}`;
    //       }
    //       return "echo 'No golang calculator test found'";
    //     },
    //     // All tests together
    //     () => "go test -v ./src/lib/golingvu/...",
    //     // Coverage report
    //     () => "go test -coverprofile=coverage.out ./src/lib/golingvu/... && go tool cover -func=coverage.out",
    //     // Lint check - use version compatible with Go 1.22
    //     () => "golangci-lint run ./src/lib/golingvu/... --timeout=5m"
    //   ],
    //   dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/golang/golang.ts`,
    //   buildKitOptions: {
    //     cacheMounts: [
    //       "/go/pkg/mod",
    //       "/root/.cache/go-build"
    //     ],
    //   },
    //   outputs: [
    //     "coverage.out",
    //     "coverage.html"
    //   ],
    // },
    // rusttests: {
    //   runtime: "rust",
    //   tests: [
    //     "src/lib/rusto/examples/calculator_test.rs",
    //     // "src/lib/rusto/examples/calculator_complete_test.rs",
    //   ],
    //   checks: [
    //     // (x) => `cargo test --manifest-path=${x[0].split("/src/")[0]}/Cargo.toml`,
    //   ],
    //   dockerfile: `testeranto/runtimes/rust/rust.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/rust/rust.ts`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },
  }
};
var testeranto_default = config;

// src/vscode/commands/launchAgentCommand.ts
import * as vscode30 from "vscode";
function launchAgentCommand(context, outputChannel) {
  return vscode30.commands.registerCommand("testeranto.launchAgent", async () => {
    outputChannel.appendLine("[Testeranto] Launching agent...");
    try {
      const profiles = Object.keys(testeranto_default.agents || {});
      if (profiles.length === 0) {
        vscode30.window.showErrorMessage("No agent profiles configured");
        return;
      }
      const selectedProfile = await vscode30.window.showQuickPick(profiles, {
        placeHolder: "Select agent profile to launch"
      });
      if (!selectedProfile) {
        return;
      }
      const agentConfig = testeranto_default.agents?.[selectedProfile];
      if (!agentConfig) {
        vscode30.window.showErrorMessage(`Agent profile '${selectedProfile}' not found in configuration`);
        return;
      }
      const workspaceRoot = vscode30.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();
      const apiUrl = getApiUrl("getAgentSlice", { agentName: selectedProfile });
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout?.(3e3) });
      if (!response.ok) {
        throw new Error(`Failed to fetch agent data from server: ${response.status}`);
      }
      const agentData = await response.json();
      const metadata = agentData.metadata || {};
      const personaBody = metadata.personaBody || "";
      const readFiles = metadata.readFiles || [];
      const addFiles = metadata.addFiles || [];
      const personaFilePath = metadata.personaFilePath || "";
      const editedMessage = await vscode30.window.showInputBox({
        prompt: "Edit the message for the agent (or press Enter to keep default)",
        value: personaBody,
        placeHolder: "Enter the message for the agent",
        ignoreFocusOut: true
      });
      if (editedMessage === void 0) {
        return;
      }
      const finalMessage = editedMessage;
      const command = buildAgentCommand(
        selectedProfile,
        finalMessage,
        readFiles,
        addFiles,
        personaFilePath,
        workspaceRoot
      );
      outputChannel.appendLine(`[Testeranto] Agent command composed locally for profile: ${selectedProfile}`);
      sendCommandToTerminal(command, `Agent: ${selectedProfile}`);
      vscode30.window.showInformationMessage(`Agent command ready for ${selectedProfile}. Press Enter in the terminal to start the container.`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Failed to launch agent: ${error.message}`);
      vscode30.window.showErrorMessage(`Failed to launch agent: ${error.message}`);
    }
  });
}

// src/vscode/commands/launchRuntimeTestCommand.ts
import * as vscode31 from "vscode";
function launchRuntimeTestCommand(context, outputChannel) {
  return vscode31.commands.registerCommand("testeranto.runTest", async (runtimeArg, testFileArg, inputFilesArg) => {
    outputChannel.appendLine("[Testeranto] Running test...");
    try {
      let selectedRuntime;
      let selectedTestFile;
      let inputFiles = [];
      if (runtimeArg && testFileArg) {
        selectedRuntime = runtimeArg;
        selectedTestFile = testFileArg;
        inputFiles = inputFilesArg || [];
      } else {
        const runtimes = Object.keys(testeranto_default.runtimes || {});
        if (runtimes.length === 0) {
          vscode31.window.showErrorMessage("No runtimes configured");
          return;
        }
        const pickedRuntime = await vscode31.window.showQuickPick(runtimes, {
          placeHolder: "Select runtime to run test"
        });
        if (!pickedRuntime) {
          return;
        }
        selectedRuntime = pickedRuntime;
        const runtimeConfig = testeranto_default.runtimes?.[selectedRuntime];
        if (!runtimeConfig) {
          vscode31.window.showErrorMessage(`Runtime '${selectedRuntime}' not found in configuration`);
          return;
        }
        const testFiles = runtimeConfig.tests || [];
        if (testFiles.length === 0) {
          vscode31.window.showErrorMessage(`No test files configured for runtime '${selectedRuntime}'`);
          return;
        }
        const pickedTestFile = await vscode31.window.showQuickPick(testFiles, {
          placeHolder: "Select test file to run"
        });
        if (!pickedTestFile) {
          return;
        }
        selectedTestFile = pickedTestFile;
        try {
          const apiUrl = getApiUrl("getRuntime");
          const response = await fetch(apiUrl, { signal: AbortSignal.timeout?.(3e3) });
          if (response.ok) {
            const runtimeData = await response.json();
            const runtimeInfo = runtimeData.runtimes?.[selectedRuntime];
            if (runtimeInfo?.inputFiles?.[selectedTestFile]) {
              inputFiles = runtimeInfo.inputFiles[selectedTestFile];
            }
          }
        } catch (fetchError) {
          outputChannel.appendLine(`[Testeranto] Failed to fetch input files from graph: ${fetchError}`);
        }
      }
      const workspaceRoot = vscode31.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();
      if (!inputFiles.includes("SOUL.md")) {
        inputFiles.push("SOUL.md");
      }
      if (!inputFiles.includes("README.md")) {
        inputFiles.push("README.md");
      }
      const defaultMessage = `Run the test file ${selectedTestFile}`;
      const editedMessage = await vscode31.window.showInputBox({
        prompt: "Edit the message for the test (or press Enter to keep default)",
        value: defaultMessage,
        placeHolder: "Enter the message for the test",
        ignoreFocusOut: true
      });
      if (editedMessage === void 0) {
        return;
      }
      const finalMessage = editedMessage;
      const command = buildRuntimeTestCommand(
        selectedRuntime,
        selectedTestFile,
        inputFiles,
        workspaceRoot,
        finalMessage
      );
      outputChannel.appendLine(`[Testeranto] Test command composed locally for runtime: ${selectedRuntime}, test: ${selectedTestFile}`);
      sendCommandToTerminal(command, `Test: ${selectedTestFile} (${selectedRuntime})`);
      vscode31.window.showInformationMessage(`Test command ready for ${selectedTestFile}. Press Enter in the terminal to start the container.`);
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Failed to run test: ${error.message}`);
      vscode31.window.showErrorMessage(`Failed to run test: ${error.message}`);
    }
  });
}

// src/vscode/extension/ExtensionActivatorCore.ts
async function activateExtension(context) {
  const outputChannel = createOutputChannel();
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating...");
  try {
    outputChannel.appendLine("[Testeranto] =========================================");
    outputChannel.appendLine("[Testeranto] Extension activation started");
    outputChannel.appendLine("[Testeranto] =========================================");
    const { terminalManager, statusBarManager } = createManagers(outputChannel);
    statusBarManager.updateServerStatus();
    const providers = createProviders(outputChannel);
    const { commandManager, commandDisposables } = registerCommands2(
      context,
      terminalManager,
      statusBarManager,
      providers,
      outputChannel
    );
    context.subscriptions.push(
      launchAgentCommand(context, outputChannel)
    );
    context.subscriptions.push(
      launchRuntimeTestCommand(context, outputChannel)
    );
    vscode32.window.showInformationMessage("Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.");
    registerCheckServerCommand(context);
    registerOpenProcessTerminalCommand(context, outputChannel, terminalManager);
    registerOpenAiderTerminalCommand(context, outputChannel, terminalManager);
    registerOpenViewCommand(context, outputChannel);
    registerTreeViews(providers, context, outputChannel);
    refreshProviders(providers, outputChannel);
    setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables);
    outputChannel.appendLine("[Testeranto] Extension activated successfully");
    console.log("[Testeranto] Extension activated successfully");
  } catch (error) {
    handleActivationError(error, outputChannel);
  }
}

// src/vscode/extension.ts
async function activate(context) {
  activateExtension(context);
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
