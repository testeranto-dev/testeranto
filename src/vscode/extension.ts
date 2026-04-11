import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { TerminalManager } from "./TerminalManager";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
import { DockerProcessTreeDataProvider } from "./providers/DockerProcessTreeDataProvider";
import { AiderProcessTreeDataProvider } from "./providers/AiderProcessTreeDataProvider";
import { FileTreeDataProvider } from "./providers/FileTreeDataProvider";
import { ViewTreeDataProvider } from "./providers/ViewTreeDataProvider";
import { AgentTreeDataProvider } from "./providers/AgentTreeDataProvider";
import { ChatTreeDataProvider } from "./providers/ChatTreeDataProvider";
import { StatusBarManager } from "./statusBarManager";
import { CommandManager } from "./commandManager";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");

    // Create output channel for Testeranto logs
    const outputChannel = vscode.window.createOutputChannel("Testeranto");
    outputChannel.show(true); // Show the output channel
    outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");

    try {
        // SIMPLE TEST - Show a message to prove extension works
        vscode.window.showInformationMessage('Testeranto extension is loading...');

        // Create output channel first
        outputChannel.appendLine("[Testeranto] =========================================");
        outputChannel.appendLine("[Testeranto] Extension activation started");
        outputChannel.appendLine("[Testeranto] =========================================");

        // Create managers
        outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
        const terminalManager = new TerminalManager();
        outputChannel.appendLine("[Testeranto] TerminalManager created");

        outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
        const statusBarManager = new StatusBarManager();
        statusBarManager.initialize();
        outputChannel.appendLine("[Testeranto] StatusBarManager created");

        // Initial status check
        outputChannel.appendLine("[Testeranto] Updating server status...");
        statusBarManager.updateServerStatus();

        // Don't create terminals automatically - they should be created on demand
        outputChannel.appendLine("[Testeranto] Skipping automatic terminal creation");

        // Create providers using graph-based approach
        outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
        const runtimeProvider = new TestTreeDataProvider();
        outputChannel.appendLine("[Testeranto] TestTreeDataProvider created successfully");

        // Create Docker process provider using graph data
        outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
        const dockerProcessProvider = new DockerProcessTreeDataProvider();
        outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created successfully");

        // Create Aider process provider using graph data
        outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
        const aiderProcessProvider = new AiderProcessTreeDataProvider();
        outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created successfully");

        // Create File tree provider for file perspective
        outputChannel.appendLine("[Testeranto] Creating FileTreeDataProvider...");
        const fileTreeProvider = new FileTreeDataProvider();
        outputChannel.appendLine("[Testeranto] FileTreeDataProvider created successfully");

        // Create View tree provider for configured views
        outputChannel.appendLine("[Testeranto] Creating ViewTreeDataProvider...");
        const viewTreeProvider = new ViewTreeDataProvider();
        outputChannel.appendLine("[Testeranto] ViewTreeDataProvider created successfully");

        // Create Agent tree provider
        outputChannel.appendLine("[Testeranto] Creating AgentTreeDataProvider...");
        const agentProvider = new AgentTreeDataProvider();
        outputChannel.appendLine("[Testeranto] AgentTreeDataProvider created successfully");

        // Verify providers implement required interface
        outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
        const requiredMethods = ['getChildren', 'getTreeItem'];
        for (const [name, provider] of Object.entries({
            runtimeProvider,
            dockerProcessProvider,
            aiderProcessProvider,
            fileTreeProvider,
            viewTreeProvider,
            agentProvider,
        })) {
            outputChannel.appendLine(`[Testeranto] Checking provider: ${name}`);
            for (const method of requiredMethods) {
                if (typeof (provider as any)[method] !== 'function') {
                    const errorMsg = `${name} does not implement required method: ${method}`;
                    outputChannel.appendLine(`[Testeranto] ERROR: ${errorMsg}`);
                    throw new Error(errorMsg);
                }
                outputChannel.appendLine(`[Testeranto] ✓ ${name} implements ${method}`);
            }
        }

        // Create command manager
        outputChannel.appendLine("[Testeranto] Creating CommandManager...");
        const commandManager = new CommandManager(terminalManager, statusBarManager);
        // Set the providers so commands can refresh them
        commandManager.setRuntimeProvider(runtimeProvider);
        commandManager.setDockerProcessProvider(dockerProcessProvider);
        commandManager.setAiderProcessProvider(aiderProcessProvider);
        commandManager.setFileTreeProvider(fileTreeProvider);
        commandManager.setViewTreeProvider(viewTreeProvider);
        commandManager.setAgentProvider(agentProvider);
        const commandDisposables = commandManager.registerCommands(
            context,
            terminalManager,
            runtimeProvider,
            statusBarManager,
            dockerProcessProvider,
            aiderProcessProvider,
            fileTreeProvider,
        );

        outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");

        // Show a welcome message
        vscode.window.showInformationMessage('Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.');

        // Add a simple command to check server status
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

        // Register the openProcessTerminal command
        const openProcessTerminalCommand = vscode.commands.registerCommand('testeranto.openProcessTerminal', async (nodeId?: string, label?: string, containerId?: string, serviceName?: string) => {
            try {
                outputChannel.appendLine(`[Testeranto] Opening terminal for process: ${nodeId || 'unknown'}`);

                if (!nodeId) {
                    vscode.window.showWarningMessage('No process node ID provided');
                    return;
                }

                // Use the TerminalManager to open the terminal
                await terminalManager.openProcessTerminal(nodeId, label || 'Process', containerId || '', serviceName || '');

            } catch (error: any) {
                outputChannel.appendLine(`[Testeranto] Error opening process terminal: ${error.message}`);
                vscode.window.showErrorMessage(`Failed to open process terminal: ${error.message}`);
            }
        });
        context.subscriptions.push(openProcessTerminalCommand);

        // Register the openView command
        const openViewCommand = vscode.commands.registerCommand('testeranto.openView', async (viewKey?: string, viewUrl?: string) => {
            try {
                outputChannel.appendLine(`[Testeranto] Opening view: ${viewKey || 'unknown'}`);

                if (!viewKey) {
                    vscode.window.showWarningMessage('No view key provided');
                    return;
                }

                // Construct the URL directly - views are always at http://localhost:3000/testeranto/views/{viewKey}.html
                const actualViewUrl = viewUrl || `http://localhost:3000/testeranto/views/${viewKey}.html`;

                // Open the view in a webview panel
                const panel = vscode.window.createWebviewPanel(
                    `testeranto.view.${viewKey}`,
                    `View: ${viewKey}`,
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                // Load the view in an iframe
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

        // Register tree data providers FIRST
        outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
        vscode.window.registerTreeDataProvider('testeranto.runtimeView', runtimeProvider);
        vscode.window.registerTreeDataProvider('testeranto.dockerProcessView', dockerProcessProvider);
        vscode.window.registerTreeDataProvider('testeranto.aiderProcessView', aiderProcessProvider);
        vscode.window.registerTreeDataProvider('testeranto.fileTreeView', fileTreeProvider);
        vscode.window.registerTreeDataProvider('testeranto.viewView', viewTreeProvider);
        vscode.window.registerTreeDataProvider('testeranto.agentView', agentProvider);
        outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");

        // Create tree views AFTER registering providers
        outputChannel.appendLine("[Testeranto] Creating tree views...");
        const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
            treeDataProvider: runtimeProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");

        const dockerProcessTreeView = vscode.window.createTreeView("testeranto.dockerProcessView", {
            treeDataProvider: dockerProcessProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");

        const aiderProcessTreeView = vscode.window.createTreeView("testeranto.aiderProcessView", {
            treeDataProvider: aiderProcessProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");

        const fileTreeView = vscode.window.createTreeView("testeranto.fileTreeView", {
            treeDataProvider: fileTreeProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] File tree view created successfully");

        const viewTreeView = vscode.window.createTreeView("testeranto.viewView", {
            treeDataProvider: viewTreeProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] View tree view created successfully");

        const agentTreeView = vscode.window.createTreeView("testeranto.agentView", {
            treeDataProvider: agentProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Agent tree view created successfully");

        // Add tree views to subscriptions
        outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
        context.subscriptions.push(
            runtimeTreeView,
            dockerProcessTreeView,
            aiderProcessTreeView,
            fileTreeView,
            viewTreeView,
            agentTreeView
        );
        outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");

        // Test the providers by calling getChildren with undefined (root)
        outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
        try {
            const runtimeChildren = await runtimeProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] runtimeProvider.getChildren() returned ${runtimeChildren?.length || 0} items`);

            // Log what items we got
            if (runtimeChildren && runtimeChildren.length > 0) {
                runtimeChildren.forEach((item, index) => {
                    outputChannel.appendLine(`[Testeranto]   Item ${index}: ${item.label} (${item.type})`);
                });
            }
        } catch (error) {
            outputChannel.appendLine(`[Testeranto] ERROR testing runtimeProvider: ${error}`);
        }

        // Test other providers but don't fail if they error
        try {
            const dockerChildren = await dockerProcessProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);
        } catch (error) {
            outputChannel.appendLine(`[Testeranto] dockerProcessProvider error (non-fatal): ${error}`);
        }

        try {
            const fileChildren = await fileTreeProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
        } catch (error) {
            outputChannel.appendLine(`[Testeranto] fileTreeProvider error (non-fatal): ${error}`);
        }

        try {
            const viewChildren = await viewTreeProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] viewTreeProvider.getChildren() returned ${viewChildren?.length || 0} items`);
        } catch (error) {
            outputChannel.appendLine(`[Testeranto] viewTreeProvider error (non-fatal): ${error}`);
        }

        // Refresh all providers to load initial data
        outputChannel.appendLine("[Testeranto] Refreshing tree data providers...");
        if (typeof runtimeProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing runtimeProvider...");
            runtimeProvider.refresh();
        }
        if (typeof dockerProcessProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing dockerProcessProvider...");
            dockerProcessProvider.refresh();
        }
        if (typeof aiderProcessProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing aiderProcessProvider...");
            aiderProcessProvider.refresh();
        }
        if (typeof fileTreeProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing fileTreeProvider...");
            fileTreeProvider.refresh();
        }
        if (typeof viewTreeProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing viewTreeProvider...");
            viewTreeProvider.refresh();
        }
        if (typeof agentProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing agentProvider...");
            agentProvider.refresh();
        }
        outputChannel.appendLine("[Testeranto] Tree data providers refreshed");

        // Register the openChat command
        const openChatCommand = vscode.commands.registerCommand('testeranto.openChat', async () => {
            try {
                outputChannel.appendLine('[Testeranto] Opening group chat');

                // Create a webview panel for the chat
                const panel = vscode.window.createWebviewPanel(
                    'testeranto.chat',
                    'Testeranto Group Chat',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                // Simple chat interface
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
                            
                            // Handle messages from the extension
                            window.addEventListener('message', event => {
                                const message = event.data;
                                if (message.command === 'receiveMessage') {
                                    addMessage(message.sender, message.text, message.time);
                                }
                            });
                            
                            // Initial message
                            addMessage('System', 'Chat started. Messages are not persisted yet.', new Date().toLocaleTimeString());
                        </script>
                    </body>
                    </html>
                `;

                // Handle messages from the webview
                panel.webview.onDidReceiveMessage(
                    async message => {
                        if (message.command === 'sendMessage') {
                            outputChannel.appendLine(`[Testeranto] Chat message: ${message.text}`);
                            // For now, just echo back
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

        // Clean up on deactivation
        context.subscriptions.push({
            dispose: () => {
                outputChannel.appendLine("[Testeranto] Extension deactivating...");
                terminalManager.disposeAll();
                runtimeProvider.dispose?.();
                dockerProcessProvider.dispose?.();
                aiderProcessProvider.dispose?.();
                fileTreeProvider.dispose?.();
                viewTreeProvider.dispose?.();
                agentProvider.dispose?.();
                statusBarManager.dispose();
                outputChannel.dispose();
            }
        });

        // Register all disposables
        outputChannel.appendLine("[Testeranto] Registering all disposables...");
        context.subscriptions.push(
            outputChannel,
            ...commandDisposables,
            statusBarManager.getMainStatusBarItem(),
            statusBarManager.getServerStatusBarItem()
        );

        outputChannel.appendLine("[Testeranto] Extension activated successfully");
        outputChannel.appendLine("[Testeranto] Test command 'testeranto.testLogging' registered");
        console.log("[Testeranto] Extension activated successfully");

    } catch (error: any) {
        outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
        outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
        vscode.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
        console.error("[Testeranto] Extension activation failed:", error);
    }

    outputChannel.appendLine("[Testeranto] Extension activation function completed");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
