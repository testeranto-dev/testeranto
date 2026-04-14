import * as vscode from "vscode";

export function handleActivationError(error: any, outputChannel: vscode.OutputChannel): void {
    outputChannel.appendLine(`[Testeranto] ERROR during extension activation: ${error}`);
    outputChannel.appendLine(`[Testeranto] Stack trace: ${error.stack}`);
    vscode.window.showErrorMessage(`Testeranto extension failed to activate: ${error.message}`);
    console.error("[Testeranto] Extension activation failed:", error);
}
