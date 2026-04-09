import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { AiderGraphLoader } from './utils/AiderGraphLoader';
import { AiderTreeItemCreator } from './utils/AiderTreeItemCreator';
import { AiderDataGrouper } from './utils/AiderDataGrouper';

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
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      }).catch(error => {
        console.error('[AiderProcessTreeDataProvider] Initial load failed:', error);
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      const result = await AiderGraphLoader.loadGraphData();
      this.graphData = result.graphData;
      this.agents = result.agents;
    } catch (error) {
      console.error('[AiderProcessTreeDataProvider] Error loading graph data:', error);
      // Fallback to fetching agents and aider processes directly
      await this.fetchAgentsDirectly();
      await this.fetchAiderProcessesDirectly();
    }
  }

  private async fetchAgentsDirectly(): Promise<void> {
    // Agents are included in the aider slice, so we don't need to fetch them separately
    // This method is kept for compatibility but does nothing
    this.agents = [];
  }

  private async fetchAiderProcessesDirectly(): Promise<void> {
    // Only use the /~/aider endpoint which works with GET
    try {
      const response = await fetch('http://localhost:3000/~/aider', {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        // The aider slice contains both agent nodes and aider process nodes
        // We need to filter for aider_process type nodes
        this.graphData = this.graphData || { nodes: [], edges: [] };
        const existingIds = new Set(this.graphData.nodes.map(n => n.id));
        
        // Extract aider process nodes (type: 'aider_process')
        const aiderProcessNodes = data.nodes?.filter((node: any) => 
          node.type === 'aider_process'
        ) || [];
        
        // Also extract agent nodes for reference
        const agentNodes = data.nodes?.filter((node: any) => 
          node.type === 'agent'
        ) || [];
        
        // Add aider process nodes to graphData
        aiderProcessNodes.forEach((node: any) => {
          if (!existingIds.has(node.id)) {
            this.graphData!.nodes.push({
              id: node.id,
              type: node.type,
              label: node.label,
              metadata: node.metadata
            });
          }
        });
        
        // Store agents for grouping/filtering
        this.agents = agentNodes.map((node: any) => ({
          name: node.metadata?.agentName,
          ...node.metadata
        }));
        
        console.log(`[AiderProcessTreeDataProvider] Successfully fetched ${aiderProcessNodes.length} aider processes and ${agentNodes.length} agents from /~/aider`);
        return;
      } else {
        console.warn(`[AiderProcessTreeDataProvider] Failed to fetch from /~/aider:`, response.status);
      }
    } catch (error) {
      console.error(`[AiderProcessTreeDataProvider] Error fetching from /~/aider:`, error);
    }
  }

  refresh(): void {
    console.log('[AiderProcessTreeDataProvider] Manual refresh triggered');
    // Clear current data to show loading state
    this.graphData = null;
    this.agents = [];
    this._onDidChangeTreeData.fire();
    
    // Load data with timeout
    const loadPromise = this.loadGraphData();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 10000);
    });
    
    Promise.race([loadPromise, timeoutPromise])
      .then(() => {
        this._onDidChangeTreeData.fire();
      })
      .catch(error => {
        console.error('[AiderProcessTreeDataProvider] Error in refresh:', error);
        // Try direct fetching as fallback
        return Promise.allSettled([
          this.fetchAgentsDirectly(),
          this.fetchAiderProcessesDirectly()
        ]).then(() => {
          this._onDidChangeTreeData.fire();
        });
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
      return this.getAiderProcessItems();
    }

    const elementType = element.type;
    const elementData = element.data || {};

    if (elementType === TreeItemType.Runtime) {
      return this.getAiderProcessesForEntrypoint(elementData.entrypointId);
    }

    return [];
  }

  private getAiderProcessItems(): TestTreeItem[] {
    // Create items directly from graph data
    const items: TestTreeItem[] = [];
    
    // Add refresh item first
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
          command: 'testeranto.refreshAiderProcesses',
          title: 'Refresh',
          arguments: []
        },
        new vscode.ThemeIcon('refresh')
      )
    );
    
    // Check if we have graph data
    if (!this.graphData || this.graphData.nodes.length === 0) {
      items.push(
        new TestTreeItem(
          'No aider data available',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            info: 'The server may not be running or the /~/aider endpoint may be unavailable. ' +
                  'Try running "Testeranto: Start Server" or check if the server is running on port 3000.'
          },
          undefined,
          new vscode.ThemeIcon('info')
        )
      );
      return items;
    }
    
    // Find all aider process nodes
    const aiderProcessNodes = this.graphData.nodes.filter((node: any) => 
      node.type === 'aider_process'
    );
    
    // Find all agent nodes for grouping
    const agentNodes = this.graphData.nodes.filter((node: any) => 
      node.type === 'agent'
    );
    
    if (aiderProcessNodes.length === 0) {
      items.push(
        new TestTreeItem(
          'No aider processes found',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            info: agentNodes.length > 0 
              ? 'Agents are running but no aider processes are active.'
              : 'No agents or aider processes found.'
          },
          undefined,
          new vscode.ThemeIcon('info')
        )
      );
      return items;
    }
    
    // Group aider processes by their agent
    const aiderByAgent = new Map<string, any[]>();
    
    for (const aiderNode of aiderProcessNodes) {
      // Find which agent this aider process belongs to
      const edge = this.graphData.edges.find((e: any) => 
        e.target === aiderNode.id && e.attributes.type === 'hasAiderProcess'
      );
      
      if (edge) {
        const agentId = edge.source;
        if (!aiderByAgent.has(agentId)) {
          aiderByAgent.set(agentId, []);
        }
        aiderByAgent.get(agentId)!.push(aiderNode);
      } else {
        // Ungrouped aider process
        if (!aiderByAgent.has('ungrouped')) {
          aiderByAgent.set('ungrouped', []);
        }
        aiderByAgent.get('ungrouped')!.push(aiderNode);
      }
    }
    
    // Create group items
    for (const [agentId, aiderNodes] of aiderByAgent.entries()) {
      let groupLabel = 'Ungrouped Aider Processes';
      let groupIcon = new vscode.ThemeIcon('server');
      
      if (agentId !== 'ungrouped') {
        const agentNode = agentNodes.find((n: any) => n.id === agentId);
        if (agentNode) {
          groupLabel = `Agent: ${agentNode.metadata?.agentName || agentNode.label || agentId}`;
          groupIcon = new vscode.ThemeIcon('person');
        } else {
          groupLabel = `Agent: ${agentId}`;
          groupIcon = new vscode.ThemeIcon('person');
        }
      }
      
      const groupItem = new TestTreeItem(
        groupLabel,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          description: `${aiderNodes.length} aider process(es)`,
          groupId: agentId,
          isGroup: true
        },
        undefined,
        groupIcon
      );
      
      // Create child items for each aider process
      groupItem.children = aiderNodes.map((node: any) => {
        const metadata = node.metadata || {};
        const containerName = metadata.containerName || '';
        const agentName = metadata.agentName || '';
        const label = node.label || 'Aider Process';
        const status = node.status || 'unknown';
        
        // Determine icon based on status
        let icon: vscode.ThemeIcon;
        if (status === 'running') {
          icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
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
            description: `Status: ${status}`,
            status,
            containerName,
            agentName,
            metadata,
            isAiderProcess: true,
            nodeId: node.id
          },
          {
            command: 'testeranto.openAiderTerminal',
            title: 'Open Aider Terminal',
            arguments: [containerName, label, agentName]
          },
          icon
        );
        
        // Build tooltip
        let tooltip = `Type: ${node.type}\n`;
        tooltip += `ID: ${node.id}\n`;
        tooltip += `Container: ${containerName}\n`;
        tooltip += `Status: ${status}\n`;
        tooltip += `Agent: ${agentName || 'None'}\n`;
        if (metadata.containerId) {
          tooltip += `Container ID: ${metadata.containerId}\n`;
        }
        if (metadata.timestamp) {
          tooltip += `Created: ${metadata.timestamp}\n`;
        }
        item.tooltip = tooltip;
        
        return item;
      });
      
      items.push(groupItem);
    }
    
    return items;
  }

  private getAiderProcessesForEntrypoint(entrypointId: string): TestTreeItem[] {
    if (!this.graphData) return [];
    return AiderDataGrouper.getAiderProcessesForEntrypoint(this.graphData, entrypointId);
  }

  private createAiderProcessItem(node: GraphNode, entrypointNode?: GraphNode): TestTreeItem {
    return AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode);
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
    this.subscribeToSlice('/aider');
    this.subscribeToSlice('/agents');
    this.subscribeToSlice('/graph');
  }
}
