import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function getReportItems(): TestTreeItem[] {
    return [
        new TestTreeItem(
            'Generate HTML Report',
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
                description: 'Create static report for stakeholders'
            },
            {
                command: 'testeranto.generateHtmlReport',
                title: 'Generate Report'
            },
            new vscode.ThemeIcon('file-code')
        )
    ];
}
