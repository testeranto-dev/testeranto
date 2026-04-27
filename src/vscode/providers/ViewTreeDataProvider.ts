import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { BASE_URL, getApiPath } from '../../api';

interface ViewNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, any>;
}

interface ViewData {
  views: ViewNode[];
  message: string;
  timestamp: string;
  count: number;
}

export class ViewTreeDataProvider extends BaseTreeDataProvider {
  private views: ViewNode[] = [];
  private viewMap: Map<string, ViewNode> = new Map();

  constructor() {
    super();
    console.log('[ViewTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadViews().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadViews(): Promise<void> {
    try {
      console.log('[ViewTreeDataProvider] Loading view data from /~/views API endpoint');
      const url = `${BASE_URL}${getApiPath('getViews')}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ViewData = await response.json();
      
      if (data && Array.isArray(data.views)) {
        this.views = data.views;
        this.viewMap.clear();
        for (const view of data.views) {
          this.viewMap.set(view.id, view);
        }
        console.log('[ViewTreeDataProvider] Loaded', data.views.length, 'views from API');
      } else {
        console.warn('[ViewTreeDataProvider] API response does not contain views array:', data);
        this.views = [];
      }
    } catch (error) {
      console.error('[ViewTreeDataProvider] Failed to load view data from API:', error);
      this.views = [];
    }
  }

  refresh(): void {
    this.loadViews().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[ViewTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!element) {
      return this.getViewItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }

  private getViewItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (this.views.length === 0) {
      items.push(new TestTreeItem(
        'No views found',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No views available'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
      return items;
    }

    console.log(`[ViewTreeDataProvider] Processing ${this.views.length} views`);

    // Return a flat list of view items
    for (const view of this.views) {
      items.push(this.createViewItem(view));
    }

    return items;
  }

  private createViewItem(node: ViewNode): TestTreeItem {
    const metadata = node.metadata || {};
    
    const viewType = metadata.viewType || 'unknown';
    const isActive = metadata.isActive || false;
    const viewId = node.id;
    const viewLabel = node.label || viewId;

    const label = viewLabel;

    // Determine description
    let description = '';
    if (isActive) {
      description += 'Active';
    } else {
      description += 'Inactive';
    }
    description += ` • ${viewType}`;

    // Determine icon based on view type
    let icon: vscode.ThemeIcon;
    if (viewType === 'kanban') {
      icon = new vscode.ThemeIcon('columns');
    } else if (viewType === 'gantt') {
      icon = new vscode.ThemeIcon('graph');
    } else if (viewType === 'eisenhower') {
      icon = new vscode.ThemeIcon('dashboard');
    } else {
      icon = new vscode.ThemeIcon('eye');
    }

    const item = new TestTreeItem(
      label,
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description,
        viewType,
        isActive,
        nodeId: viewId,
        viewLabel
      },
      {
        command: 'testeranto.openView',
        title: 'Open View',
        arguments: [viewId, label]
      },
      icon
    );

    // Build comprehensive tooltip
    let tooltip = `View: ${label}\n`;
    tooltip += `Type: ${viewType}\n`;
    tooltip += `ID: ${viewId}\n`;
    tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
    
    if (metadata.url) {
      tooltip += `URL: ${metadata.url}\n`;
    }
    
    if (metadata.description) {
      tooltip += `Description: ${metadata.description}\n`;
    }
    
    if (metadata.createdAt) {
      tooltip += `Created: ${metadata.createdAt}\n`;
    }
    
    if (metadata.updatedAt) {
      tooltip += `Last Updated: ${metadata.updatedAt}\n`;
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[ViewTreeDataProvider] Received message type: ${message.type}`);

    // Handle various message types that indicate view data has changed
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/views' || message.url === '/~/graph') {
        console.log('[ViewTreeDataProvider] View data changed, refreshing from API');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[ViewTreeDataProvider] Graph updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'viewUpdated') {
      console.log('[ViewTreeDataProvider] View updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'connected') {
      console.log('[ViewTreeDataProvider] WebSocket connected, refreshing data');
      setTimeout(() => this.refresh(), 1000);
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to view updates via WebSocket
    this.subscribeToSlice('/views');
    this.subscribeToSlice('/graph');
  }
}
