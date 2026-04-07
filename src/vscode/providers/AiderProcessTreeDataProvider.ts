import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';

interface GraphNode {
  id: string;
  type: string;
  label: string;
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

export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;
  private agents: any[] = [];

  constructor() {
    super();
    console.log('[AiderProcessTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      console.log('[AiderProcessTreeDataProvider] Loading graph data from aider slice and agents');
      
      // Load aider slice
      const aiderResponse = await fetch(ApiUtils.getAiderSliceUrl());
      if (!aiderResponse.ok) {
        throw new Error(`HTTP error! status: ${aiderResponse.status}`);
      }
      const aiderData = await aiderResponse.json();
      
      // Load agent data
      const agentsData = await this.loadAgentData();
      
      // Combine the data
      this.graphData = {
        nodes: [...(aiderData.nodes || []), ...(agentsData.nodes || [])],
        edges: [...(aiderData.edges || []), ...(agentsData.edges || [])]
      };
      
      // Store agents separately for easier access
      this.agents = agentsData.agents;
      
      console.log('[AiderProcessTreeDataProvider] Loaded graph data:', 
        this.graphData?.nodes?.length, 'nodes,',
        this.graphData?.edges?.length, 'edges,',
        agentsData.agents?.length, 'agents');
    } catch (error) {
      console.error('[AiderProcessTreeDataProvider] Failed to load graph data:', error);
      this.graphData = null;
      this.agents = [];
    }
  }

  private async loadAgentData(): Promise<{ nodes: any[]; edges: any[]; agents: any[] }> {
    try {
      // Get all user-defined agents
      const agentsResponse = await fetch(ApiUtils.getUserAgentsUrl());
      if (!agentsResponse.ok) {
        throw new Error(`HTTP error! status: ${agentsResponse.status}`);
      }
      const agentsData = await agentsResponse.json();
      
      const agents = agentsData.userAgents || [];
      
      if (agents.length === 0) {
        return { nodes: [], edges: [], agents: [] };
      }
      
      // Fetch data for each agent
      const allNodes: any[] = [];
      const allEdges: any[] = [];
      
      for (const agent of agents) {
        const agentName = agent.name;
        try {
          const agentResponse = await fetch(ApiUtils.getAgentSliceUrl(agentName));
          if (agentResponse.ok) {
            const agentSliceData = await agentResponse.json();
            if (agentSliceData.nodes && Array.isArray(agentSliceData.nodes)) {
              allNodes.push(...agentSliceData.nodes);
            }
            if (agentSliceData.edges && Array.isArray(agentSliceData.edges)) {
              allEdges.push(...agentSliceData.edges);
            }
          }
        } catch (error) {
          console.error(`[AiderProcessTreeDataProvider] Failed to load data for agent ${agentName}:`, error);
        }
      }
      
      return { nodes: allNodes, edges: allEdges, agents };
    } catch (error) {
      console.error('[AiderProcessTreeDataProvider] Failed to load agent data:', error);
      return { nodes: [], edges: [], agents: [] };
    }
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[AiderProcessTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!this.graphData) {
      this.loadGraphData();
    }

    if (!element) {
      // Root level: Show aider processes grouped by entrypoint
      return this.getAiderProcessItems();
    }

    const elementType = element.type;
    const elementData = element.data || {};

    if (elementType === TreeItemType.Runtime) {
      // Show aider processes for this entrypoint
      return this.getAiderProcessesForEntrypoint(elementData.entrypointId);
    }

    return [];
  }

  private getAiderProcessItems(): TestTreeItem[] {
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
        command: 'testeranto.refreshAiderProcesses',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    // Show agents section
    if (this.agents.length > 0) {
      // Add agents header
      items.push(new TestTreeItem(
        `Agents (${this.agents.length})`,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'User-defined agents with aider',
          count: this.agents.length
        },
        undefined,
        new vscode.ThemeIcon('server')
      ));

      // Add each agent
      for (const agent of this.agents) {
        const agentName = agent.name;
        
        // Find agent nodes in the graph
        const agentNodes = this.graphData?.nodes?.filter(node => 
          node.type === 'agent' && 
          node.metadata?.agentName === agentName
        ) || [];
        
        // Find aider processes for this agent
        const agentAiderNodes = this.graphData?.nodes?.filter(node => 
          node.type === 'aider_process' && 
          node.metadata?.agentName === agentName
        ) || [];
        
        const agentItem = new TestTreeItem(
          agentName,
          TreeItemType.Runtime,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            agentName,
            description: `${agentAiderNodes.length} aider process(es)`,
            count: agentAiderNodes.length
          },
          undefined,
          new vscode.ThemeIcon('person')
        );
        
        // Store children (aider processes for this agent)
        agentItem.children = agentAiderNodes.map(node => this.createAiderProcessItem(node, null));
        items.push(agentItem);
      }
    } else {
      items.push(new TestTreeItem(
        'No agents configured',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No user-defined agents found'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
    }

    // Show regular aider processes (not associated with agents)
    if (this.graphData) {
      // Find aider nodes not associated with agents
      const aiderNodes = this.graphData.nodes.filter(node =>
        (node.type === 'aider' || node.type === 'aider_process') &&
        !node.metadata?.agentName
      );

      if (aiderNodes.length > 0) {
        // Add aider processes header
        items.push(new TestTreeItem(
          `Aider Processes (${aiderNodes.length})`,
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'Regular aider processes for tests',
            count: aiderNodes.length
          },
          undefined,
          new vscode.ThemeIcon('symbol-namespace')
        ));

        // Group aider nodes by their connected entrypoints
        const entrypointMap = new Map<string, GraphNode[]>();

        for (const aiderNode of aiderNodes) {
          // Find edges where this aider is the target (connected from entrypoint)
          const connectedEdges = this.graphData.edges.filter(edge =>
            edge.target === aiderNode.id &&
            edge.attributes.type === 'hasAider'
          );

          let entrypointId = 'ungrouped';
          for (const edge of connectedEdges) {
            const entrypointNode = this.graphData.nodes.find(n => n.id === edge.source);
            if (entrypointNode && entrypointNode.type === 'entrypoint') {
              entrypointId = entrypointNode.id;
              break;
            }
          }

          if (!entrypointMap.has(entrypointId)) {
            entrypointMap.set(entrypointId, []);
          }
          entrypointMap.get(entrypointId)!.push(aiderNode);
        }

        // Create items for each entrypoint group
        for (const [entrypointId, aiderNodes] of entrypointMap.entries()) {
          let entrypointLabel = 'Ungrouped Aider Processes';
          let entrypointNode: GraphNode | undefined;

          if (entrypointId !== 'ungrouped') {
            entrypointNode = this.graphData.nodes.find(n => n.id === entrypointId);
            entrypointLabel = entrypointNode?.label || entrypointId;
          }

          const entrypointItem = new TestTreeItem(
            entrypointLabel,
            TreeItemType.Runtime,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              entrypointId,
              description: `${aiderNodes.length} aider process(es)`,
              count: aiderNodes.length
            },
            undefined,
            new vscode.ThemeIcon('file-text')
          );

          // Store children
          entrypointItem.children = aiderNodes.map(node => this.createAiderProcessItem(node, entrypointNode));
          items.push(entrypointItem);
        }
      } else if (this.agents.length === 0) {
        items.push(new TestTreeItem(
          'No aider processes found',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'No aider processes in graph'
          },
          undefined,
          new vscode.ThemeIcon('info')
        ));
      }
    }

    return items;
  }

  private getAiderProcessesForEntrypoint(entrypointId: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find aider nodes connected to this entrypoint
    const connectedEdges = this.graphData.edges.filter(edge =>
      edge.source === entrypointId &&
      edge.attributes.type === 'hasAider'
    );

    const aiderNodes: GraphNode[] = [];
    for (const edge of connectedEdges) {
      const aiderNode = this.graphData.nodes.find(n => n.id === edge.target);
      if (aiderNode && (aiderNode.type === 'aider' || aiderNode.type === 'aider_process')) {
        aiderNodes.push(aiderNode);
      }
    }

    const entrypointNode = this.graphData.nodes.find(n => n.id === entrypointId);
    return aiderNodes.map(node => this.createAiderProcessItem(node, entrypointNode));
  }

  private createAiderProcessItem(node: GraphNode, entrypointNode?: GraphNode): TestTreeItem {
    const metadata = node.metadata || {};
    const status = metadata.status || 'stopped';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';
    const containerName = metadata.aiderServiceName || metadata.containerName || 'unknown';
    const runtime = metadata.runtime || 'unknown';
    const testName = metadata.testName || 'unknown';
    const configKey = metadata.configKey || 'unknown';
    const agentName = metadata.agentName;
    const isAgentAider = metadata.isAgentAider || false;

    // Determine label
    let label = node.label || containerName;
    if (label === 'unknown' && node.id) {
      const parts = node.id.split(':');
      label = parts[parts.length - 1] || node.id;
    }

    // Determine description
    let description = `${status}`;
    if (exitCode !== undefined) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += ' • inactive';
    }
    if (isAgentAider) {
      description += ' • agent';
    }

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (isAgentAider) {
      icon = new vscode.ThemeIcon('person', new vscode.ThemeColor('testing.iconPassed'));
    } else if (status === 'running' && isActive) {
      icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
    } else if (status === 'exited') {
      if (exitCode === 0) {
        icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      } else {
        icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      }
    } else if (status === 'stopped') {
      icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
    } else {
      icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
    }

    const item = new TestTreeItem(
      label,
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description,
        status,
        exitCode,
        runtime,
        testName,
        configKey,
        containerId,
        containerName,
        isActive,
        aiderId: node.id,
        agentName,
        isAgentAider
      },
      {
        command: 'testeranto.openAiderTerminal',
        title: 'Open Aider Terminal',
        arguments: [runtime, testName, containerId]
      },
      icon
    );

    // Build tooltip
    let tooltip = `Type: ${node.type}\n`;
    tooltip += `ID: ${node.id}\n`;
    if (isAgentAider && agentName) {
      tooltip += `Agent: ${agentName}\n`;
    }
    if (entrypointNode) {
      tooltip += `Entrypoint: ${entrypointNode.label || entrypointNode.id}\n`;
    }
    tooltip += `Container: ${containerName}\n`;
    tooltip += `Container ID: ${containerId}\n`;
    tooltip += `Status: ${status}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
    if (exitCode !== undefined) {
      tooltip += `Exit Code: ${exitCode}\n`;
    }
    if (!isAgentAider) {
      tooltip += `Runtime: ${runtime}\n`;
      tooltip += `Test: ${testName}\n`;
      tooltip += `Config: ${configKey}\n`;
    }
    if (metadata.startedAt) {
      tooltip += `Started: ${metadata.startedAt}\n`;
    }
    if (metadata.lastActivity) {
      tooltip += `Last Activity: ${metadata.lastActivity}\n`;
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/aider' || message.url === '/~/agents' || message.url === '/~/graph') {
        console.log('[AiderProcessTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[AiderProcessTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to aider slice
    this.subscribeToSlice('/aider');
    // Subscribe to agents
    this.subscribeToSlice('/agents');
    // Also subscribe to graph for general updates
    this.subscribeToSlice('/graph');
  }
}
