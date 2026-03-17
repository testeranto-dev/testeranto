import * as vscode from "vscode";
import { TestTreeItem } from "../TestTreeItem";
import { TreeItemType } from "../types";
import { BaseTreeDataProvider } from "./BaseTreeDataProvider";

export class FeaturesTreeDataProvider extends BaseTreeDataProvider {
    private allFilesTree: Record<string, any> = {};
    
    constructor() {
        super();
        this.loadAllFiles();
    }

    refresh(): void {
        this.loadAllFiles();
        super.refresh();
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        
        const data = element.data as any;
        if (data?.filePath) {
            return Promise.resolve(this.getFileChildren(data.filePath));
        }
        
        return Promise.resolve([]);
    }

    private async loadAllFiles(): Promise<void> {
        try {
            // Fetch all file types from HTTP endpoints
            const [docs, inputs, results, reports] = await Promise.all([
                this.fetchDocumentationFiles(),
                this.fetchInputFiles(),
                this.fetchTestResultFiles(),
                this.fetchReportFiles()
            ]);
            
            // Merge all trees into one
            this.allFilesTree = this.mergeTrees([docs, inputs, results, reports]);
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error('[FeaturesTreeDataProvider] Error loading files:', error);
        }
    }

    private async fetchDocumentationFiles(): Promise<Record<string, any>> {
        try {
            const response = await fetch('http://localhost:3000/~/collated-documentation');
            const data = await response.json();
            return data.tree || {};
        } catch (error) {
            console.error('[FeaturesTreeDataProvider] Error fetching documentation:', error);
            return {};
        }
    }

    private async fetchInputFiles(): Promise<Record<string, any>> {
        try {
            const response = await fetch('http://localhost:3000/~/collated-inputfiles');
            const data = await response.json();
            return data.fsTree || {};
        } catch (error) {
            console.error('[FeaturesTreeDataProvider] Error fetching input files:', error);
            return {};
        }
    }

    private async fetchTestResultFiles(): Promise<Record<string, any>> {
        try {
            const response = await fetch('http://localhost:3000/~/collated-testresults');
            const data = await response.json();
            return this.extractFilesFromTestResults(data.collatedTestResults || {});
        } catch (error) {
            console.error('[FeaturesTreeDataProvider] Error fetching test results:', error);
            return {};
        }
    }

    private async fetchReportFiles(): Promise<Record<string, any>> {
        try {
            const response = await fetch('http://localhost:3000/~/reports');
            const data = await response.json();
            return data.tree || {};
        } catch (error) {
            console.error('[FeaturesTreeDataProvider] Error fetching reports:', error);
            return {};
        }
    }

    private extractFilesFromTestResults(testResults: any): Record<string, any> {
        const tree: Record<string, any> = {};
        
        for (const [configKey, configData] of Object.entries(testResults)) {
            const configInfo = configData as any;
            const files = configInfo.files || [];
            
            for (const file of files) {
                // Add file to tree
                const parts = file.path.split('/').filter((p: string) => p.length > 0);
                let currentNode = tree;
                
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isLast = i === parts.length - 1;
                    
                    if (!currentNode[part]) {
                        currentNode[part] = isLast 
                            ? { type: 'file', path: file.path, isJson: file.isJson }
                            : { type: 'directory', children: {} };
                    }
                    
                    if (!isLast && currentNode[part].type === 'directory') {
                        currentNode = currentNode[part].children;
                    }
                }
            }
        }
        
        return tree;
    }

    private mergeTrees(trees: Record<string, any>[]): Record<string, any> {
        const merged: Record<string, any> = {};
        
        for (const tree of trees) {
            this.mergeNode(merged, tree);
        }
        
        return merged;
    }

    private mergeNode(target: Record<string, any>, source: Record<string, any>): void {
        for (const [key, sourceNode] of Object.entries(source)) {
            if (!target[key]) {
                target[key] = { ...sourceNode };
                if (sourceNode.children) {
                    target[key].children = {};
                }
            } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
                // Merge children
                if (sourceNode.children) {
                    if (!target[key].children) {
                        target[key].children = {};
                    }
                    this.mergeNode(target[key].children, sourceNode.children);
                }
            }
            // If both are files, keep the first one (don't overwrite)
        }
    }

    private getRootItems(): TestTreeItem[] {
        if (Object.keys(this.allFilesTree).length === 0) {
            return [
                new TestTreeItem(
                    'Loading files...',
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    { description: 'Fetching all files from server' },
                    undefined,
                    new vscode.ThemeIcon('loading')
                )
            ];
        }
        
        return this.buildTreeItemsFromNode(this.allFilesTree, '');
    }

    private getFileChildren(filePath: string): TestTreeItem[] {
        const parts = filePath.split('/').filter(part => part.length > 0);
        let currentNode = this.allFilesTree;
        
        for (const part of parts) {
            if (currentNode[part] && currentNode[part].type === 'directory') {
                currentNode = currentNode[part].children;
            } else {
                return [];
            }
        }
        
        return this.buildTreeItemsFromNode(currentNode, filePath);
    }

    private buildTreeItemsFromNode(node: Record<string, any>, parentPath: string): TestTreeItem[] {
        const items: TestTreeItem[] = [];
        
        const keys = Object.keys(node).sort((a, b) => {
            const aNode = node[a];
            const bNode = node[b];
            
            // Directories first, then files
            if (aNode.type === 'directory' && bNode.type !== 'directory') return -1;
            if (aNode.type !== 'directory' && bNode.type === 'directory') return 1;
            return a.localeCompare(b);
        });
        
        for (const key of keys) {
            const nodeData = node[key];
            const isDirectory = nodeData.type === 'directory';
            const collapsibleState = isDirectory 
                ? vscode.TreeItemCollapsibleState.Collapsed 
                : vscode.TreeItemCollapsibleState.None;
            
            const fullPath = parentPath ? `${parentPath}/${key}` : key;
            
            let icon: vscode.ThemeIcon;
            let description = '';
            
            if (isDirectory) {
                icon = new vscode.ThemeIcon('folder');
                description = 'Directory';
            } else {
                // Determine icon based on file type
                if (nodeData.isJson) {
                    icon = new vscode.ThemeIcon('json');
                    description = 'JSON file';
                } else if (nodeData.path?.endsWith('.md')) {
                    icon = new vscode.ThemeIcon('markdown');
                    description = 'Documentation';
                } else if (nodeData.path?.endsWith('.html')) {
                    icon = new vscode.ThemeIcon('globe');
                    description = 'HTML report';
                } else {
                    icon = new vscode.ThemeIcon('file');
                    description = 'File';
                }
            }
            
            let command: vscode.Command | undefined;
            if (!isDirectory && nodeData.path) {
                // Create command to open file
                command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(nodeData.path)]
                };
            }
            
            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    collapsibleState,
                    {
                        filePath: fullPath,
                        originalPath: nodeData.path,
                        isFile: !isDirectory,
                        description: description
                    },
                    command,
                    icon
                )
            );
        }
        
        return items;
    }

    protected handleWebSocketMessage(message: any): void {
        if (message.type === 'resourceChanged') {
            this.loadAllFiles();
        }
    }
}
