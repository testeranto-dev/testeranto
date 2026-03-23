import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { buildTreeFromPaths } from './buildTreeFromPaths';
import { buildTreeItemsFromNode } from './buildTreeItemsFromNode';

export function getTestInputTestItems(
    runtime: string,
    testName: string,
    testInputFiles: Map<string, any[]>
): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    const testEntries = testInputFiles.get(runtime);

    if (!testEntries) {
        return items;
    }

    const entry = testEntries.find(e => e.testName === testName);
    if (!entry || entry.files.length === 0) {
        items.push(
            new TestTreeItem(
                'No files found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'This test has no input files'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        );
        return items;
    }

    const treeRoot = buildTreeFromPaths(entry.files);
    return buildTreeItemsFromNode(treeRoot, 'test-input');
}
