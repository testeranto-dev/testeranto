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
  description?: string;
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

export class FileTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;
  private graphDataPath: string | null = null;

  constructor() {
    super();
    console.log('[FileTreeDataProvider] Constructor called');
    this.loadGraphData();
  }

  private loadGraphData(): void {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
      
      if (fs.existsSync(this.graphDataPath)) {
        const content = fs.readFileSync(this.graphDataPath, 'utf-8');
        const parsed = JSON.parse(content);
        this.graphData = parsed.data?.unifiedGraph || { nodes: [], edges: [] };
        console.log(`[FileTreeDataProvider] Loaded graph with ${this.graphData.nodes.length} nodes`);
      }
    } catch (error) {
      console.error('[FileTreeDataProvider] Error loading graph data:', error);
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
    if (!this.graphData) return [];

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

    // Get all folder and file nodes
    const folderNodes = this.graphData.nodes.filter(node => 
      node.type === 'folder' || node.type === 'domain'
    );
    
    const fileNodes = this.graphData.nodes.filter(node => 
      node.type === 'file' || node.type === 'input_file'
    );

    console.log(`[FileTreeDataProvider] Found ${folderNodes.length} folders, ${fileNodes.length} files`);

    // Build a tree structure
    const tree = this.buildTreeStructure(folderNodes, fileNodes);
    
    // Convert tree to items
    const rootItems = this.convertTreeToItems(tree);
    items.push(...rootItems);

    return items;
  }

  private buildTreeStructure(folderNodes: GraphNode[], fileNodes: GraphNode[]): any {
    const tree: any = {
      type: 'root',
      children: {}
    };

    // Process folder nodes
    for (const folder of folderNodes) {
      const folderPath = folder.metadata?.path || '';
      const folderName = folder.label || folder.id.replace('folder:', '');
      const isRoot = folder.metadata?.isRoot || folder.id === 'folder:';
      
      if (isRoot) {
        // Root folder
        tree.children[folderName] = {
          type: 'folder',
          node: folder,
          path: folderPath,
          name: folderName,
          children: {}
        };
      } else {
        // Build path hierarchy
        const parts = folderPath.split('/').filter(p => p.length > 0);
        let current = tree.children;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (!current[part]) {
            if (isLast) {
              current[part] = {
                type: 'folder',
                node: folder,
                path: folderPath,
                name: folderName,
                children: {}
              };
            } else {
              current[part] = {
                type: 'folder',
                path: parts.slice(0, i + 1).join('/'),
                name: part,
                children: {}
              };
            }
          }
          
          if (!isLast) {
            current = current[part].children;
          }
        }
      }
    }

    // Process file nodes
    for (const file of fileNodes) {
      const filePath = file.metadata?.filePath || file.label || '';
      const fileName = path.basename(filePath);
      const dirPath = path.dirname(filePath);
      
      // Find the folder in the tree
      const parts = dirPath.split('/').filter(p => p.length > 0);
      let current = tree.children;
      let found = true;
      
      for (const part of parts) {
        if (current[part]) {
          current = current[part].children;
        } else {
          // Folder not in tree, create it
          current[part] = {
            type: 'folder',
            path: dirPath,
            name: part,
            children: {}
          };
          current = current[part].children;
        }
      }
      
      // Add file to current folder
      current[fileName] = {
        type: 'file',
        node: file,
        path: filePath,
        name: fileName
      };
    }

    return tree;
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
            fileCount: this.countFilesInTree(typedNode)
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
          this.getFileIcon(typedNode)
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
    if (!this.graphData) return [];

    // Find files and subfolders that belong to this folder
    const folderNodes = this.graphData.nodes.filter(node => 
      (node.type === 'folder' || node.type === 'domain') &&
      node.metadata?.path?.startsWith(folderPath + '/')
    );
    
    const fileNodes = this.graphData.nodes.filter(node => 
      (node.type === 'file' || node.type === 'input_file') &&
      node.metadata?.filePath?.startsWith(folderPath + '/')
    );

    const items: TestTreeItem[] = [];

    // Add subfolders
    for (const folder of folderNodes) {
      const folderName = folder.label || path.basename(folder.metadata?.path || '');
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
      const fileName = path.basename(file.metadata?.filePath || file.label || '');
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
        this.getFileIcon(file)
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

  private countFilesInTree(node: any): number {
    let count = 0;
    
    for (const [childName, childNode] of Object.entries(node.children || {})) {
      const typedChild = childNode as any;
      if (typedChild.type === 'file') {
        count++;
      } else if (typedChild.type === 'folder') {
        count += this.countFilesInTree(typedChild);
      }
    }
    
    return count;
  }

  private getFileIcon(fileNode: any): vscode.ThemeIcon {
    const fileType = fileNode.metadata?.fileType || fileNode.type;
    
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
    if (message.type === 'graphUpdated') {
      this.refresh();
    }
  }
}
