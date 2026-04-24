import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { getApiUrl, getApiPath, wsApi, type IFileRouteResponse } from '../../api';

interface FileNode {
  id: string;
  name: string;
  type: string;
  path: string;
  children?: FileNode[];
  metadata?: Record<string, any>;
}

interface FileData {
  tree: FileNode[];
  timestamp: string;
}

export class FileTreeDataProvider extends BaseTreeDataProvider {
  private treeData: FileNode[] = [];

  constructor() {
    super();
    console.log('[FileTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadFiles().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadFiles(): Promise<void> {
    try {
      console.log('[FileTreeDataProvider] Loading file data from files API endpoint');
      const filesUrl = getApiUrl('getFiles');
      const response = await fetch(filesUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: FileData = await response.json();
      
      if (data && Array.isArray(data.tree)) {
        this.treeData = data.tree;
        console.log('[FileTreeDataProvider] Loaded', data.tree.length, 'root nodes from API');
      } else {
        console.warn('[FileTreeDataProvider] API response does not contain tree array:', data);
        this.treeData = [];
      }
    } catch (error) {
      console.error('[FileTreeDataProvider] Failed to load file data from API:', error);
      this.treeData = [];
    }
  }

  refresh(): void {
    this.loadFiles().then(() => {
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
      return this.getRootItems();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }

  private getRootItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (this.treeData.length === 0) {
      items.push(new TestTreeItem(
        'No files found',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No files available'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
      return items;
    }

    console.log(`[FileTreeDataProvider] Processing ${this.treeData.length} root nodes`);

    // Build recursive tree from server-provided tree structure
    for (const node of this.treeData) {
      const item = this.createTreeItem(node);
      items.push(item);
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

  private createTreeItem(node: FileNode): TestTreeItem {
    const isFolder = node.type === 'folder';
    const label = node.name || node.id;
    const filePath = node.path || '';
    const metadata = node.metadata || {};

    // Determine description
    let description = '';
    if (isFolder) {
      description += 'Folder';
    } else {
      description += 'File';
    }

    // Determine icon based on file type
    let icon: vscode.ThemeIcon;
    if (isFolder) {
      icon = new vscode.ThemeIcon('folder');
    } else {
      const fileType = metadata.fileType || metadata.testPath ? 'test' : 'file';
      switch (fileType) {
        case 'input_file':
        case 'source':
          icon = new vscode.ThemeIcon('file-code');
          break;
        case 'log':
          icon = new vscode.ThemeIcon('output');
          break;
        case 'documentation':
          icon = new vscode.ThemeIcon('book');
          break;
        case 'config':
          icon = new vscode.ThemeIcon('settings-gear');
          break;
        case 'test':
          icon = new vscode.ThemeIcon('beaker');
          break;
        default:
          icon = new vscode.ThemeIcon('file');
      }
    }

    // Build children recursively if this is a folder
    let children: TestTreeItem[] | undefined;
    if (isFolder && node.children && node.children.length > 0) {
      children = node.children.map(child => this.createTreeItem(child));
      // Sort children: folders first, then files
      children.sort((a, b) => {
        const aIsFolder = a.data?.isFolder === true;
        const bIsFolder = b.data?.isFolder === true;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return (a.label?.toString() || '').localeCompare(b.label?.toString() || '');
      });
    }

    const item = new TestTreeItem(
      label,
      TreeItemType.File,
      isFolder && children && children.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      {
        description,
        isFolder,
        filePath,
        nodeId: node.id,
        fileName: filePath,
        fileType: isFolder ? 'folder' : 'file'
      },
      !isFolder && filePath ? {
        command: 'testeranto.openFile',
        title: 'Open File',
        arguments: [{ fileName: filePath }]
      } : undefined,
      icon
    );

    // Set children on the TestTreeItem so getChildren() can return them
    item.children = children;

    // Build comprehensive tooltip
    let tooltip = `${isFolder ? 'Folder' : 'File'}: ${label}\n`;
    tooltip += `Path: ${filePath}\n`;
    tooltip += `ID: ${node.id}\n`;
    
    if (metadata.filePath) {
      tooltip += `File Path: ${metadata.filePath}\n`;
    }
    if (metadata.localPath) {
      tooltip += `Local Path: ${metadata.localPath}\n`;
    }
    if (metadata.url) {
      tooltip += `URL: ${metadata.url}\n`;
    }
    if (metadata.testPath) {
      tooltip += `Test Path: ${metadata.testPath}\n`;
    }
    if (metadata.configKey) {
      tooltip += `Config Key: ${metadata.configKey}\n`;
    }
    if (metadata.runtime) {
      tooltip += `Runtime: ${metadata.runtime}\n`;
    }

    item.tooltip = tooltip;
    return item;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}`);

    // Handle various message types that indicate file data has changed
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/files' || message.url === '/~/graph') {
        console.log('[FileTreeDataProvider] File data changed, refreshing from API');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[FileTreeDataProvider] Graph updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'fileUpdated') {
      console.log('[FileTreeDataProvider] File updated, refreshing from API');
      this.refresh();
    } else if (message.type === 'connected') {
      console.log('[FileTreeDataProvider] WebSocket connected, refreshing data');
      setTimeout(() => this.refresh(), 1000);
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to file updates via WebSocket
    this.subscribeToSlice('/files');
    this.subscribeToSlice('/graph');
  }
}
