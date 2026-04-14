import * as vscode from 'vscode';
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

export class DockerProcessTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;

  constructor() {
    super();
    console.log('[DockerProcessTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      console.log('[DockerProcessTreeDataProvider] Loading process data from /~/process API endpoint');
      // Use the correct API endpoint - /~/process for GET requests
      const response = await fetch('http://localhost:3000/~/process');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // The API returns { processes: [], message: string, timestamp: string, count: number }
      if (data && Array.isArray(data.processes)) {
        // Use the processes directly as nodes
        this.graphData = {
          nodes: data.processes,
          edges: []
        };
        console.log('[DockerProcessTreeDataProvider] Loaded', data.processes.length, 'processes from API');
      } else {
        console.warn('[DockerProcessTreeDataProvider] API response does not contain processes array:', data);
        this.graphData = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('[DockerProcessTreeDataProvider] Failed to load process data from API:', error);
      this.graphData = { nodes: [], edges: [] };
    }
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[DockerProcessTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    // Load data if not already loaded
    if (!this.graphData) {
      await this.loadGraphData();
    }

    if (!element) {
      // Root level: Show all docker processes
      return this.getDockerProcessItems();
    }

    // If element has children stored, return them
    if (element.children) {
      return element.children;
    }

    return [];
  }

  private getDockerProcessItems(): TestTreeItem[] {
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
        command: 'testeranto.refreshDockerProcesses',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    if (!this.graphData) {
      items.push(new TestTreeItem(
        'Cannot connect to server',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Testeranto server is not running on port 3000.',
          startServer: true
        },
        {
          command: 'testeranto.startServer',
          title: 'Start Server',
          arguments: []
        },
        new vscode.ThemeIcon('warning')
      ));
      return items;
    }

    console.log(`[DockerProcessTreeDataProvider] Processing graph with ${this.graphData.nodes.length} nodes, ${this.graphData.edges.length} edges`);

    // Find all docker process nodes
    const dockerProcessNodes = this.graphData.nodes.filter(node => {
      // Check if node.type is an object with category 'process'
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'process';
      }
      // For backward compatibility, also check string types
      return node.type === 'docker_process' ||
             node.type === 'bdd_process' ||
             node.type === 'check_process' ||
             node.type === 'builder_process' ||
             node.type === 'aider_process';
    });

    console.log(`[DockerProcessTreeDataProvider] Found ${dockerProcessNodes.length} docker process nodes`);

    if (dockerProcessNodes.length === 0) {
      items.push(new TestTreeItem(
        'No docker processes found',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No docker processes in graph'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
      return items;
    }

    // Group processes by their connected config or entrypoint
    const processGroups = new Map<string, {
      parentNode: any;
      processes: any[];
      type: 'config' | 'entrypoint' | 'unknown';
    }>();

    for (const processNode of dockerProcessNodes) {
      // Find edges where this process is the target
      const incomingEdges = this.graphData.edges.filter(edge =>
        edge.target === processNode.id
      );

      let parentNode = null;
      let groupType: 'config' | 'entrypoint' | 'unknown' = 'unknown';

      for (const edge of incomingEdges) {
        const sourceNode = this.graphData.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === 'config') {
            parentNode = sourceNode;
            groupType = 'config';
            break;
          } else if (sourceNode.type === 'entrypoint') {
            parentNode = sourceNode;
            groupType = 'entrypoint';
            break;
          }
        }
      }

      const groupKey = parentNode ? parentNode.id : 'ungrouped';

      if (!processGroups.has(groupKey)) {
        processGroups.set(groupKey, {
          parentNode,
          processes: [],
          type: groupType
        });
      }
      processGroups.get(groupKey)!.processes.push(processNode);
    }

    // Create groups
    for (const [groupKey, group] of processGroups.entries()) {
      let groupLabel = 'Ungrouped Processes';
      let groupDescription = `${group.processes.length} process(es)`;

      if (group.parentNode) {
        if (group.type === 'config') {
          groupLabel = `Config: ${group.parentNode.label || group.parentNode.id}`;
          groupDescription = `${group.processes.length} builder process(es)`;
        } else if (group.type === 'entrypoint') {
          groupLabel = `Entrypoint: ${group.parentNode.label || group.parentNode.id}`;
          groupDescription = `${group.processes.length} test process(es)`;
        }
      }

      const groupItem = new TestTreeItem(
        groupLabel,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          description: groupDescription,
          count: group.processes.length,
          groupKey,
          groupType: group.type
        },
        undefined,
        group.type === 'config' ? new vscode.ThemeIcon('settings-gear') :
          group.type === 'entrypoint' ? new vscode.ThemeIcon('file-text') :
            new vscode.ThemeIcon('server')
      );

      // Store children processes
      groupItem.children = group.processes.map(node => this.createProcessItem(node));
      items.push(groupItem);
    }

    return items;
  }

  private createProcessItem(node: GraphNode): TestTreeItem {
    const metadata = node.metadata || {};
    const state = metadata.state || metadata.status || 'unknown';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';

    // Try to extract service name from node ID if not in metadata
    let serviceName = metadata.serviceName || metadata.containerName || metadata.name || 'unknown';

    // If serviceName is still 'unknown', try to construct it from node.id
    if (serviceName === 'unknown' && node.id) {
      // Parse node.id to extract configKey and testName
      // Format: type_process:configKey:testName
      const parts = node.id.split(':');
      if (parts.length >= 3) {
        const processTypePart = parts[0]; // e.g., "builder_process"
        const configKey = parts[1];
        const testName = parts[2];

        // Extract process type from processTypePart
        const processType = processTypePart.replace('_process', '');
        
        // Construct a reasonable service name
        // Special handling for agent processes (matching Server_Vscode.getAiderServiceName)
        if (processType === 'aider' && configKey === 'agent') {
          // Agent containers are named like 'agent-prodirek'
          serviceName = `agent-${testName}`;
        } else if (processType === 'check') {
          serviceName = `check-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
        } else if (processType === 'bdd') {
          serviceName = `bdd-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
        } else if (processType === 'aider') {
          serviceName = `aider-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
        } else if (processType === 'builder') {
          serviceName = `builder-${configKey}`;
        } else {
          serviceName = `${processType}-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
        }
      }
    }

    // Determine process type for display
    let processTypeDisplay = 'unknown';
    if (node.type && typeof node.type === 'object') {
      processTypeDisplay = node.type.type || 'unknown';
    } else if (typeof node.type === 'string') {
      processTypeDisplay = node.type.replace('_process', '');
    }

    // Determine label
    let label = node.label || serviceName;
    if (label === 'unknown' && node.id) {
      const parts = node.id.split(':');
      label = parts[parts.length - 1] || node.id;
    }

    // Determine description
    let description = `${state}`;
    if (exitCode !== undefined) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += ' • inactive';
    }
    if (processTypeDisplay === 'aider') {
      description += ' • aider';
    }

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (processTypeDisplay === 'aider') {
      icon = new vscode.ThemeIcon('comment-discussion', new vscode.ThemeColor('testing.iconPassed'));
    } else if (state === 'running' && isActive) {
      icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
    } else if (state === 'exited') {
      if (exitCode === 0) {
        icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      } else {
        icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      }
    } else if (state === 'stopped') {
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
        status: state,
        exitCode,
        containerId,
        serviceName,
        processType: processTypeDisplay,
        isActive,
        nodeId: node.id,
        // Add aider-specific fields
        agentName: metadata.agentName,
        isAgentAider: metadata.isAgentAider
      },
      {
        command: 'testeranto.openProcessTerminal',
        title: 'Open Process Terminal',
        arguments: [node.id, label, containerId, serviceName]
      },
      icon
    );

    // Build tooltip
    let tooltip = `Type: ${processTypeDisplay}\n`;
    tooltip += `ID: ${node.id}\n`;
    tooltip += `Container: ${containerId}\n`;
    tooltip += `State: ${state}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
    tooltip += `Service: ${serviceName}\n`;
    if (processTypeDisplay === 'aider') {
      if (metadata.agentName) {
        tooltip += `Agent: ${metadata.agentName}\n`;
      }
      if (metadata.isAgentAider) {
        tooltip += `Agent Aider: Yes\n`;
      }
    }
    if (exitCode !== undefined) {
      tooltip += `Exit Code: ${exitCode}\n`;
    }
    if (metadata.image) {
      tooltip += `Image: ${metadata.image}\n`;
    }
    if (metadata.command) {
      tooltip += `Command: ${metadata.command}\n`;
    }
    if (metadata.startedAt) {
      tooltip += `Started: ${metadata.startedAt}\n`;
    }
    if (metadata.finishedAt) {
      tooltip += `Finished: ${metadata.finishedAt}\n`;
    }

    // Check if connected to an entrypoint
    if (this.graphData) {
      const connectedEdges = this.graphData.edges.filter(edge =>
        edge.target === node.id &&
        edge.attributes &&
        edge.attributes.type &&
        (edge.attributes.type === 'hasProcess' ||
         (typeof edge.attributes.type === 'object' && 
          edge.attributes.type.type === 'has'))
      );

      for (const edge of connectedEdges) {
        const sourceNode = this.graphData.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          let sourceType = 'unknown';
          if (sourceNode.type && typeof sourceNode.type === 'object') {
            sourceType = sourceNode.type.type || 'unknown';
          } else if (typeof sourceNode.type === 'string') {
            sourceType = sourceNode.type;
          }
          
          if (sourceType === 'entrypoint') {
            tooltip += `\nConnected to entrypoint: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceType === 'config') {
            tooltip += `\nConnected to config: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceType === 'agent') {
            tooltip += `\nConnected to agent: ${sourceNode.label || sourceNode.id}`;
          }
        }
      }
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[DockerProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

    if (message.type === 'resourceChanged') {
      if (message.url === '/~/process' || message.url === '/~/graph') {
        console.log('[DockerProcessTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[DockerProcessTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to process updates via WebSocket
    // The server sends resourceChanged messages for /~/processes
    this.subscribeToSlice('/processes');
    // Also subscribe to graph for general updates
    this.subscribeToSlice('/graph');
  }
}
