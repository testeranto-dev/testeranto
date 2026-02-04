// import * as vscode from 'vscode';
// import * as path from 'path';
// import { TestTreeItem } from '../TestTreeItem';
// import { TreeItemType } from '../types';

// interface TreeNode {
//   name: string;
//   children: Map<string, TreeNode>;
//   fullPath: string;
//   isFile: boolean;
// }

// export class FileTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
//   private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = new
//     vscode.EventEmitter<TestTreeItem | undefined | null | void>();
//   readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

//   refresh(): void {
//     this._onDidChangeTreeData.fire();
//   }

//   getTreeItem(element: TestTreeItem): vscode.TreeItem {
//     return element;
//   }

//   getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
//     if (!element) {
//       return this.getRootItems();
//     } else {
//       const path = element.data?.path;
//       return this.getDirectoryItems(path);
//     }
//   }

//   private async getRootItems(): Promise<TestTreeItem[]> {
//     const tree = await this.buildFileTree();
//     if (!tree) {
//       return [];
//     }
//     return this.buildTreeItems(tree);
//   }

//   private async getDirectoryItems(path?: string): Promise<TestTreeItem[]> {
//     if (!path) {
//       return [];
//     }
//     const tree = await this.buildFileTree();
//     if (!tree) {
//       return [];
//     }

//     // Find the node corresponding to the path
//     const parts = path.split('/').filter(p => p.length > 0);
//     let currentNode = tree;
//     for (const part of parts) {
//       if (currentNode.children.has(part)) {
//         currentNode = currentNode.children.get(part)!;
//       } else {
//         return [];
//       }
//     }

//     return this.buildTreeItems(currentNode);
//   }

//   private async buildFileTree(): Promise<TreeNode | null> {
//     // Get all possible JSON input file patterns
//     const jsonFilePatterns = [
//       "testeranto/bundles/allTests/**/*-inputFiles.json",
//       "testeranto/reports/allTests/**/*.json"
//     ];

//     const allFiles: Set<string> = new Set();
//     const workspaceFolders = vscode.workspace.workspaceFolders;
//     if (!workspaceFolders || workspaceFolders.length === 0) {
//       console.error("No workspace folder open");
//       return null;
//     }
//     const workspaceRoot = workspaceFolders[0].uri;

//     // Use findFiles to get all matching JSON files
//     for (const pattern of jsonFilePatterns) {
//       try {
//         const files = await vscode.workspace.findFiles(pattern, null, 1000);
//         for (const file of files) {
//           // Convert URI to relative path
//           const relativePath = path.relative(workspaceRoot.fsPath, file.fsPath);
          
//           if (file.fsPath.includes('-inputFiles.json')) {
//             // Read the JSON file to get the list of files
//             try {
//               const fileContent = await vscode.workspace.fs.readFile(file);
//               const filesList: string[] = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
//               filesList.forEach(filePath => {
//                 // Make sure file paths are relative to workspace
//                 const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
//                 allFiles.add(normalizedPath);
//               });
//             } catch (error) {
//               console.error(`Failed to read JSON file ${file.fsPath}:`, error);
//             }
//           } else {
//             // Add the report file itself
//             allFiles.add(relativePath);
//           }
//         }
//       } catch (error) {
//         console.error(`Failed to find files with pattern ${pattern}:`, error);
//       }
//     }

//     // Also add the JSON input files themselves
//     try {
//       const inputFiles = await vscode.workspace.findFiles("testeranto/bundles/allTests/**/*-inputFiles.json", null, 1000);
//       for (const file of inputFiles) {
//         const relativePath = path.relative(workspaceRoot.fsPath, file.fsPath);
//         allFiles.add(relativePath);
//       }
//     } catch (error) {
//       console.error("Failed to add input files themselves:", error);
//     }

//     // Build tree structure
//     const treeRoot: TreeNode = { name: '', children: new Map(), fullPath: '', isFile: false };

//     for (const rawFileName of Array.from(allFiles)) {
//       // Skip empty paths
//       if (!rawFileName || rawFileName.trim().length === 0) {
//         continue;
//       }
      
//       // Remove leading '/' if present
//       const fileName = rawFileName.startsWith('/') ? rawFileName.substring(1) : rawFileName;
//       const parts = fileName.split('/');
//       let currentNode = treeRoot;

//       for (let i = 0; i < parts.length; i++) {
//         const part = parts[i];
//         // Skip empty parts
//         if (!part || part.trim().length === 0) {
//           continue;
//         }
//         const isLast = i === parts.length - 1;

//         if (!currentNode.children.has(part)) {
//           currentNode.children.set(part, {
//             name: part,
//             children: new Map(),
//             fullPath: parts.slice(0, i + 1).join('/'),
//             isFile: isLast
//           });
//         }
//         currentNode = currentNode.children.get(part)!;
//       }
//     }

//     return treeRoot;
//   }

//   private buildTreeItems(node: TreeNode): TestTreeItem[] {
//     const items: TestTreeItem[] = [];

//     // Sort children: directories first, then files, alphabetically
//     const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
//       if (a.isFile && !b.isFile) return 1;
//       if (!a.isFile && b.isFile) return -1;
//       return a.name.localeCompare(b.name);
//     });

//     for (const child of sortedChildren) {
//       const collapsibleState = child.isFile
//         ? vscode.TreeItemCollapsibleState.None
//         : vscode.TreeItemCollapsibleState.Collapsed;

//       const treeItem = new TestTreeItem(
//         child.name,
//         TreeItemType.File,
//         collapsibleState,
//         {
//           path: child.fullPath,
//           fileName: child.fullPath
//         },
//         child.isFile ? {
//           command: "vscode.open",
//           title: "Open File",
//           arguments: [vscode.Uri.file(child.fullPath)]
//         } : undefined,
//         child.isFile ? new vscode.ThemeIcon("file") : new vscode.ThemeIcon("folder")
//       );

//       items.push(treeItem);
//     }

//     return items;
//   }
// }
