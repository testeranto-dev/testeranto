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

                    // Call the spawn agent API endpoint with the profile name
                    const url = ApiUtils.getUrl('spawnAgent');
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            profile: agentName
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        vscode.window.showInformationMessage(`${agentName} agent launched: ${data.agentName} (container: ${data.containerId})`);

                        // Refresh the agent provider
                        if (agentProvider && typeof (agentProvider as any).refresh === 'function') {
                            await (agentProvider as any).refresh();
                        }
                    } else {
                        const errorData = await response.json();
                        vscode.window.showErrorMessage(`Failed to launch ${agentName} agent: ${errorData.error || response.statusText}`);
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error launching agent: ${err}`);
                }
            }
        )
    );

    return disposables;
};
