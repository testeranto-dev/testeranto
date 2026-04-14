import * as vscode from "vscode";

export async function testProviders(
    providers: any,
    outputChannel: vscode.OutputChannel
): Promise<void> {
    outputChannel.appendLine("[Testeranto] Testing providers by calling getChildren()...");
    try {
        const runtimeChildren = await providers.runtimeProvider.getChildren();
        outputChannel.appendLine(`[Testeranto] runtimeProvider.getChildren() returned ${runtimeChildren?.length || 0} items`);

        if (runtimeChildren && runtimeChildren.length > 0) {
            runtimeChildren.forEach((item: any, index: number) => {
                outputChannel.appendLine(`[Testeranto]   Item ${index}: ${item.label} (${item.type})`);
            });
        }
    } catch (error) {
        outputChannel.appendLine(`[Testeranto] ERROR testing runtimeProvider: ${error}`);
    }

    try {
        const dockerChildren = await providers.dockerProcessProvider.getChildren();
        outputChannel.appendLine(`[Testeranto] dockerProcessProvider.getChildren() returned ${dockerChildren?.length || 0} items`);
    } catch (error) {
        outputChannel.appendLine(`[Testeranto] dockerProcessProvider error (non-fatal): ${error}`);
    }

    try {
        const fileChildren = await providers.fileTreeProvider.getChildren();
        outputChannel.appendLine(`[Testeranto] fileTreeProvider.getChildren() returned ${fileChildren?.length || 0} items`);
    } catch (error) {
        outputChannel.appendLine(`[Testeranto] fileTreeProvider error (non-fatal): ${error}`);
    }

    try {
        const viewChildren = await providers.viewTreeProvider.getChildren();
        outputChannel.appendLine(`[Testeranto] viewTreeProvider.getChildren() returned ${viewChildren?.length || 0} items`);
    } catch (error) {
        outputChannel.appendLine(`[Testeranto] viewTreeProvider error (non-fatal): ${error}`);
    }
}
