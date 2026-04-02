import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';
import type { AiderProcessesResponse } from '../../../api';

interface AiderProcess {
    id: string;
    containerId: string;
    containerName: string;
    runtime: string;
    testName: string;
    configKey: string;
    isActive: boolean;
    status: 'running' | 'stopped' | 'exited';
    exitCode?: number;
    startedAt: string;
    lastActivity?: string;
}

export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
    private processes: AiderProcess[] = [];
    private refreshInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startAutoRefresh();
    }

    private startAutoRefresh(): void {
        // Refresh every 10 seconds
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 10000);
    }

    async refresh(): Promise<void> {
        try {
            await this.fetchProcesses();
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error('[AiderProcessTreeDataProvider] Error refreshing processes:', error);
        }
    }

    private async fetchProcesses(): Promise<void> {
        try {
            const response = await fetch(ApiUtils.getAiderProcessesUrl(), {
                signal: AbortSignal.timeout(3000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const aiderResponse = data as AiderProcessesResponse;
            const rawProcesses = Array.isArray(aiderResponse.aiderProcesses) ? aiderResponse.aiderProcesses : [];
            
            this.processes = rawProcesses.filter(process => 
                process && typeof process === 'object'
            ).map(process => ({
                id: process.id || process.containerId || 'unknown',
                containerId: process.containerId || 'unknown',
                containerName: process.containerName || 'unknown',
                runtime: process.runtime || 'unknown',
                testName: process.testName || 'unknown',
                configKey: process.configKey || 'unknown',
                isActive: process.isActive || false,
                status: process.status || 'stopped',
                exitCode: process.exitCode,
                startedAt: process.startedAt || '',
                lastActivity: process.lastActivity
            }));
            
            if (this.processes.length > 0) {
                console.log('[AiderProcessTreeDataProvider] Found', this.processes.length, 'aider processes');
            }
        } catch (error) {
            console.error('[AiderProcessTreeDataProvider] Error fetching aider processes:', error);
            this.processes = [];
        }
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return this.getRootItems();
        }
        
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
            'Aider Processes',
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: `${this.processes.length} processes`,
                count: this.processes.length
            },
            undefined,
            new vscode.ThemeIcon('comment-discussion')
        ));

        // Add refresh item
        items.push(new TestTreeItem(
            'Refresh now',
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: 'Update aider process list',
                refresh: true
            },
            {
                command: 'testeranto.refreshAiderProcesses',
                title: 'Refresh Aider Processes',
                arguments: []
            },
            new vscode.ThemeIcon('refresh')
        ));

        // Add process items
        if (this.processes.length === 0) {
            items.push(new TestTreeItem(
                'No aider processes found',
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Run tests to create aider processes'
                },
                {
                    command: 'testeranto.showTests',
                    title: 'Show Tests',
                    arguments: []
                },
                new vscode.ThemeIcon('info')
            ));
        } else {
            // Group by runtime
            const groupedByRuntime = this.groupProcessesByRuntime();
            
            for (const [runtime, processes] of Object.entries(groupedByRuntime)) {
                if (!processes || processes.length === 0) continue;
                
                if (runtime === 'unknown') {
                    processes.forEach(process => {
                        if (process) {
                            items.push(this.createProcessItem(process));
                        }
                    });
                } else {
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
                    
                    runtimeItem.children = processes
                        .filter(process => process)
                        .map(process => this.createProcessItem(process));
                    items.push(runtimeItem);
                }
            }
        }

        return items;
    }

    private groupProcessesByRuntime(): Record<string, AiderProcess[]> {
        const groups: Record<string, AiderProcess[]> = {};
        
        this.processes.forEach(process => {
            if (!process || typeof process !== 'object') return;
            
            const runtime = process.runtime || 'unknown';
            
            if (!groups[runtime]) {
                groups[runtime] = [];
            }
            groups[runtime].push(process);
        });
        
        return groups;
    }

    private createProcessItem(process: AiderProcess): TestTreeItem {
        const label = `${process.testName} (${process.runtime})`;
        let description = process.status;
        if (process.exitCode !== undefined) {
            description += ` (exit: ${process.exitCode})`;
        }
        if (!process.isActive) {
            description += ' • inactive';
        }

        let icon: vscode.ThemeIcon;
        if (process.status === 'running' && process.isActive) {
            icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
        } else if (process.status === 'exited') {
            if (process.exitCode === 0) {
                icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
            } else {
                icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
            }
        } else if (process.status === 'stopped') {
            icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
        } else {
            icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
        }

        const item = new TestTreeItem(
            label,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
                description: description,
                status: process.status,
                exitCode: process.exitCode,
                runtime: process.runtime,
                testName: process.testName,
                configKey: process.configKey,
                containerId: process.containerId,
                containerName: process.containerName,
                isActive: process.isActive
            },
            {
                command: 'testeranto.openAiderTerminal',
                title: 'Open Aider Terminal',
                arguments: [process.runtime, process.testName, process.containerId]
            },
            icon
        );
        
        let tooltip = `Test: ${process.testName}\n`;
        tooltip += `Runtime: ${process.runtime}\n`;
        tooltip += `Config: ${process.configKey}\n`;
        tooltip += `Status: ${process.status}\n`;
        tooltip += `Active: ${process.isActive ? 'Yes' : 'No'}\n`;
        if (process.exitCode !== undefined) {
            tooltip += `Exit Code: ${process.exitCode}\n`;
        }
        tooltip += `Container: ${process.containerName}\n`;
        tooltip += `Container ID: ${process.containerId}\n`;
        if (process.startedAt) {
            tooltip += `Started: ${process.startedAt}\n`;
        }
        if (process.lastActivity) {
            tooltip += `Last Activity: ${process.lastActivity}\n`;
        }
        item.tooltip = tooltip;
        
        return item;
    }

    protected handleWebSocketMessage(message: any): void {
        if (message.type === 'resourceChanged' && message.url === '/~/aider-processes') {
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
