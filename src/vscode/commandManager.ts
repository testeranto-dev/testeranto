import * as vscode from "vscode";
import * as path from "path";
import { TerminalManager } from "./TerminalManager";
import { TestTreeItem } from "./TestTreeItem";
import { TreeItemType } from "./types";
import { StatusBarManager } from "./statusBarManager";
import { DockerProcessTreeDataProvider } from "./providers/DockerProcessTreeDataProvider";
import { ApiUtils } from "./providers/utils/apiUtils";

export class CommandManager {
    private terminalManager: TerminalManager;
    private statusBarManager: StatusBarManager;
    private runtimeProvider: vscode.TreeDataProvider<any> | null;
    private dockerProcessProvider: vscode.TreeDataProvider<any> | null;
    private aiderProcessProvider: vscode.TreeDataProvider<any> | null;

    constructor(terminalManager: TerminalManager, statusBarManager: StatusBarManager) {
        this.terminalManager = terminalManager;
        this.statusBarManager = statusBarManager;
        this.runtimeProvider = null;
        this.dockerProcessProvider = null;
        this.aiderProcessProvider = null;
    }

    public setRuntimeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.runtimeProvider = provider;
    }

    public setDockerProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.dockerProcessProvider = provider;
    }

    public setAiderProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.aiderProcessProvider = provider;
    }

    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.showTests",
                () => {
                    vscode.window.showInformationMessage("Showing Testeranto Dashboard");
                    vscode.commands.executeCommand("testeranto.unifiedView.focus");
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.runTest",
                async (item: TestTreeItem) => {
                    if (item.type === TreeItemType.Test) {
                        const { runtime, testName } = item.data || {};
                        vscode.window.showInformationMessage(`Running ${testName} for ${runtime}...`);
                        const terminal = this.terminalManager.showTerminal(runtime, testName);
                        if (terminal) {
                            vscode.window.showInformationMessage(`Terminal for ${testName} is ready`, { modal: false });
                        } else {
                            vscode.window.showWarningMessage(`Terminal for ${testName} not found`);
                        }
                    }
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.launchAiderTerminal",
                async (data: any) => {
                    let runtime: string;
                    let testName: string;

                    if (data && typeof data === 'object') {
                        runtime = data.runtimeKey || data.runtime;
                        testName = data.testName;
                    } else {
                        vscode.window.showErrorMessage('Cannot launch aider: Invalid test data');
                        return;
                    }

                    if (!runtime || !testName) {
                        vscode.window.showErrorMessage('Cannot launch aider: Missing runtime or test name');
                        return;
                    }

                    vscode.window.showInformationMessage(`Launching aider for ${testName} (${runtime})...`);
                    const terminal = await this.terminalManager.createAiderTerminal(runtime, testName);
                    terminal.show();
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
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
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.openTesterantoConfig",
                async () => {
                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (workspaceFolders && workspaceFolders.length > 0) {
                            const workspaceRoot = workspaceFolders[0].uri;
                            
                            // Try to find the testeranto/testeranto.ts file
                            const configUri = vscode.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");
                            
                            try {
                                const doc = await vscode.workspace.openTextDocument(configUri);
                                await vscode.window.showTextDocument(doc);
                            } catch (err) {
                                // If not found, try alternative locations
                                const alternativePaths = [
                                    vscode.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                                    vscode.Uri.file("testeranto/testeranto.ts"),
                                    vscode.Uri.file("testeranto.ts")
                                ];
                                
                                let opened = false;
                                for (const uri of alternativePaths) {
                                    try {
                                        const doc = await vscode.workspace.openTextDocument(uri);
                                        await vscode.window.showTextDocument(doc);
                                        opened = true;
                                        break;
                                    } catch (e) {
                                        // Continue to next path
                                    }
                                }
                                
                                if (!opened) {
                                    // Search for the file in the workspace
                                    const files = await vscode.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                                    if (files.length > 0) {
                                        const doc = await vscode.workspace.openTextDocument(files[0]);
                                        await vscode.window.showTextDocument(doc);
                                    } else {
                                        vscode.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                                    }
                                }
                            }
                        } else {
                            vscode.window.showWarningMessage("No workspace folder open");
                        }
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error opening testeranto config: ${err}`);
                    }
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.openFile",
                async (arg: TestTreeItem | { fileName: string; runtime?: string; testName?: string; isFile?: boolean; fileType?: string }) => {
                    console.log('[CommandManager] openFile called with arg:', arg);
                    
                    let fileName: string | undefined;
                    let itemLabel: string | undefined;
                    
                    // Handle both cases: TestTreeItem or data object
                    if (arg && typeof arg === 'object') {
                        if ('type' in arg && arg.type === TreeItemType.File) {
                            // It's a TestTreeItem
                            const item = arg as TestTreeItem;
                            fileName = item.data?.fileName || item.label;
                            itemLabel = item.label;
                        } else if ('fileName' in arg) {
                            // It's a data object passed via arguments
                            fileName = arg.fileName;
                            itemLabel = arg.fileName;
                        }
                    }
                    
                    if (!fileName) {
                        console.error('[CommandManager] openFile called with invalid argument:', arg);
                        vscode.window.showErrorMessage('Cannot open file: Invalid argument');
                        return;
                    }
                    
                    console.log('[CommandManager] Opening file:', fileName);
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    
                    if (workspaceFolders && workspaceFolders.length > 0) {
                        const workspaceRoot = workspaceFolders[0].uri;
                        let fileUri: vscode.Uri;
                        
                        if (fileName.startsWith('/')) {
                            fileUri = vscode.Uri.file(fileName);
                        } else {
                            fileUri = vscode.Uri.joinPath(workspaceRoot, fileName);
                        }
                        console.log('[CommandManager] File URI:', fileUri.toString());
                        
                        try {
                            const doc = await vscode.workspace.openTextDocument(fileUri);
                            await vscode.window.showTextDocument(doc);
                            console.log('[CommandManager] File opened successfully');
                        } catch (err) {
                            console.error('[CommandManager] Error opening file:', err);
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
            )
        );

        disposables.push(
            vscode.commands.registerCommand("testeranto.refresh", async () => {
                vscode.window.showInformationMessage("Refreshing all Testeranto views...");
                await this.statusBarManager.updateServerStatus();
                // Refresh the runtime provider if available
                if (this.runtimeProvider && typeof (this.runtimeProvider as any).refresh === 'function') {
                    (this.runtimeProvider as any).refresh();
                }
            })
        );

        disposables.push(
            vscode.commands.registerCommand("testeranto.retryConnection", (provider: any) => {
                vscode.window.showInformationMessage("Retrying connection to server...");
                if (provider && typeof provider.setupWebSocket === 'function') {
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
            })
        );

        disposables.push(
            vscode.commands.registerCommand("testeranto.startServer", async () => {
                vscode.window.showInformationMessage("Starting Testeranto server...");

                const terminal = vscode.window.createTerminal('Testeranto Server');
                terminal.show();

                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    const workspacePath = workspaceFolders[0].uri.fsPath;
                    terminal.sendText(`cd "${workspacePath}" && npm start`);
                } else {
                    terminal.sendText('npm start');
                }

                vscode.window.showInformationMessage('Server starting in terminal. It may take a few moments...');

                setTimeout(async () => {
                    await this.statusBarManager.updateServerStatus();
                    // Refresh the runtime provider if available
                    if (this.runtimeProvider && typeof (this.runtimeProvider as any).refresh === 'function') {
                        (this.runtimeProvider as any).refresh();
                    }
                }, 5000);
            })
        );

        // Docker processes commands
        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.refreshDockerProcesses",
                async () => {
                    try {
                        if (this.dockerProcessProvider && typeof (this.dockerProcessProvider as any).refresh === 'function') {
                            await (this.dockerProcessProvider as any).refresh();
                            vscode.window.showInformationMessage("Docker processes refreshed");
                        } else {
                            vscode.window.showWarningMessage("Docker process provider not available");
                        }
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error refreshing Docker processes: ${err}`);
                    }
                }
            )
        );

        // Aider processes commands
        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.refreshAiderProcesses",
                async () => {
                    try {
                        if (this.aiderProcessProvider && typeof (this.aiderProcessProvider as any).refresh === 'function') {
                            await (this.aiderProcessProvider as any).refresh();
                            vscode.window.showInformationMessage("Aider processes refreshed");
                        } else {
                            vscode.window.showWarningMessage("Aider process provider not available");
                        }
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error refreshing aider processes: ${err}`);
                    }
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.openAiderTerminal",
                async (runtime: string, testName: string, containerId?: string) => {
                    try {
                        vscode.window.showInformationMessage(`Opening aider terminal for ${testName} (${runtime})...`);
                        const terminal = await this.terminalManager.createAiderTerminal(runtime, testName);
                        terminal.show();
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error opening aider terminal: ${err}`);
                    }
                }
            )
        );

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.showProcessLogs",
                async (processId: string, processName: string) => {
                    try {
                        // Create output channel for process logs
                        const outputChannel = vscode.window.createOutputChannel(`Process: ${processName || processId}`);
                        outputChannel.show(true);
                        
                        // Fetch logs from server
                        const response = await fetch(ApiUtils.getProcessLogsUrl(processId));
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        const data = await response.json();
                        // Use type assertion for the response
                        const processLogsResponse = data as import('../../api').ProcessLogsResponse;
                        
                        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
                        outputChannel.appendLine(`Process ID: ${processId}`);
                        outputChannel.appendLine(`Status: ${processLogsResponse.status || 'unknown'}`);
                        outputChannel.appendLine(`Exit Code: ${processLogsResponse.exitCode || 'N/A'}`);
                        outputChannel.appendLine(`\n--- Logs ---\n`);
                        
                        if (processLogsResponse.logs && Array.isArray(processLogsResponse.logs)) {
                            processLogsResponse.logs.forEach((log: string) => {
                                outputChannel.appendLine(log);
                            });
                        } else {
                            outputChannel.appendLine('No logs available');
                        }
                        
                        outputChannel.appendLine(`\n=== End of logs ===`);
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error fetching process logs: ${err}`);
                    }
                }
            )
        );

        // Add server status check command
        disposables.push(
            vscode.commands.registerCommand("testeranto.checkServerStatus", async () => {
                try {
                    const response = await ApiUtils.fetchWithTimeout(ApiUtils.getConfigsUrl(), {}, 2000);
                    if (response.ok) {
                        vscode.window.showInformationMessage('✅ Server is running and reachable');
                    } else {
                        vscode.window.showWarningMessage(`⚠️ Server responded with status: ${response.status}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`❌ Cannot connect to server: ${error.message}`);
                }
            })
        );

        // Open server webview command
        disposables.push(
            vscode.commands.registerCommand("testeranto.openServerWebview", async () => {
                try {
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        vscode.window.showErrorMessage('No workspace folder open');
                        return;
                    }
                    
                    const workspaceRoot = workspaceFolders[0].uri;
                    const reportHtmlUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports', 'index.html');
                    
                    // Check if the report file exists
                    try {
                        await vscode.workspace.fs.stat(reportHtmlUri);
                    } catch (error) {
                        vscode.window.showWarningMessage('Report file not found. Starting server to generate it...');
                        // Start server to generate the report
                        await vscode.commands.executeCommand('testeranto.startServer');
                        // Wait for server to generate the report
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                    
                    // Create and show webview
                    const panel = vscode.window.createWebviewPanel(
                        'testerantoServer',
                        'Testeranto Server Report',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            retainContextWhenHidden: true,
                            localResourceRoots: [vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports')]
                        }
                    );
                    
                    // Get the HTML content
                    let htmlContent: string;
                    try {
                        const fileContent = await vscode.workspace.fs.readFile(reportHtmlUri);
                        htmlContent = Buffer.from(fileContent).toString('utf-8');
                    } catch (error) {
                        htmlContent = getFallbackHtmlContent();
                    }
                    
                    // Replace script src to use webview.asWebviewUri
                    const reportJsUri = panel.webview.asWebviewUri(
                        vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports', 'index.js')
                    );
                    
                    // Update the script tag in the HTML
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
                    
                    // Handle messages from the webview
                    panel.webview.onDidReceiveMessage(
                        message => {
                            switch (message.command) {
                                case 'alert':
                                    vscode.window.showErrorMessage(message.text);
                                    return;
                                case 'refresh':
                                    // Re-read the HTML file and update
                                    vscode.workspace.fs.readFile(reportHtmlUri).then(fileContent => {
                                        const newHtmlContent = Buffer.from(fileContent).toString('utf-8');
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
                        },
                        undefined,
                        disposables
                    );
                    
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
                }
            })
        );

        return disposables;
    }
}

function getFallbackHtmlContent(): string {
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
