import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { ApiUtils } from './utils/apiUtils';

export abstract class BaseTreeDataProvider implements vscode.TreeDataProvider<TestTreeItem> {
    protected _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | null | void> = 
        new vscode.EventEmitter<TestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    protected ws: WebSocket | null = null;
    protected isConnected: boolean = false;

    constructor() {
        this.setupWebSocket();
    }

    abstract getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]>;

    getTreeItem(element: TestTreeItem): vscode.TreeItem {
        return element;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    protected setupWebSocket(): void {
        // Don't create WebSocket if we're not in a browser-like environment
        if (typeof WebSocket === 'undefined') {
            console.log('[BaseTreeDataProvider] WebSocket not available in this environment');
            return;
        }

        if (this.ws) {
            this.ws.close();
        }

        try {
            // Use the same base URL as HTTP, but with ws:// protocol
            const wsUrl = ApiUtils.getWebSocketUrl();
            console.log(`[BaseTreeDataProvider] Attempting to connect to WebSocket at ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[BaseTreeDataProvider] WebSocket connection established');
                this.isConnected = true;
                this._onDidChangeTreeData.fire();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('[BaseTreeDataProvider] WebSocket message received:', message.type);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('[BaseTreeDataProvider] Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[BaseTreeDataProvider] WebSocket error:', error);
                this.isConnected = false;
                this._onDidChangeTreeData.fire();
            };

            this.ws.onclose = (event) => {
                console.log(`[BaseTreeDataProvider] WebSocket closed: code=${event.code}, reason=${event.reason}`);
                this.isConnected = false;
                this.ws = null;
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    console.log('[BaseTreeDataProvider] Attempting to reconnect WebSocket...');
                    this.setupWebSocket();
                }, 5000);
                this._onDidChangeTreeData.fire();
            };
        } catch (error) {
            console.error('[BaseTreeDataProvider] Error setting up WebSocket:', error);
            this.isConnected = false;
        }
    }

    protected handleWebSocketMessage(message: any): void {
        // Base implementation - can be overridden by subclasses
        if (message.type === 'resourceChanged') {
            this.refresh();
        }
    }

    public dispose(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
