import * as vscode from 'vscode';
import { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';

export function buildTreeItemsFromTestResultsTreeForConfig(
    tree: Record<string, any>,
    configKey: string
): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    const configNode = tree[configKey];

    if (!configNode) {
        return items;
    }

    const children = configNode.children || {};
    const childKeys = Object.keys(children).sort((a, b) => {
        const aNode = children[a];
        const bNode = children[b];
        const aIsDir = aNode.type === 'directory';
        const bIsDir = bNode.type === 'directory';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of childKeys) {
        const node = children[key];

        if (node.type === 'directory') {
            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-results-directory',
                        path: key,
                        parentRuntime: configKey,
                        description: 'Directory'
                    },
                    undefined,
                    new vscode.ThemeIcon('folder')
                )
            );
        } else if (node.type === 'test') {
            const description = `${node.passed} passed, ${node.failed} failed (${node.total} total) - ${node.fileCount || 0} files`;
            const icon = node.failed === 0 ?
                new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        testName: node.fullPath,
                        runtime: node.runtime,
                        description: description,
                        passed: node.passed,
                        failed: node.failed,
                        total: node.total,
                        results: node.results,
                        files: node.files,
                        fileCount: node.fileCount || 0
                    },
                    undefined,
                    icon
                )
            );
        } else if (node.type === 'file') {
            // const description = `${node.isJson ? 'JSON' : 'File'} - ${node.size} bytes`;
            const icon = node.isJson ?
                new vscode.ThemeIcon('json') :
                new vscode.ThemeIcon('file');

            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        fileName: node.name,
                        filePath: node.path,
                        // isJson: node.isJson,
                        // size: node.size,
                        // modified: node.modified,
                        description: node.description
                    },
                    undefined,
                    icon
                )
            );
        }
    }

    return items;
}
