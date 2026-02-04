import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export class ProcessesTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = new
    vscode.EventEmitter<TestTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private processes: any[] = [];
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Start with an initial HTTP fetch
    this.fetchProcessesViaHttp().catch(error => {
      console.log('[ProcessesTreeDataProvider] Initial HTTP fetch failed:', error);
    });
    // Connect to WebSocket for real-time updates
    this.connectWebSocket();
  }

  refresh(): void {
    console.log('[ProcessesTreeDataProvider] Manual refresh requested');
    this.fetchProcessesViaHttp().catch(error => {
      console.log('[ProcessesTreeDataProvider] HTTP refresh failed:', error);
    });
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

  private getProcessItems(): TestTreeItem[] {
    // Show connection status
    const items: TestTreeItem[] = [];
    
    // Add connection status item
    if (this.isConnected) {
      items.push(
        new TestTreeItem(
          "✅ Connected via WebSocket",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: "Receiving real-time updates",
            connected: true
          },
          undefined,
          new vscode.ThemeIcon("radio-tower", new vscode.ThemeColor("testing.iconPassed"))
        )
      );
    } else {
      items.push(
        new TestTreeItem(
          "⚠️ Not connected",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            description: "Click to retry WebSocket connection",
            disconnected: true
          },
          {
            command: "testeranto.retryConnection",
            title: "Retry Connection",
            arguments: [this]
          },
          new vscode.ThemeIcon("warning", new vscode.ThemeColor("testing.iconFailed"))
        )
      );
    }
    
    // Add refresh item
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
    
    // Show processes if we have them
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

      // Show all processes directly without grouping
      for (const process of this.processes) {
        let icon: vscode.ThemeIcon;
        let labelPrefix = '';
        let statusColor: vscode.ThemeColor | undefined;

        let status = process.status || '';
        const state = process.state || '';
        const isActive = process.isActive === true;
        const runtime = process.runtime || 'unknown';

        if (isActive) {
          icon = new vscode.ThemeIcon("play", new vscode.ThemeColor("testing.iconPassed"));
          labelPrefix = '▶ ';
          statusColor = new vscode.ThemeColor("testing.iconPassed");
        } else {
          icon = new vscode.ThemeIcon("stop", new vscode.ThemeColor("testing.iconFailed"));
          labelPrefix = '■ ';
          statusColor = new vscode.ThemeColor("testing.iconFailed");

          // Add exit code to status if available
          if (process.exitCode !== null && process.exitCode !== undefined) {
            status = `${status} (exit: ${process.exitCode})`;
          }
        }

        // Create a more informative label
        const containerName = process.processId || process.name || 'Unknown';
        const label = `${labelPrefix}${containerName}`;
        
        // Create detailed description
        let description = '';
        if (process.command) {
          description = process.command;
        } else if (process.image) {
          description = process.image;
        }
        
        // Add status and runtime to description
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
              description: description,
              status: status,
              state: state,
              isActive: isActive,
              processId: process.processId,
              runtime: runtime,
              ports: process.ports,
              exitCode: process.exitCode,
              containerName: containerName,
              startedAt: process.startedAt,
              finishedAt: process.finishedAt
            },
            undefined,
            icon
          )
        );
      }
    } else {
      // No processes found
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

  public connectWebSocket(): void {
    if (this.ws) {
      // Close existing connection
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    console.log('[ProcessesTreeDataProvider] Connecting to WebSocket at ws://localhost:3000');
    
    try {
      this.ws = new WebSocket('ws://localhost:3000');
      
      this.ws.onopen = () => {
        console.log('[ProcessesTreeDataProvider] WebSocket connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
        this._onDidChangeTreeData.fire();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[ProcessesTreeDataProvider] Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[ProcessesTreeDataProvider] WebSocket error:', error);
        this.isConnected = false;
        this._onDidChangeTreeData.fire();
      };
      
      this.ws.onclose = (event) => {
        console.log(`[ProcessesTreeDataProvider] WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.ws = null;
        this._onDidChangeTreeData.fire();
        
        // Attempt to reconnect after 5 seconds
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          console.log(`[ProcessesTreeDataProvider] Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts}) in 5 seconds...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, 5000);
        } else {
          console.log('[ProcessesTreeDataProvider] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[ProcessesTreeDataProvider] Failed to create WebSocket:', error);
      this.isConnected = false;
      this._onDidChangeTreeData.fire();
    }
  }

  private handleWebSocketMessage(message: any): void {
    console.log('[ProcessesTreeDataProvider] Received WebSocket message:', message.type);
    
    switch (message.type) {
      case 'connected':
        console.log('[ProcessesTreeDataProvider] WebSocket connection confirmed');
        break;
      case 'resourceChanged':
        console.log('[ProcessesTreeDataProvider] Resource changed, fetching updated processes:', message.url);
        // If the processes resource changed, fetch via HTTP
        if (message.url === '/~/processes') {
          this.fetchProcessesViaHttp().catch(error => {
            console.log('[ProcessesTreeDataProvider] HTTP fetch after resource change failed:', error);
          });
        }
        break;
      case 'useHttp':
        console.log('[ProcessesTreeDataProvider] Server requested HTTP for processes');
        // Make an HTTP request to get processes
        this.fetchProcessesViaHttp().catch(error => {
          console.log('[ProcessesTreeDataProvider] HTTP fetch failed:', error);
        });
        break;
      default:
        console.log('[ProcessesTreeDataProvider] Unhandled message type:', message.type);
    }
  }


  private async fetchProcessesViaHttp(): Promise<void> {
    console.log('[ProcessesTreeDataProvider] Fetching processes via HTTP from http://localhost:3000/~/processes');
    try {
      // Use a simple fetch without timeout for now
      const response = await fetch('http://localhost:3000/~/processes');
      
      if (!response.ok) {
        console.error(`[ProcessesTreeDataProvider] HTTP error! status: ${response.status}`);
        this.processes = [];
        this._onDidChangeTreeData.fire();
        return;
      }
      
      const data = await response.json();
      console.log(`[ProcessesTreeDataProvider] HTTP fetch returned ${data.processes?.length || 0} processes`);
      
      this.processes = data.processes || [];
      console.log(`[ProcessesTreeDataProvider] Updated processes array to have ${this.processes.length} items`);
      this._onDidChangeTreeData.fire();
    } catch (error: any) {
      console.error('[ProcessesTreeDataProvider] HTTP fetch failed:', error.message || error);
      this.processes = [];
      this._onDidChangeTreeData.fire();
    }
  }

  public dispose(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}
