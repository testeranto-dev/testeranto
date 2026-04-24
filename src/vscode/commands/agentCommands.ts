import * as vscode from "vscode";
import { ApiUtils } from '../providers/utils/apiUtils';
import type { AgentTreeDataProvider } from '../providers/AgentTreeDataProvider';

export const registerAgentCommands = (
    agentProvider: AgentTreeDataProvider,
    chatProvider: any
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

    return disposables;
};
