import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import type { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';
import type { TreeNode } from './buildTreeFromPaths';


export function buildTreeItemsFromNode(node: TreeNode, context: string): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const sortedChildren = Array.from(node.children.values()).sort((a: any, b: any) => {
        if (!a.isFile && b.isFile) return -1;
        if (a.isFile && !b.isFile) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const child of sortedChildren) {
        const collapsibleState = child.isFile
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed;

        let command: vscode.Command | undefined;
        if (child.isFile && child.originalPath) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const cwd = process.cwd();

                let fullPath: string;
                if (path.isAbsolute(child.originalPath)) {
                    fullPath = child.originalPath;
                } else {
                    fullPath = path.join(workspaceRoot, child.originalPath);
                    if (!fs.existsSync(fullPath)) {
                        fullPath = path.join(cwd, child.originalPath);
                    }
                }

                command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(fullPath)]
                };
            }
        }

        const treeItem = new TestTreeItem(
            child.name,
            TreeItemType.File,
            collapsibleState,
            {
                filePath: child.fullPath,
                originalPath: child.originalPath,
                isFile: child.isFile,
                context: context,
                description: child.isFile ? path.dirname(child.originalPath || '') : ''
            },
            command,
            child.isFile ? new vscode.ThemeIcon('markdown') : new vscode.ThemeIcon('folder')
        );

        items.push(treeItem);
    }

    return items;
}
