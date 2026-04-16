// Deprecated
// export interface GraphNode {
//   id: string;
//   type: string;
//   label: string;
//   description?: string;
//   metadata?: Record<string, any>;
// }

// export interface GraphEdge {
//   source: string;
//   target: string;
//   attributes: {
//     type: string;
//   };
// }

// export interface GraphData {
//   nodes: GraphNode[];
//   edges: GraphEdge[];
// }

// export class FileTreeLogic {
//   private graphData: GraphData | null = null;

//   setGraphData(data: GraphData | null): void {
//     this.graphData = data;
//   }

//   getGraphData(): GraphData | null {
//     return this.graphData;
//   }

//   hasGraphData(): boolean {
//     return this.graphData !== null;
//   }

//   filterFolderNodes(graphData: GraphData): GraphNode[] {
//     return graphData.nodes.filter(node =>
//       node.type === 'folder' || node.type === 'domain'
//     );
//   }

//   filterFileNodes(graphData: GraphData): GraphNode[] {
//     return graphData.nodes.filter(node =>
//       node.type === 'file' || node.type === 'input_file'
//     );
//   }

//   filterFolderNodesByPath(graphData: GraphData, folderPath: string): GraphNode[] {
//     return graphData.nodes.filter(node =>
//       (node.type === 'folder' || node.type === 'domain') &&
//       (
//         node.metadata?.path === folderPath || 
//         node.metadata?.path === '/' + folderPath ||
//         node.metadata?.path?.startsWith(folderPath + '/') ||
//         node.metadata?.path?.startsWith('/' + folderPath + '/')
//       )
//     );
//   }

//   filterFileNodesByPath(graphData: GraphData, folderPath: string): GraphNode[] {
//     return graphData.nodes.filter(node =>
//       (node.type === 'file' || node.type === 'input_file') &&
//       (
//         node.metadata?.filePath?.startsWith(folderPath + '/') ||
//         node.metadata?.filePath?.startsWith('/' + folderPath + '/')
//       )
//     );
//   }

//   getFolderName(folder: GraphNode): string {
//     const path = folder.metadata?.path || '';
//     const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
//     return folder.label || this.basename(normalizedPath);
//   }

//   getFileName(file: GraphNode): string {
//     const path = file.metadata?.filePath || file.label || '';
//     const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
//     return this.basename(normalizedPath);
//   }

//   buildTreeStructure(folderNodes: GraphNode[], fileNodes: GraphNode[]): any {
//     const tree: any = {
//       type: 'root',
//       children: {}
//     };

//     // Helper to normalize path (remove leading slash and handle empty paths)
//     const normalizePath = (path: string): string => {
//       if (!path) return '';
//       return path.startsWith('/') ? path.substring(1) : path;
//     };

//     // First, add all folder nodes to the tree
//     for (const folder of folderNodes) {
//       const folderPath = normalizePath(folder.metadata?.path || '');
//       if (!folderPath) continue;
      
//       const parts = folderPath.split('/').filter(p => p.length > 0);
//       let current = tree.children;
      
//       for (let i = 0; i < parts.length; i++) {
//         const part = parts[i];
//         const isLast = i === parts.length - 1;
        
//         if (!current[part]) {
//           current[part] = {
//             type: 'folder',
//             node: folder,
//             path: folderPath,
//             name: part,
//             children: {}
//           };
//         } else if (isLast) {
//           // Update existing folder node
//           current[part].node = folder;
//           current[part].path = folderPath;
//         }
        
//         if (!isLast) {
//           current = current[part].children;
//         }
//       }
//     }

//     // Then, add all file nodes to the tree
//     for (const file of fileNodes) {
//       const filePath = normalizePath(file.metadata?.filePath || '');
//       if (!filePath) continue;
      
//       const parts = filePath.split('/').filter(p => p.length > 0);
//       if (parts.length === 0) continue;
      
//       const fileName = parts[parts.length - 1];
//       const dirParts = parts.slice(0, parts.length - 1);
      
//       // Find or create the directory structure
//       let current = tree.children;
//       for (const part of dirParts) {
//         if (!current[part]) {
//           // Create a placeholder folder if it doesn't exist
//           current[part] = {
//             type: 'folder',
//             path: dirParts.slice(0, dirParts.indexOf(part) + 1).join('/'),
//             name: part,
//             children: {}
//           };
//         }
//         current = current[part].children;
//       }
      
//       // Add the file
//       current[fileName] = {
//         type: 'file',
//         node: file,
//         path: filePath,
//         name: fileName
//       };
//     }

//     return tree;
//   }

//   countFilesInTree(node: any): number {
//     let count = 0;

//     for (const [childName, childNode] of Object.entries(node.children || {})) {
//       const typedChild = childNode as any;
//       if (typedChild.type === 'file') {
//         count++;
//       } else if (typedChild.type === 'folder') {
//         count += this.countFilesInTree(typedChild);
//       }
//     }

//     return count;
//   }

//   getFileIcon(fileNode: any): any {
//     const fileType = fileNode.metadata?.fileType || fileNode.type;

//     switch (fileType) {
//       case 'input_file':
//       case 'source':
//         return { id: 'file-code' };
//       case 'log':
//         return { id: 'output' };
//       case 'documentation':
//         return { id: 'book' };
//       case 'config':
//         return { id: 'settings-gear' };
//       default:
//         return { id: 'file' };
//     }
//   }

//   private basename(path: string): string {
//     // Handle both paths with and without leading slashes
//     const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
//     const parts = normalizedPath.split('/').filter(p => p.length > 0);
//     return parts.length > 0 ? parts[parts.length - 1] : '';
//   }

//   private dirname(path: string): string {
//     // Handle both paths with and without leading slashes
//     const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
//     const parts = normalizedPath.split('/').filter(p => p.length > 0);
//     if (parts.length <= 1) return '';
//     return parts.slice(0, parts.length - 1).join('/');
//   }
// }
