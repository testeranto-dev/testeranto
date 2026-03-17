import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

export class HtmlReportProvider extends BaseTreeDataProvider {
    constructor() {
        super();
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getReportItems());
        }
        return Promise.resolve([]);
    }

    private getReportItems(): TestTreeItem[] {
        return [
            new TestTreeItem(
                '🌐 Generate & View Report',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Create and open HTML report for stakeholders',
                    action: 'generate-report'
                },
                {
                    command: 'testeranto.generateHtmlReport',
                    title: 'Generate HTML Report'
                },
                new vscode.ThemeIcon('globe')
            ),
            new TestTreeItem(
                '📊 Report Preview',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Documentation + Test Results (no source code)'
                },
                undefined,
                new vscode.ThemeIcon('preview')
            ),
            new TestTreeItem(
                '🎯 Stakeholder Focused',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Business-facing, no implementation details'
                },
                undefined,
                new vscode.ThemeIcon('eye')
            ),
            new TestTreeItem(
                '📁 Static HTML File',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Can be checked into git and hosted on GitHub'
                },
                undefined,
                new vscode.ThemeIcon('file-code')
            ),
            new TestTreeItem(
                '🔄 Auto-refresh',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Updates when tests run'
                },
                undefined,
                new vscode.ThemeIcon('refresh')
            )
        ];
    }

    protected handleWebSocketMessage(message: any): void {
        if (message.type === 'resourceChanged') {
            this.refresh();
        }
    }
}
