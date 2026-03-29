import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

interface DockerProcess {
    // The server returns these fields (based on curl output)
    processId: string;
    containerId: string;
    command: string;
    image: string;
    timestamp: string;
    status: string;  // e.g., "Up Less than a second"
    state: 'running' | 'exited' | 'paused' | 'created';
    ports: string;
    exitCode?: number;
    startedAt: string;
    finishedAt: string;
    isActive: boolean;
    health: string;
    // For backward compatibility, we'll keep these optional
    id?: string;
    name?: string;
    runtime?: string;
    testName?: string;
    serviceName?: string;
    lastPass?: boolean;
    lastFail?: boolean;
}

export class DockerProcessTreeDataProvider extends BaseTreeDataProvider {
    private processes: DockerProcess[] = [];
    private refreshInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startAutoRefresh();
    }

    private startAutoRefresh(): void {
        // Refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 5000);
    }

    async refresh(): Promise<void> {
        try {
            await this.fetchProcesses();
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error('[DockerProcessTreeDataProvider] Error refreshing processes:', error);
        }
    }

    private async fetchProcesses(): Promise<void> {
        try {
            const response = await fetch('http://localhost:3000/~/processes', {
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const rawProcesses = Array.isArray(data.processes) ? data.processes : [];
            // Filter out invalid entries and map to our interface
            this.processes = rawProcesses.filter(process => 
                process && typeof process === 'object'
            ).map(process => {
                // Map server fields to our interface
                return {
                    ...process,
                    // For backward compatibility, set id to processId if not present
                    id: process.id || process.processId,
                    // Ensure all required fields are present
                    processId: process.processId || process.id || 'unknown',
                    containerId: process.containerId || 'unknown',
                    command: process.command || '',
                    image: process.image || '',
                    timestamp: process.timestamp || '',
                    status: process.status || '',
                    state: process.state || 'unknown',
                    ports: process.ports || '',
                    exitCode: process.exitCode,
                    startedAt: process.startedAt || '',
                    finishedAt: process.finishedAt || '',
                    isActive: process.isActive || false,
                    health: process.health || 'unknown',
                    // Optional fields
                    name: process.name,
                    runtime: process.runtime,
                    testName: process.testName,
                    serviceName: process.serviceName,
                    lastPass: process.lastPass,
                    lastFail: process.lastFail
                };
            });
            
            // Log the first process structure for debugging
            if (this.processes.length > 0) {
                console.log('[DockerProcessTreeDataProvider] First process structure:', 
                    JSON.stringify(this.processes[0], null, 2));
            }
            
            // Update status based on exit codes
            this.processes.forEach(process => {
                if (!process || typeof process !== 'object') return;
                
                if (process.state === 'exited') {
                    if (process.exitCode === 0) {
                        process.lastPass = true;
                        process.lastFail = false;
                    } else if (process.exitCode !== undefined && process.exitCode !== 0) {
                        process.lastPass = false;
                        process.lastFail = true;
                    }
                }
            });
        } catch (error) {
            console.error('[DockerProcessTreeDataProvider] Error fetching processes:', error);
            this.processes = [];
        }
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return this.getRootItems();
        }
        
        // If element has children stored, return them
        if (element.children && element.children.length > 0) {
            return Promise.resolve(element.children);
        }
        
        return Promise.resolve([]);
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    private async getRootItems(): Promise<TestTreeItem[]> {
        const items: TestTreeItem[] = [];

        // Add header item
        items.push(new TestTreeItem(
            'Docker Processes',
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: `${this.processes.length} processes`,
                count: this.processes.length
            },
            undefined,
            new vscode.ThemeIcon('server')
        ));

        // Add refresh item
        items.push(new TestTreeItem(
            'Refresh now',
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: 'Update process list',
                refresh: true
            },
            {
                command: 'testeranto.refreshDockerProcesses',
                title: 'Refresh Docker Processes',
                arguments: []
            },
            new vscode.ThemeIcon('refresh')
        ));

        // Add process items
        if (this.processes.length === 0) {
            items.push(new TestTreeItem(
                'No processes found',
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Server may not be running'
                },
                {
                    command: 'testeranto.startServer',
                    title: 'Start Server',
                    arguments: []
                },
                new vscode.ThemeIcon('info')
            ));
        } else {
            // Group by runtime if available
            const groupedByRuntime = this.groupProcessesByRuntime();
            
            for (const [runtime, processes] of Object.entries(groupedByRuntime)) {
                if (!processes || processes.length === 0) continue;
                
                if (runtime === 'unknown') {
                    // Add ungrouped processes directly
                    processes.forEach(process => {
                        if (process) {
                            items.push(this.createProcessItem(process));
                        }
                    });
                } else {
                    // Create runtime group
                    const runtimeItem = new TestTreeItem(
                        runtime,
                        TreeItemType.Runtime,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        {
                            runtime: runtime,
                            description: `${processes.length} processes`,
                            count: processes.length
                        },
                        undefined,
                        new vscode.ThemeIcon('symbol-namespace')
                    );
                    
                    // Store children in the item
                    runtimeItem.children = processes
                        .filter(process => process)
                        .map(process => this.createProcessItem(process));
                    items.push(runtimeItem);
                }
            }
        }

        return items;
    }

    private groupProcessesByRuntime(): Record<string, DockerProcess[]> {
        const groups: Record<string, DockerProcess[]> = {};
        
        this.processes.forEach(process => {
            if (!process || typeof process !== 'object') return;
            
            // Try multiple ways to determine runtime
            let runtime = 'unknown';
            
            // First, check if runtime is explicitly provided
            const runtimeValue = process.runtime;
            if (runtimeValue && typeof runtimeValue === 'string') {
                runtime = runtimeValue.toLowerCase();
            } 
            // Check processId for runtime hints
            else if (process.processId) {
                const processId = String(process.processId).toLowerCase();
                if (processId.includes('golang') || processId.includes('go-')) {
                    runtime = 'golang';
                } else if (processId.includes('node') || processId.includes('js-') || processId.includes('ts-')) {
                    runtime = 'node';
                } else if (processId.includes('python') || processId.includes('py-')) {
                    runtime = 'python';
                } else if (processId.includes('rust')) {
                    runtime = 'rust';
                } else if (processId.includes('builder')) {
                    runtime = 'builder';
                } else if (processId.includes('web')) {
                    runtime = 'web';
                }
            }
            // Check serviceName for runtime hints
            else if (process.serviceName) {
                const serviceName = String(process.serviceName).toLowerCase();
                if (serviceName.includes('golang')) {
                    runtime = 'golang';
                } else if (serviceName.includes('node')) {
                    runtime = 'node';
                } else if (serviceName.includes('python')) {
                    runtime = 'python';
                } else if (serviceName.includes('rust')) {
                    runtime = 'rust';
                } else if (serviceName.includes('web')) {
                    runtime = 'web';
                }
            }
            
            // Ensure runtime is never undefined
            if (!runtime) {
                runtime = 'unknown';
            }
            
            if (!groups[runtime]) {
                groups[runtime] = [];
            }
            groups[runtime].push(process);
        });
        
        return groups;
    }

    private createProcessItem(process: DockerProcess): TestTreeItem {
        // Ensure process has required properties
        const processId = process?.id?.trim() || 'unknown';
        const processName = process?.name?.trim() || 'Unnamed Process';
        const processStatus = process?.status || 'unknown';
        
        // Ensure processId is never empty for substring operation
        const safeProcessId = processId || 'unknown';
        // Check if we got a real name (not the fallback)
        const hasRealName = processName !== 'Unnamed Process' && processName !== '';
        const label = hasRealName ? processName : safeProcessId.substring(0, Math.min(safeProcessId.length, 12));
        let description = processStatus;
        if (process?.exitCode !== undefined) {
            description += ` (exit: ${process.exitCode})`;
        }
        if (process?.serviceName) {
            description += ` • ${process.serviceName}`;
        }

        // Determine icon and color based on state and exit code
        let icon: vscode.ThemeIcon;
        
        if (process?.state === 'running') {
            icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
        } else if (process?.lastPass) {
            icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
        } else if (process?.lastFail) {
            icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
        } else if (process?.state === 'exited') {
            icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
        } else if (process?.state === 'paused') {
            icon = new vscode.ThemeIcon('debug-pause', new vscode.ThemeColor('testing.iconQueued'));
        } else if (process?.state === 'created') {
            icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconQueued'));
        } else {
            icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
        }

        const item = new TestTreeItem(
            label,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: description,
                status: processStatus,
                exitCode: process?.exitCode,
                runtime: process?.runtime,
                testName: process?.testName,
                serviceName: process?.serviceName
            },
            {
                command: 'testeranto.showProcessLogs',
                title: 'Show Process Logs',
                arguments: [safeProcessId, processName]
            },
            icon
        );
        
        // Set tooltip with more details using actual server fields
        let tooltip = `Process ID: ${safeProcessId}\n`;
        tooltip += `Container ID: ${process?.containerId || 'unknown'}\n`;
        tooltip += `State: ${process?.state || 'unknown'}\n`;
        tooltip += `Status: ${process?.status || 'unknown'}\n`;
        if (process?.exitCode !== undefined) {
            tooltip += `Exit Code: ${process.exitCode}\n`;
        }
        tooltip += `Image: ${process?.image || 'unknown'}\n`;
        tooltip += `Command: ${process?.command || 'unknown'}\n`;
        if (process?.startedAt && process.startedAt !== '0001-01-01T00:00:00Z') {
            tooltip += `Started: ${process.startedAt}\n`;
        }
        if (process?.finishedAt && process.finishedAt !== '0001-01-01T00:00:00Z') {
            tooltip += `Finished: ${process.finishedAt}\n`;
        }
        tooltip += `Active: ${process?.isActive ? 'Yes' : 'No'}\n`;
        tooltip += `Health: ${process?.health || 'unknown'}\n`;
        // Add any additional fields that might be useful
        if (process?.runtime) {
            tooltip += `Runtime: ${process.runtime}\n`;
        }
        if (process?.testName) {
            tooltip += `Test: ${process.testName}\n`;
        }
        if (process?.serviceName) {
            tooltip += `Service: ${process.serviceName}\n`;
        }
        item.tooltip = tooltip;
        
        return item;
    }

    protected handleWebSocketMessage(message: any): void {
        if (message.type === 'resourceChanged' && message.url === '/~/processes') {
            this.refresh();
        }
    }

    dispose(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        super.dispose();
    }
}
