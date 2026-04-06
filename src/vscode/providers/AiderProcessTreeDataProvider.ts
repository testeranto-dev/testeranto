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

export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;

  constructor() {
    super();
    console.log('[AiderProcessTreeDataProvider] Constructor called');
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
        console.log(`[AiderProcessTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error('[AiderProcessTreeDataProvider] Error loading graph data:', error);
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
    if (!this.graphData) return [];

    // Find all aider nodes
    const aiderNodes = this.graphData.nodes.filter(node => 
      node.type === 'aider' || node.type === 'aider_process'
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
        command: 'testeranto.refreshAiderProcesses',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    if (aiderNodes.length === 0) {
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
      return items;
    }

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
        new vscode.ThemeIcon('symbol-namespace')
      );

      // Store children
      entrypointItem.children = aiderNodes.map(node => this.createAiderProcessItem(node, entrypointNode));
      items.push(entrypointItem);
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

    // Determine icon
    let icon: vscode.ThemeIcon;
    if (status === 'running' && isActive) {
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
        aiderId: node.id
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
    tooltip += `Runtime: ${runtime}\n`;
    tooltip += `Test: ${testName}\n`;
    tooltip += `Config: ${configKey}\n`;
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
    if (message.type === 'graphUpdated') {
      this.refresh();
    }
  }
}
