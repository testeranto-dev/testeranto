import * as vscode from "vscode";
import { TerminalManager } from "../TerminalManager";
import { StatusBarManager } from "../statusBarManager";

export function createManagers(outputChannel: vscode.OutputChannel): {
    terminalManager: TerminalManager;
    statusBarManager: StatusBarManager;
} {
    outputChannel.appendLine("[Testeranto] Creating TerminalManager...");
    const terminalManager = new TerminalManager();
    outputChannel.appendLine("[Testeranto] TerminalManager created");

    outputChannel.appendLine("[Testeranto] Creating StatusBarManager...");
    const statusBarManager = new StatusBarManager();
    statusBarManager.initialize();
    outputChannel.appendLine("[Testeranto] StatusBarManager created");

    outputChannel.appendLine("[Testeranto] Skipping automatic terminal creation");

    return { terminalManager, statusBarManager };
}
