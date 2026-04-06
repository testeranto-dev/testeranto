import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from "../../../TestTreeItem";
import { convertNodeToItem } from "./nodeConverter";
import { filterTreeForRuntimeAndTest } from "./treeFilter";
import { TreeItemType } from '../../../types';

export async function getDirectoryChildren(
  runtime: string,
  testName: string,
  dirPath: string,
): Promise<TestTreeItem[]> {
  try {
    // Read from graph-data.json instead of HTTP endpoint
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
    
    if (!fs.existsSync(graphDataPath)) {
      return [];
    }

    const graphDataContent = fs.readFileSync(graphDataPath, 'utf-8');
    const graphData = JSON.parse(graphDataContent);
    
    // Build a tree structure from graph nodes
    const tree: Record<string, any> = {};
    
    // Get all file and folder nodes
    const fileNodes = graphData.data?.unifiedGraph?.nodes?.filter((node: any) => 
      node.type === 'file' || node.type === 'folder' || node.type === 'input_file'
    ) || [];
    
    // Get edges to understand relationships
    const edges = graphData.data?.unifiedGraph?.edges || [];
    
    // Find test nodes for this runtime and testName
    const testNodes = graphData.data?.unifiedGraph?.nodes?.filter((node: any) =>
      node.type === 'test' &&
      (node.metadata?.configKey === runtime || node.metadata?.runtime === runtime) &&
      (node.metadata?.testName === testName || node.label === testName)
    ) || [];
    
    if (testNodes.length === 0) {
      return [];
    }
    
    // Build a simple tree structure for compatibility
    // We'll create a flat structure since the old code expects a tree
    const simpleTree: Record<string, any> = {
      [runtime]: {
        type: 'directory',
        children: {}
      }
    };
    
    // For each test node, find connected file nodes
    for (const testNode of testNodes) {
      const testId = testNode.id;
      
      // Find edges from this test to files
      const connectedEdges = edges.filter((edge: any) =>
        edge.source === testId || edge.target === testId
      );
      
      for (const edge of connectedEdges) {
        const fileNodeId = edge.source === testId ? edge.target : edge.source;
        const fileNode = fileNodes.find((n: any) => n.id === fileNodeId);
        
        if (fileNode) {
          const filePath = fileNode.metadata?.filePath || fileNode.label;
          const fileName = path.basename(filePath);
          const fileType = fileNode.type === 'folder' ? 'directory' : 'file';
          
          // Create a simple node structure
          simpleTree[runtime].children[fileName] = {
            type: fileType,
            path: filePath,
            fileType: fileNode.metadata?.fileType || (fileNode.type === 'input_file' ? 'source' : 'file'),
            testName: testName,
            runtime: runtime
          };
        }
      }
    }
    
    // Use the existing filter function (it expects the old tree structure)
    const filteredTree = filterTreeForRuntimeAndTest(
      simpleTree,
      runtime,
      testName,
    );

    const normalizedDirPath = dirPath.startsWith("/")
      ? dirPath.substring(1)
      : dirPath;
    const dirParts = normalizedDirPath
      .split("/")
      .filter((part) => part.length > 0);

    let currentNode = filteredTree;
    for (const part of dirParts) {
      if (currentNode[part] && currentNode[part].type === "directory") {
        currentNode = currentNode[part].children || {};
      } else {
        return [];
      }
    }

    const items: TestTreeItem[] = [];
    for (const [name, node] of Object.entries(currentNode)) {
      const item = convertNodeToItem(
        name,
        node,
        runtime,
        testName,
        dirPath,
      );
      if (item) {
        items.push(item);
      }
    }

    items.sort((a, b) => {
      const aIsDir = a.data?.isFile === false;
      const bIsDir = b.data?.isFile === false;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  } catch (error) {
    console.error("Error in getDirectoryChildren:", error);
    return [];
  }
}
