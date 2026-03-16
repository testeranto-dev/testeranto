import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export class ProcessesTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TestTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private processes: any[] = [];
  private ws: WebSocket | null = null;
  private isConnected = false;

  constructor() {
    this.fetchProcesses();
    this.connectWebSocket();
  }

  refresh(): void {
    this.fetchProcesses();
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getProcessItems());
    }
    return Promise.resolve([]);
  }

  private async fetchProcesses(): Promise<void> {
    const response = await fetch('http://localhost:3000/~/processes');
    const data = await response.json();
    this.processes = data.processes;
    this._onDidChangeTreeData.fire();
  }

  private connectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket('ws://localhost:3000');
    
    this.ws.onopen = () => {
      this.isConnected = true;
      this._onDidChangeTreeData.fire();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'resourceChanged' && message.url === '/~/processes') {
        this.fetchProcesses();
      }
    };
    
    this.ws.onerror = () => {
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    };
    
    this.ws.onclose = () => {
      this.isConnected = false;
      this.ws = null;
      this._onDidChangeTreeData.fire();
    };
  }

  private getProcessItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    
    items.push(
      new TestTreeItem(
        this.isConnected ? "✅ Connected via WebSocket" : "⚠️ Not connected",
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          description: this.isConnected ? "Receiving real-time updates" : "Click to retry WebSocket connection",
          connected: this.isConnected
        },
        !this.isConnected ? {
          command: "testeranto.retryConnection",
          title: "Retry Connection",
          arguments: [this]
        } : undefined,
        this.isConnected ? 
          new vscode.ThemeIcon("radio-tower", new vscode.ThemeColor("testing.iconPassed")) :
          new vscode.ThemeIcon("warning", new vscode.ThemeColor("testing.iconFailed"))
      )
    );
    
    items.push(
      new TestTreeItem(
        "Refresh now",
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          description: "Update Docker container list",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode.ThemeIcon("refresh", new vscode.ThemeColor("testing.iconQueued"))
      )
    );
    
    if (this.processes.length > 0) {
      items.push(
        new TestTreeItem(
          `📦 ${this.processes.length} Docker container(s)`,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: "Active and stopped containers",
            count: this.processes.length
          },
          undefined,
          new vscode.ThemeIcon("package", new vscode.ThemeColor("testing.iconUnset"))
        )
      );

      for (const process of this.processes) {
        const isActive = process.isActive === true;
        const icon = isActive ? 
          new vscode.ThemeIcon("play", new vscode.ThemeColor("testing.iconPassed")) :
          new vscode.ThemeIcon("stop", new vscode.ThemeColor("testing.iconFailed"));
        
        const containerName = process.processId || process.name || 'Unknown';
        const label = `${isActive ? '▶ ' : '■ '}${containerName}`;
        
        let description = process.command || process.image || '';
        const status = process.status || '';
        const runtime = process.runtime || 'unknown';
        
        if (status) {
          description = `${description} - ${status}`;
        }
        description = `${description} [${runtime}]`;

        items.push(
          new TestTreeItem(
            label,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              description,
              status,
              isActive,
              processId: process.processId,
              runtime,
              ports: process.ports,
              exitCode: process.exitCode,
              containerName
            },
            undefined,
            icon
          )
        );
      }
    } else {
      items.push(
        new TestTreeItem(
          "No Docker containers found",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: "Make sure the Testeranto server is running on port 3000",
            noProcesses: true
          },
          undefined,
          new vscode.ThemeIcon("info", new vscode.ThemeColor("testing.iconUnset"))
        )
      );
      items.push(
        new TestTreeItem(
          "Start Testeranto Server",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: "Launch the server in a terminal",
            startServer: true
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode.ThemeIcon("play", new vscode.ThemeColor("testing.iconPassed"))
        )
      );
    }

    return items;
  }

  public dispose(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
