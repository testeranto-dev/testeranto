import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { getApiUrl } from '../../api';

export class AgentTreeDataProvider extends BaseTreeDataProvider {
    private agents: any[] = [];

    constructor() {
        super();
        // Don't load automatically - wait for getChildren
    }

    async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
        try {
            if (!element) {
                // Root level - load agents if not already loaded
                if (this.agents.length === 0) {
                    await this.loadAgents();
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
            // According to SOUL.md: allow errors to propagate
            // But in VS Code tree view, we need to return something
            // Return an error item
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
        // Create items directly from agents data
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
        
        // Check if we have agents
        if (this.agents.length === 0) {
            // According to SOUL.md: no guessing, no fallbacks
            // If agents array is empty, it means the server returned an empty array
            // This is valid - just show a message
            items.push(
                new TestTreeItem(
                    'No agents configured',
                    TreeItemType.Info,
                    vscode.TreeItemCollapsibleState.None,
                    { 
                        info: 'The server returned an empty agents array. Check your testeranto.ts configuration.'
                    }
                )
            );
            return items;
        }
        
        // Create agent items
        return this.agents.map(agent => {
            const agentName = agent.name || agent.key;
            if (!agentName) {
                // According to SOUL.md: no guessing
                // If agent doesn't have a name or key, we can't display it
                throw new Error('Agent missing name and key properties');
            }
            
            const agentConfig = agent.config || {};
            
            return new TestTreeItem(
                agentName,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    description: agentConfig.message ? agentConfig.message.substring(0, 50) + '...' : 'Agent',
                    agentName: agentName,
                    action: 'launchAgent'
                },
                undefined,
                new vscode.ThemeIcon('person'),
                'agentItem'
            );
        });
    }

    private async getAgentDetails(agentName: string): Promise<TestTreeItem[]> {
        const agent = this.agents.find(a => (a.name || a.key) === agentName);
        if (!agent) {
            return [];
        }

        const details: TestTreeItem[] = [];

        // Add agent name
        details.push(new TestTreeItem(
            `Name: ${agentName}`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            { info: agentName }
        ));

        // Add agent config details if available
        const agentConfig = agent.config || {};
        
        if (agentConfig.message) {
            details.push(new TestTreeItem(
                `Description: ${agentConfig.message.substring(0, 100)}...`,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: agentConfig.message }
            ));
        }

        if (agentConfig.load && Array.isArray(agentConfig.load)) {
            details.push(new TestTreeItem(
                `Loads: ${agentConfig.load.length} items`,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: agentConfig.load.join(', ') }
            ));
        }

        // Add launch action
        details.push(new TestTreeItem(
            'Launch Agent',
            TreeItemType.Config,
            vscode.TreeItemCollapsibleState.None,
            {
                agentName: agentName,
                action: 'launchAgent',
                description: 'Click to launch this agent'
            },
            {
                command: 'testeranto.launchAgent',
                title: 'Launch Agent',
                arguments: [agentName]
            },
            new vscode.ThemeIcon('rocket'),
            'agentLaunchItem'
        ));

        // Add view slice action
        details.push(new TestTreeItem(
            'View Agent Slice',
            TreeItemType.Config,
            vscode.TreeItemCollapsibleState.None,
            {
                agentName: agentName,
                action: 'viewAgentSlice',
                description: 'Click to view this agent\'s slice data'
            },
            {
                command: 'testeranto.openView',
                title: 'View Agent Slice',
                arguments: [`agent-${agentName}`, `Agent: ${agentName}`, `/~/agents/${agentName}`]
            },
            new vscode.ThemeIcon('eye'),
            'agentViewSliceItem'
        ));

        return details;
    }

    private async loadAgents(): Promise<void> {
        console.log('[AgentTreeDataProvider] Loading agents from API endpoint');
        
        // According to SOUL.md: no guessing, no fallbacks
        // Use the correct API endpoint for agents
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
        
        // The response might be in a different format
        // Check if it has agents property or if it's the array directly
        if (data && Array.isArray(data)) {
            this.agents = data;
            console.log(`[AgentTreeDataProvider] Loaded ${this.agents.length} agents:`, 
                this.agents.map(a => a.name || a.key || 'unnamed').join(', '));
        } else if (data && data.agents && Array.isArray(data.agents)) {
            this.agents = data.agents;
            console.log(`[AgentTreeDataProvider] Loaded ${this.agents.length} agents:`, 
                this.agents.map(a => a.name || a.key || 'unnamed').join(', '));
        } else {
            // If no agents are configured, that's valid - just show empty
            this.agents = [];
            console.log('[AgentTreeDataProvider] No agents configured or empty response');
        }
    }

    refresh(): void {
        console.log('[AgentTreeDataProvider] Manual refresh triggered');
        // Clear current data
        this.agents = [];
        this._onDidChangeTreeData.fire();
        
        // Load fresh data - errors will be shown in the tree
        this.loadAgents()
            .then(() => {
                this._onDidChangeTreeData.fire();
            })
            .catch(error => {
                console.error('[AgentTreeDataProvider] Error in refresh:', error);
                // Error will be shown when getChildren is called
                this._onDidChangeTreeData.fire();
            });
    }
}
