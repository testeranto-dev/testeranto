import * as vscode from "vscode";

export function registerAdditionalCommands(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    terminalManager: any
): void {
    registerCheckServerCommand(context);
    registerOpenProcessTerminalCommand(context, outputChannel, terminalManager);
    registerOpenViewCommand(context, outputChannel);
    registerOpenChatCommand(context, outputChannel);
}

function registerCheckServerCommand(context: vscode.ExtensionContext): void {
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

function registerOpenProcessTerminalCommand(
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

function registerOpenViewCommand(
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

function registerOpenChatCommand(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): void {
    const openChatCommand = vscode.commands.registerCommand('testeranto.openChat', async () => {
        try {
            outputChannel.appendLine('[Testeranto] Opening group chat');

            const panel = vscode.window.createWebviewPanel(
                'testeranto.chat',
                'Testeranto Group Chat',
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
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
                        .message { margin-bottom: 10px; }
                        .message .sender { font-weight: bold; }
                        .message .time { font-size: 0.8em; color: #666; }
                        #messageInput { width: 70%; padding: 5px; }
                        #sendButton { padding: 5px 10px; }
                    </style>
                </head>
                <body>
                    <h1>Testeranto Group Chat</h1>
                    <div id="messages"></div>
                    <input type="text" id="messageInput" placeholder="Type a message...">
                    <button id="sendButton">Send</button>
                    <script>
                        const vscode = acquireVsCodeApi();
                        const messagesDiv = document.getElementById('messages');
                        const messageInput = document.getElementById('messageInput');
                        const sendButton = document.getElementById('sendButton');
                        
                        function addMessage(sender, text, time) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message';
                            messageDiv.innerHTML = \`
                                <div class="sender">\${sender}</div>
                                <div class="text">\${text}</div>
                                <div class="time">\${time}</div>
                            \`;
                            messagesDiv.appendChild(messageDiv);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                        
                        sendButton.addEventListener('click', () => {
                            const text = messageInput.value.trim();
                            if (text) {
                                vscode.postMessage({
                                    command: 'sendMessage',
                                    text: text
                                });
                                messageInput.value = '';
                            }
                        });
                        
                        messageInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                sendButton.click();
                            }
                        });
                        
                        window.addEventListener('message', event => {
                            const message = event.data;
                            if (message.command === 'receiveMessage') {
                                addMessage(message.sender, message.text, message.time);
                            }
                        });
                        
                        addMessage('System', 'Chat started. Messages are not persisted yet.', new Date().toLocaleTimeString());
                    </script>
                </body>
                </html>
            `;

            panel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'sendMessage') {
                        outputChannel.appendLine(`[Testeranto] Chat message: ${message.text}`);
                        panel.webview.postMessage({
                            command: 'receiveMessage',
                            sender: 'You',
                            text: message.text,
                            time: new Date().toLocaleTimeString()
                        });
                    }
                },
                undefined,
                context.subscriptions
            );

        } catch (error: any) {
            outputChannel.appendLine(`[Testeranto] Error opening chat: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to open chat: ${error.message}`);
        }
    });
    context.subscriptions.push(openChatCommand);
}
