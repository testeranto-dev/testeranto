export interface GraphNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class FileTreeLogic {
  private graphData: GraphData | null = null;

  setGraphData(data: GraphData | null): void {
    this.graphData = data;
  }

  getGraphData(): GraphData | null {
    return this.graphData;
  }

  hasGraphData(): boolean {
    return this.graphData !== null;
  }

  filterFolderNodes(graphData: GraphData): GraphNode[] {
    return graphData.nodes.filter(node =>
      node.type === 'folder' || node.type === 'domain'
    );
  }

  filterFileNodes(graphData: GraphData): GraphNode[] {
    return graphData.nodes.filter(node =>
      node.type === 'file' || node.type === 'input_file'
    );
  }

  filterFolderNodesByPath(graphData: GraphData, folderPath: string): GraphNode[] {
    return graphData.nodes.filter(node =>
      (node.type === 'folder' || node.type === 'domain') &&
      (node.metadata?.path === folderPath || node.metadata?.path?.startsWith(folderPath + '/'))
    );
  }

  filterFileNodesByPath(graphData: GraphData, folderPath: string): GraphNode[] {
    return graphData.nodes.filter(node =>
      (node.type === 'file' || node.type === 'input_file') &&
      (node.metadata?.filePath?.startsWith(folderPath + '/'))
    );
  }

  getFolderName(folder: GraphNode): string {
    return folder.label || this.basename(folder.metadata?.path || '');
  }

  getFileName(file: GraphNode): string {
    return this.basename(file.metadata?.filePath || file.label || '');
  }

  buildTreeStructure(folderNodes: GraphNode[], fileNodes: GraphNode[]): any {
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
      const fileName = this.basename(filePath);
      const dirPath = this.dirname(filePath);

      // Find the folder in the tree
      const parts = dirPath.split('/').filter(p => p.length > 0);
      let current = tree.children;

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

  countFilesInTree(node: any): number {
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

  getFileIcon(fileNode: any): any {
    const fileType = fileNode.metadata?.fileType || fileNode.type;

    switch (fileType) {
      case 'input_file':
      case 'source':
        return { id: 'file-code' };
      case 'log':
        return { id: 'output' };
      case 'documentation':
        return { id: 'book' };
      case 'config':
        return { id: 'settings-gear' };
      default:
        return { id: 'file' };
    }
  }

  private basename(path: string): string {
    const parts = path.split('/').filter(p => p.length > 0);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private dirname(path: string): string {
    const parts = path.split('/').filter(p => p.length > 0);
    if (parts.length <= 1) return '';
    return parts.slice(0, parts.length - 1).join('/');
  }
}
