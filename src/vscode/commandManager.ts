import * as vscode from "vscode";
import { TerminalManager } from "./TerminalManager";
import { StatusBarManager } from "./statusBarManager";
import { registerCommands } from "./registerCommands";

export class CommandManager {
    private terminalManager: TerminalManager;
    private statusBarManager: StatusBarManager;
    private runtimeProvider: vscode.TreeDataProvider<any> | null;
    private dockerProcessProvider: vscode.TreeDataProvider<any> | null;
    private aiderProcessProvider: vscode.TreeDataProvider<any> | null;

    constructor(terminalManager: TerminalManager, statusBarManager: StatusBarManager) {
        this.terminalManager = terminalManager;
        this.statusBarManager = statusBarManager;
        this.runtimeProvider = null;
        this.dockerProcessProvider = null;
        this.aiderProcessProvider = null;
    }

    public setRuntimeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.runtimeProvider = provider;
    }

    public setDockerProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.dockerProcessProvider = provider;
    }

    public setAiderProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.aiderProcessProvider = provider;
    }

    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        return registerCommands(context, this.terminalManager, this.dockerProcessProvider)
    }
}

