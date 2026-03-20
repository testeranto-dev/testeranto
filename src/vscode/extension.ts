import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// import { TerminalManager } from "./TerminalManager";

// import { TesterantoTreeDataProvider } from "./providers/TesterantoTreeDataProvider";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
// import { FeaturesTreeDataProvider } from "./providers/FeaturesTreeDataProvider";
// import { ProcessesTreeDataProvider } from "./providers/ProcessesTreeDataProvider";
// import { HtmlReportProvider } from "./providers/HtmlReportProvider";

import { TestTreeItem } from "./TestTreeItem";
import { TreeItemType } from "./types";

export function activate(context: vscode.ExtensionContext): void {
    // Helper function to convert local paths to webview URIs
    // const convertLocalPathsToWebviewUris = (htmlContent: string, webview: vscode.Webview, workspaceRoot: string): string => {
    //     // Convert relative paths to webview URIs
    //     let modifiedHtml = htmlContent;

    //     // Convert CSS and JS file references
    //     modifiedHtml = modifiedHtml.replace(
    //         /(href|src)=["']([^"']+\.(css|js|png|jpg|gif|svg))["']/gi,
    //         (match, attr, filePath) => {
    //             const fullPath = path.join(workspaceRoot, 'testeranto', 'reports', filePath);
    //             const uri = webview.asWebviewUri(vscode.Uri.file(fullPath));
    //             return `${attr}="${uri}"`;
    //         }
    //     );

    //     return modifiedHtml;
    // };

    // Create terminal manager
    // const terminalManager = new TerminalManager();
    // terminalManager.createAllTerminals();

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

    // Create all providers
    // const unifiedProvider = new TesterantoTreeDataProvider();
    const runtimeProvider = new TestTreeDataProvider();
    // const resultsProvider = new FeaturesTreeDataProvider();
    // const processProvider = new ProcessesTreeDataProvider();
    // const reportProvider = new HtmlReportProvider();

    // Register commands
    const showTestsCommand = vscode.commands.registerCommand(
        "testeranto.showTests",
        () => {
            vscode.window.showInformationMessage("Showing Testeranto Dashboard");
            vscode.commands.executeCommand("testeranto.unifiedView.focus");
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
        async (...args: any[]) => {
            console.log('[Testeranto] Aider command triggered with args:', args);

            let runtime: any;
            let testName: any;

            if (args.length === 0) {
                vscode.window.showErrorMessage('Cannot connect to aider: No arguments provided');
                return;
            }

            const firstArg = args[0];

            // Check if first argument is a TestTreeItem
            if (firstArg && typeof firstArg === 'object' && firstArg.type !== undefined) {
                if (firstArg.type === TreeItemType.Test) {
                    console.log('[Testeranto] Item label:', firstArg.label);
                    console.log('[Testeranto] Item data:', JSON.stringify(firstArg.data, null, 2));

                    // Extract runtime and testName from item.data
                    runtime = firstArg.data?.runtime;
                    testName = firstArg.data?.testName;

                    // If not found, try alternative property names
                    if (!runtime) {
                        runtime = firstArg.data?.runtimeKey;
                    }
                    if (!testName) {
                        testName = firstArg.label;
                    }
                } else {
                    vscode.window.showErrorMessage(`Cannot connect to aider: Item is not a test (type: ${firstArg.type})`);
                    return;
                }
            } else if (args.length >= 2) {
                // Direct parameters: runtime, testName
                runtime = args[0];
                testName = args[1];
                console.log('[Testeranto] Using direct parameters:', runtime, testName);
            } else {
                // Single parameter case
                runtime = firstArg;
                testName = 'unknown';
                console.log('[Testeranto] Using single parameter:', runtime);
            }

            // Log the extracted values
            console.log('[Testeranto] Extracted runtime:', runtime, 'type:', typeof runtime);
            console.log('[Testeranto] Extracted testName:', testName, 'type:', typeof testName);

            if (!runtime || !testName) {
                vscode.window.showErrorMessage(`Cannot connect to aider: Missing runtime or test name. Runtime: ${runtime}, Test: ${testName}`);
                return;
            }

            console.log('[Testeranto] Calling createAiderTerminal with raw values');
            vscode.window.showInformationMessage(`Connecting to aider process for ${testName || 'unknown'} (${runtime || 'unknown'})...`);
            try {
                // Pass the original values, not stringified versions
                const aiderTerminal = await terminalManager.createAiderTerminal(runtime, testName);
                aiderTerminal.show();

                // Process test name to match Docker container naming convention
                let processedTestName = testName || "";
                // Remove file extension
                processedTestName = processedTestName?.replace(/\.[^/.]+$/, "") || "";
                // Remove 'example/' prefix if present
                processedTestName = processedTestName.replace(/^example\//, "");
                // Replace special characters with underscores (matching DockerManager)
                const sanitizedTestName = processedTestName ? processedTestName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-") : "";
                // Construct container name matching DockerManager's convention
                const containerName = `${runtime}-${sanitizedTestName}-aider`;

                aiderTerminal.sendText("clear");
                setTimeout(() => {
                    aiderTerminal.sendText(`echo "Connecting to aider container: ${containerName}"`);
                    aiderTerminal.sendText(`docker exec -it ${containerName} /bin/bash`);
                }, 500);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to create aider terminal: ${error.message}`);
                console.error('[Testeranto] Error creating aider terminal:', error);
                return;
            }
        }
    );

    // Context menu command for test items
    // Command to launch aider for the currently selected test in the tree view
    const launchAiderForSelectedTestCommand = vscode.commands.registerCommand(
        "testeranto.launchAiderForSelectedTest",
        async () => {
            // Get the active tree view
            const treeView = vscode.window.createTreeView("testeranto.runtimeView", {
                treeDataProvider: runtimeProvider,
                showCollapseAll: true
            });
            
            // Get the selected item
            const selection = treeView.selection;
            if (selection.length === 0) {
                vscode.window.showErrorMessage('No test selected. Please select a test in the Testeranto tree view.');
                return;
            }
            
            const item = selection[0];
            if (item.type !== TreeItemType.Test) {
                vscode.window.showErrorMessage('Selected item is not a test. Please select a test in the Testeranto tree view.');
                return;
            }
            
            const runtime = item.data?.runtimeKey || item.data?.runtime;
            const testName = item.data?.testName;
            
            if (!runtime || !testName) {
                vscode.window.showErrorMessage('Cannot launch aider: Missing runtime or test name');
                return;
            }
            
            vscode.window.showInformationMessage(`Launching aider terminal for ${testName} (${runtime})...`);
            try {
                await vscode.commands.executeCommand('testeranto.launchAiderTerminal', runtime, testName);
            } catch (error) {
                console.error('Failed to launch aider terminal:', error);
                vscode.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
            }
        }
    );

    // Context menu command for test items
    const launchAiderFromContextCommand = vscode.commands.registerCommand(
        "testeranto.launchAiderFromContext",
        async (item: TestTreeItem) => {
            console.log('[Testeranto] launchAiderFromContext called with item:', item);
            
            if (!item || item.type !== TreeItemType.Test) {
                vscode.window.showErrorMessage('This command is only available for test items');
                return;
            }
            
            const runtime = item.data?.runtimeKey || item.data?.runtime;
            const testName = item.data?.testName;
            
            if (!runtime || !testName) {
                vscode.window.showErrorMessage('Cannot launch aider: Missing runtime or test name');
                return;
            }
            
            vscode.window.showInformationMessage(`Launching aider terminal for ${testName} (${runtime})...`);
            try {
                // Call the existing launchAiderTerminal command with the runtime and testName
                await vscode.commands.executeCommand('testeranto.launchAiderTerminal', runtime, testName);
            } catch (error) {
                console.error('Failed to launch aider terminal:', error);
                vscode.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
            }
        }
    );

    const launchAiderTerminalCommand = vscode.commands.registerCommand(
        "testeranto.launchAiderTerminal",
        async (...args: any[]) => {
            console.log('[Testeranto] launchAiderTerminal called with args:', args);

            let runtime: any;
            let testName: any;

            // Check the number and type of arguments
            if (args.length === 0) {
                vscode.window.showErrorMessage('Cannot launch aider terminal: No arguments provided');
                return;
            }

            const firstArg = args[0];

            // Case 1: First argument is a TestTreeItem (when clicked from context menu)
            if (firstArg && typeof firstArg === 'object' && firstArg.type !== undefined) {
                // Extract from TestTreeItem data
                runtime = firstArg.data?.runtimeKey || firstArg.data?.runtime;
                testName = firstArg.data?.testName;

                console.log('[Testeranto] Extracted from TestTreeItem - runtime:', runtime, 'type:', typeof runtime);
                console.log('[Testeranto] Extracted from TestTreeItem - testName:', testName, 'type:', typeof testName);
                console.log('[Testeranto] Full data object:', JSON.stringify(firstArg.data, null, 2));
            }
            // Case 2: First argument is runtime string, second is testName string (when called with arguments)
            else if (args.length >= 2) {
                runtime = args[0];
                testName = args[1];
                console.log('[Testeranto] Using direct arguments:', runtime, testName);
            }
            // Case 3: Only one argument which might be runtime or something else
            else {
                runtime = firstArg;
                testName = 'unknown';
                console.log('[Testeranto] Using single argument:', runtime);
            }

            console.log('[Testeranto] Raw values - runtime:', runtime, 'type:', typeof runtime);
            console.log('[Testeranto] Raw values - testName:', testName, 'type:', typeof testName);

            vscode.window.showInformationMessage(`Launching aider terminal for ${testName || 'unknown'} (${runtime || 'unknown'})...`);
            try {
                // We need to import TerminalManager
                // For now, show a message that this feature requires the terminal manager
                vscode.window.showInformationMessage(`Aider terminal feature requires TerminalManager to be implemented.`);
                console.log('Aider terminal would launch for:', runtime, testName);
                // TODO: Implement actual terminal launch when TerminalManager is available
            } catch (error) {
                console.error('Failed to launch aider terminal:', error);
                vscode.window.showErrorMessage(`Failed to launch aider terminal: ${error}`);
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
                const workspaceFolders = vscode.workspace.workspaceFolders;
                
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const workspaceRoot = workspaceFolders[0].uri;
                    let fileUri: vscode.Uri;
                    
                    // Handle both absolute and relative paths
                    if (fileName.startsWith('/')) {
                        fileUri = vscode.Uri.file(fileName);
                    } else {
                        fileUri = vscode.Uri.joinPath(workspaceRoot, fileName);
                    }
                    
                    try {
                        const doc = await vscode.workspace.openTextDocument(fileUri);
                        await vscode.window.showTextDocument(doc);
                    } catch (err) {
                        // If the file doesn't exist at the exact path, try to find it
                        const files = await vscode.workspace.findFiles(`**/${path.basename(fileName)}`, null, 1);
                        if (files.length > 0) {
                            const doc = await vscode.workspace.openTextDocument(files[0]);
                            await vscode.window.showTextDocument(doc);
                        } else {
                            vscode.window.showWarningMessage(`Could not open file: ${fileName}`);
                        }
                    }
                } else {
                    vscode.window.showWarningMessage('No workspace folder open');
                }
            }
        }
    );

    const refreshCommand = vscode.commands.registerCommand("testeranto.refresh", async () => {
        vscode.window.showInformationMessage("Refreshing all Testeranto views...");
        // First update server status
        await updateServerStatus();
        // Then refresh all tree views
        // unifiedProvider.refresh();
        runtimeProvider.refresh();
        // resultsProvider.refresh();
        // processProvider.refresh();
        // reportProvider.refresh();
    });

    const retryConnectionCommand = vscode.commands.registerCommand("testeranto.retryConnection", (provider: any) => {
        vscode.window.showInformationMessage("Retrying connection to server...");
        // Check if provider has setupWebSocket method
        if (provider && typeof provider.setupWebSocket === 'function') {
            // Reset connection attempts and try to reconnect
            if (provider.connectionAttempts !== undefined) {
                provider.connectionAttempts = 0;
            }
            if (provider.isConnected !== undefined) {
                provider.isConnected = false;
            }
            provider.setupWebSocket();
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
            testerantoTreeDataProvider.refresh();
        }, 5000);
    });

    // const generateHtmlReportCommand = vscode.commands.registerCommand(
    //     "testeranto.generateHtmlReport",
    //     async () => {
    //         vscode.window.showInformationMessage("Generating stakeholder HTML report...");
    //         try {
    //             const response = await fetch('http://localhost:3000/~/html-report');
    //             if (!response.ok) {
    //                 throw new Error(`Server returned ${response.status}`);
    //             }
    //             const data = await response.json();
    //             vscode.window.showInformationMessage(`HTML report generated: ${data.message}`);

    //             // Open the report in a webview panel instead of text editor
    //             const panel = vscode.window.createWebviewPanel(
    //                 'testerantoReport',
    //                 'Testeranto Stakeholder Report',
    //                 vscode.ViewColumn.One,
    //                 {
    //                     enableScripts: true,
    //                     retainContextWhenHidden: true,
    //                     localResourceRoots: [
    //                         vscode.Uri.file(path.join(process.cwd(), 'testeranto', 'reports'))
    //                     ]
    //                 }
    //             );

    //             // Get the HTML content from the file
    //             const workspaceFolders = vscode.workspace.workspaceFolders;
    //             if (workspaceFolders && workspaceFolders.length > 0) {
    //                 const workspaceRoot = workspaceFolders[0].uri.fsPath;
    //                 const reportPath = path.join(workspaceRoot, 'testeranto', 'reports', 'index.html');

    //                 if (fs.existsSync(reportPath)) {
    //                     const htmlContent = fs.readFileSync(reportPath, 'utf-8');

    //                     // Convert local file paths to webview URIs
    //                     const webviewHtml = convertLocalPathsToWebviewUris(htmlContent, panel.webview, workspaceRoot);
    //                     panel.webview.html = webviewHtml;
    //                 } else {
    //                     panel.webview.html = `
    //                         <!DOCTYPE html>
    //                         <html>
    //                         <head>
    //                             <style>
    //                                 body { 
    //                                     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    //                                     padding: 40px;
    //                                     background: #f5f5f5;
    //                                 }
    //                                 .container {
    //                                     max-width: 800px;
    //                                     margin: 0 auto;
    //                                     background: white;
    //                                     padding: 30px;
    //                                     border-radius: 8px;
    //                                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    //                                 }
    //                                 h1 { color: #333; margin-bottom: 20px; }
    //                                 .error { 
    //                                     color: #f44336; 
    //                                     background: #ffebee;
    //                                     padding: 15px;
    //                                     border-radius: 4px;
    //                                     border-left: 4px solid #f44336;
    //                                 }
    //                                 .info { 
    //                                     color: #2196f3; 
    //                                     background: #e3f2fd;
    //                                     padding: 15px;
    //                                     border-radius: 4px;
    //                                     border-left: 4px solid #2196f3;
    //                                 }
    //                                 button {
    //                                     background: #667eea;
    //                                     color: white;
    //                                     border: none;
    //                                     padding: 10px 20px;
    //                                     border-radius: 4px;
    //                                     cursor: pointer;
    //                                     font-size: 14px;
    //                                     margin-top: 20px;
    //                                 }
    //                                 button:hover {
    //                                     background: #764ba2;
    //                                 }
    //                             </style>
    //                         </head>
    //                         <body>
    //                             <div class="container">
    //                                 <h1>📊 Testeranto Stakeholder Report</h1>
    //                                 <p class="error">The HTML report file was not found at: ${reportPath}</p>
    //                                 <p class="info">Try generating the report again by clicking the button below.</p>
    //                                 <button onclick="generateReport()">Generate Report</button>
    //                             </div>
    //                             <script>
    //                                 const vscode = acquireVsCodeApi();
    //                                 function generateReport() {
    //                                     vscode.postMessage({
    //                                         command: 'generateReport'
    //                                     });
    //                                 }
    //                             </script>
    //                         </body>
    //                         </html>
    //                     `;

    //                     // Handle messages from the webview
    //                     panel.webview.onDidReceiveMessage(
    //                         message => {
    //                             switch (message.command) {
    //                                 case 'generateReport':
    //                                     vscode.commands.executeCommand('testeranto.generateHtmlReport');
    //                                     break;
    //                             }
    //                         },
    //                         undefined,
    //                         context.subscriptions
    //                     );
    //                 }
    //             }
    //         } catch (error: any) {
    //             vscode.window.showErrorMessage(`${JSON.stringify(error)}`);
    //         }
    //     }
    // );

    // Register all tree views in the Testeranto activity bar
    // const unifiedTreeView = vscode.window.createTreeView("testeranto.unifiedView", {
    //     treeDataProvider: unifiedProvider,
    //     showCollapseAll: true
    // });

    const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
        treeDataProvider: runtimeProvider,
        showCollapseAll: true
    });

    // const resultsTreeView = vscode.window.createTreeView("testeranto.resultsView", {
    //     treeDataProvider: resultsProvider,
    //     showCollapseAll: true
    // });

    // const processTreeView = vscode.window.createTreeView("testeranto.processView", {
    //     treeDataProvider: processProvider,
    //     showCollapseAll: true
    // });

    // const reportTreeView = vscode.window.createTreeView("testeranto.reportView", {
    //     treeDataProvider: reportProvider,
    //     showCollapseAll: true
    // });

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            // terminalManager.disposeAll();
            // unifiedProvider.dispose();
            runtimeProvider.dispose();
            // resultsProvider.dispose();
            // processProvider.dispose();
            // reportProvider.dispose();
        }
    });

    // Register all commands and views
    context.subscriptions.push(
        showTestsCommand,
        runTestCommand,
        aiderCommand,
        launchAiderTerminalCommand,
        launchAiderFromContextCommand,
        launchAiderForSelectedTestCommand,
        openFileCommand,
        openConfigCommand,
        refreshCommand,
        retryConnectionCommand,
        startServerCommand,
        // generateHtmlReportCommand,
        // unifiedTreeView,
        runtimeTreeView,
        // resultsTreeView,
        // processTreeView,
        // reportTreeView,
        mainStatusBarItem,
        serverStatusBarItem
    );

    console.log("[Testeranto] Commands registered");
    console.log("[Testeranto] Unified tree view registered");

    vscode.commands.getCommands().then((commands) => {
        const hasCommand = commands.includes("testeranto.showTests");
        console.log(`[Testeranto] Command available in palette: ${hasCommand}`);
    });

    console.log("[Testeranto] Extension activated successfully");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
