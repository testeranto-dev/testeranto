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
    private fileTreeProvider: vscode.TreeDataProvider<any> | null;

    constructor(terminalManager: TerminalManager, statusBarManager: StatusBarManager) {
        this.terminalManager = terminalManager;
        this.statusBarManager = statusBarManager;
        this.runtimeProvider = null;
        this.dockerProcessProvider = null;
        this.aiderProcessProvider = null;
        this.fileTreeProvider = null;
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

    public setFileTreeProvider(provider: vscode.TreeDataProvider<any>): void {
        this.fileTreeProvider = provider;
    }

    public registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables = registerCommands(
            context,
            this.terminalManager,
            this.runtimeProvider,
            this.statusBarManager,
            this.dockerProcessProvider,
            this.aiderProcessProvider,
            this.fileTreeProvider
        );
        
        // Add a test command for debugging
        const testCommand = vscode.commands.registerCommand('testeranto.testLogging', () => {
            vscode.window.showInformationMessage('Testeranto test command works!');
            console.log('[Testeranto] Test command executed successfully');
        });
        disposables.push(testCommand);
        
        return disposables;
    }
}

