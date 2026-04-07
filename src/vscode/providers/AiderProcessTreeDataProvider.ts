import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { AiderGraphLoader } from './utils/AiderGraphLoader';
import { AiderTreeItemCreator } from './utils/AiderTreeItemCreator';
import { AiderDataGrouper } from './utils/AiderDataGrouper';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class AiderProcessTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;
  private agents: any[] = [];

  constructor() {
    super();
    console.log('[AiderProcessTreeDataProvider] Constructor called');
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    const result = await AiderGraphLoader.loadGraphData();
    this.graphData = result.graphData;
    this.agents = result.agents;
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[AiderProcessTreeDataProvider] Error in refresh:', error);
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!this.graphData) {
      this.loadGraphData();
    }

    if (!element) {
      return this.getAiderProcessItems();
    }

    const elementType = element.type;
    const elementData = element.data || {};

    if (elementType === TreeItemType.Runtime) {
      return this.getAiderProcessesForEntrypoint(elementData.entrypointId);
    }

    return [];
  }

  private getAiderProcessItems(): TestTreeItem[] {
    return AiderDataGrouper.getAiderProcessItems(this.graphData, this.agents);
  }

  private getAiderProcessesForEntrypoint(entrypointId: string): TestTreeItem[] {
    if (!this.graphData) return [];
    return AiderDataGrouper.getAiderProcessesForEntrypoint(this.graphData, entrypointId);
  }

  private createAiderProcessItem(node: GraphNode, entrypointNode?: GraphNode): TestTreeItem {
    return AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode);
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[AiderProcessTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);

    if (message.type === 'resourceChanged') {
      if (message.url === '/~/aider' || message.url === '/~/agents' || message.url === '/~/graph') {
        console.log('[AiderProcessTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[AiderProcessTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    this.subscribeToSlice('/aider');
    this.subscribeToSlice('/agents');
    this.subscribeToSlice('/graph');
  }
}
