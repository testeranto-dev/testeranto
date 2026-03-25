import * as vscode from "vscode";
import { TerminalManager } from "./TerminalManager";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
import { StatusBarManager } from "./statusBarManager";
import { CommandManager } from "./commandManager";

export function activate(context: vscode.ExtensionContext): void {
    // Create managers
    const terminalManager = new TerminalManager();
    terminalManager.createAllTerminals();

    const statusBarManager = new StatusBarManager();
    statusBarManager.initialize();

    // Initial status check
    statusBarManager.updateServerStatus();

    // Create providers
    const runtimeProvider = new TestTreeDataProvider();

    // Create command manager
    const commandManager = new CommandManager(terminalManager, statusBarManager);
    // Set the runtime provider so commands can refresh it
    commandManager.setRuntimeProvider(runtimeProvider);
    const commandDisposables = commandManager.registerCommands(context);

    // Register tree views
    const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
        treeDataProvider: runtimeProvider,
        showCollapseAll: true
    });

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            terminalManager.disposeAll();
            runtimeProvider.dispose();
            statusBarManager.dispose();
        }
    });

    // Register all disposables
    context.subscriptions.push(
        ...commandDisposables,
        runtimeTreeView,
        statusBarManager.getMainStatusBarItem(),
        statusBarManager.getServerStatusBarItem()
    );

    console.log("[Testeranto] Extension activated successfully");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
