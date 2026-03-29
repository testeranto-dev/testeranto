import * as vscode from "vscode";
import * as path from "path";
import { TerminalManager } from "./TerminalManager";
import { TestTreeItem } from "./TestTreeItem";
import { TreeItemType } from "./types";
import { StatusBarManager } from "./statusBarManager";
import { DockerProcessTreeDataProvider } from "./providers/DockerProcessTreeDataProvider";

export class CommandManager {
    private terminalManager: TerminalManager;
    private statusBarManager: StatusBarManager;
    private runtimeProvider: vscode.TreeDataProvider<any> | null;
    private dockerProcessProvider: vscode.TreeDataProvider<any> | null;

    constructor(terminalManager: TerminalManager, statusBarManager: StatusBarManager) {
        this.terminalManager = terminalManager;
        this.statusBarManager = statusBarManager;
        this.runtimeProvider = null;
        this.dockerProcessProvider = null;
    }

    public setRuntimeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.runtimeProvider = provider;
    }

    public setDockerProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.dockerProcessProvider = provider;
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
                async (item: TestTreeItem) => {
                    if (item.type === TreeItemType.File) {
                        const fileName = item.data?.fileName || item.label;
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        
                        if (workspaceFolders && workspaceFolders.length > 0) {
                            const workspaceRoot = workspaceFolders[0].uri;
                            let fileUri: vscode.Uri;
                            
                            if (fileName.startsWith('/')) {
                                fileUri = vscode.Uri.file(fileName);
                            } else {
                                fileUri = vscode.Uri.joinPath(workspaceRoot, fileName);
                            }
                            
                            try {
                                const doc = await vscode.workspace.openTextDocument(fileUri);
                                await vscode.window.showTextDocument(doc);
                            } catch (err) {
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

        disposables.push(
            vscode.commands.registerCommand(
                "testeranto.showProcessLogs",
                async (processId: string, processName: string) => {
                    try {
                        // Create output channel for process logs
                        const outputChannel = vscode.window.createOutputChannel(`Process: ${processName || processId}`);
                        outputChannel.show(true);
                        
                        // Fetch logs from server
                        const response = await fetch(`http://localhost:3000/~/process-logs/${processId}`);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        const data = await response.json();
                        
                        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
                        outputChannel.appendLine(`Process ID: ${processId}`);
                        outputChannel.appendLine(`Status: ${data.status || 'unknown'}`);
                        outputChannel.appendLine(`Exit Code: ${data.exitCode || 'N/A'}`);
                        outputChannel.appendLine(`\n--- Logs ---\n`);
                        
                        if (data.logs && Array.isArray(data.logs)) {
                            data.logs.forEach((log: string) => {
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

        return disposables;
    }
}
