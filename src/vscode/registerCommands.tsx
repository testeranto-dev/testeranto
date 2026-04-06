import * as vscode from "vscode";
import { getFallbackHtmlContent } from './getFallbackHtmlContent';
import { ApiUtils } from './providers/utils/apiUtils';
import type { TerminalManager } from './TerminalManager';
import type { TestTreeItem } from './TestTreeItem';
import { TreeItemType } from './types';
import type { StatusBarManager } from './statusBarManager';
import type { DockerProcessTreeDataProvider } from './providers/DockerProcessTreeDataProvider';
import type { AiderProcessTreeDataProvider } from './providers/AiderProcessTreeDataProvider';
// Note: showProcessLogs has been updated to use graph-based approach
import { showProcessLogs } from './showProcessLogs';
import { openFile } from './openFile';
import { openServerWebview } from './openServerWebview';

export const registerCommands = (
    context: vscode.ExtensionContext,
    terminalManager: TerminalManager,
    runtimeProvider: any,
    statusBarManager: StatusBarManager,
    dockerProcessProvider: DockerProcessTreeDataProvider,
    aiderProcessProvider: AiderProcessTreeDataProvider,
    fileTreeProvider: any
): vscode.Disposable[] => {
    console.log('[VS Code] Registering commands');
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
                    const terminal = terminalManager.showTerminal(runtime, testName);
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
                const terminal = await terminalManager.createAiderTerminal(runtime, testName);
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
        openFile()
    );

    disposables.push(
        vscode.commands.registerCommand("testeranto.refresh", async () => {
            vscode.window.showInformationMessage("Refreshing all Testeranto views...");
            await statusBarManager.updateServerStatus();
            // Refresh the runtime provider if available
            if (runtimeProvider && typeof (runtimeProvider as any).refresh === 'function') {
                (runtimeProvider as any).refresh();
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
                await statusBarManager.updateServerStatus();
                // Refresh the runtime provider if available
                if (runtimeProvider && typeof (runtimeProvider as any).refresh === 'function') {
                    (runtimeProvider as any).refresh();
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
                    if (dockerProcessProvider && typeof (dockerProcessProvider as any).refresh === 'function') {
                        await (dockerProcessProvider as any).refresh();
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
                    if (aiderProcessProvider && typeof (aiderProcessProvider as any).refresh === 'function') {
                        await (aiderProcessProvider as any).refresh();
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

    // File tree commands
    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.refreshFileTree",
            async () => {
                try {
                    if (fileTreeProvider && typeof (fileTreeProvider as any).refresh === 'function') {
                        await (fileTreeProvider as any).refresh();
                        vscode.window.showInformationMessage("File tree refreshed");
                    } else {
                        vscode.window.showWarningMessage("File tree provider not available");
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error refreshing file tree: ${err}`);
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
                    const terminal = await terminalManager.createAiderTerminal(runtime, testName);
                    terminal.show();
                } catch (err) {
                    vscode.window.showErrorMessage(`Error opening aider terminal: ${err}`);
                }
            }
        )
    );

    disposables.push(
        showProcessLogs()
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
            } catch (error: any) {
                vscode.window.showErrorMessage(`❌ Cannot connect to server: ${error.message}`);
            }
        })
    );

    // Open server webview command
    disposables.push(
        openServerWebview()
    );

    return disposables;
}
