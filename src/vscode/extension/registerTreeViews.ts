import * as vscode from "vscode";

export function registerTreeViews(
    providers: any,
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): void {
    outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
    vscode.window.registerTreeDataProvider('testeranto.runtimeView', providers.runtimeProvider);
    vscode.window.registerTreeDataProvider('testeranto.dockerProcessView', providers.dockerProcessProvider);
    // vscode.window.registerTreeDataProvider('testeranto.aiderProcessView', providers.aiderProcessProvider);
    vscode.window.registerTreeDataProvider('testeranto.fileTreeView', providers.fileTreeProvider);
    vscode.window.registerTreeDataProvider('testeranto.viewView', providers.viewTreeProvider);
    vscode.window.registerTreeDataProvider('testeranto.agentView', providers.agentProvider);
    outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");

    outputChannel.appendLine("[Testeranto] Creating tree views...");
    const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
        treeDataProvider: providers.runtimeProvider,
        showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");

    const dockerProcessTreeView = vscode.window.createTreeView("testeranto.dockerProcessView", {
        treeDataProvider: providers.dockerProcessProvider,
        showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");

    // const aiderProcessTreeView = vscode.window.createTreeView("testeranto.aiderProcessView", {
    //     treeDataProvider: providers.aiderProcessProvider,
    //     showCollapseAll: true
    // });
    // outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");

    const fileTreeView = vscode.window.createTreeView("testeranto.fileTreeView", {
        treeDataProvider: providers.fileTreeProvider,
        showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] File tree view created successfully");

    const viewTreeView = vscode.window.createTreeView("testeranto.viewView", {
        treeDataProvider: providers.viewTreeProvider,
        showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] View tree view created successfully");

    const agentTreeView = vscode.window.createTreeView("testeranto.agentView", {
        treeDataProvider: providers.agentProvider,
        showCollapseAll: true
    });
    outputChannel.appendLine("[Testeranto] Agent tree view created successfully");

    outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
    context.subscriptions.push(
        runtimeTreeView,
        dockerProcessTreeView,
        // aiderProcessTreeView,
        fileTreeView,
        viewTreeView,
        agentTreeView
    );
    outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");
}
