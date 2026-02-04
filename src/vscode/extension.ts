import * as vscode from "vscode";
import { TerminalManager } from "./TerminalManager";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
// import { FileTreeDataProvider } from "./providers/FileTreeDataProvider";
import { ProcessesTreeDataProvider } from "./providers/ProcessesTreeDataProvider";
import { FeaturesTreeDataProvider } from "./providers/FeaturesTreeDataProvider";
import { TestTreeItem } from "./TestTreeItem";
import { TreeItemType } from "./types";

export function activate(context: vscode.ExtensionContext): void {
    console.log("[Testeranto] Extension activating...");

    // Create terminal manager
    const terminalManager = new TerminalManager();
    terminalManager.createAllTerminals();
    console.log("[Testeranto] Created terminals for all tests");

    // Create status bar items
    const mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    mainStatusBarItem.text = "$(beaker) Testeranto";
    mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
    mainStatusBarItem.command = "testeranto.showTests";
    mainStatusBarItem.show();

    const serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    serverStatusBarItem.text = "$(circle-slash) Server";
    serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
    serverStatusBarItem.command = "testeranto.startServer";
    serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    serverStatusBarItem.show();

    // Function to update server status
    const updateServerStatus = async () => {
        try {
            // Check if extension-config.json exists
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri;
                const configUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'extension-config.json');

                try {
                    const fileContent = await vscode.workspace.fs.readFile(configUri);
                    const configText = Buffer.from(fileContent).toString('utf-8');
                    const config = JSON.parse(configText);

                    // Check the serverStarted field
                    if (config.serverStarted === true) {
                        serverStatusBarItem.text = "$(check) Server";
                        serverStatusBarItem.tooltip = "Testeranto server is running. Click to restart.";
                        serverStatusBarItem.backgroundColor = undefined;
                        console.log('[Testeranto] Server status: Running (config indicates server is started)');

                        // Also check if there are any processes
                        if (config.processes && config.processes.length > 0) {
                            const runningProcesses = config.processes.filter((p: any) => p.isActive === true);
                            const stoppedProcesses = config.processes.filter((p: any) => p.isActive !== true);

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
                        serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                        console.log('[Testeranto] Server status: Not running (config indicates server is stopped)');
                    }
                } catch (error) {
                    // File doesn't exist or can't be parsed - server not running
                    serverStatusBarItem.text = "$(circle-slash) Server";
                    serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
                    serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                    console.log('[Testeranto] Server status: Not running (config file not found or invalid):', error);
                }
            } else {
                console.log('[Testeranto] No workspace folder open');
                serverStatusBarItem.text = "$(circle-slash) Server";
                serverStatusBarItem.tooltip = "No workspace folder open";
                serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            }
        } catch (error) {
            console.error('[Testeranto] Error checking server status:', error);
            serverStatusBarItem.text = "$(error) Server Error";
            serverStatusBarItem.tooltip = "Error checking server status";
            serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    };

    // Initial status check
    updateServerStatus();

    // Watch for changes to the config file
    let configWatcher: vscode.FileSystemWatcher | undefined;
    const setupConfigWatcher = () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri;
            const configPattern = new vscode.RelativePattern(workspaceRoot, 'testeranto/extension-config.json');

            // Dispose existing watcher if any
            if (configWatcher) {
                configWatcher.dispose();
            }

            configWatcher = vscode.workspace.createFileSystemWatcher(configPattern, false, false, false);

            const handleConfigChange = (uri: vscode.Uri) => {
                console.log('[Testeranto] Config file changed:', uri.fsPath);
                // Debounce to avoid multiple rapid updates
                setTimeout(() => {
                    updateServerStatus();
                    // Also refresh tree views
                    testTreeDataProvider.refresh();
                    processesTreeDataProvider.refresh();
                    featuresTreeDataProvider.refresh();
                    // fileTreeDataProvider.refresh();
                }, 100);
            };

            configWatcher.onDidChange(handleConfigChange);
            configWatcher.onDidCreate(handleConfigChange);
            configWatcher.onDidDelete(() => {
                console.log('[Testeranto] Config file deleted');
                updateServerStatus();
                testTreeDataProvider.refresh();
                processesTreeDataProvider.refresh();
                featuresTreeDataProvider.refresh();
                // fileTreeDataProvider.refresh();
            });

            context.subscriptions.push(configWatcher);
            console.log('[Testeranto] Config file watcher set up');
        }
    };

    // Set up initial watcher
    setupConfigWatcher();

    // Also watch for workspace folder changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            console.log('[Testeranto] Workspace folders changed, re-setting up config watcher');
            setupConfigWatcher();
            updateServerStatus();
        })
    );

    // No periodic HTTP polling - rely on WebSocket messages and config file watcher
    // The config file watcher will update status when the config file changes

    // Create tree data providers
    const testTreeDataProvider = new TestTreeDataProvider();
    // const fileTreeDataProvider = new FileTreeDataProvider();
    const processesTreeDataProvider = new ProcessesTreeDataProvider();
    const featuresTreeDataProvider = new FeaturesTreeDataProvider();

    // Register commands
    const showTestsCommand = vscode.commands.registerCommand(
        "testeranto.showTests",
        () => {
            vscode.window.showInformationMessage("Showing Testeranto tests");
            vscode.commands.executeCommand("testerantoTestsView.focus");
        }
    );

    const runTestCommand = vscode.commands.registerCommand(
        "testeranto.runTest",
        async (item: TestTreeItem) => {
            if (item.type === TreeItemType.Test) {
                const { runtime, testName } = item.data || {};
                vscode.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
                const terminal = terminalManager.showTerminal(runtime, testName);
                if (terminal) {
                    vscode.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
                } else {
                    vscode.window.showWarningMessage(`Terminal for ${testName} not found`);
                }
            }
        }
    );

    const aiderCommand = vscode.commands.registerCommand(
        "testeranto.aider",
        async (item: TestTreeItem) => {
            if (item.type === TreeItemType.Test) {
                const { runtime, testName } = item.data || {};
                vscode.window.showInformationMessage(`Connecting to aider process for ${testName} (${runtime})...`);
                const aiderTerminal = terminalManager.createAiderTerminal(runtime, testName);
                aiderTerminal.show();

                // Process test name to match Docker container naming convention
                let processedTestName = testName;
                // Remove file extension
                processedTestName = processedTestName?.replace(/\.[^/.]+$/, "") || "";
                // Remove 'example/' prefix if present
                processedTestName = processedTestName.replace(/^example\//, "");
                // Replace special characters with underscores (matching DockerManager)
                const sanitizedTestName = processedTestName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-");
                // Construct container name matching DockerManager's convention
                const containerName = `${runtime}-${sanitizedTestName}-aider`;

                aiderTerminal.sendText("clear");
                setTimeout(() => {
                    aiderTerminal.sendText(`echo "Connecting to aider container: ${containerName}"`);
                    aiderTerminal.sendText(`docker exec -it ${containerName} /bin/bash`);
                }, 500);
            }
        }
    );

    const openConfigCommand = vscode.commands.registerCommand(
        "testeranto.openConfig",
        async () => {
            try {
                const uri = vscode.Uri.file("allTests.ts");
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
            } catch (err) {
                vscode.window.showWarningMessage("Could not open allTests.ts configuration file");
            }
        }
    );

    const openFileCommand = vscode.commands.registerCommand(
        "testeranto.openFile",
        async (item: TestTreeItem) => {
            if (item.type === TreeItemType.File) {
                const fileName = item.data?.fileName || item.label;
                const uri = vscode.Uri.file(fileName);
                try {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                } catch (err) {
                    const files = await vscode.workspace.findFiles(`**/${fileName}`, null, 1);
                    if (files.length > 0) {
                        const doc = await vscode.workspace.openTextDocument(files[0]);
                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showWarningMessage(`Could not open file: ${fileName}`);
                    }
                }
            }
        }
    );

    const refreshCommand = vscode.commands.registerCommand("testeranto.refresh", async () => {
        vscode.window.showInformationMessage("Refreshing all Testeranto views...");
        // First update server status
        await updateServerStatus();
        // Then refresh all tree views
        testTreeDataProvider.refresh();
        // fileTreeDataProvider.refresh();
        processesTreeDataProvider.refresh();
        featuresTreeDataProvider.refresh();
    });

    const retryConnectionCommand = vscode.commands.registerCommand("testeranto.retryConnection", (provider: any) => {
        vscode.window.showInformationMessage("Retrying connection to server...");
        // Check if provider has connectWebSocket method
        if (provider && typeof provider.connectWebSocket === 'function') {
            // Reset connection attempts and try to reconnect
            if (provider.connectionAttempts !== undefined) {
                provider.connectionAttempts = 0;
            }
            if (provider.isConnected !== undefined) {
                provider.isConnected = false;
            }
            provider.connectWebSocket();
            if (typeof provider.refresh === 'function') {
                provider.refresh();
            }
        } else {
            vscode.window.showWarningMessage("Provider does not support WebSocket reconnection");
        }
    });

    const startServerCommand = vscode.commands.registerCommand("testeranto.startServer", async () => {
        vscode.window.showInformationMessage("Starting Testeranto server...");

        // Create a terminal to run the server
        const terminal = vscode.window.createTerminal('Testeranto Server');
        terminal.show();

        // Change to workspace directory and run npm start
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            terminal.sendText(`cd "${workspacePath}" && npm start`);
        } else {
            terminal.sendText('npm start');
        }

        vscode.window.showInformationMessage('Server starting in terminal. It may take a few moments...');

        // Update status after a delay
        setTimeout(async () => {
            await updateServerStatus();
            testTreeDataProvider.refresh();
            processesTreeDataProvider.refresh();
        }, 5000);
    });

    // Register tree views
    const testTreeView = vscode.window.createTreeView("testerantoTestsView", {
        treeDataProvider: testTreeDataProvider,
        showCollapseAll: true
    });

    // const fileTreeView = vscode.window.createTreeView("testerantoFilesView", {
    //     treeDataProvider: fileTreeDataProvider,
    //     showCollapseAll: true
    // });

    const processesTreeView = vscode.window.createTreeView("testerantoResultsView", {
        treeDataProvider: processesTreeDataProvider,
        showCollapseAll: true
    });

    const featuresTreeView = vscode.window.createTreeView("testerantoFeaturesView", {
        treeDataProvider: featuresTreeDataProvider,
        showCollapseAll: true
    });

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            terminalManager.disposeAll();
            processesTreeDataProvider.dispose();
            testTreeDataProvider.dispose();
            // fileTreeDataProvider.dispose();
            featuresTreeDataProvider.dispose();
        }
    });

    // Register all commands and views
    context.subscriptions.push(
        showTestsCommand,
        runTestCommand,
        aiderCommand,
        openFileCommand,
        openConfigCommand,
        refreshCommand,
        retryConnectionCommand,
        startServerCommand,
        testTreeView,
        // fileTreeView,
        processesTreeView,
        featuresTreeView,
        mainStatusBarItem,
        serverStatusBarItem
    );

    console.log("[Testeranto] Commands registered");
    console.log("[Testeranto] Four tree views registered");

    vscode.commands.getCommands().then((commands) => {
        const hasCommand = commands.includes("testeranto.showTests");
        console.log(`[Testeranto] Command available in palette: ${hasCommand}`);
    });

    console.log("[Testeranto] Extension activated successfully");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
