import * as vscode from 'vscode';

export function registerCheckServerCommand(context: vscode.ExtensionContext): void {
    const checkServerCommand = vscode.commands.registerCommand('testeranto.checkServer', async () => {
        try {
            const response = await fetch('http://localhost:3000/~/configs', {
                method: 'GET',
                signal: AbortSignal.timeout?.(3000) || (() => {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 3000);
                    return controller.signal;
                })()
            });
            if (response.ok) {
                vscode.window.showInformationMessage('✅ Testeranto server is running');
            } else {
                vscode.window.showWarningMessage('⚠️ Server responded with error: ' + response.status);
            }
        } catch (error) {
            vscode.window.showErrorMessage('❌ Cannot connect to Testeranto server. Make sure it is running on port 3000.');
        }
    });
    context.subscriptions.push(checkServerCommand);
}
