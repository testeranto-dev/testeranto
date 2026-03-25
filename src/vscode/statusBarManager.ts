import * as vscode from "vscode";

export class StatusBarManager {
    private mainStatusBarItem: vscode.StatusBarItem;
    private serverStatusBarItem: vscode.StatusBarItem;

    constructor() {
        this.mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    }

    public initialize(): void {
        this.mainStatusBarItem.text = "$(beaker) Testeranto";
        this.mainStatusBarItem.tooltip = "Testeranto: Dockerized, AI powered BDD test framework";
        this.mainStatusBarItem.command = "testeranto.showTests";
        this.mainStatusBarItem.show();

        this.serverStatusBarItem.text = "$(circle-slash) Server";
        this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
        this.serverStatusBarItem.command = "testeranto.startServer";
        this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.serverStatusBarItem.show();
    }

    public async updateServerStatus(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri;
                const configUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'extension-config.json');

                try {
                    const fileContent = await vscode.workspace.fs.readFile(configUri);
                    const configText = Buffer.from(fileContent).toString('utf-8');
                    const config = JSON.parse(configText);

                    if (config.serverStarted === true) {
                        this.serverStatusBarItem.text = "$(check) Server";
                        this.serverStatusBarItem.tooltip = "Testeranto server is running. Click to restart.";
                        this.serverStatusBarItem.backgroundColor = undefined;
                        console.log('[Testeranto] Server status: Running (config indicates server is started)');

                        if (config.processes && config.processes.length > 0) {
                            const runningProcesses = config.processes.filter((p: any) => p.isActive === true);
                            const stoppedProcesses = config.processes.filter((p: any) => p.isActive !== true);

                            if (runningProcesses.length > 0) {
                                this.serverStatusBarItem.text = `$(check) Server (${runningProcesses.length} running)`;
                                if (stoppedProcesses.length > 0) {
                                    this.serverStatusBarItem.tooltip = `Testeranto server is running. ${runningProcesses.length} containers running, ${stoppedProcesses.length} stopped.`;
                                }
                            } else {
                                this.serverStatusBarItem.text = "$(check) Server (0 running)";
                                if (stoppedProcesses.length > 0) {
                                    this.serverStatusBarItem.tooltip = `Testeranto server is running. All ${stoppedProcesses.length} containers are stopped.`;
                                }
                            }
                        }
                    } else {
                        this.serverStatusBarItem.text = "$(circle-slash) Server";
                        this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
                        this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                        console.log('[Testeranto] Server status: Not running (config indicates server is stopped)');
                    }
                } catch (error) {
                    this.serverStatusBarItem.text = "$(circle-slash) Server";
                    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
                    this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                    console.log('[Testeranto] Server status: Not running (config file not found or invalid):', error);
                }
            } else {
                console.log('[Testeranto] No workspace folder open');
                this.serverStatusBarItem.text = "$(circle-slash) Server";
                this.serverStatusBarItem.tooltip = "No workspace folder open";
                this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            }
        } catch (error) {
            console.error('[Testeranto] Error checking server status:', error);
            this.serverStatusBarItem.text = "$(error) Server Error";
            this.serverStatusBarItem.tooltip = "Error checking server status";
            this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    public getMainStatusBarItem(): vscode.StatusBarItem {
        return this.mainStatusBarItem;
    }

    public getServerStatusBarItem(): vscode.StatusBarItem {
        return this.serverStatusBarItem;
    }

    public dispose(): void {
        this.mainStatusBarItem.dispose();
        this.serverStatusBarItem.dispose();
    }
}
