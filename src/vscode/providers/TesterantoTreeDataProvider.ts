import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TesterantoTreeDataProviderUtils } from './TesterantoTreeDataProviderUtils';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

export class TesterantoTreeDataProvider extends BaseTreeDataProvider {
    constructor() {
        super();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            TesterantoTreeDataProviderUtils.loadInitialData().then(() => {
                this.refresh();
            });
        }
        this.setupWorkspaceWatcher();
    }

    refresh(): void {
        TesterantoTreeDataProviderUtils.loadInitialData().then(() => {
            super.refresh();
        });
    }

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
        return Promise.resolve(
            TesterantoTreeDataProviderUtils.getChildrenForElement(element)
        );
    }

    protected handleWebSocketMessage(message: any): void {
        if (message.type === 'resourceChanged') {
            TesterantoTreeDataProviderUtils.loadInitialData().then(() => {
                this.refresh();
            });
        }
    }

    public dispose(): void {
        super.dispose();
    }

    private setupWorkspaceWatcher(): void {
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            if (event.added.length > 0) {
                TesterantoTreeDataProviderUtils.loadInitialData().then(() => {
                    this.refresh();
                });
                this.setupWebSocket();
            } else if (event.removed.length > 0) {
                TesterantoTreeDataProviderUtils.clearData();
                this._onDidChangeTreeData.fire();
            }
        });
    }
}
