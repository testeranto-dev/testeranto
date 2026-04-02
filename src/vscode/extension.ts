import * as vscode from "vscode";
import { TerminalManager } from "./TerminalManager";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
import { DockerProcessTreeDataProvider } from "./providers/DockerProcessTreeDataProvider";
import { AiderProcessTreeDataProvider } from "./providers/AiderProcessTreeDataProvider";
import { StatusBarManager } from "./statusBarManager";
import { CommandManager } from "./commandManager";

export function activate(context: vscode.ExtensionContext): void {
    // Create output channel for Testeranto logs
    const outputChannel = vscode.window.createOutputChannel("Testeranto");
    outputChannel.show(true); // Show the output channel
    outputChannel.appendLine("[Testeranto] Extension activating...");
    
    // Create managers
    const terminalManager = new TerminalManager();
    terminalManager.createAllTerminals();

    const statusBarManager = new StatusBarManager();
    statusBarManager.initialize();

    // Initial status check
    statusBarManager.updateServerStatus();

    // Create providers
    outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
    const runtimeProvider = new TestTreeDataProvider();
    outputChannel.appendLine("[Testeranto] TestTreeDataProvider created");

    // Create Docker process provider
    outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
    const dockerProcessProvider = new DockerProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created");

    // Create Aider process provider
    outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
    const aiderProcessProvider = new AiderProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created");

    // Create command manager
    outputChannel.appendLine("[Testeranto] Creating CommandManager...");
    const commandManager = new CommandManager(terminalManager, statusBarManager);
    // Set the providers so commands can refresh them
    commandManager.setRuntimeProvider(runtimeProvider);
    commandManager.setDockerProcessProvider(dockerProcessProvider);
    commandManager.setAiderProcessProvider(aiderProcessProvider);
    const commandDisposables = commandManager.registerCommands(context);
    outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");

    // Register tree views
    const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
        treeDataProvider: runtimeProvider,
        showCollapseAll: true
    });

    // Register Docker processes tree view
    const dockerProcessTreeView = vscode.window.createTreeView("testeranto.dockerProcessView", {
        treeDataProvider: dockerProcessProvider,
        showCollapseAll: true
    });

    // Register Aider processes tree view
    const aiderProcessTreeView = vscode.window.createTreeView("testeranto.aiderProcessView", {
        treeDataProvider: aiderProcessProvider,
        showCollapseAll: true
    });

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            terminalManager.disposeAll();
            runtimeProvider.dispose();
            dockerProcessProvider.dispose();
            aiderProcessProvider.dispose();
            statusBarManager.dispose();
            outputChannel.dispose();
        }
    });

    // Add a test command to verify logging
    const testCommand = vscode.commands.registerCommand('testeranto.testLogging', () => {
        outputChannel.appendLine('[Testeranto] Test logging command executed at ' + new Date().toISOString());
        vscode.window.showInformationMessage('Test logging command executed! Check Testeranto output channel.');
    });
    
    // Register all disposables
    context.subscriptions.push(
        outputChannel,
        ...commandDisposables,
        runtimeTreeView,
        dockerProcessTreeView,
        aiderProcessTreeView,
        statusBarManager.getMainStatusBarItem(),
        statusBarManager.getServerStatusBarItem(),
        testCommand
    );

    outputChannel.appendLine("[Testeranto] Extension activated successfully");
    outputChannel.appendLine("[Testeranto] Test command 'testeranto.testLogging' registered");
    console.log("[Testeranto] Extension activated successfully");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
