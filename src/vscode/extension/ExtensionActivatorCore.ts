
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
import { getApiUrl } from "../../api";
import { buildAgentCommand } from "../utilities/buildAgentCommand";

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

        // Register launch agent command (unified agent creation route)
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

                    // Compose the Docker command locally using the agent config.
                    // No server request needed – the Docker events watcher will
                    // detect the container when it starts and create the graph node.
                    const agentConfig = config.agents?.[selectedProfile];
                    if (!agentConfig) {
                        vscode.window.showErrorMessage(`Agent profile '${selectedProfile}' not found in configuration`);
                        return;
                    }

                    // Use workspace root from VSCode, not process.cwd()
                    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();

                    // Fetch agent data from the graph via the server API.
                    // The server has already parsed the markdown file and stored
                    // personaBody, readFiles, addFiles in the agent node's metadata.
                    const apiUrl = getApiUrl('getAgentSlice', { agentName: selectedProfile });
                    const response = await fetch(apiUrl, { signal: AbortSignal.timeout?.(3000) });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch agent data from server: ${response.status}`);
                    }
                    const agentData = await response.json();
                    // The agent slice response includes metadata with parsed data
                    const metadata = agentData.metadata || {};
                    const personaBody = metadata.personaBody || "";
                    const readFiles: string[] = metadata.readFiles || [];
                    const addFiles: string[] = metadata.addFiles || [];
                    const personaFilePath = metadata.personaFilePath || "";

                    // Build the Docker command using the shared utility
                    const command = buildAgentCommand(
                        selectedProfile,
                        personaBody,
                        readFiles,
                        addFiles,
                        personaFilePath,
                        workspaceRoot,
                    );

                    outputChannel.appendLine(`[Testeranto] Agent command composed locally for profile: ${selectedProfile}`);

                    // Open a terminal and send the command line by line
                    // The heredoc approach with backslash-newline continuation
                    // makes it easy to send in lines without truncation
                    const terminal = vscode.window.createTerminal(`Agent: ${selectedProfile}`);
                    terminal.show();

                    // Split the command into lines and send each one
                    const lines = command.split('\n');
                    for (const line of lines) {
                        terminal.sendText(line, false);
                    }
                    // Send a final newline to execute the assembled command
                    terminal.sendText('', true);

                    vscode.window.showInformationMessage(`Agent command ready for ${selectedProfile}. Press Enter in the terminal to start the container.`);

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
