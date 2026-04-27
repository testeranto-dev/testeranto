import * as vscode from "vscode";
import { CommandManager } from "../commandManager";

export function registerCommands(
    context: vscode.ExtensionContext,
    terminalManager: any,
    statusBarManager: any,
    providers: any,
    outputChannel: vscode.OutputChannel
): {
    commandManager: CommandManager;
    commandDisposables: vscode.Disposable[];
} {
    outputChannel.appendLine("[Testeranto] Creating CommandManager...");
    const commandManager = new CommandManager(terminalManager, statusBarManager);

    commandManager.setRuntimeProvider(providers.runtimeProvider);
    commandManager.setDockerProcessProvider(providers.dockerProcessProvider);
    // commandManager.setAiderProcessProvider(providers.aiderProcessProvider);
    commandManager.setFileTreeProvider(providers.fileTreeProvider);
    commandManager.setViewTreeProvider(providers.viewTreeProvider);
    commandManager.setAgentProvider(providers.agentProvider);

    const commandDisposables = commandManager.registerCommands(
        context,
        terminalManager,
        providers.runtimeProvider,
        statusBarManager,
        providers.dockerProcessProvider,
        // providers.aiderProcessProvider,
        providers.fileTreeProvider,
    );

    outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");

    return { commandManager, commandDisposables };
}
