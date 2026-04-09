import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { FileTreeLogic } from './logic/FileTreeLogic';
import { FileTreeDataFetcher } from './logic/FileTreeDataFetcher';

export class FileTreeDataProvider extends BaseTreeDataProvider {
  private logic: FileTreeLogic;
  private fetcher: FileTreeDataFetcher;

  constructor() {
    super();
    console.log('[FileTreeDataProvider] Constructor called');
    this.fetcher = new FileTreeDataFetcher();
    this.logic = new FileTreeLogic();
    // Load data asynchronously
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      const graphData = await this.fetcher.fetchGraphData();
      this.logic.setGraphData(graphData);
      console.log('[FileTreeDataProvider] Loaded graph data:', graphData?.nodes?.length, 'nodes');
    } catch (error) {
      console.error('[FileTreeDataProvider] Failed to load graph data:', error);
      this.logic.setGraphData(null);
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
    if (!this.logic.hasGraphData()) {
      this.loadGraphData();
    }

    if (!element) {
      // Root level: Show the file system tree
      return this.buildFileSystemTree();
    }

    const elementData = element.data || {};

    // If this is a folder, show its children
    if (elementData.isFolder) {
      return this.getFolderChildren(elementData.folderPath || '', elementData.folderId || '');
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

    // Add server status item
    if (!this.logic.hasGraphData()) {
      items.push(new TestTreeItem(
        'Server not connected',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Click to start server',
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

    const graphData = this.logic.getGraphData();
    if (!graphData) {
      return items;
    }

    const folderNodes = this.logic.filterFolderNodes(graphData);
    const fileNodes = this.logic.filterFileNodes(graphData);

    console.log(`[FileTreeDataProvider] Found ${folderNodes.length} folders, ${fileNodes.length} files`);

    if (folderNodes.length === 0 && fileNodes.length === 0) {
      items.push(new TestTreeItem(
        'No files or folders found',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'No file data in graph'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
      return items;
    }

    // Build a tree structure using pure logic
    const tree = this.logic.buildTreeStructure(folderNodes, fileNodes);

    // Convert tree to items
    const rootItems = this.convertTreeToItems(tree);
    items.push(...rootItems);

    return items;
  }

  private convertTreeToItems(tree: any): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    for (const [name, node] of Object.entries(tree.children || {})) {
      const typedNode = node as any;

      if (typedNode.type === 'folder') {
        const folderItem = new TestTreeItem(
          name,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            isFolder: true,
            folderPath: typedNode.path,
            folderId: typedNode.node?.id,
            description: 'Folder',
            fileCount: this.logic.countFilesInTree(typedNode)
          },
          undefined,
          new vscode.ThemeIcon('folder')
        );

        // Store children for later retrieval
        folderItem.children = this.convertTreeToItems(typedNode);
        items.push(folderItem);
      } else if (typedNode.type === 'file') {
        const fileItem = new TestTreeItem(
          name,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            isFile: true,
            fileName: typedNode.path,
            fileType: typedNode.node?.metadata?.fileType || 'file',
            description: 'File'
          },
          typedNode.path ? {
            command: 'testeranto.openFile',
            title: 'Open File',
            arguments: [{ fileName: typedNode.path }]
          } : undefined,
          this.logic.getFileIcon(typedNode)
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
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  }

  private getFolderChildren(folderPath: string, folderId: string): TestTreeItem[] {
    const graphData = this.logic.getGraphData();
    if (!graphData) return [];

    const folderNodes = this.logic.filterFolderNodesByPath(graphData, folderPath);
    const fileNodes = this.logic.filterFileNodesByPath(graphData, folderPath);

    const items: TestTreeItem[] = [];

    // Add subfolders
    for (const folder of folderNodes) {
      const folderName = this.logic.getFolderName(folder);
      const item = new TestTreeItem(
        folderName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          isFolder: true,
          folderPath: folder.metadata?.path,
          folderId: folder.id,
          description: 'Folder'
        },
        undefined,
        new vscode.ThemeIcon('folder')
      );
      items.push(item);
    }

    // Add files
    for (const file of fileNodes) {
      const fileName = this.logic.getFileName(file);
      const item = new TestTreeItem(
        fileName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          isFile: true,
          fileName: file.metadata?.filePath,
          fileType: file.metadata?.fileType || 'file',
          description: 'File'
        },
        file.metadata?.filePath ? {
          command: 'testeranto.openFile',
          title: 'Open File',
          arguments: [{ fileName: file.metadata.filePath }]
        } : undefined,
        this.logic.getFileIcon(file)
      );
      items.push(item);
    }

    // Sort folders first, then files
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFolder === true;
      const bIsFolder = b.data?.isFolder === true;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[FileTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/files' || message.url === '/~/graph') {
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
    // Subscribe to files slice
    this.subscribeToSlice('/files');
    // Also subscribe to graph for general updates
    this.subscribeToSlice('/graph');
  }
}
