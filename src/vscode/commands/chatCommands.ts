import * as vscode from "vscode";
import { ApiUtils } from '../providers/utils/apiUtils';
import type { ChatTreeDataProvider } from '../providers/ChatTreeDataProvider';
// import { getWebviewContent } from "./getWebviewContent";

export const registerChatCommands = (
    chatProvider: ChatTreeDataProvider
): vscode.Disposable[] => {
    const disposables: vscode.Disposable[] = [];

    // disposables.push(
    //     vscode.commands.registerCommand(
    //         "testeranto.refreshChat",
    //         async () => {
    //             try {
    //                 if (chatProvider && typeof (chatProvider as any).refresh === 'function') {
    //                     await (chatProvider as any).refresh();
    //                     vscode.window.showInformationMessage("Chat refreshed");
    //                 } else {
    //                     vscode.window.showWarningMessage("Chat provider not available");
    //                 }
    //             } catch (err) {
    //                 vscode.window.showErrorMessage(`Error refreshing chat: ${err}`);
    //             }
    //         }
    //     )
    // );

    // disposables.push(
    //     vscode.commands.registerCommand(
    //         "testeranto.clearChat",
    //         async () => {
    //             try {
    //                 if (chatProvider && typeof (chatProvider as any).clearChat === 'function') {
    //                     await (chatProvider as any).clearChat();
    //                     vscode.window.showInformationMessage("Chat cleared");
    //                 } else {
    //                     vscode.window.showWarningMessage("Chat provider not available");
    //                 }
    //             } catch (err) {
    //                 vscode.window.showErrorMessage(`Error clearing chat: ${err}`);
    //             }
    //         }
    //     )
    // );

    // disposables.push(
    //     vscode.commands.registerCommand(
    //         "testeranto.sendChatMessage",
    //         async () => {
    //             try {
    //                 // Fetch agents from server
    //                 const response = await fetch('http://localhost:3000/~/agents');
    //                 let agents: Array<{ name: string; markdownFile: string; hasSliceFunction: boolean }> = [];

    //                 if (response.ok) {
    //                     const data = await response.json();
    //                     agents = data.agents || [];
    //                 } else {
    //                     console.error('Failed to fetch agents:', await response.text());
    //                 }

    //                 // Collect agents for selection
    //                 const chatAgents: Array<{ label: string, value: string }> = [];

    //                 // Add 'User' option for the person using VS Code
    //                 chatAgents.push({ label: 'User', value: 'user' });

    //                 // Add fetched agents
    //                 agents.forEach(agent => {
    //                     chatAgents.push({ label: agent.name, value: agent.name });
    //                 });

    //                 if (chatAgents.length === 0) {
    //                     vscode.window.showInformationMessage('No agents available');
    //                     return;
    //                 }

    //                 const selectedAgent = await vscode.window.showQuickPick(
    //                     chatAgents.map(a => a.label),
    //                     { placeHolder: 'Select an agent to send message as' }
    //                 );

    //                 if (!selectedAgent) {
    //                     return;
    //                 }

    //                 const agent = chatAgents.find(a => a.label === selectedAgent);
    //                 if (!agent) {
    //                     return;
    //                 }

    //                 // Get message
    //                 const message = await vscode.window.showInputBox({
    //                     placeHolder: 'Enter your message',
    //                     prompt: `Message from ${agent.value}`
    //                 });

    //                 if (!message) {
    //                     return;
    //                 }

    //                 // Send to server endpoint using API definition
    //                 const url = ApiUtils.getUrl('sendChatMessage', {}, {
    //                     agent: agent.value,
    //                     message: message
    //                 });
    //                 const sendResponse = await fetch(url);

    //                 if (sendResponse.ok) {
    //                     vscode.window.showInformationMessage(`Message sent from ${agent.value}`);

    //                     // Also add to local chat provider immediately
    //                     if (chatProvider && typeof (chatProvider as any).addChatMessage === 'function') {
    //                         (chatProvider as any).addChatMessage(agent.value, message);
    //                     }
    //                 } else {
    //                     vscode.window.showErrorMessage(`Failed to send message: ${sendResponse.statusText}`);
    //                 }
    //             } catch (err) {
    //                 vscode.window.showErrorMessage(`Error sending chat message: ${err}`);
    //             }
    //         }
    //     )
    // );

    // disposables.push(
    //     vscode.commands.registerCommand(
    //         "testeranto.openChat",
    //         async () => {
    //             try {
    //                 // Create webview panel for chat
    //                 const panel = vscode.window.createWebviewPanel(
    //                     'testerantoChat',
    //                     'Testeranto Group Chat',
    //                     vscode.ViewColumn.One,
    //                     {
    //                         enableScripts: true,
    //                         retainContextWhenHidden: true,
    //                     }
    //                 );

    //                 // Get the webview content from a separate function for clarity
    //                 panel.webview.html = getWebviewContent();

    //                 // Handle messages from the webview
    //                 panel.webview.onDidReceiveMessage(
    //                     async message => {
    //                         switch (message.command) {
    //                             case 'sendMessage':
    //                                 try {
    //                                     const url = `http://localhost:3000/~/chat?agent=${encodeURIComponent(message.agent)}&message=${encodeURIComponent(message.text)}`;
    //                                     const response = await fetch(url);
    //                                     if (!response.ok) {
    //                                         vscode.window.showErrorMessage(`Failed to send message: ${response.statusText}`);
    //                                     }
    //                                 } catch (err) {
    //                                     vscode.window.showErrorMessage(`Error sending message: ${err}`);
    //                                 }
    //                                 break;
    //                             case 'showError':
    //                                 vscode.window.showErrorMessage(message.text);
    //                                 break;
    //                         }
    //                     },
    //                     undefined,
    //                     disposables
    //                 );

    //                 vscode.window.showInformationMessage('Opened Testeranto Group Chat');
    //             } catch (err) {
    //                 vscode.window.showErrorMessage(`Error opening chat: ${err}`);
    //             }
    //         }
    //     )
    // );

    return disposables;
};


