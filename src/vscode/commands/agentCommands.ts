import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ApiUtils } from '../providers/utils/apiUtils';
import type { AgentTreeDataProvider } from '../providers/AgentTreeDataProvider';
import type { ChatTreeDataProvider } from '../providers/ChatTreeDataProvider';

export const registerAgentCommands = (
    agentProvider: AgentTreeDataProvider,
    chatProvider: ChatTreeDataProvider
): vscode.Disposable[] => {
    const disposables: vscode.Disposable[] = [];

    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.refreshAgents",
            async () => {
                try {
                    if (agentProvider && typeof (agentProvider as any).refresh === 'function') {
                        await (agentProvider as any).refresh();
                        vscode.window.showInformationMessage("Agents refreshed");
                    } else {
                        vscode.window.showWarningMessage("Agent provider not available");
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error refreshing agents: ${err}`);
                }
            }
        )
    );

    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.launchAgent",
            async (agentName: string) => {
                try {
                    vscode.window.showInformationMessage(`Launching ${agentName} agent...`);

                    // Call the server endpoint to launch the agent using API definition
                    const url = ApiUtils.getUrl('launchAgent', { agentName });
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        vscode.window.showInformationMessage(`${agentName} agent launched with suffix: ${data.suffix}`);

                        // Refresh the agent provider
                        if (agentProvider && typeof (agentProvider as any).refresh === 'function') {
                            await (agentProvider as any).refresh();
                        }
                    } else {
                        vscode.window.showErrorMessage(`Failed to launch ${agentName} agent: ${response.statusText}`);
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error launching agent: ${err}`);
                }
            }
        )
    );

    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.openAgentWebview",
            async (agentName: string, suffix: string) => {
                try {
                    const baseUrl = ApiUtils.getBaseUrl();
                    const url = `${baseUrl}/${agentName}`;
                    if (suffix && suffix !== 'undefined') {
                        // If there's a suffix, the agent instance has its own URL
                        const instanceUrl = `${baseUrl}/${agentName}/${suffix}`;
                        vscode.env.openExternal(vscode.Uri.parse(instanceUrl));
                    } else {
                        vscode.env.openExternal(vscode.Uri.parse(url));
                    }
                    vscode.window.showInformationMessage(`Opening ${agentName} agent in browser...`);
                } catch (err) {
                    vscode.window.showErrorMessage(`Error opening agent webview: ${err}`);
                }
            }
        )
    );

    // disposables.push(
    //     vscode.commands.registerCommand(
    //         "testeranto.launchAgentSelection",
    //         async () => {
    //             // Get agents from the graph data
    //             try {
    //                 const workspaceFolders = vscode.workspace.workspaceFolders;
    //                 if (!workspaceFolders || workspaceFolders.length === 0) {
    //                     vscode.window.showErrorMessage('No workspace folder open');
    //                     return;
    //                 }

    //                 const workspaceRoot = workspaceFolders[0].uri.fsPath;

    //                 // Get agents from configs in graph data
    //                 // Note: This needs to be implemented based on actual data source
    //                 // For now, we'll use a placeholder
    //                 const agentsConfig = {}; // Placeholder
    //                 if (!agentsConfig || typeof agentsConfig !== 'object') {
    //                     vscode.window.showInformationMessage('No agents configured');
    //                     return;
    //                 }

    //                 const agentEntries = Object.entries(agentsConfig);
    //                 if (agentEntries.length === 0) {
    //                     vscode.window.showInformationMessage('No agents configured');
    //                     return;
    //                 }

    //                 // Create agent options for quick pick
    //                 const agentOptions = agentEntries.map(([agentName, agentConfig]) => {
    //                     const config = agentConfig as any;
    //                     const markdownFile = config.markdownFile;
    //                     let label = `${agentName.charAt(0).toUpperCase() + agentName.slice(1)}`;

    //                     // Try to read the markdown file for a better label
    //                     if (markdownFile && typeof markdownFile === 'string') {
    //                         const agentMdPath = path.isAbsolute(markdownFile)
    //                             ? markdownFile
    //                             : path.join(workspaceRoot, markdownFile);

    //                         if (fs.existsSync(agentMdPath)) {
    //                             try {
    //                                 const mdContent = fs.readFileSync(agentMdPath, 'utf-8');
    //                                 const firstLine = mdContent.split('\n')[0];
    //                                 const roleMatch = firstLine.match(/Your name is "([^"]+)". You are a ([^.]+)\./);
    //                                 if (roleMatch) {
    //                                     const name = roleMatch[1];
    //                                     const role = roleMatch[2];
    //                                     label = `${name} (${role})`;
    //                                 }
    //                             } catch (error) {
    //                                 // If we can't read the markdown, use the agent name
    //                             }
    //                         }
    //                     }

    //                     return { label, value: agentName };
    //                 });

    //                 const selected = await vscode.window.showQuickPick(
    //                     agentOptions.map(a => a.label),
    //                     { placeHolder: 'Select an agent to launch' }
    //                 );

    //                 if (selected) {
    //                     const agent = agentOptions.find(a => a.label === selected);
    //                     if (agent) {
    //                         await vscode.commands.executeCommand('testeranto.launchAgent', agent.value);
    //                     }
    //                 }
    //             } catch (error) {
    //                 console.error('[registerCommands] Error launching agent selection:', error);
    //                 vscode.window.showErrorMessage(`Error launching agent: ${error}`);
    //             }
    //         }
    //     )
    // );

    return disposables;
};
