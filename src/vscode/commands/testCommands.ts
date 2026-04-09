import * as vscode from "vscode";
import type { TerminalManager } from '../TerminalManager';
import type { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export const registerTestCommands = (
    terminalManager: TerminalManager
): vscode.Disposable[] => {
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
            "testeranto.openAiderTerminal",
            async (containerName?: string, label?: string, agentName?: string) => {
                try {
                    vscode.window.showInformationMessage(`Opening aider terminal for ${label || 'Aider'}...`);
                    const terminal = await terminalManager.openAiderTerminal(containerName || '', label || 'Aider', agentName);
                    terminal.show();
                } catch (err) {
                    vscode.window.showErrorMessage(`Error opening aider terminal: ${err}`);
                }
            }
        )
    );

    return disposables;
};
