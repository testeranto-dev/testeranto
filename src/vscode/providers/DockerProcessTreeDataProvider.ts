import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

interface ProcessNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, any>;
}

interface ProcessData {
  processes: ProcessNode[];
  message: string;
  timestamp: string;
  count: number;
}

export class DockerProcessTreeDataProvider extends BaseTreeDataProvider {
  private processes: ProcessNode[] = [];
  private processMap: Map<string, ProcessNode> = new Map();

  constructor() {
    super();
    console.log('[DockerProcessTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadProcesses().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadProcesses(): Promise<void> {
    try {
      console.log('[DockerProcessTreeDataProvider] Loading process data from /~/process API endpoint');
      const response = await fetch('http://localhost:3000/~/process');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ProcessData = await response.json();
      
      if (data && Array.isArray(data.processes)) {
        this.processes = data.processes;
        this.processMap.clear();
        for (const proc of data.processes) {
          this.processMap.set(proc.id, proc);
        }
        console.log('[DockerProcessTreeDataProvider] Loaded', data.processes.length, 'processes from API');
      } else {
        console.warn('[DockerProcessTreeDataProvider] API response does not contain processes array:', data);
        this.processes = [];
      }
    } catch (error) {
      console.error('[DockerProcessTreeDataProvider] Failed to load process data from API:', error);
      this.processes = [];
    }
  }

  refresh(): void {
    this.loadProcesses().then(() => {
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
    if (!element) {
      return this.getDockerProcessItems();
    }
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
        description: 'Reload process data',
        refresh: true
      },
      {
        command: 'testeranto.refreshDockerProcesses',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    if (this.processes.length === 0) {
      items.push(new TestTreeItem(
        'No docker processes found',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No docker processes available'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
      return items;
    }

    console.log(`[DockerProcessTreeDataProvider] Processing ${this.processes.length} processes`);

    // Group processes by type
    const processGroups = new Map<string, ProcessNode[]>();
    for (const proc of this.processes) {
      const metadata = proc.metadata || {};
      const processType = metadata.processType || 'unknown';
      if (!processGroups.has(processType)) {
        processGroups.set(processType, []);
      }
      processGroups.get(processType)!.push(proc);
    }

    // Create groups
    for (const [groupType, groupProcesses] of processGroups.entries()) {
      const groupLabel = `${groupType.charAt(0).toUpperCase() + groupType.slice(1)} Processes`;
      const groupDescription = `${groupProcesses.length} process(es)`;

      const groupItem = new TestTreeItem(
        groupLabel,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          description: groupDescription,
          count: groupProcesses.length,
          groupType
        },
        undefined,
        new vscode.ThemeIcon('server')
      );

      // Store children processes
      groupItem.children = groupProcesses.map(proc => this.createProcessItem(proc));
      items.push(groupItem);
    }

    return items;
  }

  private createProcessItem(node: ProcessNode): TestTreeItem {
    const metadata = node.metadata || {};
    
    const status = metadata.status || 'unknown';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';
    const isAider = metadata.isAider || false;
    const processType = metadata.processType || 'unknown';
    const serviceName = metadata.serviceName || metadata.containerName || metadata.name || 'unknown';

    const label = node.label || serviceName;

    // Determine description with clear status information
    let description = '';
    if (isAider) {
      description += '🤖 ';
    }
    
    switch (status.toLowerCase()) {
      case 'running':
        description += '▶️ Running';
        break;
      case 'stopped':
        description += '⏹️ Stopped';
        break;
      case 'exited':
        if (exitCode === 0) {
          description += '✅ Exited';
        } else {
          description += '❌ Exited';
        }
        break;
      case 'failed':
        description += '❌ Failed';
        break;
      default:
        description += `❓ ${status}`;
    }
    
    if (exitCode !== undefined) {
      description += ` (exit: ${exitCode})`;
    }
    
    description += ` • ${processType}`;

    // Determine icon based on status and process type
    let icon: vscode.ThemeIcon;
    if (isAider) {
      if (status === 'running') {
        icon = new vscode.ThemeIcon('comment-discussion', new vscode.ThemeColor('testing.iconPassed'));
      } else {
        icon = new vscode.ThemeIcon('comment', new vscode.ThemeColor('testing.iconUnset'));
      }
    } else {
      if (status === 'running') {
        icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
      } else if (status === 'exited') {
        if (exitCode === 0) {
          icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
        } else {
          icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
        }
      } else if (status === 'stopped') {
        icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
      } else if (status === 'failed') {
        icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      } else {
        icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
      }
    }

    const item = new TestTreeItem(
      label,
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description,
        status,
        exitCode,
        containerId,
        serviceName,
        processType,
        isActive,
        nodeId: node.id,
        agentName: metadata.agentName,
        isAgentAider: metadata.isAgentAider,
        isAider
      },
      {
        command: 'testeranto.openProcessTerminal',
        title: 'Open Process Terminal',
        arguments: [node.id, label, containerId, serviceName]
      },
      icon
    );

    // Build comprehensive tooltip
    let tooltip = `Process: ${label}\n`;
    tooltip += `Type: ${processType}${isAider ? ' (Aider)' : ''}\n`;
    tooltip += `ID: ${node.id}\n`;
    tooltip += `Status: ${status}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
    
    if (containerId && containerId !== 'unknown') {
      tooltip += `Container: ${containerId}\n`;
    }
    
    if (serviceName && serviceName !== 'unknown') {
      tooltip += `Service: ${serviceName}\n`;
    }
    
    if (isAider) {
      tooltip += `Aider Process: Yes\n`;
      if (metadata.agentName) {
        tooltip += `Agent: ${metadata.agentName}\n`;
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
    
    if (metadata.updatedAt) {
      tooltip += `Last Updated: ${metadata.updatedAt}\n`;
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[DockerProcessTreeDataProvider] Received message type: ${message.type}`);

    // Handle various message types that indicate process data has changed
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/process' || message.url === '/~/graph') {
        console.log('[DockerProcessTreeDataProvider] Process data changed, refreshing from API');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[DockerProcessTreeDataProvider] Graph updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'processUpdated') {
      console.log('[DockerProcessTreeDataProvider] Process updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'containerStatusChanged') {
      console.log('[DockerProcessTreeDataProvider] Container status changed, refreshing from API');
      this.refresh();
    } else if (message.type === 'connected') {
      console.log('[DockerProcessTreeDataProvider] WebSocket connected, refreshing data');
      setTimeout(() => this.refresh(), 1000);
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to process updates via WebSocket
    this.subscribeToSlice('/process');
    this.subscribeToSlice('/graph');
    this.subscribeToSlice('/container-status');
  }
}
