import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import type { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';

export function buildTreeItemsFromCollatedTree(
    tree: Record<string, any>,
    context: string,
    parentPath: string = ''
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const keys = Object.keys(tree).sort((a, b) => {
        const aIsDir = tree[a].type === 'directory';
        const bIsDir = tree[b].type === 'directory';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of keys) {
        const node = tree[key];
        const isFile = node.type === 'file';
        const collapsibleState = isFile
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed;

        let command: vscode.Command | undefined;
        if (isFile && node.path) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const cwd = process.cwd();

                let fullPath: string;
                if (path.isAbsolute(node.path)) {
                    fullPath = node.path;
                } else {
                    fullPath = path.join(workspaceRoot, node.path);
                    if (!fs.existsSync(fullPath)) {
                        fullPath = path.join(cwd, node.path);
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
            key,
            TreeItemType.File,
            collapsibleState,
            {
                filePath: parentPath ? `${parentPath}/${key}` : key,
                originalPath: node.path,
                isFile: isFile,
                context: context,
                description: isFile ? path.dirname(node.path || '') : ''
            },
            command,
            isFile ? new vscode.ThemeIcon('markdown') : new vscode.ThemeIcon('folder')
        );

        items.push(treeItem);
    }

    return items;
}
