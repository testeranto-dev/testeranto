import * as vscode from 'vscode';

export function registerOpenProcessTerminalCommand(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    terminalManager: any
): void {
    const openProcessTerminalCommand = vscode.commands.registerCommand('testeranto.openProcessTerminal', async (nodeId?: string, label?: string, containerId?: string, serviceName?: string) => {
        try {
            outputChannel.appendLine(`[Testeranto] Opening terminal for process: ${nodeId || 'unknown'}`);

            if (!nodeId) {
                vscode.window.showWarningMessage('No process node ID provided');
                return;
            }

            await terminalManager.openProcessTerminal(nodeId, label || 'Process', containerId || '', serviceName || '');

        } catch (error: any) {
            outputChannel.appendLine(`[Testeranto] Error opening process terminal: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to open process terminal: ${error.message}`);
        }
    });
    context.subscriptions.push(openProcessTerminalCommand);
}
