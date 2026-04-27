import * as vscode from "vscode";

export function refreshProviders(
    providers: any,
    outputChannel: vscode.OutputChannel
): void {
    outputChannel.appendLine("[Testeranto] Refreshing tree data providers...");

    const refreshIfPossible = (provider: any, name: string) => {
        if (typeof provider.refresh === 'function') {
            outputChannel.appendLine(`[Testeranto] Refreshing ${name}...`);
            provider.refresh();
        }
    };

    refreshIfPossible(providers.runtimeProvider, 'runtimeProvider');
    refreshIfPossible(providers.dockerProcessProvider, 'dockerProcessProvider');
    // refreshIfPossible(providers.aiderProcessProvider, 'aiderProcessProvider');
    refreshIfPossible(providers.fileTreeProvider, 'fileTreeProvider');
    refreshIfPossible(providers.viewTreeProvider, 'viewTreeProvider');
    refreshIfPossible(providers.agentProvider, 'agentProvider');

    outputChannel.appendLine("[Testeranto] Tree data providers refreshed");
}
