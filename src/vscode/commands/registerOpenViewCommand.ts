import * as vscode from 'vscode';

export function registerOpenViewCommand(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): void {
    const openViewCommand = vscode.commands.registerCommand('testeranto.openView', async (viewKey?: string, viewUrl?: string) => {
        try {
            outputChannel.appendLine(`[Testeranto] Opening view: ${viewKey || 'unknown'}`);

            if (!viewKey) {
                vscode.window.showWarningMessage('No view key provided');
                return;
            }

            const actualViewUrl = viewUrl || `http://localhost:3000/testeranto/views/${viewKey}.html`;

            const panel = vscode.window.createWebviewPanel(
                `testeranto.view.${viewKey}`,
                `View: ${viewKey}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body, html {
                            margin: 0;
                            padding: 0;
                            height: 100%;
                            overflow: hidden;
                        }
                        iframe {
                            width: 100%;
                            height: 100vh;
                            border: none;
                        }
                    </style>
                </head>
                <body>
                    <iframe src="${actualViewUrl}"></iframe>
                </body>
                </html>
            `;

            outputChannel.appendLine(`[Testeranto] Opened view: ${viewKey} at ${actualViewUrl}`);

        } catch (error: any) {
            outputChannel.appendLine(`[Testeranto] Error opening view: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to open view: ${error.message}`);
        }
    });
    context.subscriptions.push(openViewCommand);
}
