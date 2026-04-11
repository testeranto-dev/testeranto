import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

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

            // If no views loaded from server, use default views
            if (this.views.length === 0) {
                // Default views based on common configuration
                const defaultViewKeys = ['Kanban', 'Gantt', 'Eisenhower'];
                this.views = defaultViewKeys.map(key => ({
                    key,
                    name: key,
                    url: `http://localhost:3000/testeranto/views/${key}.html`
                }));
            }

            return this.views.map(view => {
                const viewKey = view.key || view.id;
                const viewName = view.name || viewKey;

                return new TestTreeItem(
                    viewName,
                    TreeItemType.Config,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        runtimeKey: viewKey,
                        description: `Open ${viewName} view`,
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

        // Add open action
        // Views are always at http://localhost:3000/testeranto/views/{viewKey}.html
        const viewUrl = `http://localhost:3000/testeranto/views/${viewKey}.html`;
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
                arguments: [viewKey, viewUrl]
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
                // Process views from server
                this.views = data.views.map((view: any) => {
                    const viewKey = view.key || view.id;
                    // Ensure URL is correct
                    let viewUrl = view.url;
                    if (!viewUrl) {
                        viewUrl = `http://localhost:3000/testeranto/views/${viewKey}.html`;
                    } else if (viewUrl.includes('/stakeholder/')) {
                        // Fix URLs with /stakeholder/ in them
                        viewUrl = viewUrl.replace('/stakeholder/', '/');
                    }
                    return {
                        key: viewKey,
                        name: view.name || viewKey,
                        url: viewUrl
                    };
                });
                console.log(`[ViewTreeDataProvider] Loaded ${this.views.length} views from server`);
            } else {
                console.warn('[ViewTreeDataProvider] No views found in server response');
                this.views = [];
            }
        } catch (error) {
            console.error('[ViewTreeDataProvider] Failed to load views from server:', error);
            // If we can't load from server, we'll use default views
            this.views = [];
        }
    }

    public refresh(): void {
        this.loadViews();
        super.refresh();
    }
}
