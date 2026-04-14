import * as vscode from "vscode";
import { createOutputChannel } from "./createOutputChannel";
import { createManagers } from "./createManagers";
import { createProviders } from "./createProviders";
import { registerCommands } from "./registerCommands";
import { registerTreeViews } from "./registerTreeViews";
import { testProviders } from "./testProviders";
import { refreshProviders } from "./refreshProviders";
import { registerAdditionalCommands } from "./registerAdditionalCommands";
import { setupCleanup } from "./setupCleanup";
import { handleActivationError } from "./handleActivationError";

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");

    const outputChannel = createOutputChannel();
    outputChannel.show(true);
    outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");

    try {
        vscode.window.showInformationMessage('Testeranto extension is loading...');

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

        vscode.window.showInformationMessage('Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.');

        registerAdditionalCommands(context, outputChannel, terminalManager);

        registerTreeViews(providers, context, outputChannel);

        await testProviders(providers, outputChannel);

        refreshProviders(providers, outputChannel);

        setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables);

        outputChannel.appendLine("[Testeranto] Extension activated successfully");
        console.log("[Testeranto] Extension activated successfully");

    } catch (error: any) {
        handleActivationError(error, outputChannel);
    }

    outputChannel.appendLine("[Testeranto] Extension activation function completed");
}
