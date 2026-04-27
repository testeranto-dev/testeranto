
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
// import { testProviders } from "./testProviders";
import config from "../../../testeranto/testeranto";
import { getApiUrl } from "../../api";
import { launchAgentCommand } from "../commands/launchAgentCommand";
import { launchRuntimeTestCommand } from "../commands/launchRuntimeTestCommand";

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
            launchAgentCommand(context, outputChannel)
        );

        // Register run test command (unified test execution route)
        context.subscriptions.push(
            launchRuntimeTestCommand(context, outputChannel)
        );

        vscode.window.showInformationMessage('Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.');

        // registerAdditionalCommands(context, outputChannel, terminalManager);
        registerCheckServerCommand(context);
        registerOpenProcessTerminalCommand(context, outputChannel, terminalManager);
        registerOpenAiderTerminalCommand(context, outputChannel, terminalManager);
        registerOpenViewCommand(context, outputChannel);

        registerTreeViews(providers, context, outputChannel);

        // await testProviders(providers, outputChannel);

        refreshProviders(providers, outputChannel);

        setupCleanup(context, outputChannel, terminalManager, statusBarManager, providers, commandDisposables);

        outputChannel.appendLine("[Testeranto] Extension activated successfully");
        console.log("[Testeranto] Extension activated successfully");

    } catch (error: any) {
        handleActivationError(error, outputChannel);
    }

}
