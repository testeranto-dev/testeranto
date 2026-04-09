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
      console.log('[DockerProcessTreeDataProvider] Loading graph data from process slice');
      const response = await fetch(ApiUtils.getProcessSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      console.log('[DockerProcessTreeDataProvider] Loaded graph data:', this.graphData?.nodes?.length, 'nodes');
    } catch (error) {
      console.error('[DockerProcessTreeDataProvider] Failed to load graph data:', error);
      this.graphData = null;
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
    if (!this.graphData) {
      console.log('[DockerProcessTreeDataProvider] No graph data available');
      return [];
    }

    console.log(`[DockerProcessTreeDataProvider] Processing graph with ${this.graphData.nodes.length} nodes, ${this.graphData.edges.length} edges`);

    // Find all docker process nodes
    const dockerProcessNodes = this.graphData.nodes.filter(node =>
      node.type === 'docker_process' ||
      node.type === 'bdd_process' ||
      node.type === 'check_process' ||
      node.type === 'builder_process' ||
      node.type === 'aider_process'
    );

    console.log(`[DockerProcessTreeDataProvider] Found ${dockerProcessNodes.length} docker process nodes`);

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
    const serviceName = metadata.serviceName || metadata.containerName || metadata.name || 'unknown';

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
    if (node.type === 'aider_process') {
      description += ' • aider';
    }

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (node.type === 'aider_process') {
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
        processType: node.type,
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
    let tooltip = `Type: ${node.type}\n`;
    tooltip += `ID: ${node.id}\n`;
    tooltip += `Container: ${containerId}\n`;
    tooltip += `State: ${state}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
    if (node.type === 'aider_process') {
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
        (edge.attributes.type === 'hasProcess' ||
          edge.attributes.type === 'hasBddProcess' ||
          edge.attributes.type === 'hasCheckProcess' ||
          edge.attributes.type === 'hasBuilderProcess' ||
          edge.attributes.type === 'hasAiderProcess')
      );

      for (const edge of connectedEdges) {
        const sourceNode = this.graphData.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === 'entrypoint') {
            tooltip += `\nConnected to entrypoint: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceNode.type === 'config') {
            tooltip += `\nConnected to config: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceNode.type === 'agent') {
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
    // Subscribe to process slice
    this.subscribeToSlice('/process');
    // Also subscribe to graph for general updates
    this.subscribeToSlice('/graph');
  }
}
