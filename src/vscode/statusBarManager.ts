import * as vscode from "vscode";

export class StatusBarManager {
    private mainStatusBarItem: vscode.StatusBarItem;
    private serverStatusBarItem: vscode.StatusBarItem;
    private static instance: StatusBarManager | null = null;

    constructor() {
        this.mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    }

    public static getInstance(): StatusBarManager {
        if (!StatusBarManager.instance) {
            StatusBarManager.instance = new StatusBarManager();
            StatusBarManager.instance.initialize();
        }
        return StatusBarManager.instance;
    }

    public static initialize(): StatusBarManager {
        const instance = StatusBarManager.getInstance();
        // initialize() is already called in getInstance()
        return instance;
    }

    initialize(): void {
        if (!this.mainStatusBarItem) {
            this.mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        }
        if (!this.serverStatusBarItem) {
            this.serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        }

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

    public updateFromGraphData(graphData: any): void {
        // Ensure status bar items are initialized
        if (!this.serverStatusBarItem) {
            this.initialize();
        }

        // Update status bar based on graph data
        // Look for server status in the graph
        const serverNodes = graphData?.nodes?.filter((node: any) =>
            node.type === 'docker_process' || node.type === 'aider_process' || node.type === 'entrypoint'
        ) || [];

        const runningProcesses = serverNodes.filter((node: any) =>
            node.status === 'done' || node.status === 'running'
        );
        const totalProcesses = serverNodes.length;

        if (totalProcesses > 0) {
            this.serverStatusBarItem.text = `$(check) Server (${runningProcesses.length}/${totalProcesses})`;
            this.serverStatusBarItem.tooltip = `Testeranto server is running. ${runningProcesses.length} processes active, ${totalProcesses} total.`;
            this.serverStatusBarItem.backgroundColor = undefined;
        } else {
            // No server-related nodes found in the graph
            this.serverStatusBarItem.text = "$(circle-slash) Server";
            this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
            this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    public async updateServerStatus(): Promise<void> {
        // Ensure status bar items are initialized
        if (!this.serverStatusBarItem) {
            this.initialize();
        }

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri;

                // Read from graph-data.json only
                const graphDataUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
                try {
                    const fileContent = await vscode.workspace.fs.readFile(graphDataUri);
                    const graphDataText = Buffer.from(fileContent).toString('utf-8');
                    const graphData = JSON.parse(graphDataText);

                    // Update from graph data
                    this.updateFromGraphData(graphData.data?.unifiedGraph || graphData);
                    return;
                } catch (graphError) {
                    // graph-data.json doesn't exist or can't be read
                    // Show default status
                    this.serverStatusBarItem.text = "$(circle-slash) Server";
                    this.serverStatusBarItem.tooltip = "Testeranto server not running. Click to start.";
                    this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                    console.log('[Testeranto] Could not read graph-data.json:', graphError);
                }
            } else {
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
        StatusBarManager.instance = null;
    }

    public static updateFromGraph(graphData: any): void {
        const instance = StatusBarManager.getInstance();
        instance.updateFromGraphData(graphData);
    }

    public static async updateServerStatusSafe(): Promise<void> {
        const instance = StatusBarManager.getInstance();
        await instance.updateServerStatus();
    }
}
