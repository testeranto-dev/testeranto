// src/vscode/extension.ts
import "vscode";

// src/vscode/extension/ExtensionActivator.ts
import "vscode";

// src/vscode/extension/ExtensionActivatorCore.ts
import * as vscode33 from "vscode";

// src/vscode/extension/createOutputChannel.ts
import * as vscode from "vscode";
function createOutputChannel() {
  return vscode.window.createOutputChannel("Testeranto");
}

// src/vscode/extension/createManagers.ts
import "vscode";

// src/vscode/TerminalManager.ts
import * as vscode2 from "vscode";
import * as path from "path";
import * as fs from "fs";
var TerminalManager = class {
  terminals = /* @__PURE__ */ new Map();
  getTerminalKey(runtime, testName) {
    return `${runtime}:${testName}`;
  }
  createTerminal(runtime, testName) {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = vscode2.window.createTerminal(`Testeranto: ${testName} (${runtime})`);
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
  async fetchAiderProcesses() {
    try {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aiderProcesses || [];
    } catch (error) {
      console.error("Failed to fetch aider processes from server:", error);
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
    terminal = vscode2.window.createTerminal(`Aider: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    terminal.sendText(`echo "Opening aider terminal for: ${testName}"`);
    terminal.sendText(`echo "Runtime: ${runtime}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Note: Aider terminal support requires server implementation."`);
    terminal.sendText(`echo "This endpoint may not be fully implemented yet."`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Attempting to connect to server..."`);
    try {
      const nodeId = `aider:${runtime}:${testName}`;
      const response2 = await fetch("http://localhost:3000/~/open-process-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId,
          label: `Aider: ${testName}`,
          containerId: "",
          serviceName: `aider-${runtime}-${testName}`
        })
      });
      if (!response2.ok) {
        const errorText = await response2.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response2.status} ${response2.statusText}` };
        }
        terminal.sendText(`echo "\u274C Server error: ${errorData.error || "Failed to open aider terminal"}"`);
        terminal.sendText(`echo "Message: ${errorData.message || "No details provided"}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "Aider terminals may require additional server configuration."`);
      } else {
        const data = await response2.json();
        if (data.success && data.script) {
          terminal.sendText(`echo "\u2705 Server provided terminal script"`);
          terminal.sendText(`echo "Executing..."`);
          terminal.sendText(`echo ""`);
          const workspaceRoot = this.getWorkspaceRoot();
          if (workspaceRoot) {
            const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
            fs.writeFileSync(scriptPath, data.script, { mode: 493 });
            terminal.sendText(`"${scriptPath}" && rm -f "${scriptPath}"`);
          } else {
            const escapedScript = data.script.replace(/'/g, `'"'"'`);
            terminal.sendText(`/bin/sh << 'EOF'
${escapedScript}
EOF`);
          }
        } else {
          terminal.sendText(`echo "\u26A0\uFE0F Server response indicates failure"`);
          terminal.sendText(`echo "Error: ${data.error || "Unknown error"}"`);
        }
      }
    } catch (error) {
      terminal.sendText(`echo "\u274C Failed to connect to server"`);
      terminal.sendText(`echo "Error: ${error.message}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
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
    terminal = vscode2.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    terminal.sendText(`echo "Opening terminal to container: ${containerName}"`);
    terminal.sendText(`echo "Label: ${label}"`);
    if (agentName) {
      terminal.sendText(`echo "Agent: ${agentName}"`);
    }
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server..."`);
    try {
      const nodeId = `container:${containerName}`;
      const response2 = await fetch("http://localhost:3000/~/open-process-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId,
          label: label || `Container: ${containerName}`,
          containerId: containerName,
          serviceName: agentName || containerName
        })
      });
      if (!response2.ok) {
        const errorText = await response2.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response2.status} ${response2.statusText}` };
        }
        terminal.sendText(`echo "\u274C Server error: ${errorData.error || "Failed to open container terminal"}"`);
        terminal.sendText(`echo "Message: ${errorData.message || "No details provided"}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "You may need to manually connect to the container:"`);
        terminal.sendText(`echo "  docker exec -it ${containerName} /bin/sh"`);
      } else {
        const data = await response2.json();
        if (data.success && data.script) {
          terminal.sendText(`echo "\u2705 Server provided terminal script"`);
          terminal.sendText(`echo "Executing..."`);
          terminal.sendText(`echo ""`);
          const workspaceRoot = this.getWorkspaceRoot();
          if (workspaceRoot) {
            const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
            fs.writeFileSync(scriptPath, data.script, { mode: 493 });
            terminal.sendText(`/bin/sh "${scriptPath}" && rm -f "${scriptPath}"`);
          } else {
            const escapedScript = data.script.replace(/'/g, `'"'"'`);
            terminal.sendText(`/bin/sh << 'EOF'
${escapedScript}
EOF`);
          }
        } else {
          terminal.sendText(`echo "\u26A0\uFE0F Server response indicates failure"`);
          terminal.sendText(`echo "Error: ${data.error || "Unknown error"}"`);
        }
      }
    } catch (error) {
      terminal.sendText(`echo "\u274C Failed to connect to server"`);
      terminal.sendText(`echo "Error: ${error.message}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Make sure the Testeranto server is running."`);
    }
    terminal.show();
    return terminal;
  }
  // Restart a specific aider process
  async restartAiderProcess(runtime, testName) {
    try {
      const key = this.getTerminalKey(runtime, testName);
      let terminal = this.terminals.get(key);
      if (!terminal || terminal.exitStatus !== void 0) {
        terminal = vscode2.window.createTerminal(`Aider: ${testName} (${runtime})`);
        this.terminals.set(key, terminal);
      }
      terminal.sendText(`echo "To restart aider process for ${testName}, please use the server API"`);
      terminal.sendText(`echo "The server manages all aider processes and graph updates"`);
      terminal.show();
      vscode2.window.showInformationMessage(`Aider processes are managed by the server. Check the Aider Processes view.`);
    } catch (error) {
      console.error("Failed to handle aider process restart:", error);
      vscode2.window.showErrorMessage(`Failed to handle aider process: ${error}`);
    }
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
    terminal = vscode2.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    terminal.sendText(`echo "Opening terminal for: ${label}"`);
    terminal.sendText(`echo "Node ID: ${nodeId}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server to get container information..."`);
    try {
      const response2 = await fetch("http://localhost:3000/~/open-process-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nodeId, label, containerId, serviceName })
      });
      if (!response2.ok) {
        const errorText = await response2.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response2.status} ${response2.statusText}` };
        }
        terminal.sendText(`echo "\u274C Server error: ${errorData.error || "Failed to open terminal"}"`);
        terminal.sendText(`echo "Message: ${errorData.message || "No details provided"}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "Note: The server may not support this type of terminal."`);
        terminal.sendText(`echo "Check server logs for more information."`);
        terminal.show();
        return terminal;
      }
      const data = await response2.json();
      if (data.success && data.command) {
        terminal.sendText(`echo "\u2705 Server provided terminal command"`);
        terminal.sendText(`echo "Container: ${data.containerId || "unknown"}"`);
        terminal.sendText(`echo "Service: ${data.serviceName || "unknown"}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "To detach from the container without stopping it:"`);
        terminal.sendText(`echo "  Press Ctrl+P, Ctrl+Q"`);
        terminal.sendText(`echo "To send Ctrl+C to the container:"`);
        terminal.sendText(`echo "  Press Ctrl+C"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "Running command..."`);
        terminal.sendText(`echo ""`);
        terminal.sendText(data.command);
      } else {
        terminal.sendText(`echo "\u26A0\uFE0F Server response indicates failure"`);
        terminal.sendText(`echo "Error: ${data.error || "Unknown error"}"`);
        terminal.sendText(`echo "Message: ${data.message || "No message"}"`);
      }
    } catch (error) {
      terminal.sendText(`echo "\u274C Failed to connect to server"`);
      terminal.sendText(`echo "Error: ${error.message}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
      terminal.sendText(`echo "Run 'testeranto dev' in your project to start the server."`);
    }
    terminal.show();
    return terminal;
  }
  // Open a terminal to an aider container
  async openAiderTerminal(containerName, label, agentName) {
    if (!containerName) {
      const terminal2 = vscode2.window.createTerminal(`Aider: ${label}`);
      terminal2.sendText(`echo "\u274C Error: No container name provided for aider terminal"`);
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
    terminal = vscode2.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);
    terminal.sendText(`echo "Opening aider terminal to container: ${containerName}"`);
    terminal.sendText(`echo "Label: ${label}"`);
    if (agentName) {
      terminal.sendText(`echo "Agent: ${agentName}"`);
    }
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server..."`);
    try {
      const nodeId = `aider-container:${containerName}`;
      const response2 = await fetch("http://localhost:3000/~/open-process-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId,
          label: label || `Aider: ${containerName}`,
          containerId: containerName,
          serviceName: agentName || `aider-${containerName}`
        })
      });
      if (!response2.ok) {
        const errorText = await response2.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response2.status} ${response2.statusText}` };
        }
        terminal.sendText(`echo "\u274C Server error: ${errorData.error || "Failed to open aider container terminal"}"`);
        terminal.sendText(`echo "Message: ${errorData.message || "No details provided"}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "You may need to manually attach to the aider container:"`);
        terminal.sendText(`echo "  docker attach ${containerName}"`);
        terminal.sendText(`echo "  (Use Ctrl+P, Ctrl+Q to detach)"`);
      } else {
        const data = await response2.json();
        if (data.success && data.script) {
          terminal.sendText(`echo "\u2705 Server provided terminal script"`);
          terminal.sendText(`echo "Executing..."`);
          terminal.sendText(`echo ""`);
          const workspaceRoot = this.getWorkspaceRoot();
          if (workspaceRoot) {
            const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
            fs.writeFileSync(scriptPath, data.script, { mode: 493 });
            terminal.sendText(`/bin/sh "${scriptPath}" && rm -f "${scriptPath}"`);
          } else {
            const escapedScript = data.script.replace(/'/g, `'"'"'`);
            terminal.sendText(`/bin/sh << 'EOF'
${escapedScript}
EOF`);
          }
        } else {
          terminal.sendText(`echo "\u26A0\uFE0F Server response indicates failure"`);
          terminal.sendText(`echo "Error: ${data.error || "Unknown error"}"`);
        }
      }
    } catch (error) {
      terminal.sendText(`echo "\u274C Failed to connect to server"`);
      terminal.sendText(`echo "Error: ${error.message}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Make sure the Testeranto server is running."`);
    }
    terminal.show();
    return terminal;
  }
  getWorkspaceRoot() {
    const workspaceFolders = vscode2.workspace.workspaceFolders;
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

// src/vscode/statusBarManager.ts
import * as vscode3 from "vscode";
var StatusBarManager = class _StatusBarManager {
  mainStatusBarItem;
  serverStatusBarItem;
  lockStatusBarItem;
  // New status bar item for lock status
  static instance = null;
  constructor() {
    this.mainStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 99);
    this.lockStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 98);
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
      this.mainStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 100);
    }
    if (!this.serverStatusBarItem) {
      this.serverStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 99);
    }
    if (!this.lockStatusBarItem) {
      this.lockStatusBarItem = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 98);
    }
    this.mainStatusBarItem.text = "$(beaker) Testeranto";
    this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    this.mainStatusBarItem.command = "testeranto.showTests";
    this.mainStatusBarItem.show();
    this.serverStatusBarItem.text = "$(circle-slash) Server";
    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    this.serverStatusBarItem.command = "testeranto.startServer";
    this.serverStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.warningBackground");
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
      this.serverStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.warningBackground");
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
      this.lockStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.warningBackground");
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
      const workspaceFolders = vscode3.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
      } else {
        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "No workspace folder open";
        this.serverStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.warningBackground");
        this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
        this.lockStatusBarItem.tooltip = "Lock status unknown (no workspace)";
        this.lockStatusBarItem.backgroundColor = void 0;
      }
    } catch (error) {
      console.error("[Testeranto] Error checking server status:", error);
      this.serverStatusBarItem.text = "$(error) Server Error";
      this.serverStatusBarItem.tooltip = "Error checking server status";
      this.serverStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.errorBackground");
      this.lockStatusBarItem.text = "$(error) Lock Error";
      this.lockStatusBarItem.tooltip = "Error checking lock status";
      this.lockStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.errorBackground");
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
      this.lockStatusBarItem.backgroundColor = new vscode3.ThemeColor("statusBarItem.warningBackground");
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

// src/vscode/extension/createProviders.ts
import "vscode";

// src/vscode/providers/TestTreeDataProvider.ts
import * as vscode8 from "vscode";
import * as path2 from "path";

// src/vscode/TestTreeItem.ts
import * as vscode5 from "vscode";

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
var TestTreeItem = class extends vscode5.TreeItem {
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
        return new vscode5.ThemeIcon("symbol-namespace");
      case 1 /* Test */:
        return new vscode5.ThemeIcon("beaker");
      case 2 /* File */:
        return new vscode5.ThemeIcon("file");
      case 3 /* Info */:
        return new vscode5.ThemeIcon("info");
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
import * as vscode7 from "vscode";

// src/vscode/providers/utils/apiUtils.ts
import * as vscode6 from "vscode";

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
  // TODO 
  // spawnAgent: {
  //   agent: string,
  //   loadfile: string,
  //   message: string
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
  },
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
function getApiUrl(endpoint, params) {
  const apiDef = API[endpoint];
  let path4 = apiDef.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path4 = path4.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  const baseUrl = "http://localhost:3000";
  return `${baseUrl}${path4}`;
}
function getApiPath(endpoint, params) {
  const apiDef = API[endpoint];
  let path4 = apiDef.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path4 = path4.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  return path4;
}

// src/vscode/providers/utils/apiUtils.ts
var ApiUtils = class {
  static getBaseUrl() {
    try {
      const config = vscode6.workspace.getConfiguration("testeranto");
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
    const endpoint = API[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in vscodeHttpAPI`);
    }
    let path4 = endpoint.path;
    if (params && endpoint.params) {
      for (const [key, value] of Object.entries(params)) {
        if (endpoint.params[key]) {
          path4 = path4.replace(`:${key}`, value);
        }
      }
    }
    const url = `${this.getBaseUrl()}${path4}`;
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
      const response2 = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response2;
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
  _onDidChangeTreeData = new vscode7.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  ws = null;
  isConnected = false;
  subscribedSlices = /* @__PURE__ */ new Set();
  constructor() {
    this.setupWebSocket();
  }
  getTreeItem(element) {
    if (element === null || element === void 0) {
      console.error("[BaseTreeDataProvider] getTreeItem called with null/undefined element");
      const item = new vscode7.TreeItem("Invalid item", vscode7.TreeItemCollapsibleState.None);
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
      console.log("[TestTreeDataProvider] Loading graph data from runtime slice API endpoint");
      const response2 = await fetch(ApiUtils.getRuntimeSliceUrl());
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response2.status}`);
      }
      const data = await response2.json();
      this.graphData = data;
      console.log("[TestTreeDataProvider] Loaded graph data from API:", this.graphData?.nodes?.length, "nodes");
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
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode8.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refresh",
        title: "Refresh",
        arguments: []
      },
      new vscode8.ThemeIcon("refresh")
    ));
    if (!this.graphData) {
      items.push(new TestTreeItem(
        "Cannot connect to server",
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.None,
        {
          description: "Testeranto server is not running on port 3000.",
          startServer: true
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode8.ThemeIcon("warning")
      ));
      return items;
    }
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
    for (const [runtimeKey, data] of runtimeMap.entries()) {
      items.push(new TestTreeItem(
        runtimeKey,
        0 /* Runtime */,
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${data.count} config(s)`,
          count: data.count
        },
        void 0,
        new vscode8.ThemeIcon("symbol-namespace")
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
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId: node.id,
          description: node.description,
          // Mark this as an entrypoint item, not a test item
          isEntrypoint: true
        },
        void 0,
        new vscode8.ThemeIcon("file-text")
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
        vscode8.TreeItemCollapsibleState.Collapsed,
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
          vscode8.TreeItemCollapsibleState.None,
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
          new vscode8.ThemeIcon("arrow-down")
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
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "input-files"
        },
        void 0,
        new vscode8.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        "Output Files",
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "output-files"
        },
        void 0,
        new vscode8.ThemeIcon("folder-opened")
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
          vscode8.TreeItemCollapsibleState.None,
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
          new vscode8.ThemeIcon("arrow-down")
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
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: "test-input-files"
        },
        void 0,
        new vscode8.ThemeIcon("folder-opened")
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }
    if (outputFilePaths.length > 0) {
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        "Output Files",
        3 /* Info */,
        vscode8.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: "test-output-files"
        },
        void 0,
        new vscode8.ThemeIcon("folder-opened")
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, testId);
      items.push(outputFolder);
    }
    return items;
  }
  buildFileTree(filePaths) {
    const root = { type: "directory", children: {} };
    for (const { node, path: path4 } of filePaths) {
      const parts = path4.split(/[\\/]/).filter((part) => part.length > 0);
      let current = root.children;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!current[part]) {
          if (isLast) {
            current[part] = {
              type: "file",
              path: path4,
              node,
              label: node.label || path4.basename(path4) || part,
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
            path: path4,
            node,
            label: node.label || path4.basename(path4) || part,
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
          vscode8.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey,
            testId,
            isFile: false,
            fileType: "folder"
          },
          void 0,
          new vscode8.ThemeIcon("folder")
        );
        folderItem.children = this.convertTreeToItems(typedNode, runtimeKey, testId);
        items.push(folderItem);
      } else if (typedNode.type === "file") {
        const fileItem = new TestTreeItem(
          name,
          2 /* File */,
          vscode8.TreeItemCollapsibleState.None,
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
          new vscode8.ThemeIcon("arrow-up")
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
      return new vscode8.ThemeIcon("error", new vscode8.ThemeColor("testing.iconFailed"));
    } else if (failed === false || status === "done") {
      return new vscode8.ThemeIcon("check", new vscode8.ThemeColor("testing.iconPassed"));
    } else {
      return new vscode8.ThemeIcon("circle-outline", new vscode8.ThemeColor("testing.iconUnset"));
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
import * as vscode9 from "vscode";
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
      console.log("[DockerProcessTreeDataProvider] Loading process data from /~/process API endpoint");
      const response2 = await fetch("http://localhost:3000/~/process");
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response2.status}`);
      }
      const data = await response2.json();
      if (data && Array.isArray(data.processes)) {
        const processedNodes = data.processes.map((node) => {
          const metadata = node.metadata || {};
          let isAider = false;
          if (node.type) {
            if (typeof node.type === "object") {
              isAider = node.type.type === "aider";
            } else if (typeof node.type === "string") {
              isAider = node.type.includes("aider");
            }
          }
          let status = metadata.status || "unknown";
          const isActive = metadata.isActive || false;
          const containerId = metadata.containerId;
          if (containerId && status === "unknown") {
            status = isActive ? "running" : "stopped";
          }
          return {
            ...node,
            metadata: {
              ...metadata,
              status,
              isAider,
              // Ensure we have the process type
              processType: isAider ? "aider" : node.type && typeof node.type === "object" ? node.type.type : typeof node.type === "string" ? node.type.replace("_process", "") : "unknown"
            }
          };
        });
        this.graphData = {
          nodes: processedNodes,
          edges: []
        };
        console.log("[DockerProcessTreeDataProvider] Loaded", processedNodes.length, "processes from API");
      } else {
        console.warn("[DockerProcessTreeDataProvider] API response does not contain processes array:", data);
        this.graphData = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error("[DockerProcessTreeDataProvider] Failed to load process data from API:", error);
      this.graphData = { nodes: [], edges: [] };
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
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode9.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshDockerProcesses",
        title: "Refresh",
        arguments: []
      },
      new vscode9.ThemeIcon("refresh")
    ));
    if (!this.graphData) {
      items.push(new TestTreeItem(
        "Cannot connect to server",
        3 /* Info */,
        vscode9.TreeItemCollapsibleState.None,
        {
          description: "Testeranto server is not running on port 3000.",
          startServer: true
        },
        {
          command: "testeranto.startServer",
          title: "Start Server",
          arguments: []
        },
        new vscode9.ThemeIcon("warning")
      ));
      return items;
    }
    console.log(`[DockerProcessTreeDataProvider] Processing graph with ${this.graphData.nodes.length} nodes, ${this.graphData.edges.length} edges`);
    const dockerProcessNodes = this.graphData.nodes.filter((node) => {
      if (node.type && typeof node.type === "object") {
        return node.type.category === "process";
      }
      return node.type === "docker_process" || node.type === "bdd_process" || node.type === "check_process" || node.type === "builder_process" || node.type === "aider_process";
    });
    console.log(`[DockerProcessTreeDataProvider] Found ${dockerProcessNodes.length} docker process nodes`);
    if (dockerProcessNodes.length === 0) {
      items.push(new TestTreeItem(
        "No docker processes found",
        3 /* Info */,
        vscode9.TreeItemCollapsibleState.None,
        {
          description: "No docker processes in graph"
        },
        void 0,
        new vscode9.ThemeIcon("info")
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
      const groupItem = new TestTreeItem(
        groupLabel,
        3 /* Info */,
        vscode9.TreeItemCollapsibleState.Collapsed,
        {
          description: groupDescription,
          count: group.processes.length,
          groupKey,
          groupType: group.type
        },
        void 0,
        group.type === "config" ? new vscode9.ThemeIcon("settings-gear") : group.type === "entrypoint" ? new vscode9.ThemeIcon("file-text") : new vscode9.ThemeIcon("server")
      );
      groupItem.children = group.processes.map((node) => this.createProcessItem(node));
      items.push(groupItem);
    }
    return items;
  }
  createProcessItem(node) {
    const metadata = node.metadata || {};
    const status = metadata.status || metadata.state || "unknown";
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || "unknown";
    const isAider = metadata.isAider || false;
    const processType = metadata.processType || "unknown";
    let serviceName = metadata.serviceName || metadata.containerName || metadata.name || "unknown";
    if (serviceName === "unknown" && node.id) {
      const parts = node.id.split(":");
      if (parts.length >= 3) {
        const processTypePart = parts[0];
        const configKey = parts[1];
        const testName = parts[2];
        const extractedProcessType = processTypePart.replace("_process", "");
        if (extractedProcessType === "aider" && configKey === "agent") {
          serviceName = `agent-${testName}`;
        } else if (extractedProcessType === "check") {
          serviceName = `check-${configKey}-${testName.replace(/\//g, "-").replace(/\./g, "-")}`;
        } else if (extractedProcessType === "bdd") {
          serviceName = `bdd-${configKey}-${testName.replace(/\//g, "-").replace(/\./g, "-")}`;
        } else if (extractedProcessType === "aider") {
          serviceName = `aider-${configKey}-${testName.replace(/\//g, "-").replace(/\./g, "-")}`;
        } else if (extractedProcessType === "builder") {
          serviceName = `builder-${configKey}`;
        } else {
          serviceName = `${extractedProcessType}-${configKey}-${testName.replace(/\//g, "-").replace(/\./g, "-")}`;
        }
      }
    }
    let label = node.label || serviceName;
    if (label === "unknown" && node.id) {
      const parts = node.id.split(":");
      label = parts[parts.length - 1] || node.id;
    }
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
      case "todo":
        description += "\u{1F4DD} Todo";
        break;
      default:
        description += `\u2753 ${status}`;
    }
    if (exitCode !== void 0) {
      description += ` (exit: ${exitCode})`;
    }
    description += ` \u2022 ${processType}`;
    if (!isActive && status !== "stopped" && status !== "exited") {
      description += " \u2022 inactive";
    }
    let icon;
    if (isAider) {
      if (status === "running") {
        icon = new vscode9.ThemeIcon("comment-discussion", new vscode9.ThemeColor("testing.iconPassed"));
      } else if (status === "stopped" || status === "exited") {
        icon = new vscode9.ThemeIcon("comment", new vscode9.ThemeColor("testing.iconUnset"));
      } else {
        icon = new vscode9.ThemeIcon("comment", new vscode9.ThemeColor("testing.iconUnset"));
      }
    } else {
      if (status === "running") {
        icon = new vscode9.ThemeIcon("play-circle", new vscode9.ThemeColor("testing.iconPassed"));
      } else if (status === "exited") {
        if (exitCode === 0) {
          icon = new vscode9.ThemeIcon("check", new vscode9.ThemeColor("testing.iconPassed"));
        } else {
          icon = new vscode9.ThemeIcon("error", new vscode9.ThemeColor("testing.iconFailed"));
        }
      } else if (status === "stopped") {
        icon = new vscode9.ThemeIcon("circle-slash", new vscode9.ThemeColor("testing.iconUnset"));
      } else if (status === "failed") {
        icon = new vscode9.ThemeIcon("error", new vscode9.ThemeColor("testing.iconFailed"));
      } else {
        icon = new vscode9.ThemeIcon("circle-outline", new vscode9.ThemeColor("testing.iconUnset"));
      }
    }
    const item = new TestTreeItem(
      label,
      3 /* Info */,
      vscode9.TreeItemCollapsibleState.None,
      {
        description,
        status,
        exitCode,
        containerId,
        serviceName,
        processType,
        isActive,
        nodeId: node.id,
        // Add aider-specific fields
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
    if (this.graphData) {
      const connectedEdges = this.graphData.edges.filter(
        (edge) => edge.target === node.id && edge.attributes && edge.attributes.type && (edge.attributes.type === "hasProcess" || typeof edge.attributes.type === "object" && edge.attributes.type.type === "has")
      );
      for (const edge of connectedEdges) {
        const sourceNode = this.graphData.nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          let sourceType = "unknown";
          if (sourceNode.type && typeof sourceNode.type === "object") {
            sourceType = sourceNode.type.type || "unknown";
          } else if (typeof sourceNode.type === "string") {
            sourceType = sourceNode.type;
          }
          if (sourceType === "entrypoint") {
            tooltip += `
Connected to entrypoint: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceType === "config") {
            tooltip += `
Connected to config: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceType === "agent") {
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

// src/vscode/providers/AiderProcessTreeDataProvider.ts
import * as vscode10 from "vscode";
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
      console.log("[AiderProcessTreeDataProvider] Loading graph data from aider API endpoint");
      await this.fetchAiderProcessesDirectly();
    } catch (error) {
      console.error("[AiderProcessTreeDataProvider] Error loading graph data from API:", error);
      this.graphData = null;
      this.agents = [];
      console.error(`[AiderProcessTreeDataProvider] Error details: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[AiderProcessTreeDataProvider] Make sure server is running on http://localhost:3000`);
    }
  }
  async fetchAiderProcessesDirectly() {
    try {
      const aiderUrl = getApiUrl("getAider");
      const response2 = await fetch(aiderUrl, {
        method: "GET"
      });
      if (response2.ok) {
        const data = await response2.json();
        console.log("[AiderProcessTreeDataProvider] Raw aider data:", JSON.stringify(data, null, 2));
        this.graphData = this.graphData || { nodes: [], edges: [] };
        const existingIds = new Set(this.graphData.nodes.map((n) => n.id));
        const aiderProcessNodes = data.nodes?.filter(
          (node) => node.type === "aider_process"
        ) || [];
        const agentNodes = data.nodes?.filter(
          (node) => node.type === "agent"
        ) || [];
        this.graphData.nodes = [];
        aiderProcessNodes.forEach((node) => {
          this.graphData.nodes.push({
            id: node.id,
            type: node.type,
            label: node.label,
            metadata: node.metadata
          });
        });
        this.agents = agentNodes.map((node) => ({
          name: node.metadata?.agentName,
          ...node.metadata
        }));
        console.log(`[AiderProcessTreeDataProvider] Successfully fetched ${aiderProcessNodes.length} aider processes and ${agentNodes.length} agents from ${aiderUrl}`);
        if (aiderProcessNodes.length === 0) {
          console.log("[AiderProcessTreeDataProvider] No aider processes found in /~/aider endpoint");
        }
        return;
      } else {
        console.warn(`[AiderProcessTreeDataProvider] Failed to fetch from ${aiderUrl}:`, response2.status);
      }
    } catch (error) {
      console.error(`[AiderProcessTreeDataProvider] Error fetching from getAider API:`, error);
    }
  }
  refresh() {
    console.log("[AiderProcessTreeDataProvider] Manual refresh triggered");
    this.graphData = null;
    this.agents = [];
    this._onDidChangeTreeData.fire();
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[AiderProcessTreeDataProvider] Error in refresh:", error);
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
      new TestTreeItem(
        "Refresh",
        TreeItemType.Action,
        vscode10.TreeItemCollapsibleState.None,
        {
          action: "refresh",
          info: "Refresh the view to try loading data again."
        },
        {
          command: "testeranto.refreshAiderProcesses",
          title: "Refresh",
          arguments: []
        },
        new vscode10.ThemeIcon("refresh")
      )
    );
    if (!this.graphData) {
      items.push(
        new TestTreeItem(
          "Cannot connect to server",
          3 /* Info */,
          vscode10.TreeItemCollapsibleState.None,
          {
            info: "Testeranto server is not running on port 3000.",
            startServer: true
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode10.ThemeIcon("warning")
        )
      );
      return items;
    }
    if (this.graphData.nodes.length === 0) {
      items.push(
        new TestTreeItem(
          "No aider data available",
          3 /* Info */,
          vscode10.TreeItemCollapsibleState.None,
          {
            info: 'The server returned empty graph data. Try running "Testeranto: Start Server" or check if the server is running on port 3000.'
          },
          void 0,
          new vscode10.ThemeIcon("info")
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
        new TestTreeItem(
          "No aider processes found",
          3 /* Info */,
          vscode10.TreeItemCollapsibleState.None,
          {
            info: agentNodes.length > 0 ? "Agents are running but no aider processes are active." : "No agents or aider processes found."
          },
          void 0,
          new vscode10.ThemeIcon("info")
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
      let groupIcon = new vscode10.ThemeIcon("server");
      if (agentId !== "ungrouped") {
        const agentNode = agentNodes.find((n) => n.id === agentId);
        if (agentNode) {
          groupLabel = `Agent: ${agentNode.metadata?.agentName || agentNode.label || agentId}`;
          groupIcon = new vscode10.ThemeIcon("person");
        } else {
          groupLabel = `Agent: ${agentId}`;
          groupIcon = new vscode10.ThemeIcon("person");
        }
      }
      const groupItem = new TestTreeItem(
        groupLabel,
        3 /* Info */,
        vscode10.TreeItemCollapsibleState.Collapsed,
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
          icon = new vscode10.ThemeIcon("play-circle", new vscode10.ThemeColor("testing.iconPassed"));
        } else if (status === "stopped") {
          icon = new vscode10.ThemeIcon("circle-slash", new vscode10.ThemeColor("testing.iconUnset"));
        } else {
          icon = new vscode10.ThemeIcon("circle-outline", new vscode10.ThemeColor("testing.iconUnset"));
        }
        const item = new TestTreeItem(
          label,
          3 /* Info */,
          vscode10.TreeItemCollapsibleState.None,
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
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      const aiderPath = getApiPath("getAider");
      const userAgentsPath = getApiPath("getUserAgents");
      const isAgentRelated = message.url && (message.url === userAgentsPath || message.url.startsWith("/~/agents/") || message.url === "/~/agents");
      if (message.url === aiderPath || isAgentRelated || message.url === "/~/graph") {
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
    this.subscribeToSlice(wsApi.slices.aider);
    this.subscribeToSlice(wsApi.slices.agents);
    this.subscribeToSlice(wsApi.slices.graph);
  }
};

// src/vscode/providers/FileTreeDataProvider.ts
import * as vscode11 from "vscode";
var FileTreeDataProvider = class extends BaseTreeDataProvider {
  treeData = null;
  constructor() {
    super();
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }
  async loadGraphData() {
    try {
      console.log("[FileTreeDataProvider] Loading graph data from files API endpoint");
      const filesUrl = getApiUrl("getFiles");
      const response2 = await fetch(filesUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response2.ok) {
        throw new Error(`Server returned ${response2.status}: ${response2.statusText}`);
      }
      const data = await response2.json();
      console.log("[FileTreeDataProvider] Has tree?", !!data.tree, "Type:", typeof data.tree);
      if (data.tree && Array.isArray(data.tree)) {
        console.log("[FileTreeDataProvider] Using server-provided tree with", data.tree.length, "root nodes");
        this.treeData = data.tree;
      } else {
        console.log("[FileTreeDataProvider] No tree in response");
        this.treeData = null;
      }
    } catch (error) {
      console.error("[FileTreeDataProvider] Failed to load graph data from API:", error);
      this.treeData = null;
      console.error(`[FileTreeDataProvider] Error details: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[FileTreeDataProvider] Make sure server is running on http://localhost:3000`);
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
    if (!element) {
      return this.buildFileSystemTree();
    }
    const elementData = element.data || {};
    if (elementData.isFolder && elementData.children) {
      return elementData.children;
    }
    return [];
  }
  buildFileSystemTree() {
    const items = [];
    items.push(new TestTreeItem(
      "Refresh",
      3 /* Info */,
      vscode11.TreeItemCollapsibleState.None,
      {
        description: "Reload graph data",
        refresh: true
      },
      {
        command: "testeranto.refreshFileTree",
        title: "Refresh",
        arguments: []
      },
      new vscode11.ThemeIcon("refresh")
    ));
    if (this.treeData && Array.isArray(this.treeData)) {
      console.log("[FileTreeDataProvider] Using server-provided tree structure");
      const treeItems = this.convertServerTreeToItems(this.treeData);
      items.push(...treeItems);
      return items;
    }
    items.push(new TestTreeItem(
      "Cannot connect to server",
      3 /* Info */,
      vscode11.TreeItemCollapsibleState.None,
      {
        description: "Testeranto server is not running on port 3000.",
        startServer: true
      },
      {
        command: "testeranto.startServer",
        title: "Start Server",
        arguments: []
      },
      new vscode11.ThemeIcon("warning")
    ));
    return items;
  }
  convertServerTreeToItems(treeNodes) {
    const items = [];
    for (const treeNode of treeNodes) {
      if (treeNode.type === "folder") {
        const children = treeNode.children && Array.isArray(treeNode.children) ? this.convertServerTreeToItems(treeNode.children) : [];
        const folderItem = new TestTreeItem(
          treeNode.name,
          2 /* File */,
          children.length > 0 ? vscode11.TreeItemCollapsibleState.Collapsed : vscode11.TreeItemCollapsibleState.None,
          {
            isFolder: true,
            folderPath: treeNode.path || "",
            folderId: treeNode.id || "",
            description: treeNode.description || "Folder",
            fileCount: this.countFilesInServerTree(treeNode),
            children
          },
          void 0,
          new vscode11.ThemeIcon("folder")
        );
        items.push(folderItem);
      } else if (treeNode.type === "file") {
        const fileItem = new TestTreeItem(
          treeNode.name,
          2 /* File */,
          vscode11.TreeItemCollapsibleState.None,
          {
            isFile: true,
            fileName: treeNode.path || "",
            fileType: treeNode.metadata?.fileType || "file",
            description: treeNode.description || "File"
          },
          treeNode.path ? {
            command: "testeranto.openFile",
            title: "Open File",
            arguments: [{ fileName: treeNode.path }]
          } : void 0,
          this.getIconForFile(treeNode)
        );
        items.push(fileItem);
      }
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
  countFilesInServerTree(treeNode) {
    let count = 0;
    if (treeNode.type === "file") {
      count++;
    }
    if (treeNode.children && Array.isArray(treeNode.children)) {
      for (const child of treeNode.children) {
        count += this.countFilesInServerTree(child);
      }
    }
    return count;
  }
  getIconForFile(treeNode) {
    const fileType = treeNode.metadata?.fileType || treeNode.type;
    switch (fileType) {
      case "input_file":
      case "source":
        return new vscode11.ThemeIcon("file-code");
      case "log":
        return new vscode11.ThemeIcon("output");
      case "documentation":
        return new vscode11.ThemeIcon("book");
      case "config":
        return new vscode11.ThemeIcon("settings-gear");
      default:
        return new vscode11.ThemeIcon("file");
    }
  }
  handleWebSocketMessage(message) {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    if (message.type === "resourceChanged") {
      const filesPath = getApiPath("getFiles");
      if (message.url === filesPath || message.url === "/~/graph") {
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
    this.subscribeToSlice(wsApi.slices.files);
    this.subscribeToSlice(wsApi.slices.graph);
  }
};

// src/vscode/providers/ViewTreeDataProvider.ts
import * as vscode12 from "vscode";
var ViewTreeDataProvider = class extends BaseTreeDataProvider {
  views = [];
  constructor() {
    super();
    this.loadViews();
  }
  async getChildren(element) {
    if (element) {
      return this.getViewDetails(element);
    }
    return this.getViewItems();
  }
  async getViewItems() {
    try {
      await this.loadViews();
      if (this.views.length === 0) {
        const defaultViewKeys = ["Kanban", "Gantt", "Eisenhower"];
        this.views = defaultViewKeys.map((key) => ({
          key,
          name: key,
          url: `http://localhost:3000/testeranto/views/${key}.html`
        }));
      }
      return this.views.map((view) => {
        const viewKey = view.key || view.id;
        const viewName = view.name || viewKey;
        return new TestTreeItem(
          viewName,
          4 /* Config */,
          vscode12.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey: viewKey,
            description: `Open ${viewName} view`,
            action: "openView"
          },
          void 0,
          new vscode12.ThemeIcon("eye"),
          "viewItem"
        );
      });
    } catch (error) {
      console.error("[ViewTreeDataProvider] Error loading views:", error);
      return [
        new TestTreeItem(
          "Cannot connect to server",
          3 /* Info */,
          vscode12.TreeItemCollapsibleState.None,
          {
            info: "Testeranto server is not running on port 3000."
          }
        ),
        new TestTreeItem(
          "Start server",
          3 /* Info */,
          vscode12.TreeItemCollapsibleState.None,
          {
            action: "startServer",
            description: "Click to start the server"
          },
          {
            command: "testeranto.startServer",
            title: "Start Server"
          }
        )
      ];
    }
  }
  async getViewDetails(element) {
    const viewKey = element.data?.runtimeKey;
    if (!viewKey) {
      return [];
    }
    const view = this.views.find((v) => (v.key || v.id) === viewKey);
    if (!view) {
      return [];
    }
    const details = [];
    const viewUrl = `http://localhost:3000/testeranto/views/${viewKey}.html`;
    details.push(new TestTreeItem(
      "Open View",
      4 /* Config */,
      vscode12.TreeItemCollapsibleState.None,
      {
        runtimeKey: viewKey,
        action: "openView",
        description: "Click to open in webview"
      },
      {
        command: "testeranto.openView",
        title: "Open View",
        arguments: [viewKey, viewUrl]
      },
      new vscode12.ThemeIcon("link-external"),
      "viewOpenItem"
    ));
    return details;
  }
  async loadViews() {
    try {
      console.log("[ViewTreeDataProvider] Loading views from /~/views endpoint");
      const response2 = await fetch("http://localhost:3000/~/views", {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response2.ok) {
        throw new Error(`Server returned ${response2.status}: ${response2.statusText}`);
      }
      const data = await response2.json();
      console.log("[ViewTreeDataProvider] Response:", data);
      if (data && data.views) {
        this.views = data.views.map((view) => {
          const viewKey = view.key || view.id;
          let viewUrl = view.url;
          if (!viewUrl) {
            viewUrl = `http://localhost:3000/testeranto/views/${viewKey}.html`;
          } else if (viewUrl.includes("/stakeholder/")) {
            viewUrl = viewUrl.replace("/stakeholder/", "/");
          }
          return {
            key: viewKey,
            name: view.name || viewKey,
            url: viewUrl
          };
        });
        console.log(`[ViewTreeDataProvider] Loaded ${this.views.length} views from server`);
      } else {
        console.warn("[ViewTreeDataProvider] No views found in server response");
        this.views = [];
      }
    } catch (error) {
      console.error("[ViewTreeDataProvider] Failed to load views from server:", error);
      this.views = [];
    }
  }
  refresh() {
    this.loadViews();
    super.refresh();
  }
};

// src/vscode/providers/AgentTreeDataProvider.ts
import * as vscode13 from "vscode";
var AgentTreeDataProvider = class extends BaseTreeDataProvider {
  agents = [];
  constructor() {
    super();
  }
  async getChildren(element) {
    try {
      if (!element) {
        if (this.agents.length === 0) {
          await this.loadAgents();
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
          vscode13.TreeItemCollapsibleState.None,
          {
            info: error instanceof Error ? error.message : "Unknown error"
          },
          void 0,
          new vscode13.ThemeIcon("error")
        ),
        new TestTreeItem(
          "Refresh",
          TreeItemType.Action,
          vscode13.TreeItemCollapsibleState.None,
          {
            action: "refresh",
            info: "Click to retry"
          },
          {
            command: "testeranto.refreshAgents",
            title: "Refresh",
            arguments: []
          },
          new vscode13.ThemeIcon("refresh")
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
        vscode13.TreeItemCollapsibleState.None,
        {
          action: "refresh",
          info: "Refresh the view to try loading data again."
        },
        {
          command: "testeranto.refreshAgents",
          title: "Refresh",
          arguments: []
        },
        new vscode13.ThemeIcon("refresh")
      )
    );
    if (this.agents.length === 0) {
      items.push(
        new TestTreeItem(
          "No agents configured",
          3 /* Info */,
          vscode13.TreeItemCollapsibleState.None,
          {
            info: "The server returned an empty agents array. Check your testeranto.ts configuration."
          }
        )
      );
      return items;
    }
    return this.agents.map((agent) => {
      const agentName = agent.name || agent.key;
      if (!agentName) {
        throw new Error("Agent missing name and key properties");
      }
      const agentConfig = agent.config || {};
      return new TestTreeItem(
        agentName,
        3 /* Info */,
        vscode13.TreeItemCollapsibleState.Collapsed,
        {
          description: agentConfig.message ? agentConfig.message.substring(0, 50) + "..." : "Agent",
          agentName,
          action: "launchAgent"
        },
        void 0,
        new vscode13.ThemeIcon("person"),
        "agentItem"
      );
    });
  }
  async getAgentDetails(agentName) {
    const agent = this.agents.find((a) => (a.name || a.key) === agentName);
    if (!agent) {
      return [];
    }
    const details = [];
    details.push(new TestTreeItem(
      `Name: ${agentName}`,
      3 /* Info */,
      vscode13.TreeItemCollapsibleState.None,
      { info: agentName }
    ));
    const agentConfig = agent.config || {};
    if (agentConfig.message) {
      details.push(new TestTreeItem(
        `Description: ${agentConfig.message.substring(0, 100)}...`,
        3 /* Info */,
        vscode13.TreeItemCollapsibleState.None,
        { info: agentConfig.message }
      ));
    }
    if (agentConfig.load && Array.isArray(agentConfig.load)) {
      details.push(new TestTreeItem(
        `Loads: ${agentConfig.load.length} items`,
        3 /* Info */,
        vscode13.TreeItemCollapsibleState.None,
        { info: agentConfig.load.join(", ") }
      ));
    }
    details.push(new TestTreeItem(
      "Launch Agent",
      4 /* Config */,
      vscode13.TreeItemCollapsibleState.None,
      {
        agentName,
        action: "launchAgent",
        description: "Click to launch this agent"
      },
      {
        command: "testeranto.launchAgent",
        title: "Launch Agent",
        arguments: [agentName]
      },
      new vscode13.ThemeIcon("rocket"),
      "agentLaunchItem"
    ));
    details.push(new TestTreeItem(
      "View Agent Slice",
      4 /* Config */,
      vscode13.TreeItemCollapsibleState.None,
      {
        agentName,
        action: "viewAgentSlice",
        description: "Click to view this agent's slice data"
      },
      {
        command: "testeranto.openView",
        title: "View Agent Slice",
        arguments: [`agent-${agentName}`, `Agent: ${agentName}`, `/~/agents/${agentName}`]
      },
      new vscode13.ThemeIcon("eye"),
      "agentViewSliceItem"
    ));
    return details;
  }
  async loadAgents() {
    console.log("[AgentTreeDataProvider] Loading agents from API endpoint");
    const agentsUrl = getApiUrl("getAllAgents");
    const response2 = await fetch(agentsUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response2.ok) {
      throw new Error(`Server returned ${response2.status}: ${response2.statusText}`);
    }
    const data = await response2.json();
    console.log("[AgentTreeDataProvider] Response:", data);
    if (data && Array.isArray(data)) {
      this.agents = data;
      console.log(
        `[AgentTreeDataProvider] Loaded ${this.agents.length} agents:`,
        this.agents.map((a) => a.name || a.key || "unnamed").join(", ")
      );
    } else if (data && data.agents && Array.isArray(data.agents)) {
      this.agents = data.agents;
      console.log(
        `[AgentTreeDataProvider] Loaded ${this.agents.length} agents:`,
        this.agents.map((a) => a.name || a.key || "unnamed").join(", ")
      );
    } else {
      this.agents = [];
      console.log("[AgentTreeDataProvider] No agents configured or empty response");
    }
  }
  refresh() {
    console.log("[AgentTreeDataProvider] Manual refresh triggered");
    this.agents = [];
    this._onDidChangeTreeData.fire();
    this.loadAgents().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch((error) => {
      console.error("[AgentTreeDataProvider] Error in refresh:", error);
      this._onDidChangeTreeData.fire();
    });
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
  outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
  const aiderProcessProvider = new AiderProcessTreeDataProvider();
  outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created successfully - uses /~/aider API endpoint");
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
    aiderProcessProvider,
    fileTreeProvider,
    viewTreeProvider,
    agentProvider
  }, outputChannel);
  return {
    runtimeProvider,
    dockerProcessProvider,
    aiderProcessProvider,
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

// src/vscode/extension/registerCommands.ts
import "vscode";

// src/vscode/commandManager.ts
import * as vscode25 from "vscode";

// src/vscode/providers/utils/registerCommands.tsx
import "vscode";

// src/vscode/commands/testCommands.ts
import * as vscode15 from "vscode";
var registerTestCommands = (terminalManager) => {
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
      "testeranto.openAiderTerminal",
      async (containerName, label, agentName) => {
        try {
          vscode15.window.showInformationMessage(`Opening aider terminal for ${label || "Aider"}...`);
          const terminal = await terminalManager.openAiderTerminal(containerName || "", label || "Aider", agentName);
          terminal.show();
        } catch (err) {
          vscode15.window.showErrorMessage(`Error opening aider terminal: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/processCommands.ts
import * as vscode16 from "vscode";
var registerProcessCommands = (dockerProcessProvider, aiderProcessProvider, fileTreeProvider) => {
  const disposables = [];
  disposables.push(
    vscode16.commands.registerCommand(
      "testeranto.refreshDockerProcesses",
      async () => {
        try {
          if (dockerProcessProvider && typeof dockerProcessProvider.refresh === "function") {
            await dockerProcessProvider.refresh();
            vscode16.window.showInformationMessage("Docker processes refreshed");
          } else {
            vscode16.window.showWarningMessage("Docker process provider not available");
          }
        } catch (err) {
          vscode16.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode16.commands.registerCommand(
      "testeranto.refreshAiderProcesses",
      async () => {
        try {
          if (aiderProcessProvider && typeof aiderProcessProvider.refresh === "function") {
            await aiderProcessProvider.refresh();
            vscode16.window.showInformationMessage("Aider processes refreshed");
          } else {
            vscode16.window.showWarningMessage("Aider process provider not available");
          }
        } catch (err) {
          vscode16.window.showErrorMessage(`Error refreshing aider processes: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode16.commands.registerCommand(
      "testeranto.refreshFileTree",
      async () => {
        try {
          if (fileTreeProvider && typeof fileTreeProvider.refresh === "function") {
            await fileTreeProvider.refresh();
            vscode16.window.showInformationMessage("File tree refreshed");
          } else {
            vscode16.window.showWarningMessage("File tree provider not available");
          }
        } catch (err) {
          vscode16.window.showErrorMessage(`Error refreshing file tree: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/agentCommands.ts
import * as vscode17 from "vscode";
var registerAgentCommands = (agentProvider, chatProvider) => {
  const disposables = [];
  disposables.push(
    vscode17.commands.registerCommand(
      "testeranto.refreshAgents",
      async () => {
        try {
          if (agentProvider && typeof agentProvider.refresh === "function") {
            await agentProvider.refresh();
            vscode17.window.showInformationMessage("Agents refreshed");
          } else {
            vscode17.window.showWarningMessage("Agent provider not available");
          }
        } catch (err) {
          vscode17.window.showErrorMessage(`Error refreshing agents: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode17.commands.registerCommand(
      "testeranto.launchAgent",
      async (agentName) => {
        try {
          vscode17.window.showInformationMessage(`Launching ${agentName} agent...`);
          const url = ApiUtils.getUrl("launchAgent", { agentName });
          const response2 = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (response2.ok) {
            const data = await response2.json();
            vscode17.window.showInformationMessage(`${agentName} agent launched with suffix: ${data.suffix}`);
            if (agentProvider && typeof agentProvider.refresh === "function") {
              await agentProvider.refresh();
            }
          } else {
            vscode17.window.showErrorMessage(`Failed to launch ${agentName} agent: ${response2.statusText}`);
          }
        } catch (err) {
          vscode17.window.showErrorMessage(`Error launching agent: ${err}`);
        }
      }
    )
  );
  disposables.push(
    vscode17.commands.registerCommand(
      "testeranto.openAgentWebview",
      async (agentName, suffix) => {
        try {
          const baseUrl = ApiUtils.getBaseUrl();
          const url = `${baseUrl}/${agentName}`;
          if (suffix && suffix !== "undefined") {
            const instanceUrl = `${baseUrl}/${agentName}/${suffix}`;
            vscode17.env.openExternal(vscode17.Uri.parse(instanceUrl));
          } else {
            vscode17.env.openExternal(vscode17.Uri.parse(url));
          }
          vscode17.window.showInformationMessage(`Opening ${agentName} agent in browser...`);
        } catch (err) {
          vscode17.window.showErrorMessage(`Error opening agent webview: ${err}`);
        }
      }
    )
  );
  return disposables;
};

// src/vscode/commands/serverCommands.ts
import * as vscode18 from "vscode";
var registerServerCommands = (statusBarManager, runtimeProvider) => {
  const disposables = [];
  disposables.push(
    vscode18.commands.registerCommand("testeranto.refresh", async () => {
      vscode18.window.showInformationMessage("Refreshing all Testeranto views...");
      await statusBarManager.updateServerStatus();
      if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
        runtimeProvider.refresh();
      }
    })
  );
  disposables.push(
    vscode18.commands.registerCommand("testeranto.retryConnection", (provider) => {
      vscode18.window.showInformationMessage("Retrying connection to server...");
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
        vscode18.window.showWarningMessage("Provider does not support WebSocket reconnection");
      }
    })
  );
  disposables.push(
    vscode18.commands.registerCommand("testeranto.startServer", async () => {
      vscode18.window.showInformationMessage("Starting Testeranto server...");
      const terminal = vscode18.window.createTerminal("Testeranto Server");
      terminal.show();
      const workspaceFolders = vscode18.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        terminal.sendText(`cd "${workspacePath}" && npm start`);
      } else {
        terminal.sendText("npm start");
      }
      vscode18.window.showInformationMessage("Server starting in terminal. It may take a few moments...");
      setTimeout(async () => {
        await statusBarManager.updateServerStatus();
        if (runtimeProvider && typeof runtimeProvider.refresh === "function") {
          runtimeProvider.refresh();
        }
      }, 5e3);
    })
  );
  disposables.push(
    vscode18.commands.registerCommand("testeranto.checkServerStatus", async () => {
      try {
        const response2 = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 2e3);
        if (response2.ok) {
          vscode18.window.showInformationMessage("\u2705 Server is running and reachable");
        } else {
          vscode18.window.showWarningMessage(`\u26A0\uFE0F Server responded with status: ${response2.status}`);
        }
      } catch (error) {
        vscode18.window.showErrorMessage(`\u274C Cannot connect to server: ${error.message}`);
      }
    })
  );
  disposables.push(
    vscode18.commands.registerCommand("testeranto.checkLockStatus", async () => {
      try {
        const url = ApiUtils.getUrl("getLockStatus");
        const response2 = await fetch(url);
        if (response2.ok) {
          const data = await response2.json();
          if (data.hasLockedFiles) {
            vscode18.window.showInformationMessage(
              `Files are locked: ${data.lockedCount} file(s) locked for system restart`,
              { modal: false }
            );
          } else {
            vscode18.window.showInformationMessage(
              "All files are unlocked and available for testing",
              { modal: false }
            );
          }
        } else {
          vscode18.window.showErrorMessage("Failed to fetch lock status from server");
        }
      } catch (err) {
        vscode18.window.showErrorMessage(`Error checking lock status: ${err}`);
      }
    })
  );
  return disposables;
};

// src/vscode/commands/configCommands.ts
import * as vscode19 from "vscode";
var registerConfigCommands = () => {
  const disposables = [];
  disposables.push(
    vscode19.commands.registerCommand(
      "testeranto.openConfig",
      async () => {
        try {
          const uri = vscode19.Uri.file("allTests.ts");
          const doc = await vscode19.workspace.openTextDocument(uri);
          await vscode19.window.showTextDocument(doc);
        } catch (err) {
          vscode19.window.showWarningMessage("Could not open allTests.ts configuration file");
        }
      }
    )
  );
  disposables.push(
    vscode19.commands.registerCommand(
      "testeranto.openTesterantoConfig",
      async () => {
        try {
          const workspaceFolders = vscode19.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri;
            const configUri = vscode19.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
            try {
              const doc = await vscode19.workspace.openTextDocument(configUri);
              await vscode19.window.showTextDocument(doc);
            } catch (err) {
              const alternativePaths = [
                vscode19.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                vscode19.Uri.file("testeranto/testeranto.ts"),
                vscode19.Uri.file("testeranto.ts")
              ];
              let opened = false;
              for (const uri of alternativePaths) {
                try {
                  const doc = await vscode19.workspace.openTextDocument(uri);
                  await vscode19.window.showTextDocument(doc);
                  opened = true;
                  break;
                } catch (e) {
                }
              }
              if (!opened) {
                const files = await vscode19.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                if (files.length > 0) {
                  const doc = await vscode19.workspace.openTextDocument(files[0]);
                  await vscode19.window.showTextDocument(doc);
                } else {
                  vscode19.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                }
              }
            }
          } else {
            vscode19.window.showWarningMessage("No workspace folder open");
          }
        } catch (err) {
          vscode19.window.showErrorMessage(`Error opening testeranto config: ${err}`);
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
import * as vscode21 from "vscode";
var showProcessLogs = () => {
  return vscode21.commands.registerCommand(
    "testeranto.showProcessLogs",
    async (processId, processName) => {
      try {
        const outputChannel = vscode21.window.createOutputChannel(`Process: ${processName || processId}`);
        outputChannel.show(true);
        const response2 = await fetch(ApiUtils.getProcessLogsUrl(processId));
        if (!response2.ok) {
          throw new Error(`HTTP ${response2.status}: ${response2.statusText}`);
        }
        const data = await response2.json();
        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
        outputChannel.appendLine(`Process ID: ${processId}`);
        outputChannel.appendLine(`
=== End of logs ===`);
      } catch (err) {
        vscode21.window.showErrorMessage(`Error fetching process logs: ${err}`);
      }
    }
  );
};

// src/vscode/providers/utils/openFile.ts
import * as vscode22 from "vscode";
import * as path3 from "path";
var openFile = () => {
  return vscode22.commands.registerCommand(
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
        vscode22.window.showErrorMessage("Cannot open file: Invalid argument");
        return;
      }
      console.log("[CommandManager] Opening file:", fileName);
      const workspaceFolders = vscode22.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        let fileUri;
        if (fileName.startsWith("/")) {
          fileUri = vscode22.Uri.file(fileName);
        } else {
          fileUri = vscode22.Uri.joinPath(workspaceRoot, fileName);
        }
        console.log("[CommandManager] File URI:", fileUri.toString());
        try {
          const doc = await vscode22.workspace.openTextDocument(fileUri);
          await vscode22.window.showTextDocument(doc);
          console.log("[CommandManager] File opened successfully");
        } catch (err) {
          console.error("[CommandManager] Error opening file:", err);
          const files = await vscode22.workspace.findFiles(`**/${path3.basename(fileName)}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode22.workspace.openTextDocument(files[0]);
            await vscode22.window.showTextDocument(doc);
          } else {
            vscode22.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      } else {
        vscode22.window.showWarningMessage("No workspace folder open");
      }
    }
  );
};

// src/vscode/providers/utils/openServerWebview.ts
import * as vscode23 from "vscode";

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
  return vscode23.commands.registerCommand("testeranto.openServerWebview", async () => {
    try {
      const workspaceFolders = vscode23.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode23.window.showErrorMessage("No workspace folder open");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri;
      const reportHtmlUri = vscode23.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.html");
      try {
        await vscode23.workspace.fs.stat(reportHtmlUri);
      } catch (error) {
        vscode23.window.showWarningMessage("Report file not found. Starting server to generate it...");
        await vscode23.commands.executeCommand("testeranto.startServer");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      }
      const panel = vscode23.window.createWebviewPanel(
        "testerantoServer",
        "Testeranto Server Report",
        vscode23.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode23.Uri.joinPath(workspaceRoot, "testeranto", "reports")]
        }
      );
      let htmlContent;
      try {
        const fileContent = await vscode23.workspace.fs.readFile(reportHtmlUri);
        htmlContent = Buffer.from(fileContent).toString("utf-8");
      } catch (error) {
        htmlContent = getFallbackHtmlContent();
      }
      const reportJsUri = panel.webview.asWebviewUri(
        vscode23.Uri.joinPath(workspaceRoot, "testeranto", "reports", "index.js")
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
              vscode23.window.showErrorMessage(message.text);
              return;
            case "refresh":
              vscode23.workspace.fs.readFile(reportHtmlUri).then((fileContent) => {
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
      vscode23.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
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
  viewTreeProvider;
  agentProvider;
  chatProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
    this.dockerProcessProvider = null;
    this.aiderProcessProvider = null;
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
  setAiderProcessProvider(provider) {
    this.aiderProcessProvider = provider;
  }
  setFileTreeProvider(provider) {
    this.fileTreeProvider = provider;
  }
  setViewTreeProvider(provider) {
    this.viewTreeProvider = provider;
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
      this.agentProvider,
      this.viewTreeProvider
    );
    const testCommand = vscode25.commands.registerCommand("testeranto.testLogging", () => {
      vscode25.window.showInformationMessage("Testeranto test command works!");
      console.log("[Testeranto] Test command executed successfully");
    });
    disposables.push(testCommand);
    return disposables;
  }
};

// src/vscode/extension/registerCommands.ts
function registerCommands2(context, terminalManager, statusBarManager, providers, outputChannel) {
  outputChannel.appendLine("[Testeranto] Creating CommandManager...");
  const commandManager = new CommandManager(terminalManager, statusBarManager);
  commandManager.setRuntimeProvider(providers.runtimeProvider);
  commandManager.setDockerProcessProvider(providers.dockerProcessProvider);
  commandManager.setAiderProcessProvider(providers.aiderProcessProvider);
  commandManager.setFileTreeProvider(providers.fileTreeProvider);
  commandManager.setViewTreeProvider(providers.viewTreeProvider);
  commandManager.setAgentProvider(providers.agentProvider);
  const commandDisposables = commandManager.registerCommands(
    context,
    terminalManager,
    providers.runtimeProvider,
    statusBarManager,
    providers.dockerProcessProvider,
    providers.aiderProcessProvider,
    providers.fileTreeProvider
  );
  outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");
  return { commandManager, commandDisposables };
}

// src/vscode/extension/registerTreeViews.ts
import * as vscode27 from "vscode";
function registerTreeViews(providers, context, outputChannel) {
  outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
  vscode27.window.registerTreeDataProvider("testeranto.runtimeView", providers.runtimeProvider);
  vscode27.window.registerTreeDataProvider("testeranto.dockerProcessView", providers.dockerProcessProvider);
  vscode27.window.registerTreeDataProvider("testeranto.aiderProcessView", providers.aiderProcessProvider);
  vscode27.window.registerTreeDataProvider("testeranto.fileTreeView", providers.fileTreeProvider);
  vscode27.window.registerTreeDataProvider("testeranto.viewView", providers.viewTreeProvider);
  vscode27.window.registerTreeDataProvider("testeranto.agentView", providers.agentProvider);
  outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");
  outputChannel.appendLine("[Testeranto] Creating tree views...");
  const runtimeTreeView = vscode27.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: providers.runtimeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");
  const dockerProcessTreeView = vscode27.window.createTreeView("testeranto.dockerProcessView", {
    treeDataProvider: providers.dockerProcessProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");
  const aiderProcessTreeView = vscode27.window.createTreeView("testeranto.aiderProcessView", {
    treeDataProvider: providers.aiderProcessProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");
  const fileTreeView = vscode27.window.createTreeView("testeranto.fileTreeView", {
    treeDataProvider: providers.fileTreeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] File tree view created successfully");
  const viewTreeView = vscode27.window.createTreeView("testeranto.viewView", {
    treeDataProvider: providers.viewTreeProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] View tree view created successfully");
  const agentTreeView = vscode27.window.createTreeView("testeranto.agentView", {
    treeDataProvider: providers.agentProvider,
    showCollapseAll: true
  });
  outputChannel.appendLine("[Testeranto] Agent tree view created successfully");
  outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
  context.subscriptions.push(
    runtimeTreeView,
    dockerProcessTreeView,
    aiderProcessTreeView,
    fileTreeView,
    viewTreeView,
    agentTreeView
  );
  outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");
}

// src/vscode/extension/testProviders.ts
import "vscode";
async function testProviders(providers, outputChannel) {
  outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
  try {
    const runtimeChildren = await providers.runtimeProvider.getChildren();
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
    const dockerChildren = await providers.dockerProcessProvider.getChildren();
    outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);
  } catch (error) {
    outputChannel.appendLine(`[Testeranto] dockerProcessProvider error (non-fatal): ${error}`);
  }
  try {
    const fileChildren = await providers.fileTreeProvider.getChildren();
    outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
  } catch (error) {
    outputChannel.appendLine(`[Testeranto] fileTreeProvider error (non-fatal): ${error}`);
  }
  try {
    const viewChildren = await providers.viewTreeProvider.getChildren();
    outputChannel.appendLine(`[Testeranto] viewTreeProvider.getChildren() returned ${viewChildren?.length || 0} items`);
  } catch (error) {
    outputChannel.appendLine(`[Testeranto] viewTreeProvider error (non-fatal): ${error}`);
  }
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
  refreshIfPossible(providers.aiderProcessProvider, "aiderProcessProvider");
  refreshIfPossible(providers.fileTreeProvider, "fileTreeProvider");
  refreshIfPossible(providers.viewTreeProvider, "viewTreeProvider");
  refreshIfPossible(providers.agentProvider, "agentProvider");
  outputChannel.appendLine("[Testeranto] Tree data providers refreshed");
}

// src/vscode/extension/registerAdditionalCommands.ts
import * as vscode30 from "vscode";
function registerAdditionalCommands(context, outputChannel, terminalManager) {
  registerCheckServerCommand(context);
  registerOpenProcessTerminalCommand(context, outputChannel, terminalManager);
  registerOpenViewCommand(context, outputChannel);
  registerOpenChatCommand(context, outputChannel);
}
function registerCheckServerCommand(context) {
  const checkServerCommand = vscode30.commands.registerCommand("testeranto.checkServer", async () => {
    try {
      const response2 = await fetch("http://localhost:3000/~/configs", {
        method: "GET",
        signal: AbortSignal.timeout?.(3e3) || (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3e3);
          return controller.signal;
        })()
      });
      if (response2.ok) {
        vscode30.window.showInformationMessage("\u2705 Testeranto server is running");
      } else {
        vscode30.window.showWarningMessage("\u26A0\uFE0F Server responded with error: " + response2.status);
      }
    } catch (error) {
      vscode30.window.showErrorMessage("\u274C Cannot connect to Testeranto server. Make sure it is running on port 3000.");
    }
  });
  context.subscriptions.push(checkServerCommand);
}
function registerOpenProcessTerminalCommand(context, outputChannel, terminalManager) {
  const openProcessTerminalCommand = vscode30.commands.registerCommand("testeranto.openProcessTerminal", async (nodeId, label, containerId, serviceName) => {
    try {
      outputChannel.appendLine(`[Testeranto] Opening terminal for process: ${nodeId || "unknown"}`);
      if (!nodeId) {
        vscode30.window.showWarningMessage("No process node ID provided");
        return;
      }
      await terminalManager.openProcessTerminal(nodeId, label || "Process", containerId || "", serviceName || "");
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Error opening process terminal: ${error.message}`);
      vscode30.window.showErrorMessage(`Failed to open process terminal: ${error.message}`);
    }
  });
  context.subscriptions.push(openProcessTerminalCommand);
}
function registerOpenViewCommand(context, outputChannel) {
  const openViewCommand = vscode30.commands.registerCommand("testeranto.openView", async (viewKey, viewUrl) => {
    try {
      outputChannel.appendLine(`[Testeranto] Opening view: ${viewKey || "unknown"}`);
      if (!viewKey) {
        vscode30.window.showWarningMessage("No view key provided");
        return;
      }
      const actualViewUrl = viewUrl || `http://localhost:3000/testeranto/views/${viewKey}.html`;
      const panel = vscode30.window.createWebviewPanel(
        `testeranto.view.${viewKey}`,
        `View: ${viewKey}`,
        vscode30.ViewColumn.One,
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
      vscode30.window.showErrorMessage(`Failed to open view: ${error.message}`);
    }
  });
  context.subscriptions.push(openViewCommand);
}
function registerOpenChatCommand(context, outputChannel) {
  const openChatCommand = vscode30.commands.registerCommand("testeranto.openChat", async () => {
    try {
      outputChannel.appendLine("[Testeranto] Opening group chat");
      const panel = vscode30.window.createWebviewPanel(
        "testeranto.chat",
        "Testeranto Group Chat",
        vscode30.ViewColumn.One,
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
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
                        .message { margin-bottom: 10px; }
                        .message .sender { font-weight: bold; }
                        .message .time { font-size: 0.8em; color: #666; }
                        #messageInput { width: 70%; padding: 5px; }
                        #sendButton { padding: 5px 10px; }
                    </style>
                </head>
                <body>
                    <h1>Testeranto Group Chat</h1>
                    <div id="messages"></div>
                    <input type="text" id="messageInput" placeholder="Type a message...">
                    <button id="sendButton">Send</button>
                    <script>
                        const vscode = acquireVsCodeApi();
                        const messagesDiv = document.getElementById('messages');
                        const messageInput = document.getElementById('messageInput');
                        const sendButton = document.getElementById('sendButton');
                        
                        function addMessage(sender, text, time) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message';
                            messageDiv.innerHTML = \`
                                <div class="sender">\${sender}</div>
                                <div class="text">\${text}</div>
                                <div class="time">\${time}</div>
                            \`;
                            messagesDiv.appendChild(messageDiv);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                        
                        sendButton.addEventListener('click', () => {
                            const text = messageInput.value.trim();
                            if (text) {
                                vscode.postMessage({
                                    command: 'sendMessage',
                                    text: text
                                });
                                messageInput.value = '';
                            }
                        });
                        
                        messageInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                sendButton.click();
                            }
                        });
                        
                        window.addEventListener('message', event => {
                            const message = event.data;
                            if (message.command === 'receiveMessage') {
                                addMessage(message.sender, message.text, message.time);
                            }
                        });
                        
                        addMessage('System', 'Chat started. Messages are not persisted yet.', new Date().toLocaleTimeString());
                    </script>
                </body>
                </html>
            `;
      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.command === "sendMessage") {
            outputChannel.appendLine(`[Testeranto] Chat message: ${message.text}`);
            panel.webview.postMessage({
              command: "receiveMessage",
              sender: "You",
              text: message.text,
              time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
            });
          }
        },
        void 0,
        context.subscriptions
      );
    } catch (error) {
      outputChannel.appendLine(`[Testeranto] Error opening chat: ${error.message}`);
      vscode30.window.showErrorMessage(`Failed to open chat: ${error.message}`);
    }
  });
  context.subscriptions.push(openChatCommand);
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
      providers.aiderProcessProvider.dispose?.();
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

// src/vscode/extension/handleActivationError.ts
import * as vscode32 from "vscode";
function handleActivationError(error, outputChannel) {
  outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
  outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
  vscode32.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
  console.error("[Testeranto] Extension activation failed:", error);
}

// src/vscode/extension/ExtensionActivatorCore.ts
async function activateExtension(context) {
  console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");
  const outputChannel = createOutputChannel();
  outputChannel.show(true);
  outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");
  try {
    vscode33.window.showInformationMessage("Testeranto extension is loading...");
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
    vscode33.window.showInformationMessage("Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.");
    registerAdditionalCommands(context, outputChannel, terminalManager);
    registerTreeViews(providers, context, outputChannel);
    await testProviders(providers, outputChannel);
    refreshProviders(providers, outputChannel);
    setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables);
    outputChannel.appendLine("[Testeranto] Extension activated successfully");
    console.log("[Testeranto] Extension activated successfully");
  } catch (error) {
    handleActivationError(error, outputChannel);
  }
  outputChannel.appendLine("[Testeranto] Extension activation function completed");
}

// src/vscode/extension/ExtensionActivator.ts
var ExtensionActivator = class {
  async activate(context) {
    await activateExtension(context);
  }
};

// src/vscode/extension.ts
async function activate(context) {
  const activator = new ExtensionActivator();
  await activator.activate(context);
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
