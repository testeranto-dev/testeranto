import * as vscode from 'vscode';
import type { TestTreeItem } from '../../TestTreeItem';
import type { TreeItemType } from '../../types';


export function buildTreeItemsFromTestResultsTreeForConfig(
    tree: Record<string, any>,
    configKey: string
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const keys = Object.keys(tree).sort((a, b) => {
        const aNode = tree[a];
        const bNode = tree[b];

        const aIsDir = aNode.type === 'directory';
        const bIsDir = bNode.type === 'directory';

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of keys) {
        const node = tree[key];

        if (node.type === 'directory') {
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
            const description = `${node.passed} passed, ${node.failed} failed (${node.total} total)`;
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
                        results: node.results
                    },
                    undefined,
                    icon
                )
            );
        }
    }

    return items;
}
