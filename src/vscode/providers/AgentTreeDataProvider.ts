import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { getApiUrl, wsApi } from '../../api';

export class AgentTreeDataProvider extends BaseTreeDataProvider {
    private runningAgents: any[] = [];

    constructor() {
        super();
    }

    async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
        try {
            if (!element) {
                // Root level - load running agents if not already loaded
                if (this.runningAgents.length === 0) {
                    await this.loadRunningAgents();
                }
                return this.getAgentItems();
            }

            const elementType = element.type;
            const elementData = element.data || {};

            if (elementType === TreeItemType.Info && elementData.agentName) {
                return this.getAgentDetails(elementData.agentName);
            }

            return [];
        } catch (error) {
            console.error('[AgentTreeDataProvider] Error in getChildren:', error);
            return [
                new TestTreeItem(
                    'Error loading agents',
                    TreeItemType.Info,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        info: error instanceof Error ? error.message : 'Unknown error'
                    },
                    undefined,
                    new vscode.ThemeIcon('error')
                ),
                new TestTreeItem(
                    'Refresh',
                    TreeItemType.Action,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        action: 'refresh',
                        info: 'Click to retry'
                    },
                    {
                        command: 'testeranto.refreshAgents',
                        title: 'Refresh',
                        arguments: []
                    },
                    new vscode.ThemeIcon('refresh')
                )
            ];
        }
    }

    private getAgentItems(): TestTreeItem[] {
        const items: TestTreeItem[] = [];

        // Add refresh item
        items.push(
            new TestTreeItem(
                'Refresh',
                TreeItemType.Action,
                vscode.TreeItemCollapsibleState.None,
                {
                    action: 'refresh',
                    info: 'Refresh the view to try loading data again.'
                },
                {
                    command: 'testeranto.refreshAgents',
                    title: 'Refresh',
                    arguments: []
                },
                new vscode.ThemeIcon('refresh')
            )
        );

        if (this.runningAgents.length === 0) {
            items.push(
                new TestTreeItem(
                    'No configured agents',
                    TreeItemType.Info,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        info: 'No agents are configured. Add agent profiles to testeranto config.'
                    }
                )
            );
            return items;
        }

        // Create agent items for each configured agent
        for (const agent of this.runningAgents) {
            const agentName = agent.agentName || agent.name || agent.id;
            if (!agentName) {
                continue;
            }

            const status = agent.status || 'configured';
            const loadCount = agent.config?.load?.length || 0;

            const item = new TestTreeItem(
                agentName,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    description: `${loadCount} load file(s)`,
                    agentName: agentName,
                    status: status,
                    action: 'launchAgent'
                },
                {
                    command: 'testeranto.launchAgent',
                    title: 'Launch Agent',
                    arguments: [agentName]
                },
                new vscode.ThemeIcon('person'),
                'agentItem'
            );

            // Build tooltip
            let tooltip = `Agent: ${agentName}\n`;
            tooltip += `Status: ${status}\n`;
            tooltip += `Load files: ${loadCount}\n`;
            if (agent.config?.message) {
                const msgPreview = agent.config.message.substring(0, 100) + (agent.config.message.length > 100 ? '...' : '');
                tooltip += `Message: ${msgPreview}\n`;
            }
            item.tooltip = tooltip;

            items.push(item);
        }

        return items;
    }

    private async getAgentDetails(agentName: string): Promise<TestTreeItem[]> {
        const agent = this.runningAgents.find(a => (a.agentName || a.name || a.id) === agentName);
        if (!agent) {
            return [];
        }

        const details: TestTreeItem[] = [];

        details.push(new TestTreeItem(
            `Name: ${agentName}`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            { info: agentName }
        ));

        details.push(new TestTreeItem(
            `Status: ${agent.status || 'configured'}`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            { info: agent.status || 'configured' }
        ));

        // Show load files
        const loadFiles = agent.config?.load || [];
        if (loadFiles.length > 0) {
            details.push(new TestTreeItem(
                `Load files (${loadFiles.length})`,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: loadFiles.join('\n') }
            ));
        }

        // Show message preview
        const message = agent.config?.message || '';
        if (message) {
            const msgPreview = message.substring(0, 200) + (message.length > 200 ? '...' : '');
            details.push(new TestTreeItem(
                'Message',
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: msgPreview }
            ));
        }

        // Add launch agent action
        details.push(new TestTreeItem(
            'Launch Agent',
            TreeItemType.Config,
            vscode.TreeItemCollapsibleState.None,
            {
                agentName: agentName,
                action: 'launchAgent',
                description: 'Click to launch this agent as a Docker container'
            },
            {
                command: 'testeranto.launchAgent',
                title: 'Launch Agent',
                arguments: [agentName]
            },
            new vscode.ThemeIcon('play'),
            'agentLaunchItem'
        ));

        return details;
    }

    private async loadRunningAgents(): Promise<void> {
        console.log('[AgentTreeDataProvider] Loading agents from /~/agents API endpoint');

        // Fetch from the agents endpoint which returns configured agent profiles
        const agentsUrl = getApiUrl('getAllAgents');
        const response = await fetch(agentsUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[AgentTreeDataProvider] Response:', data);

        // The agents endpoint returns an array of agent configs
        const agents = data.agents || [];
        this.runningAgents = agents.map((agent: any) => ({
            agentName: agent.name || agent.key || 'unknown',
            containerName: '',
            containerId: '',
            status: 'configured',
            id: agent.name || agent.key || 'unknown',
            config: agent.config || {},
        }));

        console.log(`[AgentTreeDataProvider] Loaded ${this.runningAgents.length} configured agents:`,
            this.runningAgents.map(a => a.agentName).join(', '));
    }

    refresh(): void {
        console.log('[AgentTreeDataProvider] Manual refresh triggered');
        this.runningAgents = [];
        this._onDidChangeTreeData.fire();

        this.loadRunningAgents()
            .then(() => {
                this._onDidChangeTreeData.fire();
            })
            .catch(error => {
                console.error('[AgentTreeDataProvider] Error in refresh:', error);
                this._onDidChangeTreeData.fire();
            });
    }

    protected handleWebSocketMessage(message: any): void {
        super.handleWebSocketMessage(message);
        console.log(`[AgentTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

        if (message.type === 'resourceChanged') {
            // Refresh when agents or aider processes change
            if (message.url === '/~/agents/spawn' ||
                message.url === '/~/agents' ||
                message.url === '/~/aider' ||
                message.url === '/~/graph') {
                console.log('[AgentTreeDataProvider] Relevant update, refreshing');
                this.refresh();
            }
        } else if (message.type === 'graphUpdated') {
            console.log('[AgentTreeDataProvider] Graph updated, refreshing');
            this.refresh();
        }
    }

    protected subscribeToGraphUpdates(): void {
        super.subscribeToGraphUpdates();
        // Subscribe to agents and aider slices
        this.subscribeToSlice(wsApi.slices.agents);
        this.subscribeToSlice(wsApi.slices.aider);
        this.subscribeToSlice(wsApi.slices.graph);
        // Also subscribe to the agents endpoint for config changes
        this.subscribeToSlice('/agents');
    }
}
