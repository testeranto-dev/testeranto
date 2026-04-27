import * as vscode from "vscode";
// import { ExtensionActivator } from "./extension/ExtensionActivator";
import { activateExtension } from "./extension/ExtensionActivatorCore";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // const activator = new ExtensionActivator();
    // await activator.activate(context);
    activateExtension(context)
}

export function deactivate(): void {
    console.log("[Testeranto] Extension deactivated");
}
