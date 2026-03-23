import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function buildTreeItemsFromInputFilesTree(
    tree: Record<string, any>, 
    context: string, 
    parentPath: string = ''
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const keys = Object.keys(tree).sort((a, b) => {
        const aNode = tree[a];
        const bNode = tree[b];

        const aIsArray = Array.isArray(aNode);
        const bIsArray = Array.isArray(bNode);

        if (aIsArray || bIsArray) {
            if (aIsArray && !bIsArray) return 1;
            if (!aIsArray && bIsArray) return -1;
        }

        const aIsDir = !aIsArray && aNode.type === 'directory';
        const bIsDir = !bIsArray && bNode.type === 'directory';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;

        return a.localeCompare(b);
    });

    for (const key of keys) {
        const node = tree[key];

        if (Array.isArray(node)) {
            for (const item of node) {
                const isTest = item.type === 'test';
                const isFile = item.type === 'file';
                const collapsibleState = vscode.TreeItemCollapsibleState.None;

                let description = '';
                if (isTest) {
                    description = `Test (${item.count || 0} input files)`;
                } else if (isFile) {
                    description = `Input file for ${item.testName || 'unknown test'}`;
                }

                const treeItem = new TestTreeItem(
                    key,
                    TreeItemType.File,
                    collapsibleState,
                    {
                        filePath: parentPath ? `${parentPath}/${key}` : key,
                        originalPath: item.path,
                        isFile: true,
                        context: context,
                        description: description,
                        runtime: item.runtime,
                        testName: item.testName,
                        inputFiles: item.inputFiles,
                        count: item.count
                    },
                    undefined,
                    isTest ? new vscode.ThemeIcon('beaker') : new vscode.ThemeIcon('file')
                );
                items.push(treeItem);
            }
            continue;
        }

        const isDir = node.type === 'directory';
        const isTest = node.type === 'test';
        const isFile = node.type === 'file';

        const collapsibleState = isDir
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        let description = '';
        if (isTest) {
            description = `Test (${node.count || 0} input files)`;
        } else if (isFile) {
            description = `Input file for ${node.testName || 'unknown test'}`;
        } else if (isDir) {
            description = 'Directory';
        }

        const treeItem = new TestTreeItem(
            key,
            TreeItemType.File,
            collapsibleState,
            {
                filePath: parentPath ? `${parentPath}/${key}` : key,
                originalPath: node.path,
                isFile: !isDir,
                context: context,
                description: description,
                runtime: node.runtime,
                testName: node.testName,
                inputFiles: node.inputFiles,
                count: node.count
            },
            undefined,
            isTest ? new vscode.ThemeIcon('beaker') :
                isFile ? new vscode.ThemeIcon('file') :
                    new vscode.ThemeIcon('folder')
        );

        items.push(treeItem);
    }

    return items;
}
