import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { buildTreeItemsFromInputFilesTree } from './buildTreeItemsFromInputFilesTree';

export function getTestInputItems(
    testInputFiles: Map<string, any[]>,
    inputFilesTree: Record<string, any>
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    if (testInputFiles.size === 0) {
        items.push(
            new TestTreeItem(
                'No test input files found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Run tests to generate input files'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        );
        return items;
    }

    if (Object.keys(inputFilesTree).length > 0) {
        return buildTreeItemsFromInputFilesTree(inputFilesTree, 'test-inputs');
    }

    for (const [runtime, testEntries] of testInputFiles.entries()) {
        let totalFiles = 0;
        for (const entry of testEntries) {
            totalFiles += entry.files.length;
        }

        items.push(
            new TestTreeItem(
                runtime,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'test-inputs-runtime',
                    runtime: runtime,
                    description: `${testEntries.length} tests, ${totalFiles} files`
                },
                undefined,
                new vscode.ThemeIcon('symbol-namespace')
            )
        );
    }

    return items;
}
