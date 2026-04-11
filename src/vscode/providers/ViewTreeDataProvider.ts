import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';

export class ViewTreeDataProvider extends BaseTreeDataProvider {
    private views: any[] = [];

    constructor() {
        super();
        this.loadViews();
    }

    async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
        // If element is provided, it's a view item - show its details
        if (element) {
            return this.getViewDetails(element);
        }

        // Root level - show all views
        return this.getViewItems();
    }

    private async getViewItems(): Promise<TestTreeItem[]> {
        try {
            // Load views from the server - this will fail if server is not running
            await this.loadViews();
            
            if (this.views.length === 0) {
                return [
                    new TestTreeItem(
                        'No views configured',
                        TreeItemType.Info,
                        vscode.TreeItemCollapsibleState.None,
                        { 
                            info: 'Configure views in testeranto.ts'
                        }
                    ),
                    new TestTreeItem(
                        'Refresh views',
                        TreeItemType.Info,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            action: 'refresh',
                            description: 'Click to refresh views'
                        },
                        {
                            command: 'testeranto.refreshViewTree',
                            title: 'Refresh Views'
                        }
                    )
                ];
            }

            return this.views.map(view => {
                const viewKey = view.key || view.id;
                const viewName = view.name || viewKey;
                const viewPath = view.path || view.dataPath;
                
                return new TestTreeItem(
                    viewName,
                    TreeItemType.Config,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        runtimeKey: viewKey,
                        description: viewPath,
                        action: 'openView'
                    },
                    undefined,
                    new vscode.ThemeIcon('eye'),
                    'viewItem'
                );
            });
        } catch (error) {
            console.error('[ViewTreeDataProvider] Error loading views:', error);
            return [
                new TestTreeItem(
                    'Cannot connect to server',
                    TreeItemType.Info,
                    vscode.TreeItemCollapsibleState.None,
                    { 
                        info: 'Testeranto server is not running on port 3000.'
                    }
                ),
                new TestTreeItem(
                    'Start server',
                    TreeItemType.Info,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        action: 'startServer',
                        description: 'Click to start the server'
                    },
                    {
                        command: 'testeranto.startServer',
                        title: 'Start Server'
                    }
                )
            ];
        }
    }

    private async getViewDetails(element: TestTreeItem): Promise<TestTreeItem[]> {
        const viewKey = element.data?.runtimeKey;
        if (!viewKey) {
            return [];
        }

        const view = this.views.find(v => (v.key || v.id) === viewKey);
        if (!view) {
            return [];
        }

        const details: TestTreeItem[] = [];

        // Add view key
        details.push(new TestTreeItem(
            `Key: ${viewKey}`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            { info: viewKey }
        ));

        // Add view name
        if (view.name) {
            details.push(new TestTreeItem(
                `Name: ${view.name}`,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: view.name }
            ));
        }

        // Add data path
        if (view.path || view.dataPath) {
            details.push(new TestTreeItem(
                `Data: ${view.path || view.dataPath}`,
                TreeItemType.Info,
                vscode.TreeItemCollapsibleState.None,
                { info: view.path || view.dataPath }
            ));
        }

        // Add open action
        details.push(new TestTreeItem(
            'Open View',
            TreeItemType.Config,
            vscode.TreeItemCollapsibleState.None,
            {
                runtimeKey: viewKey,
                action: 'openView',
                description: 'Click to open in webview'
            },
            {
                command: 'testeranto.openView',
                title: 'Open View',
                arguments: [viewKey, view.name || viewKey, view.path || view.dataPath]
            },
            new vscode.ThemeIcon('link-external'),
            'viewOpenItem'
        ));

        return details;
    }

    private async loadViews(): Promise<void> {
        try {
            console.log('[ViewTreeDataProvider] Loading views from /~/views endpoint');
            const response = await fetch('http://localhost:3000/~/views', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[ViewTreeDataProvider] Response:', data);
            
            if (data && data.views) {
                this.views = data.views;
                console.log(`[ViewTreeDataProvider] Loaded ${this.views.length} views:`, 
                    this.views.map(v => `${v.key} (${v.name})`).join(', '));
            } else {
                console.warn('[ViewTreeDataProvider] No views found in response');
                this.views = [];
            }
        } catch (error) {
            console.error('[ViewTreeDataProvider] Failed to load views:', error);
            // Re-throw so getViewItems can handle it
            throw error;
        }
    }

    public refresh(): void {
        this.loadViews();
        super.refresh();
    }
}
