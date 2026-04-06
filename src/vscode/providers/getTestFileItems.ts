import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { createErrorItems } from './createErrorItems';

export async function getTestFileItems(
    runtimeKey: string,
    testName: string,
  ): Promise<TestTreeItem[]> {
    console.log(`[TestTreeDataProvider] getTestFileItems START for ${runtimeKey}/${testName} using graph data`);

    try {
      // Read from graph-data.json
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');

      if (!fs.existsSync(graphDataPath)) {
        return createErrorItems(runtimeKey, testName);
      }

      const graphDataContent = fs.readFileSync(graphDataPath, 'utf-8');
      const graphData = JSON.parse(graphDataContent);

      // Get all nodes and edges
      const allNodes = graphData.data?.unifiedGraph?.nodes || [];
      const allEdges = graphData.data?.unifiedGraph?.edges || [];

      console.log(`[TestTreeDataProvider] Total nodes: ${allNodes.length}, edges: ${allEdges.length}`);

      // Find test nodes for this specific test - use more flexible matching
      const testNodes = allNodes.filter((node: any) => {
        if (node.type !== 'test') return false;
        
        // Check configKey/runtime match
        const configMatch = node.metadata?.configKey === runtimeKey || 
                           node.metadata?.runtime === runtimeKey ||
                           runtimeKey.includes(node.metadata?.configKey || '') ||
                           (node.metadata?.configKey || '').includes(runtimeKey);
        
        if (!configMatch) return false;
        
        // Check testName match - be more flexible
        const nodeTestName = node.metadata?.testName || node.label || '';
        const cleanNodeTestName = nodeTestName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanInputTestName = testName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return nodeTestName === testName ||
               nodeTestName.includes(testName) ||
               testName.includes(nodeTestName) ||
               cleanNodeTestName.includes(cleanInputTestName) ||
               cleanInputTestName.includes(cleanNodeTestName);
      });

      console.log(`[TestTreeDataProvider] Found ${testNodes.length} test nodes for ${runtimeKey}/${testName}`);

      if (testNodes.length === 0) {
        // Try to find entrypoint nodes as fallback
        const entrypointNodes = allNodes.filter((node: any) => {
          if (node.type !== 'entrypoint') return false;
          const nodeLabel = node.label || '';
          return nodeLabel.includes(testName) || testName.includes(nodeLabel);
        });
        
        if (entrypointNodes.length === 0) {
          console.log(`[TestTreeDataProvider] No test or entrypoint nodes found for ${testName}`);
          return createErrorItems(runtimeKey, testName);
        }
        
        // Use entrypoint nodes as test nodes
        testNodes.push(...entrypointNodes);
      }

      const items: TestTreeItem[] = [];

      // Find all file nodes that might be related to this test
      // Look for files connected via edges AND files with matching metadata
      const relatedFileNodes: any[] = [];
      const testNodeIds = testNodes.map((n: any) => n.id);

      // 1. Find files connected via edges
      for (const edge of allEdges) {
        if (testNodeIds.includes(edge.source)) {
          const targetNode = allNodes.find((n: any) => n.id === edge.target);
          if (targetNode && (targetNode.type === 'file' || targetNode.type === 'input_file' || targetNode.type === 'folder')) {
            if (!relatedFileNodes.some(n => n.id === targetNode.id)) {
              relatedFileNodes.push(targetNode);
            }
          }
        }
        if (testNodeIds.includes(edge.target)) {
          const sourceNode = allNodes.find((n: any) => n.id === edge.source);
          if (sourceNode && (sourceNode.type === 'file' || sourceNode.type === 'input_file' || sourceNode.type === 'folder')) {
            if (!relatedFileNodes.some(n => n.id === sourceNode.id)) {
              relatedFileNodes.push(sourceNode);
            }
          }
        }
      }

      // 2. Find files by metadata (testName, configKey, etc.)
      for (const node of allNodes) {
        if (node.type === 'file' || node.type === 'input_file' || node.type === 'folder') {
          const metadata = node.metadata || {};
          const filePath = metadata.filePath || node.label || '';
          
          // Check if file path contains test name
          if (filePath.includes(testName)) {
            if (!relatedFileNodes.some(n => n.id === node.id)) {
              relatedFileNodes.push(node);
            }
          }
          
          // Check if metadata references this test
          if (metadata.testName === testName || metadata.configKey === runtimeKey) {
            if (!relatedFileNodes.some(n => n.id === node.id)) {
              relatedFileNodes.push(node);
            }
          }
        }
      }

      console.log(`[TestTreeDataProvider] Found ${relatedFileNodes.length} related file/folder nodes`);

      // Group files by type
      const sourceFiles: any[] = [];
      const logFiles: any[] = [];
      const outputFiles: any[] = [];
      const folderNodes: any[] = [];

      for (const fileNode of relatedFileNodes) {
        const fileType = fileNode.metadata?.fileType || 
                        (fileNode.type === 'input_file' ? 'source' : 
                         fileNode.type === 'folder' ? 'folder' : 'file');
        
        const filePath = fileNode.metadata?.filePath || fileNode.label || fileNode.id;
        
        const fileItem = {
          path: filePath,
          type: fileType,
          node: fileNode
        };

        if (fileType === 'folder') {
          folderNodes.push(fileItem);
        } else if (fileType === 'source' || fileType === 'input_file') {
          sourceFiles.push(fileItem);
        } else if (fileType === 'log') {
          logFiles.push(fileItem);
        } else if (filePath.includes('.log') || filePath.includes('.txt') || 
                   filePath.includes('log') || filePath.includes('output')) {
          logFiles.push(fileItem);
        } else {
          outputFiles.push(fileItem);
        }
      }

      // Add source files section
      if (sourceFiles.length > 0) {
        const sourceFilesItem = new TestTreeItem(
          'Source Files',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            description: `${sourceFiles.length} file(s)`,
            count: sourceFiles.length
          },
          undefined,
          new vscode.ThemeIcon('file-code')
        );

        sourceFilesItem.children = sourceFiles.map((file: any) => {
          return new TestTreeItem(
            path.basename(file.path) || file.path,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              fileName: file.path,
              runtime: runtimeKey,
              testName: testName,
              isFile: true,
              fileType: 'source'
            },
            {
              command: 'testeranto.openFile',
              title: 'Open File',
              arguments: [{ fileName: file.path, runtime: runtimeKey, testName: testName, isFile: true }]
            },
            new vscode.ThemeIcon('file-code')
          );
        });
        items.push(sourceFilesItem);
      }

      // Add logs section
      if (logFiles.length > 0) {
        const logsItem = new TestTreeItem(
          'Logs',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            description: `${logFiles.length} log file(s)`,
            count: logFiles.length
          },
          undefined,
          new vscode.ThemeIcon('output')
        );

        logsItem.children = logFiles.map((file: any) => {
          return new TestTreeItem(
            path.basename(file.path) || file.path,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              fileName: file.path,
              runtime: runtimeKey,
              testName: testName,
              isFile: true,
              fileType: 'log'
            },
            {
              command: 'testeranto.openFile',
              title: 'Open Log File',
              arguments: [{ fileName: file.path, runtime: runtimeKey, testName: testName, isFile: true }]
            },
            new vscode.ThemeIcon('output')
          );
        });
        items.push(logsItem);
      }

      // Add output files section
      if (outputFiles.length > 0) {
        const outputFilesItem = new TestTreeItem(
          'Output Files',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            description: `${outputFiles.length} file(s)`,
            count: outputFiles.length
          },
          undefined,
          new vscode.ThemeIcon('folder-opened')
        );

        outputFilesItem.children = outputFiles.map((file: any) => {
          return new TestTreeItem(
            path.basename(file.path) || file.path,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              fileName: file.path,
              runtime: runtimeKey,
              testName: testName,
              isFile: true,
              fileType: 'output'
            },
            {
              command: 'testeranto.openFile',
              title: 'Open Output File',
              arguments: [{ fileName: file.path, runtime: runtimeKey, testName: testName, isFile: true }]
            },
            new vscode.ThemeIcon('file')
          );
        });
        items.push(outputFilesItem);
      }

      // Add folders section
      if (folderNodes.length > 0) {
        const foldersItem = new TestTreeItem(
          'Folders',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            description: `${folderNodes.length} folder(s)`,
            count: folderNodes.length
          },
          undefined,
          new vscode.ThemeIcon('folder')
        );

        foldersItem.children = folderNodes.map((folder: any) => {
          return new TestTreeItem(
            path.basename(folder.path) || folder.path,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              fileName: folder.path,
              runtime: runtimeKey,
              testName: testName,
              isFile: false,
              fileType: 'folder'
            },
            undefined,
            new vscode.ThemeIcon('folder')
          );
        });
        items.push(foldersItem);
      }

      // Add test results from test nodes themselves
      if (testNodes.length > 0) {
        const testResultsItem = new TestTreeItem(
          'Test Results',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            description: `${testNodes.length} test result(s)`,
            count: testNodes.length
          },
          undefined,
          new vscode.ThemeIcon('graph')
        );

        testResultsItem.children = testNodes.map((testNode: any, index: number) => {
          const status = testNode.status || 'unknown';
          const icon = status === 'done' || status === 'passed' ? 
            new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed')) :
            new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
          
          return new TestTreeItem(
            testNode.label || `Test ${index + 1}`,
            TreeItemType.File,
            vscode.TreeItemCollapsibleState.None,
            {
              fileName: `Test: ${testNode.label}`,
              runtime: runtimeKey,
              testName: testName,
              isFile: false,
              fileType: 'test-results',
              testData: testNode
            },
            undefined,
            icon
          );
        });
        items.push(testResultsItem);
      }

      // If no items found, add a placeholder
      if (items.length === 0) {
        items.push(new TestTreeItem(
          'No files found for this test',
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          {
            description: 'The graph data may not contain file information for this test',
            runtimeKey,
            testName
          },
          undefined,
          new vscode.ThemeIcon('info')
        ));
      }

      console.log(`[TestTreeDataProvider] Built ${items.length} top-level items for ${runtimeKey}/${testName}`);
      return items;
    } catch (error) {
      console.error("[TestTreeDataProvider] Error reading graph data:", error);
      console.error(`[TestTreeDataProvider] Error details:`, error);
      return createErrorItems(runtimeKey, testName);
    }
}
