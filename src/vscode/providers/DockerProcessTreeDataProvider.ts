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
    this.loadGraphData();
  }

  private loadGraphData(): void {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
      
      if (fs.existsSync(graphDataPath)) {
        const content = fs.readFileSync(graphDataPath, 'utf-8');
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[DockerProcessTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error('[DockerProcessTreeDataProvider] Error loading graph data:', error);
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
      // Root level: Show all docker processes
      return this.getDockerProcessItems();
    }

    return [];
  }

  private getDockerProcessItems(): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find all docker process nodes
    const dockerProcessNodes = this.graphData.nodes.filter(node => 
      node.type === 'docker_process' || 
      node.type === 'bdd_process' || 
      node.type === 'check_process' || 
      node.type === 'builder_process'
    );

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

    // Add process items
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
    } else {
      // Add header
      items.push(new TestTreeItem(
        `Docker Processes (${dockerProcessNodes.length})`,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Flat list of all docker processes',
          count: dockerProcessNodes.length
        },
        undefined,
        new vscode.ThemeIcon('server')
      ));

      // Add each process
      for (const node of dockerProcessNodes) {
        items.push(this.createProcessItem(node));
      }
    }

    return items;
  }

  private createProcessItem(node: GraphNode): TestTreeItem {
    const metadata = node.metadata || {};
    const state = metadata.state || 'unknown';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';
    const serviceName = metadata.serviceName || metadata.name || 'unknown';
    
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

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (state === 'running' && isActive) {
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
        isActive
      },
      {
        command: 'testeranto.showProcessLogs',
        title: 'Show Process Logs',
        arguments: [node.id, label]
      },
      icon
    );

    // Build tooltip
    let tooltip = `Type: ${node.type}\n`;
    tooltip += `ID: ${node.id}\n`;
    tooltip += `Container: ${containerId}\n`;
    tooltip += `State: ${state}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
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
         edge.attributes.type === 'hasBuilderProcess')
      );

      for (const edge of connectedEdges) {
        const sourceNode = this.graphData.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === 'entrypoint') {
            tooltip += `\nConnected to entrypoint: ${sourceNode.label || sourceNode.id}`;
          } else if (sourceNode.type === 'config') {
            tooltip += `\nConnected to config: ${sourceNode.label || sourceNode.id}`;
          }
        }
      }
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    if (message.type === 'graphUpdated') {
      this.refresh();
    }
  }
}
