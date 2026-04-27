import * as vscode from 'vscode';
import { BASE_URL } from '../../api';

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

            // Always construct the URL from the view key, ignoring the viewUrl parameter
            const actualViewUrl = `${BASE_URL}/testeranto/views/${viewKey}.html`;

            // Create a webview panel with an iframe pointing to the server URL
            const panel = vscode.window.createWebviewPanel(
                `testeranto.view.${viewKey}`,
                `View: ${viewKey}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Use an iframe to load the page from the server
            // This avoids the complexity of fetching and modifying HTML
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
