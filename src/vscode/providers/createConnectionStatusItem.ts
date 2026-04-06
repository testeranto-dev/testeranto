import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function createConnectionStatusItem(provider: any): TestTreeItem {
    const isConnected = provider.isConnected;
    const description = isConnected ? 'WebSocket connected' : 'WebSocket disconnected';
    const icon = isConnected ?
      new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('testing.iconPassed')) :
      new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('testing.iconFailed'));

    return new TestTreeItem(
      'Connection Status',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: description,
        connected: isConnected,
        disconnected: !isConnected
      },
      {
        command: 'testeranto.retryConnection',
        title: 'Retry Connection',
        arguments: [provider]
      },
      icon
    );
}
