import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class AgentTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;
  private graphDataPath: string | null = null;

  constructor() {
    super();
    console.log('[AgentTreeDataProvider] Constructor called');
    this.loadGraphData();
  }

  private loadGraphData(): void {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
      
      if (fs.existsSync(this.graphDataPath)) {
        const content = fs.readFileSync(this.graphDataPath, 'utf-8');
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[AgentTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error('[AgentTreeDataProvider] Error loading graph data:', error);
    }
  }

  refresh(): void {
    this.loadGraphData();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!this.graphData) {
      this.loadGraphData();
    }

    if (!element) {
      // Root level: Show all agents
      return this.getAgentItems();
    }

    const elementData = element.data || {};
    
    // If this is an agent, show its instances
    if (elementData.agentName) {
      return this.getAgentInstancesItems(elementData.agentName);
    }

    return [];
  }

  private getAgentItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    // Add refresh item
    items.push(new TestTreeItem(
      'Refresh',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Reload graph data',
        refresh: true
      },
      {
        command: 'testeranto.refreshAgents',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    // Add launch new agent section
    items.push(new TestTreeItem(
      'Launch New Agent',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Click to spawn a new agent instance',
        launchAgent: true
      },
      {
        command: 'testeranto.launchAgentSelection',
        title: 'Launch Agent',
        arguments: []
      },
      new vscode.ThemeIcon('add')
    ));

    // Define the three agents
    const agents = [
      { name: 'prodirek', label: 'Prodirek (Product Manager)', description: 'Manages features and documentation' },
      { name: 'arko', label: 'Arko (Architect)', description: 'Handles architectural decisions and configurations' },
      { name: 'juna', label: 'Juna (Junior Engineer)', description: 'Updates implementations and source code' }
    ];

    // Find agent nodes in the graph
    const agentNodes = this.graphData ? this.graphData.nodes.filter(node => 
      node.type === 'agent' || node.metadata?.agentName
    ) : [];

    // Group agent instances by agent name
    const agentInstancesMap = new Map<string, GraphNode[]>();
    for (const node of agentNodes) {
      const agentName = node.metadata?.agentName || 
                       (node.label?.toLowerCase().includes('prodirek') ? 'prodirek' :
                        node.label?.toLowerCase().includes('arko') ? 'arko' :
                        node.label?.toLowerCase().includes('juna') ? 'juna' : 'unknown');
      
      if (!agentInstancesMap.has(agentName)) {
        agentInstancesMap.set(agentName, []);
      }
      agentInstancesMap.get(agentName)!.push(node);
    }

    // Create items for each agent
    for (const agent of agents) {
      const instances = agentInstancesMap.get(agent.name) || [];
      const instanceCount = instances.length;
      
      const agentItem = new TestTreeItem(
        agent.label,
        TreeItemType.Info,
        instanceCount > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        {
          agentName: agent.name,
          description: `${instanceCount} running instance(s) - ${agent.description}`,
          count: instanceCount,
          agentLabel: agent.label
        },
        undefined,
        this.getAgentIcon(agent.name)
      );

      // Store instances as children
      agentItem.children = instances.map(instance => this.createAgentInstanceItem(instance, agent.name));
      items.push(agentItem);
    }

    return items;
  }

  private getAgentInstancesItems(agentName: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find agent instances for this specific agent
    const agentInstances = this.graphData.nodes.filter(node => {
      const nodeAgentName = node.metadata?.agentName || 
                           (node.label?.toLowerCase().includes('prodirek') ? 'prodirek' :
                            node.label?.toLowerCase().includes('arko') ? 'arko' :
                            node.label?.toLowerCase().includes('juna') ? 'juna' : null);
      return nodeAgentName === agentName;
    });

    if (agentInstances.length === 0) {
      return [
        new TestTreeItem(
          'No running instances',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Click "Launch New Agent" to start an instance',
            agentName
          },
          undefined,
          new vscode.ThemeIcon('info')
        )
      ];
    }

    return agentInstances.map(instance => this.createAgentInstanceItem(instance, agentName));
  }

  private createAgentInstanceItem(node: GraphNode, agentName: string): TestTreeItem {
    const metadata = node.metadata || {};
    const status = metadata.status || 'running';
    const suffix = metadata.suffix || '';
    const startedAt = metadata.startedAt || '';
    const lastActivity = metadata.lastActivity || '';
    
    // Determine label
    let label = node.label || `${agentName} instance`;
    if (suffix) {
      label = `${label} (${suffix})`;
    }

    // Determine description
    let description = status;
    if (startedAt) {
      const timeAgo = this.getTimeAgo(startedAt);
      description += ` • Started ${timeAgo}`;
    }

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (status === 'running') {
      icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
    } else if (status === 'stopped') {
      icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
    } else if (status === 'error') {
      icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
    } else {
      icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
    }

    const item = new TestTreeItem(
      label,
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        agentName,
        instanceId: node.id,
        status,
        suffix,
        startedAt,
        lastActivity,
        description
      },
      {
        command: 'testeranto.openAgentWebview',
        title: 'Open Agent',
        arguments: [agentName, suffix || node.id]
      },
      icon
    );

    // Build tooltip
    let tooltip = `Agent: ${agentName}\n`;
    tooltip += `Instance ID: ${node.id}\n`;
    tooltip += `Status: ${status}\n`;
    if (suffix) {
      tooltip += `Suffix: ${suffix}\n`;
    }
    if (startedAt) {
      tooltip += `Started: ${startedAt}\n`;
    }
    if (lastActivity) {
      tooltip += `Last Activity: ${lastActivity}\n`;
    }
    if (metadata.message) {
      tooltip += `Message: ${metadata.message}\n`;
    }

    item.tooltip = tooltip;
    return item;
  }

  private getAgentIcon(agentName: string): vscode.ThemeIcon {
    switch (agentName) {
      case 'prodirek':
        return new vscode.ThemeIcon('megaphone');
      case 'arko':
        return new vscode.ThemeIcon('circuit-board');
      case 'juna':
        return new vscode.ThemeIcon('tools');
      default:
        return new vscode.ThemeIcon('person');
    }
  }

  private getTimeAgo(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } catch {
      return '';
    }
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    if (message.type === 'graphUpdated') {
      this.refresh();
    }
  }
}
