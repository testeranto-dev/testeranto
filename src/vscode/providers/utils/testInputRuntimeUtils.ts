import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function getTestInputRuntimeItems(
    runtime: string,
    testInputFiles: Map<string, any[]>
): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    const testEntries = testInputFiles.get(runtime);

    if (!testEntries || testEntries.length === 0) {
        items.push(
            new TestTreeItem(
                'No tests found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'This runtime has no tests configured'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        );
        return items;
    }

    for (const entry of testEntries) {
        items.push(
            new TestTreeItem(
                entry.testName,
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                    section: 'test-inputs-test',
                    runtime: runtime,
                    testName: entry.testName,
                    description: `${entry.files.length} files`
                },
                undefined,
                new vscode.ThemeIcon('beaker')
            )
        );
    }

    return items;
}
