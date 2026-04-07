import * as vscode from "vscode";
import type { DockerProcessTreeDataProvider } from '../providers/DockerProcessTreeDataProvider';
import type { AiderProcessTreeDataProvider } from '../providers/AiderProcessTreeDataProvider';

export const registerProcessCommands = (
    dockerProcessProvider: DockerProcessTreeDataProvider,
    aiderProcessProvider: AiderProcessTreeDataProvider,
    fileTreeProvider: any
): vscode.Disposable[] => {
    const disposables: vscode.Disposable[] = [];

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

    return disposables;
};
