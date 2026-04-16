import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { getApiUrl, getApiPath, wsApi, type IFileRouteResponse } from '../../api';

export class FileTreeDataProvider extends BaseTreeDataProvider {
  private treeData: any[] | null = null;

  constructor() {
    super();
    // Load data asynchronously
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      console.log('[FileTreeDataProvider] Loading graph data from files API endpoint');
      // Use the API endpoint for files
      const filesUrl = getApiUrl('getFiles');
      const response = await fetch(filesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data: IFileRouteResponse = await response.json();
      console.log('[FileTreeDataProvider] Has tree?', !!data.tree, 'Type:', typeof data.tree);

      // Check if we have a tree structure in the response
      if (data.tree && Array.isArray(data.tree)) {
        console.log('[FileTreeDataProvider] Using server-provided tree with', data.tree.length, 'root nodes');
        this.treeData = data.tree;
      } else {
        console.log('[FileTreeDataProvider] No tree in response');
        this.treeData = null;
      }
    } catch (error) {
      console.error('[FileTreeDataProvider] Failed to load graph data from API:', error);
      this.treeData = null;
      // Show error in console for debugging
      console.error(`[FileTreeDataProvider] Error details: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[FileTreeDataProvider] Make sure server is running on http://localhost:3000`);
    }
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[FileTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!element) {
      // Root level: Show the file system tree
      return this.buildFileSystemTree();
    }

    const elementData = element.data || {};

    // If this is a folder, show its children
    if (elementData.isFolder && elementData.children) {
      // If children are already stored, use them
      return elementData.children;
    }

    // Files don't have children
    return [];
  }

  private buildFileSystemTree(): TestTreeItem[] {
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
        command: 'testeranto.refreshFileTree',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    // Check if we have tree data from the server
    if (this.treeData && Array.isArray(this.treeData)) {
      console.log('[FileTreeDataProvider] Using server-provided tree structure');
      const treeItems = this.convertServerTreeToItems(this.treeData);
      items.push(...treeItems);
      return items;
    }

    // No tree data available
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

  private convertServerTreeToItems(treeNodes: any[]): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    for (const treeNode of treeNodes) {
      if (treeNode.type === 'folder') {
        const children = treeNode.children && Array.isArray(treeNode.children) 
          ? this.convertServerTreeToItems(treeNode.children) 
          : [];
        
        const folderItem = new TestTreeItem(
          treeNode.name,
          TreeItemType.File,
          children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          {
            isFolder: true,
            folderPath: treeNode.path || '',
            folderId: treeNode.id || '',
            description: treeNode.description || 'Folder',
            fileCount: this.countFilesInServerTree(treeNode),
            children: children
          },
          undefined,
          new vscode.ThemeIcon('folder')
        );

        items.push(folderItem);
      } else if (treeNode.type === 'file') {
        const fileItem = new TestTreeItem(
          treeNode.name,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            isFile: true,
            fileName: treeNode.path || '',
            fileType: treeNode.metadata?.fileType || 'file',
            description: treeNode.description || 'File'
          },
          treeNode.path ? {
            command: 'testeranto.openFile',
            title: 'Open File',
            arguments: [{ fileName: treeNode.path }]
          } : undefined,
          this.getIconForFile(treeNode)
        );
        items.push(fileItem);
      }
    }

    // Sort folders first, then files
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFolder === true;
      const bIsFolder = b.data?.isFolder === true;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return (a.label?.toString() || '').localeCompare(b.label?.toString() || '');
    });

    return items;
  }

  private countFilesInServerTree(treeNode: any): number {
    let count = 0;

    if (treeNode.type === 'file') {
      count++;
    }

    if (treeNode.children && Array.isArray(treeNode.children)) {
      for (const child of treeNode.children) {
        count += this.countFilesInServerTree(child);
      }
    }

    return count;
  }

  private getIconForFile(treeNode: any): vscode.ThemeIcon {
    const fileType = treeNode.metadata?.fileType || treeNode.type;

    switch (fileType) {
      case 'input_file':
      case 'source':
        return new vscode.ThemeIcon('file-code');
      case 'log':
        return new vscode.ThemeIcon('output');
      case 'documentation':
        return new vscode.ThemeIcon('book');
      case 'config':
        return new vscode.ThemeIcon('settings-gear');
      default:
        return new vscode.ThemeIcon('file');
    }
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

    if (message.type === 'resourceChanged') {
      // Check if the URL matches any of our API endpoints
      const filesPath = getApiPath('getFiles');
      if (message.url === filesPath || message.url === '/~/graph') {
        console.log('[FileTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[FileTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to files slice using API slice names
    this.subscribeToSlice(wsApi.slices.files);
    // Also subscribe to graph for general updates
    this.subscribeToSlice(wsApi.slices.graph);
  }
}
