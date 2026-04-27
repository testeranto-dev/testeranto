import * as vscode from "vscode";
import { ApiUtils } from '../providers/utils/apiUtils';
import type { StatusBarManager } from '../statusBarManager';

export const registerServerCommands = (
    statusBarManager: StatusBarManager,
    runtimeProvider: any
): vscode.Disposable[] => {
    const disposables: vscode.Disposable[] = [];

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

    // disposables.push(
    //     vscode.commands.registerCommand("testeranto.startServer", async () => {
    //         vscode.window.showInformationMessage("Starting Testeranto server...");

    //         const terminal = vscode.window.createTerminal('Testeranto Server');
    //         terminal.show();

    //         const workspaceFolders = vscode.workspace.workspaceFolders;
    //         if (workspaceFolders && workspaceFolders.length > 0) {
    //             const workspacePath = workspaceFolders[0].uri.fsPath;
    //             terminal.sendText(`cd "${workspacePath}" && npm start`);
    //         } else {
    //             terminal.sendText('npm start');
    //         }

    //         vscode.window.showInformationMessage('Server starting in terminal. It may take a few moments...');

    //         setTimeout(async () => {
    //             await statusBarManager.updateServerStatus();
    //             // Refresh the runtime provider if available
    //             if (runtimeProvider && typeof (runtimeProvider as any).refresh === 'function') {
    //                 (runtimeProvider as any).refresh();
    //             }
    //         }, 5000);
    //     })
    // );

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

    disposables.push(
        vscode.commands.registerCommand("testeranto.checkLockStatus", async () => {
            try {
                // Fetch lock status from server using API definition
                const url = ApiUtils.getUrl('getLockStatus');
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.hasLockedFiles) {
                        vscode.window.showInformationMessage(
                            `Files are locked: ${data.lockedCount} file(s) locked for system restart`,
                            { modal: false }
                        );
                    } else {
                        vscode.window.showInformationMessage(
                            'All files are unlocked and available for testing',
                            { modal: false }
                        );
                    }
                } else {
                    vscode.window.showErrorMessage('Failed to fetch lock status from server');
                }
            } catch (err) {
                vscode.window.showErrorMessage(`Error checking lock status: ${err}`);
            }
        })
    );

    return disposables;
};
