import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import { ApiUtils } from './utils/apiUtils';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  description?: string;
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

export class TestTreeDataProvider extends BaseTreeDataProvider {
  private graphData: GraphData | null = null;
  private graphDataPath: string | null = null;

  constructor() {
    super();
    console.log('[TestTreeDataProvider] Constructor called');
    // Load data asynchronously
    setTimeout(() => {
      this.loadGraphData().then(() => {
        this._onDidChangeTreeData.fire();
      });
    }, 100);
  }

  private async loadGraphData(): Promise<void> {
    try {
      console.log('[TestTreeDataProvider] Loading graph data from runtime slice');
      const response = await fetch(ApiUtils.getRuntimeSliceUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.graphData = data;
      console.log('[TestTreeDataProvider] Loaded graph data:', this.graphData?.nodes?.length, 'nodes');
    } catch (error) {
      console.error('[TestTreeDataProvider] Failed to load graph data:', error);
      this.graphData = null;
    }
  }

  refresh(): void {
    this.loadGraphData().then(() => {
      this._onDidChangeTreeData.fire();
    }).catch(error => {
      console.error('[TestTreeDataProvider] Error in refresh:', error);
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
      // Root level: Show runtimes (config nodes)
      return this.getRuntimeItems();
    }

    const elementType = element.type;
    const elementData = element.data || {};

    switch (elementType) {
      case TreeItemType.Runtime:
        // Runtime level: Show entrypoints for this runtime
        return this.getEntrypointItems(elementData.runtimeKey);
      case TreeItemType.Test:
        // Test level: Show input/output files for this test
        if (elementData.testId) {
          return this.getFileItems(elementData.testId, elementData.runtimeKey);
        }
        // Entrypoint level: Show tests and files for this entrypoint
        return this.getTestItems(elementData.entrypointId, elementData.runtimeKey);
      case TreeItemType.Info:
        // Handle info items (like input/output file folders)
        if (elementData.section === 'input-files' || elementData.section === 'output-files' ||
          elementData.section === 'test-input-files' || elementData.section === 'test-output-files') {
          return element.children || [];
        }
        return [];
      case TreeItemType.File:
        // File items don't have children
        return [];
      default:
        return [];
    }
  }

  private getRuntimeItems(): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find all config nodes (represent runtimes)
    const configNodes = this.graphData.nodes.filter(node =>
      node.type === 'config' || (node.metadata?.configKey && node.metadata?.runtime)
    );

    // Group by runtime
    const runtimeMap = new Map<string, { count: number; nodes: GraphNode[] }>();

    for (const node of configNodes) {
      const runtimeKey = node.metadata?.configKey || node.metadata?.runtime || 'unknown';
      const current = runtimeMap.get(runtimeKey) || { count: 0, nodes: [] };
      current.count++;
      current.nodes.push(node);
      runtimeMap.set(runtimeKey, current);
    }

    const items: TestTreeItem[] = [];

    // Add refresh item
    items.push(new TestTreeItem(
      'Refresh',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Reload graph data',
        refresh: true
      },
      {
        command: 'testeranto.refresh',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    // Add runtime items
    for (const [runtimeKey, data] of runtimeMap.entries()) {
      items.push(new TestTreeItem(
        runtimeKey,
        TreeItemType.Runtime,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          description: `${data.count} config(s)`,
          count: data.count
        },
        undefined,
        new vscode.ThemeIcon('symbol-namespace')
      ));
    }

    return items;
  }

  private getEntrypointItems(runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find entrypoint nodes for this runtime
    const entrypointNodes = this.graphData.nodes.filter(node =>
      node.type === 'entrypoint' &&
      node.metadata?.configKey === runtimeKey
    );

    return entrypointNodes.map(node => {
      return new TestTreeItem(
        node.label || node.id,
        TreeItemType.Test,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId: node.id,
          description: node.description,
          // Mark this as an entrypoint item, not a test item
          isEntrypoint: true
        },
        undefined,
        new vscode.ThemeIcon('file-text')
      );
    });
  }

  private getTestItems(entrypointId: string, runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find test nodes connected to this entrypoint via 'belongsTo' edges
    const testEdges = this.graphData.edges.filter(edge =>
      edge.source === entrypointId &&
      edge.attributes.type === 'belongsTo'
    );

    const testNodes: GraphNode[] = [];
    for (const edge of testEdges) {
      const testNode = this.graphData.nodes.find(node => node.id === edge.target);
      if (testNode && testNode.type === 'test') {
        testNodes.push(testNode);
      }
    }

    // Create a test item for each test
    const testItems = testNodes.map(node => {
      return new TestTreeItem(
        node.label || node.id,
        TreeItemType.Test,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId: node.id,
          entrypointId,
          description: node.description,
          status: node.metadata?.status
        },
        undefined,
        this.getTestIcon(node)
      );
    });

    // Also create input and output file sections directly under the entrypoint
    const fileItems = this.getEntrypointFileItems(entrypointId, runtimeKey);

    // Combine test items and file items
    return [...testItems, ...fileItems];
  }

  private getEntrypointFileItems(entrypointId: string, runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find all file nodes connected to this entrypoint
    const fileEdges = this.graphData.edges.filter(edge =>
      (edge.source === entrypointId || edge.target === entrypointId) &&
      (edge.attributes.type === 'associatedWith' || edge.attributes.type === 'locatedIn')
    );

    const fileNodes: GraphNode[] = [];
    for (const edge of fileEdges) {
      const fileNodeId = edge.source === entrypointId ? edge.target : edge.source;
      const fileNode = this.graphData.nodes.find(node => node.id === fileNodeId);
      if (fileNode && (fileNode.type === 'file' || fileNode.type === 'input_file')) {
        fileNodes.push(fileNode);
      }
    }

    // Group by file type
    const inputFiles: TestTreeItem[] = [];
    const outputFilePaths: { node: GraphNode; path: string }[] = [];

    for (const node of fileNodes) {
      const isInput = node.type === 'input_file' ||
        node.metadata?.isInputFile === true ||
        (node.metadata?.filePath &&
          (node.metadata.filePath.includes('input') ||
            node.metadata.filePath.includes('source')));

      if (isInput) {
        const item = new TestTreeItem(
          node.label || path.basename(node.metadata?.filePath || node.id),
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            entrypointId,
            fileName: node.metadata?.filePath,
            isFile: true,
            fileType: 'input'
          },
          node.metadata?.filePath ? {
            command: 'testeranto.openFile',
            title: 'Open File',
            arguments: [{ fileName: node.metadata.filePath, runtime: runtimeKey }]
          } : undefined,
          new vscode.ThemeIcon('arrow-down')
        );
        inputFiles.push(item);
      } else {
        // For output files, collect their paths
        const filePath = node.metadata?.filePath || node.label || node.id;
        if (filePath) {
          outputFilePaths.push({ node, path: filePath });
        }
      }
    }

    const items: TestTreeItem[] = [];

    if (inputFiles.length > 0) {
      const inputFolder = new TestTreeItem(
        'Input Files',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: 'input-files'
        },
        undefined,
        new vscode.ThemeIcon('folder-opened')
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }

    if (outputFilePaths.length > 0) {
      // Build a tree structure for output files
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        'Output Files',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          entrypointId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: 'output-files'
        },
        undefined,
        new vscode.ThemeIcon('folder-opened')
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, entrypointId);
      items.push(outputFolder);
    }

    return items;
  }

  private getFileItems(testId: string, runtimeKey: string): TestTreeItem[] {
    if (!this.graphData) return [];

    // Find file nodes connected to this test
    const fileEdges = this.graphData.edges.filter(edge =>
      (edge.source === testId || edge.target === testId) &&
      (edge.attributes.type === 'associatedWith' || edge.attributes.type === 'locatedIn')
    );

    const fileNodes: GraphNode[] = [];
    for (const edge of fileEdges) {
      const fileNodeId = edge.source === testId ? edge.target : edge.source;
      const fileNode = this.graphData.nodes.find(node => node.id === fileNodeId);
      if (fileNode && (fileNode.type === 'file' || fileNode.type === 'input_file')) {
        fileNodes.push(fileNode);
      }
    }

    // Group by file type
    const inputFiles: TestTreeItem[] = [];
    const outputFilePaths: { node: GraphNode; path: string }[] = [];

    for (const node of fileNodes) {
      const isInput = node.type === 'input_file' ||
        node.metadata?.isInputFile === true ||
        (node.metadata?.filePath &&
          (node.metadata.filePath.includes('input') ||
            node.metadata.filePath.includes('source')));

      if (isInput) {
        const item = new TestTreeItem(
          node.label || path.basename(node.metadata?.filePath || node.id),
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            testId,
            fileName: node.metadata?.filePath,
            isFile: true,
            fileType: 'input'
          },
          node.metadata?.filePath ? {
            command: 'testeranto.openFile',
            title: 'Open File',
            arguments: [{ fileName: node.metadata.filePath, runtime: runtimeKey }]
          } : undefined,
          new vscode.ThemeIcon('arrow-down')
        );
        inputFiles.push(item);
      } else {
        // For output files, collect their paths
        const filePath = node.metadata?.filePath || node.label || node.id;
        if (filePath) {
          outputFilePaths.push({ node, path: filePath });
        }
      }
    }

    const items: TestTreeItem[] = [];

    if (inputFiles.length > 0) {
      const inputFolder = new TestTreeItem(
        'Input Files',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${inputFiles.length} file(s)`,
          count: inputFiles.length,
          section: 'test-input-files'
        },
        undefined,
        new vscode.ThemeIcon('folder-opened')
      );
      inputFolder.children = inputFiles;
      items.push(inputFolder);
    }

    if (outputFilePaths.length > 0) {
      // Build a tree structure for output files
      const outputTree = this.buildFileTree(outputFilePaths);
      const outputFolder = new TestTreeItem(
        'Output Files',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtimeKey,
          testId,
          description: `${outputFilePaths.length} file(s)`,
          count: outputFilePaths.length,
          section: 'test-output-files'
        },
        undefined,
        new vscode.ThemeIcon('folder-opened')
      );
      outputFolder.children = this.convertTreeToItems(outputTree, runtimeKey, testId);
      items.push(outputFolder);
    }

    return items;
  }

  private buildFileTree(filePaths: { node: GraphNode; path: string }[]): any {
    const root: any = { type: 'directory', children: {} };

    for (const { node, path } of filePaths) {
      const parts = path.split(/[\\/]/).filter(part => part.length > 0);
      let current = root.children;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!current[part]) {
          if (isLast) {
            current[part] = {
              type: 'file',
              path: path,
              node: node,
              label: node.label || path.basename(path) || part,
              metadata: node.metadata
            };
          } else {
            current[part] = {
              type: 'directory',
              children: {}
            };
          }
        } else if (isLast) {
          // Update existing file node
          current[part] = {
            type: 'file',
            path: path,
            node: node,
            label: node.label || path.basename(path) || part,
            metadata: node.metadata
          };
        }

        if (!isLast) {
          current = current[part].children;
        }
      }
    }

    return root;
  }

  private convertTreeToItems(tree: any, runtimeKey: string, testId: string): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    for (const [name, node] of Object.entries(tree.children || {})) {
      const typedNode = node as any;
      if (typedNode.type === 'directory') {
        const folderItem = new TestTreeItem(
          name,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            runtimeKey,
            testId,
            isFile: false,
            fileType: 'folder'
          },
          undefined,
          new vscode.ThemeIcon('folder')
        );
        folderItem.children = this.convertTreeToItems(typedNode, runtimeKey, testId);
        items.push(folderItem);
      } else if (typedNode.type === 'file') {
        const fileItem = new TestTreeItem(
          name,
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            runtimeKey,
            testId,
            fileName: typedNode.path,
            isFile: true,
            fileType: 'output'
          },
          typedNode.path ? {
            command: 'testeranto.openFile',
            title: 'Open File',
            arguments: [{ fileName: typedNode.path, runtime: runtimeKey }]
          } : undefined,
          new vscode.ThemeIcon('arrow-up')
        );
        items.push(fileItem);
      }
    }

    // Sort folders first, then files
    items.sort((a, b) => {
      const aIsFolder = a.data?.isFile === false;
      const bIsFolder = b.data?.isFile === false;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  }

  private getTestIcon(node: GraphNode): vscode.ThemeIcon {
    const status = node.metadata?.status;
    const failed = node.metadata?.failed;

    if (failed === true || status === 'blocked') {
      return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
    } else if (failed === false || status === 'done') {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
    } else {
      return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
    }
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    console.log(`[TestTreeDataProvider] Received message type: ${message.type}, url: ${message.url}`);
    
    if (message.type === 'resourceChanged') {
      if (message.url === '/~/runtime' || message.url === '/~/graph') {
        console.log('[TestTreeDataProvider] Relevant update, refreshing');
        this.refresh();
      }
    } else if (message.type === 'graphUpdated') {
      console.log('[TestTreeDataProvider] Graph updated, refreshing');
      this.refresh();
    }
  }

  protected subscribeToGraphUpdates(): void {
    super.subscribeToGraphUpdates();
    // Subscribe to runtime slice
    this.subscribeToSlice('/runtime');
    // Also subscribe to graph for general updates
    this.subscribeToSlice('/graph');
  }
}
