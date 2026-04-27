import * as vscode from "vscode";
import { TerminalManager } from "./TerminalManager";
import { StatusBarManager } from "./statusBarManager";
import { registerCommands } from "./providers/utils/registerCommands";
import { ViewTreeDataProvider } from "./providers/ViewTreeDataProvider";

export class CommandManager {
    private terminalManager: TerminalManager;
    private statusBarManager: StatusBarManager;
    private runtimeProvider: vscode.TreeDataProvider<any> | null;
    private dockerProcessProvider: vscode.TreeDataProvider<any> | null;
    private aiderProcessProvider: vscode.TreeDataProvider<any> | null;
    private fileTreeProvider: vscode.TreeDataProvider<any> | null;
    private viewTreeProvider: ViewTreeDataProvider | null;
    private agentProvider: vscode.TreeDataProvider<any> | null;

    constructor(terminalManager: TerminalManager, statusBarManager: StatusBarManager) {
        this.terminalManager = terminalManager;
        this.statusBarManager = statusBarManager;
        this.runtimeProvider = null;
        this.dockerProcessProvider = null;
        this.aiderProcessProvider = null;
        this.fileTreeProvider = null;
        this.viewTreeProvider = null;
        this.agentProvider = null;
    }

    public setRuntimeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.runtimeProvider = provider;
    }

    public setDockerProcessProvider(provider: vscode.TreeDataProvider<any>): void {
        this.dockerProcessProvider = provider;
    }

    // public setAiderProcessProvider(provider: vscode.TreeDataProvider<any>): void {
    //     this.aiderProcessProvider = provider;
    // }

    public setFileTreeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.fileTreeProvider = provider;
    }

    public setViewTreeProvider(provider: ViewTreeDataProvider): void {
        this.viewTreeProvider = provider;
    }

    // Agent functionality is now merged into AiderProcessTreeDataProvider.
    // This setter is kept for compatibility but should not be called.
    public setAgentProvider(provider: vscode.TreeDataProvider<any>): void {
        this.agentProvider = provider;
    }


    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables = registerCommands(
            context,
            this.terminalManager,
            this.runtimeProvider,
            this.statusBarManager,
            this.dockerProcessProvider,
            // this.aiderProcessProvider,
            this.fileTreeProvider,
            this.agentProvider,
            this.viewTreeProvider
        );


        return disposables;
    }
}

