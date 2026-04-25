import * as vscode from "vscode";
import { registerOpenProcessTerminalCommand } from "../commands/registerOpenProcessTerminalCommand";
import { registerOpenAiderTerminalCommand } from "../commands/registerOpenAiderTerminalCommand";
import { registerOpenViewCommand } from "../commands/registerOpenViewCommand";
import { registerCheckServerCommand } from "../registerCheckServerCommand";
import { createManagers } from "./createManagers";
import { createOutputChannel } from "./createOutputChannel";
import { createProviders } from "./createProviders";
import { handleActivationError } from "./handleActivationError";
import { refreshProviders } from "./refreshProviders";
import { registerCommands } from "./registerCommands";
import { registerTreeViews } from "./registerTreeViews";
import { setupCleanup } from "./setupCleanup";
import { testProviders } from "./testProviders";
import config from "../../../testeranto/testeranto";

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    const outputChannel = createOutputChannel();
    outputChannel.show(true);
    outputChannel.appendLine("[Testeranto] Extension activating...");

    try {
        outputChannel.appendLine("[Testeranto] =========================================");
        outputChannel.appendLine("[Testeranto] Extension activation started");
        outputChannel.appendLine("[Testeranto] =========================================");

        const { terminalManager, statusBarManager } = createManagers(outputChannel);
        statusBarManager.updateServerStatus();

        const providers = createProviders(outputChannel);
        const { commandManager, commandDisposables } = registerCommands(
            context,
            terminalManager,
            statusBarManager,
            providers,
            outputChannel
        );

        // Register launch agent command
        context.subscriptions.push(
            vscode.commands.registerCommand('testeranto.launchAgent', async () => {
                outputChannel.appendLine('[Testeranto] Launching agent...');
                try {
                    // Show quick pick to select agent profile
                    const profiles = Object.keys(config.agents || {});
                    if (profiles.length === 0) {
                        vscode.window.showErrorMessage('No agent profiles configured');
                        return;
                    }

                    const selectedProfile = await vscode.window.showQuickPick(profiles, {
                        placeHolder: 'Select agent profile to launch'
                    });

                    if (!selectedProfile) {
                        return;
                    }

                    // Generate a unique requestUid for this async operation
                    const requestUid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    outputChannel.appendLine(`[Testeranto] Generated requestUid: ${requestUid}`);

                    // Start waiting for the notification before making the API call
                    const notificationPromise = providers.agentTreeDataProvider?.waitForNotification?.(requestUid, 60000);

                    // Call the spawn agent API endpoint with the requestUid
                    const response = await fetch('http://localhost:3000/~/agents/spawn', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            profile: selectedProfile,
                            requestUid,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Server returned ${response.status}`);
                    }

                    const result = await response.json();
                    outputChannel.appendLine(`[Testeranto] Agent launched: ${result.agentName} (container: ${result.containerId})`);

                    // Wait for the graph update notification with matching UID
                    if (notificationPromise) {
                        outputChannel.appendLine(`[Testeranto] Waiting for graph update notification with requestUid: ${requestUid}`);
                        try {
                            const notification = await notificationPromise;
                            outputChannel.appendLine(`[Testeranto] Received graph update notification for ${result.agentName}`);
                        } catch (waitError: any) {
                            outputChannel.appendLine(`[Testeranto] Warning: ${waitError.message}`);
                            // Continue anyway - the agent was spawned successfully
                        }
                    }

                    vscode.window.showInformationMessage(`Agent ${result.agentName} launched successfully`);

                    // Refresh the agent tree view
                    providers.agentTreeDataProvider?.refresh();

                    // Open a terminal to the new agent using the actual container ID
                    vscode.commands.executeCommand(
                        'testeranto.openAiderTerminal',
                        `agent-${result.agentName}`,
                        `Agent: ${result.agentName}`,
                        result.agentName,
                        result.containerId
                    );
                } catch (error: any) {
                    outputChannel.appendLine(`[Testeranto] Failed to launch agent: ${error.message}`);
                    vscode.window.showErrorMessage(`Failed to launch agent: ${error.message}`);
                }
            })
        );

        vscode.window.showInformationMessage('Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.');

        // registerAdditionalCommands(context, outputChannel, terminalManager);
        registerCheckServerCommand(context);
        registerOpenProcessTerminalCommand(context, outputChannel, terminalManager);
        registerOpenAiderTerminalCommand(context, outputChannel, terminalManager);
        registerOpenViewCommand(context, outputChannel);

        registerTreeViews(providers, context, outputChannel);

        await testProviders(providers, outputChannel);

        refreshProviders(providers, outputChannel);

        setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables);

        outputChannel.appendLine("[Testeranto] Extension activated successfully");
        console.log("[Testeranto] Extension activated successfully");

    } catch (error: any) {
        handleActivationError(error, outputChannel);
    }

}
