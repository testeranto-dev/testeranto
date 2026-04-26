import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { getApiUrl, getApiPath, wsApi, GetAiderResponse } from '../../api';

export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GetAiderResponse | null = null;
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
      console.log('[AiderProcessTreeDataProvider] Loading graph data from aider API endpoint');
      // Fetch data directly from the API
      await this.fetchAiderProcessesDirectly();
    } catch (error) {
      console.error('[AiderProcessTreeDataProvider] Error loading graph data from API:', error);
      // Clear data to show error state
      this.graphData = null;
      this.agents = [];
      // Show error in console for debugging
      console.error(`[AiderProcessTreeDataProvider] Error details: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[AiderProcessTreeDataProvider] Make sure server is running on http://localhost:3000`);
    }
  }


  private async fetchAiderProcessesDirectly(): Promise<void> {
    // Use the API endpoint for aider
    try {
      const aiderUrl = getApiUrl('getAider');
      const response = await fetch(aiderUrl, {
        method: 'GET'
      });
      if (response.ok) {
        const data: GetAiderResponse = await response.json();
        console.log('[AiderProcessTreeDataProvider] Raw aider data:', JSON.stringify(data, null, 2));
        
        // Ensure data is an object with nodes array
        if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) {
          console.warn('[AiderProcessTreeDataProvider] Invalid response format, missing nodes array');
          this.graphData = { nodes: [], edges: [] };
          this.agents = [];
          return;
        }
        
        // The aider slice contains both agent nodes and aider process nodes
        // We need to filter for aider_process type nodes
        this.graphData = { nodes: [], edges: [] };
        
        // Extract aider process nodes (type: 'aider_process')
        const aiderProcessNodes = data.nodes.filter((node: any) => 
          node.type === 'aider_process'
        );
        
        // Also extract agent nodes for reference
        const agentNodes = data.nodes.filter((node: any) => 
          node.type === 'agent'
        );
        
        // Clear existing data and add new nodes
        this.graphData.nodes = [];
        aiderProcessNodes.forEach((node: any) => {
          this.graphData!.nodes.push({
            id: node.id,
            type: node.type,
            label: node.label,
            metadata: node.metadata
          });
        });
        
        // Store agents for grouping/filtering
        this.agents = agentNodes.map((node: any) => ({
          name: node.metadata?.agentName,
          ...node.metadata
        }));
        
        console.log(`[AiderProcessTreeDataProvider] Successfully fetched ${aiderProcessNodes.length} aider processes and ${agentNodes.length} agents from ${aiderUrl}`);
        
        // If no aider processes found, check if we should try aider-processes endpoint
        if (aiderProcessNodes.length === 0) {
          console.log('[AiderProcessTreeDataProvider] No aider processes found in /~/aider endpoint');
        }
        return;
      } else {
        console.warn(`[AiderProcessTreeDataProvider] Failed to fetch from ${aiderUrl}:`, response.status);
      }
    } catch (error) {
      console.error(`[AiderProcessTreeDataProvider] Error fetching from getAider API:`, error);
    }
  }

  refresh(): void {
    console.log('[AiderProcessTreeDataProvider] Manual refresh triggered');
    // Clear current data to show loading state
    this.graphData = null;
    this.agents = [];
    this._onDidChangeTreeData.fire();
    
    // Load data directly
    this.loadGraphData()
      .then(() => {
        this._onDidChangeTreeData.fire();
      })
      .catch(error => {
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
    
    // Add "Launch Agent" item using the unified spawn route
    items.push(
      new TestTreeItem(
        'Launch Agent',
        TreeItemType.Action,
        vscode.TreeItemCollapsibleState.None,
        { 
          action: 'launchAgent',
          info: 'Launch a new agent using the unified spawn endpoint.'
        },
        {
          command: 'testeranto.launchAgent',
          title: 'Launch Agent',
          arguments: []
        },
        new vscode.ThemeIcon('add')
      )
    );
    
    // Check if we have graph data
    if (!this.graphData) {
      items.push(
        new TestTreeItem(
          'Cannot connect to server',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            info: 'Testeranto server is not running on port 3000.',
            startServer: true
          },
          {
            command: 'testeranto.startServer',
            title: 'Start Server',
            arguments: []
          },
          new vscode.ThemeIcon('warning')
        )
      );
      return items;
    }
    
    if (!Array.isArray(this.graphData.nodes) || this.graphData.nodes.length === 0) {
      items.push(
        new TestTreeItem(
          'No aider data available',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            info: 'The server returned empty graph data. ' +
                  'Try running "Testeranto: Start Server" or check if the server is running on port 3000.'
          },
          undefined,
          new vscode.ThemeIcon('info')
        )
      );
      return items;
    }
    
    // Find all aider process nodes (these represent running agents)
    const aiderProcessNodes = this.graphData.nodes.filter((node: any) => 
      node.type === 'aider_process'
    );
    
    if (aiderProcessNodes.length === 0) {
      items.push(
        new TestTreeItem(
          'No running agents',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            info: 'No agents are currently running. Launch one from the Agents view.'
          },
          undefined,
          new vscode.ThemeIcon('info')
        )
      );
      return items;
    }
    
    // Create items for each aider process (running agent)
    for (const node of aiderProcessNodes) {
      const metadata = node.metadata || {};
      const containerName = metadata.containerName || '';
      const agentName = metadata.agentName || node.label || node.id;
      const label = node.label || agentName;
      const status = node.status || 'running';
      
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
          description: `Container: ${containerName}`,
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
      let tooltip = `Agent: ${agentName}\n`;
      tooltip += `ID: ${node.id}\n`;
      tooltip += `Container: ${containerName}\n`;
      tooltip += `Status: ${status}\n`;
      if (metadata.containerId) {
        tooltip += `Container ID: ${metadata.containerId}\n`;
      }
      if (metadata.timestamp) {
        tooltip += `Created: ${metadata.timestamp}\n`;
      }
      item.tooltip = tooltip;
      
      items.push(item);
    }
    
    return items;
  }


  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

    if (message.type === 'resourceChanged') {
      // Check if the URL matches any of our API endpoints
      const aiderPath = getApiPath('getAider');
      const userAgentsPath = getApiPath('getUserAgents');
      // Check for agent-related URLs (both /~/agents and /~/user-agents)
      // Note: /~/agents requires a parameter, but WebSocket messages might use the base path
      const isAgentRelated = message.url && (
        message.url === userAgentsPath ||
        message.url.startsWith('/~/agents/') ||
        message.url === '/~/agents'
      );
      
      if (message.url === aiderPath || 
          isAgentRelated || 
          message.url === '/~/graph') {
        console.log('[AiderProcessTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }

      // Handle agent spawn notification - the extension already opens a terminal
      // when it initiates the spawn, so we don't need to open another one here.
      // This notification is for other clients (e.g., web UI).
      if (message.url === '/~/agents/spawn' && message.agentName && message.containerName) {
        console.log(`[AiderProcessTreeDataProvider] Agent spawned: ${message.agentName}, skipping terminal open (already handled by extension)`);
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[AiderProcessTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }


  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to slices using API slice names
    this.subscribeToSlice(wsApi.slices.aider);
    this.subscribeToSlice(wsApi.slices.agents);
    this.subscribeToSlice(wsApi.slices.graph);
  }
}
