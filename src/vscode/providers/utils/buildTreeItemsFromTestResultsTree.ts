import * as vscode from 'vscode';
import type { TestTreeItem } from '../../TestTreeItem';
import type { TreeItemType } from '../../types';

export function buildTreeItemsFromTestResultsTree(tree: Record<string, any>): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const keys = Object.keys(tree).sort((a, b) => {
        const aNode = tree[a];
        const bNode = tree[b];

        const aIsDir = aNode.type === 'directory' || aNode.type === 'runtime';
        const bIsDir = bNode.type === 'directory' || bNode.type === 'runtime';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of keys) {
        const node = tree[key];

        if (node.type === 'config') {
            let totalPassed = 0;
            let totalFailed = 0;
            let totalTests = 0;

            const calculateStats = (currentNode: any) => {
                if (currentNode.type === 'test') {
                    totalPassed += currentNode.passed || 0;
                    totalFailed += currentNode.failed || 0;
                    totalTests += currentNode.total || 0;
                } else if (currentNode.type === 'directory' && currentNode.children) {
                    for (const childKey in currentNode.children) {
                        calculateStats(currentNode.children[childKey]);
                    }
                }
            };

            for (const childKey in node.children) {
                calculateStats(node.children[childKey]);
            }

            const description = `${totalPassed} passed, ${totalFailed} failed (${totalTests} total)`;
            const icon = totalFailed === 0 ?
                new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
                new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));

            items.push(
                new TestTreeItem(
                    `${key} (${node.runtime})`,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-results-config',
                        configKey: key,
                        runtime: node.runtime,
                        description: description,
                        passed: totalPassed,
                        failed: totalFailed,
                        total: totalTests
                    },
                    undefined,
                    icon
                )
            );
        } else if (node.type === 'directory') {
            items.push(
                new TestTreeItem(
                    key,
                    TreeItemType.File,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        section: 'test-results-directory',
                        path: key,
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
            const description = `${node.isJson ? 'JSON' : 'File'} - ${node.size} bytes`;
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
                        isJson: node.isJson,
                        size: node.size,
                        modified: node.modified,
                        description: description
                    },
                    undefined,
                    icon
                )
            );
        }
    }

    return items;
}
