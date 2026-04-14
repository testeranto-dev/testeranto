import * as vscode from "vscode";

export function setupCleanup(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    terminalManager: any,
    statusBarManager: any,
    providers: any,
    commandDisposables: vscode.Disposable[]
): void {
    context.subscriptions.push({
        dispose: () => {
            outputChannel.appendLine("[Testeranto] Extension deactivating...");
            terminalManager.disposeAll();
            providers.runtimeProvider.dispose?.();
            providers.dockerProcessProvider.dispose?.();
            providers.aiderProcessProvider.dispose?.();
            providers.fileTreeProvider.dispose?.();
            providers.viewTreeProvider.dispose?.();
            providers.agentProvider.dispose?.();
            statusBarManager.dispose();
            outputChannel.dispose();
        }
    });

    context.subscriptions.push(
        outputChannel,
        ...commandDisposables,
        statusBarManager.getMainStatusBarItem(),
        statusBarManager.getServerStatusBarItem()
    );
}
