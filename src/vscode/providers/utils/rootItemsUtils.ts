import * as vscode from 'vscode';
import { TestTreeItem } from '../../TestTreeItem';
import { TreeItemType } from '../../types';

export function getRootItems(
    documentationFiles: string[],
    testResults: Map<string, any[]>,
    processes: any[]
): TestTreeItem[] {
    const items: TestTreeItem[] = [
        new TestTreeItem(
            '📚 Documentation',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'documentation',
                description: `${documentationFiles.length} files`
            },
            undefined,
            new vscode.ThemeIcon('book')
        ),
        new TestTreeItem(
            '🧪 Test Inputs',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'test-inputs',
                description: 'Source files for tests'
            },
            undefined,
            new vscode.ThemeIcon('beaker')
        ),
        new TestTreeItem(
            '📊 Test Results',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'test-results',
                description: `${testResults.size} tests`
            },
            undefined,
            new vscode.ThemeIcon('graph')
        ),
        new TestTreeItem(
            '🐳 Docker Processes',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
                section: 'processes',
                description: `${processes.length} containers`
            },
            undefined,
            new vscode.ThemeIcon('server')
        ),
        new TestTreeItem(
            '🌐 HTML Report',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
                section: 'reports',
                description: 'Static report for stakeholders'
            },
            {
                command: 'testeranto.generateHtmlReport',
                title: 'Generate and Open HTML Report'
            },
            new vscode.ThemeIcon('globe')
        )
    ];

    return items;
}
