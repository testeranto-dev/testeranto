// src/vscode/extension.ts
import * as vscode10 from "vscode";

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
      try {
        const response = await fetch("http://localhost:3000/~/configs");
        if (response.ok) {
          const data = await response.json();
          terminal.sendText(`echo "Available configs:"`);
          if (data.configs && data.configs.runtimes) {
            for (const [key2, value] of Object.entries(data.configs.runtimes)) {
              const config = value;
              terminal.sendText(`echo "  ${key2}: runtime=${config.runtime}, tests=${JSON.stringify(config.tests || [])}"`);
            }
          }
        }
      } catch (error) {
      }
      terminal.sendText(`echo "Error: Could not find configuration for ${testName} (${runtime})"`);
      terminal.sendText(`echo "Trying to guess container name..."`);
      const guessedConfigKey = runtime.toLowerCase().includes("web") ? "webtests" : runtime;
      const containerName2 = this.getAiderContainerName(guessedConfigKey, testName);
      terminal.sendText(`echo "Guessed container: ${containerName2}"`);
      terminal.sendText(`docker exec -it ${containerName2} /bin/bash || echo "Failed to connect to container"`);
      terminal.show();
      return terminal;
    }
    const containerName = this.getAiderContainerName(configKey, testName);
    const workspaceRoot = this.getWorkspaceRoot();
    if (workspaceRoot) {
      terminal.sendText(`echo "=== Testeranto Aider Session ==="`);
      terminal.sendText(`echo "Test: ${testName}"`);
      terminal.sendText(`echo "Runtime: ${runtime}"`);
      terminal.sendText(`echo "Config: ${configKey}"`);
      terminal.sendText(`echo "Container: ${containerName}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "1. Checking if container is running..."`);
      terminal.sendText(`if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then echo "   \u2713 Container is running"; else echo "   \u26A0 Container not running, starting..." && docker compose -f "${workspaceRoot}/testeranto/docker-compose.yml" up -d ${containerName} && sleep 2; fi`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "2. Checking for aider message file..."`);
      const messageFilePath = `${workspaceRoot}/testeranto/reports/${configKey}/${testName}/aider-message.txt`;
      terminal.sendText(`if [ -f "${messageFilePath}" ]; then echo "   \u2713 Found aider message file at ${messageFilePath}"; else echo "   \u26A0 Aider message file not found at ${messageFilePath}"; fi`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "3. Starting interactive aider session..."`);
      terminal.sendText(`echo "   Type 'exit' to leave the container shell"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`docker exec -it ${containerName} /bin/bash -c "cd /workspace && echo 'Welcome to the aider container for ${testName}!' && echo '' && echo 'To start aider with the message file, run:' && echo '  cat /workspace/testeranto/reports/${configKey}/${testName}/aider-message.txt | aider --yes' && echo '' && echo 'Or start aider normally:' && echo '  aider' && echo '' && echo 'Current directory: $(pwd)' && echo 'Files in current directory:' && ls -la && echo '' && /bin/bash"`);
    } else {
      terminal.sendText(`echo "Error: Could not determine workspace root"`);
      terminal.sendText(`echo "Trying to connect to container ${containerName}..."`);
      terminal.sendText(`docker exec -it ${containerName} /bin/bash`);
    }
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
      const response = await fetch("http://localhost:3000/~/configs");
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
    const testFileName = testName.split("/").pop() || testName;
    const cleanTestName = testFileName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-").replace(/[^a-z0-9_-]/g, "");
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
  const response = await fetch("http://localhost:3000/~/configs");
  const data = await response.json();
  configData = data;
  return data;
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
function createNoFilesItem(runtime, testName) {
  return [
    new TestTreeItem(
      "No files found for this test",
      2 /* File */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtime,
        testName,
        description: `Check server logs for ${runtime}/${testName}`
      },
      void 0,
      new vscode3.ThemeIcon("info")
    ),
    new TestTreeItem(
      "Click to refresh",
      3 /* Info */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtime,
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
function createErrorItems(runtime, testName, error) {
  return [
    new TestTreeItem(
      "Error loading files",
      2 /* File */,
      vscode3.TreeItemCollapsibleState.None,
      {
        runtime,
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
        runtime,
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
function filterTreeForRuntimeAndTest(tree, runtime, testName) {
  console.log(
    `[treeFilter] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`
  );
  const filterNode = (node) => {
    if (!node) {
      console.log(`[DEBUG] filterNode: node is null`);
      return null;
    }
    console.log(
      `[DEBUG] filterNode: type=${node.type}, testName=${node.testName}, feature=${node.feature}`
    );
    if (node.type === "file") {
      if (node.testName === testName) {
        console.log(`[DEBUG] filterNode: file matches testName`);
        return node;
      }
      if (node.tests && node.tests.includes(testName)) {
        console.log(`[DEBUG] filterNode: file matches testName in array`);
        return node;
      }
      console.log(`[DEBUG] filterNode: file doesn't match testName`);
      return null;
    } else if (node.type === "feature") {
      if (node.testName === testName) {
        console.log(
          `[DEBUG] filterNode: feature matches testName: ${node.feature}`
        );
        return node;
      }
      console.log(`[DEBUG] filterNode: feature doesn't match testName`);
      return null;
    } else if (node.type === "directory") {
      console.log(
        `[DEBUG] filterNode: processing directory with ${Object.keys(node.children || {}).length} children`
      );
      const filteredChildren = {};
      for (const [childName, child] of Object.entries(node.children || {})) {
        const filteredChild = filterNode(child);
        if (filteredChild !== null) {
          filteredChildren[childName] = filteredChild;
        }
      }
      if (Object.keys(filteredChildren).length > 0) {
        console.log(
          `[DEBUG] filterNode: directory has ${Object.keys(filteredChildren).length} filtered children`
        );
        return {
          type: "directory",
          children: filteredChildren
        };
      }
      console.log(`[DEBUG] filterNode: directory has no matching children`);
      return null;
    }
    console.log(`[DEBUG] filterNode: unknown node type: ${node.type}`);
    return null;
  };
  if (tree.type === "directory" && tree.children) {
    const filteredRoot = filterNode(tree);
    if (filteredRoot && filteredRoot.children) {
      return filteredRoot.children;
    }
    return {};
  }
  const result = {};
  for (const [name, node] of Object.entries(tree)) {
    const filteredNode = filterNode(node);
    if (filteredNode !== null) {
      result[name] = filteredNode;
    }
  }
  console.log(
    `[treeFilter] Filtered tree has ${Object.keys(result).length} top-level items`
  );
  return result;
}

// src/vscode/providers/utils/testTree/treeConverter.ts
import * as vscode4 from "vscode";
import * as path from "path";
function convertTreeToItems(tree, runtime, testName) {
  const items = [];
  const createFileItem = (file) => {
    const fileName = path.basename(file.path);
    let fileUri;
    const workspaceFolders = vscode4.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      let filePath = file.path;
      if (filePath.startsWith("/")) {
        fileUri = vscode4.Uri.file(filePath);
      } else {
        fileUri = vscode4.Uri.joinPath(workspaceRoot, filePath);
      }
    }
    let icon;
    if (file.fileType === "source") {
      icon = new vscode4.ThemeIcon("file-code");
    } else if (file.fileType === "documentation") {
      icon = new vscode4.ThemeIcon("book");
    } else if (file.fileType === "log") {
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
    } else if (file.fileType === "test-results") {
      icon = new vscode4.ThemeIcon("json");
    } else if (file.fileType === "input") {
      icon = new vscode4.ThemeIcon(
        "arrow-down",
        new vscode4.ThemeColor("testing.iconQueued")
      );
    } else if (file.fileType === "output") {
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
      if (nodeName === "source" || nodeName === "output") {
        console.log(
          `[DEBUG] Creating directory item for ${nodeName === "source" ? "Source Files" : "Output Files"}`
        );
        items.push(
          createDirectoryItem(
            nodeName === "source" ? "Source Files" : "Output Files",
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
function logTreeStructure(node, depth) {
  const indent = "  ".repeat(depth);
  if (typeof node === "object" && node !== null) {
    console.log(
      `${indent}type: ${node.type}, name: ${node.name || "N/A"}, feature: ${node.feature || "N/A"}`
    );
    if (node.children && typeof node.children === "object") {
      console.log(`${indent}children:`);
      for (const [key, child] of Object.entries(node.children)) {
        console.log(`${indent}  ${key}:`);
        logTreeStructure(child, depth + 2);
      }
    }
  } else {
    console.log(`${indent}${node}`);
  }
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
    const response = await fetch("http://localhost:3000/~/collated-files");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    const tree = data.tree || {};
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
    fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] Initial HTTP fetch failed:", error);
    });
    this.setupConfigWatcher();
  }
  refresh() {
    console.log("[TestTreeDataProvider] Manual refresh requested");
    fetchConfigsViaHttp().catch((error) => {
      console.log("[TestTreeDataProvider] HTTP refresh failed:", error);
    }).then(() => {
      this._onDidChangeTreeData.fire();
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
      const { runtime, testName } = element.data || {};
      return this.getTestFileItems(runtime, testName);
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
    items.push(createRefreshItem());
    const configData2 = getConfigData();
    if (configData2 && configData2.configs && configData2.configs.runtimes) {
      const runtimes = configData2.configs.runtimes;
      const runtimeEntries = Object.entries(runtimes);
      if (runtimeEntries.length > 0) {
        items.push(createRuntimeCountItem(runtimeEntries.length));
        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig;
          if (config.runtime) {
            items.push(createRuntimeItem(runtimeKey, config));
          }
        }
      }
    }
    return items;
  }
  getTestItems(runtime) {
    if (!runtime) {
      return [];
    }
    const configData2 = getConfigData();
    if (configData2 && configData2.configs && configData2.configs.runtimes) {
      const runtimes = configData2.configs.runtimes;
      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          return tests.map((testName) => {
            return createTestItem(runtimeKey, testName);
          });
        }
      }
    }
    return [];
  }
  async getTestFileItems(runtime, testName) {
    try {
      console.log(
        `[TestTreeDataProvider] Fetching collated files for ${runtime}/${testName}`
      );
      const response = await fetch("http://localhost:3000/~/collated-files");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(
        `[TestTreeDataProvider] Received collated files data:`,
        data
      );
      const tree = data.tree || {};
      console.log(`[TestTreeDataProvider] Tree keys:`, Object.keys(tree));
      const filteredTree = filterTreeForRuntimeAndTest(
        tree,
        runtime,
        testName
      );
      console.log(
        `[TestTreeDataProvider] Filtered tree keys:`,
        Object.keys(filteredTree)
      );
      logTreeStructure(filteredTree, 0);
      const fileItems = convertTreeToItems(
        filteredTree,
        runtime,
        testName
      );
      console.log(
        `[TestTreeDataProvider] Converted ${fileItems.length} file items`
      );
      if (fileItems.length > 0) {
        return fileItems;
      }
      return createNoFilesItem(runtime, testName);
    } catch (error) {
      console.error(
        "[TestTreeDataProvider] Error fetching collated files:",
        error
      );
      return createErrorItems(runtime, testName, error);
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

// src/vscode/statusBarManager.ts
import * as vscode8 from "vscode";
var StatusBarManager = class {
  mainStatusBarItem;
  serverStatusBarItem;
  constructor() {
    this.mainStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 100);
    this.serverStatusBarItem = vscode8.window.createStatusBarItem(vscode8.StatusBarAlignment.Right, 99);
  }
  initialize() {
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
  async updateServerStatus() {
    try {
      const workspaceFolders = vscode8.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        const configUri = vscode8.Uri.joinPath(workspaceRoot, "testeranto", "extension-config.json");
        try {
          const fileContent = await vscode8.workspace.fs.readFile(configUri);
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
            this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
            console.log("[Testeranto] Server status: Not running (config indicates server is stopped)");
          }
        } catch (error) {
          this.serverStatusBarItem.text = "$(circle-slash) Server";
          this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
          this.serverStatusBarItem.backgroundColor = new vscode8.ThemeColor("statusBarItem.warningBackground");
          console.log("[Testeranto] Server status: Not running (config file not found or invalid):", error);
        }
      } else {
        console.log("[Testeranto] No workspace folder open");
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
  }
};

// src/vscode/commandManager.ts
import * as vscode9 from "vscode";
import * as path2 from "path";
var CommandManager = class {
  terminalManager;
  statusBarManager;
  runtimeProvider;
  constructor(terminalManager, statusBarManager) {
    this.terminalManager = terminalManager;
    this.statusBarManager = statusBarManager;
    this.runtimeProvider = null;
  }
  setRuntimeProvider(provider) {
    this.runtimeProvider = provider;
  }
  registerCommands(context) {
    const disposables = [];
    disposables.push(
      vscode9.commands.registerCommand(
        "testeranto.showTests",
        () => {
          vscode9.window.showInformationMessage("Showing Testeranto Dashboard");
          vscode9.commands.executeCommand("testeranto.unifiedView.focus");
        }
      )
    );
    disposables.push(
      vscode9.commands.registerCommand(
        "testeranto.runTest",
        async (item) => {
          if (item.type === 1 /* Test */) {
            const { runtime, testName } = item.data || {};
            vscode9.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
            const terminal = this.terminalManager.showTerminal(runtime, testName);
            if (terminal) {
              vscode9.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
            } else {
              vscode9.window.showWarningMessage(`Terminal for ${testName} not found`);
            }
          }
        }
      )
    );
    disposables.push(
      vscode9.commands.registerCommand(
        "testeranto.launchAiderTerminal",
        async (data) => {
          let runtime;
          let testName;
          if (data && typeof data === "object") {
            runtime = data.runtimeKey || data.runtime;
            testName = data.testName;
          } else {
            vscode9.window.showErrorMessage("Cannot launch aider: Invalid test data");
            return;
          }
          if (!runtime || !testName) {
            vscode9.window.showErrorMessage("Cannot launch aider: Missing runtime or test name");
            return;
          }
          vscode9.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
          const terminal = await this.terminalManager.createAiderTerminal(runtime, testName);
          terminal.show();
        }
      )
    );
    disposables.push(
      vscode9.commands.registerCommand(
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
      )
    );
    disposables.push(
      vscode9.commands.registerCommand(
        "testeranto.openFile",
        async (item) => {
          if (item.type === 2 /* File */) {
            const fileName = item.data?.fileName || item.label;
            const workspaceFolders = vscode9.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
              const workspaceRoot = workspaceFolders[0].uri;
              let fileUri;
              if (fileName.startsWith("/")) {
                fileUri = vscode9.Uri.file(fileName);
              } else {
                fileUri = vscode9.Uri.joinPath(workspaceRoot, fileName);
              }
              try {
                const doc = await vscode9.workspace.openTextDocument(fileUri);
                await vscode9.window.showTextDocument(doc);
              } catch (err) {
                const files = await vscode9.workspace.findFiles(`**/${path2.basename(fileName)}`, null, 1);
                if (files.length > 0) {
                  const doc = await vscode9.workspace.openTextDocument(files[0]);
                  await vscode9.window.showTextDocument(doc);
                } else {
                  vscode9.window.showWarningMessage(`Could not open file: ${fileName}`);
                }
              }
            } else {
              vscode9.window.showWarningMessage("No workspace folder open");
            }
          }
        }
      )
    );
    disposables.push(
      vscode9.commands.registerCommand("testeranto.refresh", async () => {
        vscode9.window.showInformationMessage("Refreshing all Testeranto views...");
        await this.statusBarManager.updateServerStatus();
        if (this.runtimeProvider && typeof this.runtimeProvider.refresh === "function") {
          this.runtimeProvider.refresh();
        }
      })
    );
    disposables.push(
      vscode9.commands.registerCommand("testeranto.retryConnection", (provider) => {
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
      })
    );
    disposables.push(
      vscode9.commands.registerCommand("testeranto.startServer", async () => {
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
          await this.statusBarManager.updateServerStatus();
          if (this.runtimeProvider && typeof this.runtimeProvider.refresh === "function") {
            this.runtimeProvider.refresh();
          }
        }, 5e3);
      })
    );
    return disposables;
  }
};

// src/vscode/extension.ts
function activate(context) {
  const terminalManager = new TerminalManager();
  terminalManager.createAllTerminals();
  const statusBarManager = new StatusBarManager();
  statusBarManager.initialize();
  statusBarManager.updateServerStatus();
  const runtimeProvider = new TestTreeDataProvider();
  const commandManager = new CommandManager(terminalManager, statusBarManager);
  commandManager.setRuntimeProvider(runtimeProvider);
  const commandDisposables = commandManager.registerCommands(context);
  const runtimeTreeView = vscode10.window.createTreeView("testeranto.runtimeView", {
    treeDataProvider: runtimeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push({
    dispose: () => {
      terminalManager.disposeAll();
      runtimeProvider.dispose();
      statusBarManager.dispose();
    }
  });
  context.subscriptions.push(
    ...commandDisposables,
    runtimeTreeView,
    statusBarManager.getMainStatusBarItem(),
    statusBarManager.getServerStatusBarItem()
  );
  console.log("[Testeranto] Extension activated successfully");
}
function deactivate() {
  console.log("[Testeranto] Extension deactivated");
}
export {
  activate,
  deactivate
};
