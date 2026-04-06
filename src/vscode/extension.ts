import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { TerminalManager } from "./TerminalManager";
import { TestTreeDataProvider } from "./providers/TestTreeDataProvider";
import { DockerProcessTreeDataProvider } from "./providers/DockerProcessTreeDataProvider";
import { AiderProcessTreeDataProvider } from "./providers/AiderProcessTreeDataProvider";
import { FileTreeDataProvider } from "./providers/FileTreeDataProvider";
import { StatusBarManager } from "./statusBarManager";
import { CommandManager } from "./commandManager";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log("[Testeranto] EXTENSION ACTIVATION STARTED - MINIMAL TEST");

    // Create output channel for Testeranto logs
    const outputChannel = vscode.window.createOutputChannel("Testeranto");
    outputChannel.show(true); // Show the output channel
    outputChannel.appendLine("[Testeranto] Extension activating... MINIMAL TEST");

    try {
        // SIMPLE TEST - Show a message to prove extension works
        vscode.window.showInformationMessage('Testeranto extension is loading...');

        // Check if server is running by trying to load graph-data.json
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            outputChannel.appendLine("[Testeranto] ERROR: No workspace folder open");
            vscode.window.showErrorMessage("Testeranto: No workspace folder open. Please open a workspace folder first.");
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        outputChannel.appendLine(`[Testeranto] Workspace root: ${workspaceRoot}`);

        const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');

        if (!fs.existsSync(graphDataPath)) {
            outputChannel.appendLine(`[Testeranto] WARNING: graph-data.json not found at ${graphDataPath}`);
            outputChannel.appendLine("[Testeranto] The graph-based data file is not available. Starting in fallback mode.");
            vscode.window.showWarningMessage("Testeranto: Graph data not found. Some features may be limited.");
        } else {
            outputChannel.appendLine(`[Testeranto] Found graph-data.json at ${graphDataPath}`);
            try {
                const graphData = JSON.parse(fs.readFileSync(graphDataPath, 'utf-8'));
                outputChannel.appendLine(`[Testeranto] Graph data loaded: ${graphData.data?.unifiedGraph?.nodes?.length || 0} nodes`);
            } catch (error) {
                outputChannel.appendLine(`[Testeranto] ERROR loading graph-data.json: ${error}`);
            }
        }

        // Create managers
        outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
        const terminalManager = new TerminalManager();
        terminalManager.createAllTerminals();
        outputChannel.appendLine("[Testeranto] TerminalManager created");

        outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
        const statusBarManager = new StatusBarManager();
        statusBarManager.initialize();
        outputChannel.appendLine("[Testeranto] StatusBarManager created");

        // Initial status check
        outputChannel.appendLine("[Testeranto] Updating server status...");
        statusBarManager.updateServerStatus();

        // Create providers using graph-based approach
        outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
        const runtimeProvider = new TestTreeDataProvider();
        outputChannel.appendLine("[Testeranto] TestTreeDataProvider created successfully");

        // Create Docker process provider using graph data
        outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
        const dockerProcessProvider = new DockerProcessTreeDataProvider();
        outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created successfully");

        // Create Aider process provider using graph data
        outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
        const aiderProcessProvider = new AiderProcessTreeDataProvider();
        outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created successfully");

        // Create File tree provider for file perspective
        outputChannel.appendLine("[Testeranto] Creating FileTreeDataProvider...");
        const fileTreeProvider = new FileTreeDataProvider();
        outputChannel.appendLine("[Testeranto] FileTreeDataProvider created successfully");

        // Verify providers implement required interface
        outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
        const requiredMethods = ['getChildren', 'getTreeItem'];
        for (const [name, provider] of Object.entries({
            runtimeProvider,
            dockerProcessProvider,
            aiderProcessProvider,
            fileTreeProvider
        })) {
            outputChannel.appendLine(`[Testeranto] Checking provider: ${name}`);
            for (const method of requiredMethods) {
                if (typeof (provider as any)[method] !== 'function') {
                    const errorMsg = `${name} does not implement required method: ${method}`;
                    outputChannel.appendLine(`[Testeranto] ERROR: ${errorMsg}`);
                    throw new Error(errorMsg);
                }
                outputChannel.appendLine(`[Testeranto] ✓ ${name} implements ${method}`);
            }
        }

        // Create command manager
        outputChannel.appendLine("[Testeranto] Creating CommandManager...");
        const commandManager = new CommandManager(terminalManager, statusBarManager);
        // Set the providers so commands can refresh them
        commandManager.setRuntimeProvider(runtimeProvider);
        commandManager.setDockerProcessProvider(dockerProcessProvider);
        commandManager.setAiderProcessProvider(aiderProcessProvider);
        const commandDisposables = commandManager.registerCommands(context);
        outputChannel.appendLine("[Testeranto] CommandManager created and commands registered");

        // Show a welcome message
        vscode.window.showInformationMessage('Testeranto extension is now active! Use the Testeranto view in the Activity Bar to explore tests.');

        // Register tree data providers FIRST
        outputChannel.appendLine("[Testeranto] Registering tree data providers with VS Code...");
        vscode.window.registerTreeDataProvider('testeranto.runtimeView', runtimeProvider);
        vscode.window.registerTreeDataProvider('testeranto.dockerProcessView', dockerProcessProvider);
        vscode.window.registerTreeDataProvider('testeranto.aiderProcessView', aiderProcessProvider);
        vscode.window.registerTreeDataProvider('testeranto.fileTreeView', fileTreeProvider);
        outputChannel.appendLine("[Testeranto] Tree data providers registered successfully");

        // Create tree views AFTER registering providers
        outputChannel.appendLine("[Testeranto] Creating tree views...");
        const runtimeTreeView = vscode.window.createTreeView("testeranto.runtimeView", {
            treeDataProvider: runtimeProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Runtime tree view created successfully");

        const dockerProcessTreeView = vscode.window.createTreeView("testeranto.dockerProcessView", {
            treeDataProvider: dockerProcessProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Docker process tree view created successfully");

        const aiderProcessTreeView = vscode.window.createTreeView("testeranto.aiderProcessView", {
            treeDataProvider: aiderProcessProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] Aider process tree view created successfully");

        const fileTreeView = vscode.window.createTreeView("testeranto.fileTreeView", {
            treeDataProvider: fileTreeProvider,
            showCollapseAll: true
        });
        outputChannel.appendLine("[Testeranto] File tree view created successfully");

        // Add tree views to subscriptions
        outputChannel.appendLine("[Testeranto] Adding tree views to context subscriptions...");
        context.subscriptions.push(
            runtimeTreeView,
            dockerProcessTreeView,
            aiderProcessTreeView,
            fileTreeView
        );
        outputChannel.appendLine("[Testeranto] Tree views added to subscriptions");

        // Test the providers by calling getChildren with undefined (root)
        outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
        try {
            const runtimeChildren = await runtimeProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] runtimeProvider.getChildren() returned ${runtimeChildren?.length || 0} items`);

            const dockerChildren = await dockerProcessProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);

            const aiderChildren = await aiderProcessProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] aiderProcessProvider.getChildren() returned ${aiderChildren?.length || 0} items`);

            const fileChildren = await fileTreeProvider.getChildren();
            outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
        } catch (error) {
            outputChannel.appendLine(`[Testeranto] ERROR testing providers: ${error}`);
        }

        // Refresh all providers to load initial data
        outputChannel.appendLine("[Testeranto] Refreshing tree data providers...");
        if (typeof runtimeProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing runtimeProvider...");
            runtimeProvider.refresh();
        }
        if (typeof dockerProcessProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing dockerProcessProvider...");
            dockerProcessProvider.refresh();
        }
        if (typeof aiderProcessProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing aiderProcessProvider...");
            aiderProcessProvider.refresh();
        }
        if (typeof fileTreeProvider.refresh === 'function') {
            outputChannel.appendLine("[Testeranto] Refreshing fileTreeProvider...");
            fileTreeProvider.refresh();
        }
        outputChannel.appendLine("[Testeranto] Tree data providers refreshed");

        // Clean up on deactivation
        context.subscriptions.push({
            dispose: () => {
                outputChannel.appendLine("[Testeranto] Extension deactivating...");
                terminalManager.disposeAll();
                runtimeProvider.dispose?.();
                dockerProcessProvider.dispose?.();
                aiderProcessProvider.dispose?.();
                statusBarManager.dispose();
                outputChannel.dispose();
            }
        });

        // Register all disposables
        outputChannel.appendLine("[Testeranto] Registering all disposables...");
        context.subscriptions.push(
            outputChannel,
            ...commandDisposables,
            statusBarManager.getMainStatusBarItem(),
            statusBarManager.getServerStatusBarItem()
        );

        outputChannel.appendLine("[Testeranto] Extension activated successfully");
        outputChannel.appendLine("[Testeranto] Test command 'testeranto.testLogging' registered");
        console.log("[Testeranto] Extension activated successfully");

    } catch (error: any) {
        outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
        outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
        vscode.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
        console.error("[Testeranto] Extension activation failed:", error);
    }

    outputChannel.appendLine("[Testeranto] Extension activation function completed");
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
