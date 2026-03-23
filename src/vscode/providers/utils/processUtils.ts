import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function getProcessItems(processes: any[]): TestTreeItem[] {
    if (processes.length === 0) {
        return [
            new TestTreeItem(
                'No Docker processes found',
                TreeItemType.File,
                vscode.TreeItemCollapsibleState.None,
                {
                    description: 'Start the Testeranto server'
                },
                undefined,
                new vscode.ThemeIcon('info')
            )
        ];
    }

    return processes.map(process => {
        const isActive = process.isActive === true;
        return new TestTreeItem(
            process.name || process.containerId,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
                processId: process.containerId,
                status: process.status,
                isActive: isActive,
                runtime: process.runtime,
                description: `${process.status} - ${process.runtime}`
            },
            undefined,
            isActive ?
                new vscode.ThemeIcon('play', new vscode.ThemeColor('testing.iconPassed')) :
                new vscode.ThemeIcon('stop', new vscode.ThemeColor('testing.iconFailed'))
        );
    });
}
