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
            return;
        }

        if (this.ws) {
            this.ws.close();
        }

        // Use the same base URL as HTTP, but with ws:// protocol
        const wsUrl = ApiUtils.getWebSocketUrl();
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.isConnected = true;
            this._onDidChangeTreeData.fire();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onerror = () => {
            this.isConnected = false;
            this._onDidChangeTreeData.fire();
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.ws = null;
            this._onDidChangeTreeData.fire();
        };
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
