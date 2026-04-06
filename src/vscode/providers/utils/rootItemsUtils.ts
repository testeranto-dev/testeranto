import * as vscode from 'vscode';
import { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';


export function getRootItems(
    documentationFiles: string[],
    documentationTree: Record<string, any>,
    testInputFiles: Map<string, any[]>,
    inputFilesTree: Record<string, any>,
    testResults: Map<string, any[]>,
    collatedTestResults: Record<string, any>,
    processes: any[]
): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    // Documentation section
    items.push(
        new TestTreeItem(
            'Documentation',
            TreeItemType.Section,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'documentation',
                description: `${documentationFiles.length} files`
            },
            undefined,
            new vscode.ThemeIcon('book')
        )
    );

    // Test Inputs section
    items.push(
        new TestTreeItem(
            'Test Inputs',
            TreeItemType.Section,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'test-inputs',
                description: `${testInputFiles.size} runtimes`
            },
            undefined,
            new vscode.ThemeIcon('beaker')
        )
    );

    // Test Results section
    items.push(
        new TestTreeItem(
            'Test Results',
            TreeItemType.Section,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'test-results',
                description: `${Object.keys(collatedTestResults).length} configs`
            },
            undefined,
            new vscode.ThemeIcon('checklist')
        )
    );

    // Processes section
    items.push(
        new TestTreeItem(
            'Processes',
            TreeItemType.Section,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'processes',
                description: `${processes.length} processes`
            },
            undefined,
            new vscode.ThemeIcon('server-process')
        )
    );

    return items;
}
