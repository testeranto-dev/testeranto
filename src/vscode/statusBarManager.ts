import * as vscode from "vscode";

export class StatusBarManager {
    private mainStatusBarItem: vscode.StatusBarItem;
    private serverStatusBarItem: vscode.StatusBarItem;
    private lockStatusBarItem: vscode.StatusBarItem; // New status bar item for lock status
    private static instance: StatusBarManager | null = null;

    constructor() {
        this.mainStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        this.lockStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98); // New item
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
        if (!this.lockStatusBarItem) {
            this.lockStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
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

        // Initialize lock status bar item
        this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
        this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
        this.lockStatusBarItem.command = "testeranto.checkLockStatus";
        this.lockStatusBarItem.show();
    }

    public updateFromGraphData(graphData: any): void {
        // Ensure status bar items are initialized
        if (!this.serverStatusBarItem || !this.lockStatusBarItem) {
            this.initialize();
        }

        // Update server status bar based on graph data
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

        // Update lock status based on graph data
        this.updateLockStatusFromGraph(graphData);
    }

    private updateLockStatusFromGraph(graphData: any): void {
        if (!graphData?.nodes) {
            this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
            this.lockStatusBarItem.tooltip = "Lock status unknown";
            this.lockStatusBarItem.backgroundColor = undefined;
            return;
        }

        // Find locked file nodes
        const lockedFiles = graphData.nodes.filter((node: any) =>
            node.type === 'file' && node.locked === true
        );

        const lockedCount = lockedFiles.length;

        if (lockedCount > 0) {
            this.lockStatusBarItem.text = `$(lock) Files: ${lockedCount} locked`;
            this.lockStatusBarItem.tooltip = `${lockedCount} file(s) are locked. Click for details.`;
            this.lockStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

            // Add details to tooltip
            let tooltipDetails = `${lockedCount} file(s) are locked:\n\n`;
            lockedFiles.forEach((file: any, index: number) => {
                const owner = file.lockOwner || 'unknown';
                const type = file.lockType || 'unknown';
                const time = file.lockTimestamp ? new Date(file.lockTimestamp).toLocaleTimeString() : 'unknown';
                tooltipDetails += `${index + 1}. ${file.label || file.id}\n`;
                tooltipDetails += `   Owner: ${owner}\n`;
                tooltipDetails += `   Type: ${type}\n`;
                tooltipDetails += `   Since: ${time}\n\n`;
            });
            this.lockStatusBarItem.tooltip = tooltipDetails;
        } else {
            this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
            this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
            this.lockStatusBarItem.backgroundColor = undefined;
        }
    }

    public async updateServerStatus(): Promise<void> {
        // Ensure status bar items are initialized
        if (!this.serverStatusBarItem || !this.lockStatusBarItem) {
            this.initialize();
        }

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri;

            } else {
                this.serverStatusBarItem.text = "$(circle-slash) Server";
                this.serverStatusBarItem.tooltip = "No workspace folder open";
                this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

                this.lockStatusBarItem.text = "$(unlock) Files: Unknown";
                this.lockStatusBarItem.tooltip = "Lock status unknown (no workspace)";
                this.lockStatusBarItem.backgroundColor = undefined;
            }
        } catch (error) {
            console.error('[Testeranto] Error checking server status:', error);
            this.serverStatusBarItem.text = "$(error) Server Error";
            this.serverStatusBarItem.tooltip = "Error checking server status";
            this.serverStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');

            this.lockStatusBarItem.text = "$(error) Lock Error";
            this.lockStatusBarItem.tooltip = "Error checking lock status";
            this.lockStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    public getMainStatusBarItem(): vscode.StatusBarItem {
        return this.mainStatusBarItem;
    }

    public getServerStatusBarItem(): vscode.StatusBarItem {
        return this.serverStatusBarItem;
    }

    public getLockStatusBarItem(): vscode.StatusBarItem {
        return this.lockStatusBarItem;
    }

    public dispose(): void {
        this.mainStatusBarItem.dispose();
        this.serverStatusBarItem.dispose();
        this.lockStatusBarItem.dispose();
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

    // New method to update lock status specifically
    public updateLockStatus(hasLockedFiles: boolean, lockedCount: number = 0): void {
        if (!this.lockStatusBarItem) {
            this.initialize();
        }

        if (hasLockedFiles && lockedCount > 0) {
            this.lockStatusBarItem.text = `$(lock) Files: ${lockedCount} locked`;
            this.lockStatusBarItem.tooltip = `${lockedCount} file(s) are locked for system restart`;
            this.lockStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            this.lockStatusBarItem.text = "$(unlock) Files: Unlocked";
            this.lockStatusBarItem.tooltip = "All files are unlocked and available for testing";
            this.lockStatusBarItem.backgroundColor = undefined;
        }
    }
}
