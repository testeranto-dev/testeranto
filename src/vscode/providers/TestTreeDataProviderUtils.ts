import * as vscode from 'vscode';
import * as path from 'path';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import type { IRunTime } from '../../Types';


export class TestTreeDataProviderUtils {
  private static configData: any = null;

  static async fetchConfigsViaHttp(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/configs');
    const data = await response.json();
    TestTreeDataProviderUtils.configData = data;
    return data;
  }

  static getConfigData(): any {
    return TestTreeDataProviderUtils.configData;
  }

  static setConfigData(data: any): void {
    TestTreeDataProviderUtils.configData = data;
  }

  static async getRuntimeItems(): Promise<TestTreeItem[]> {
    const items: TestTreeItem[] = [];

    items.push(
      new TestTreeItem(
        "Refresh now",
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: "Update configuration from server",
          refresh: true
        },
        {
          command: "testeranto.refresh",
          title: "Refresh",
          arguments: []
        },
        new vscode.ThemeIcon("refresh", new vscode.ThemeColor("testing.iconQueued"))
      )
    );

    const configData = TestTreeDataProviderUtils.configData;
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;
      const runtimeEntries = Object.entries(runtimes);

      if (runtimeEntries.length > 0) {
        items.push(
          new TestTreeItem(
            `📊 ${runtimeEntries.length} Runtime(s)`,
            TreeItemType.Info,
            vscode.TreeItemCollapsibleState.None,
            {
              description: "From HTTP /~/configs endpoint",
              count: runtimeEntries.length
            },
            undefined,
            new vscode.ThemeIcon("server", new vscode.ThemeColor("testing.iconUnset"))
          )
        );

        for (const [runtimeKey, runtimeConfig] of runtimeEntries) {
          const config = runtimeConfig as any;
          if (config.runtime) {
            items.push(
              new TestTreeItem(
                `${runtimeKey} (${config.runtime})`,
                TreeItemType.Runtime,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                  runtime: config.runtime,
                  runtimeKey: runtimeKey,
                  testsCount: config.tests?.length || 0
                },
                undefined,
                new vscode.ThemeIcon("symbol-namespace")
              )
            );
          }
        }
      }
    }
    return items;
  }

  static getTestItems(runtime?: string): TestTreeItem[] {
    if (!runtime) {
      return [];
    }

    const configData = TestTreeDataProviderUtils.configData;
    if (configData && configData.configs && configData.configs.runtimes) {
      const runtimes = configData.configs.runtimes;

      for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
        const config = runtimeConfig as any;
        if (config.runtime === runtime) {
          const tests = config.tests || [];
          return tests.map((testName: string) => {
            const item = new TestTreeItem(
              testName,
              TreeItemType.Test,
              vscode.TreeItemCollapsibleState.Collapsed,
              { runtimeKey, testName },
              {
                command: 'testeranto.launchAiderTerminal',
                title: 'Launch Aider',
                arguments: [{ runtimeKey, testName }]
              },
              new vscode.ThemeIcon('beaker'),
              'testItemWithAider'
            );
            item.tooltip = `Click to launch aider for this test.`;
            return item;
          });
        }
      }
    }
    return [];
  }

  static async getTestFileItems(runtime: string, testName: string): Promise<TestTreeItem[]> {
    try {
      console.log(`[TestTreeDataProviderUtils] Fetching collated files for ${runtime}/${testName}`);
      
      // Fetch the collated files tree
      const response = await fetch('http://localhost:3000/~/collated-files');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`[TestTreeDataProviderUtils] Received collated files data:`, data);
      
      const tree = data.tree || {};
      console.log(`[TestTreeDataProviderUtils] Tree keys:`, Object.keys(tree));
      
      // Filter tree to only include files relevant to this runtime and testName
      const filteredTree = this.filterTreeForRuntimeAndTest(tree, runtime, testName);
      console.log(`[TestTreeDataProviderUtils] Filtered tree keys:`, Object.keys(filteredTree));
      console.log(`[TestTreeDataProviderUtils] Filtered tree structure (first level):`);
      for (const [key, value] of Object.entries(filteredTree)) {
        console.log(`  ${key}:`, value?.type, value?.testName, value?.path, value?.feature);
      }
      
      // Also log the full tree structure for debugging
      console.log(`[TestTreeDataProviderUtils] Full tree structure for ${runtime}/${testName}:`);
      this.logTreeStructure(filteredTree, 0);
      
      // Convert the filtered tree to TestTreeItems
      const fileItems = this.convertTreeToItems(filteredTree, runtime, testName);
      console.log(`[TestTreeDataProviderUtils] Converted ${fileItems.length} file items`);
      
      // Debug: log all items
      for (const item of fileItems) {
        console.log(`  Item: ${item.label}, type: ${item.type}, data:`, item.data);
      }
      
      if (fileItems.length > 0) {
        return fileItems;
      }
      
      // If no files found, try to show a placeholder with more info
      return [
        new TestTreeItem(
          "No files found for this test",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          { 
            runtime, 
            testName,
            description: `Check server logs for ${runtime}/${testName}` 
          },
          undefined,
          new vscode.ThemeIcon("info")
        ),
        new TestTreeItem(
          "Click to refresh",
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            runtime, 
            testName,
            refresh: true 
          },
          {
            command: "testeranto.refresh",
            title: "Refresh",
            arguments: []
          },
          new vscode.ThemeIcon("refresh")
        )
      ];
    } catch (error) {
      console.error('[TestTreeDataProviderUtils] Error fetching collated files:', error);
      return [
        new TestTreeItem(
          "Error loading files",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          { 
            runtime, 
            testName,
            description: error.message 
          },
          undefined,
          new vscode.ThemeIcon("error")
        ),
        new TestTreeItem(
          "Check if server is running",
          TreeItemType.Info,
          vscode.TreeItemCollapsibleState.None,
          { 
            runtime, 
            testName,
            serverCheck: true 
          },
          {
            command: "testeranto.startServer",
            title: "Start Server",
            arguments: []
          },
          new vscode.ThemeIcon("server")
        )
      ];
    }
  }

  private static filterTreeForRuntimeAndTest(tree: Record<string, any>, runtime: string, testName: string): Record<string, any> {
    console.log(`[TestTreeDataProviderUtils] filterTreeForRuntimeAndTest called with runtime="${runtime}", testName="${testName}"`);
    
    const filterNode = (node: any): any => {
      if (!node) {
        console.log(`[DEBUG] filterNode: node is null`);
        return null;
      }
      
      console.log(`[DEBUG] filterNode: type=${node.type}, testName=${node.testName}, feature=${node.feature}`);
      
      if (node.type === 'file') {
        // Check if this file belongs to the specified testName
        // We have testName on the node, so use that
        if (node.testName === testName) {
          console.log(`[DEBUG] filterNode: file matches testName`);
          return node;
        }
        // Also check if testName is in an array
        if (node.tests && node.tests.includes(testName)) {
          console.log(`[DEBUG] filterNode: file matches testName in array`);
          return node;
        }
        console.log(`[DEBUG] filterNode: file doesn't match testName`);
        return null;
      } else if (node.type === 'feature') {
        // Features should be included if they belong to this test
        if (node.testName === testName) {
          console.log(`[DEBUG] filterNode: feature matches testName: ${node.feature}`);
          return node;
        }
        console.log(`[DEBUG] filterNode: feature doesn't match testName`);
        return null;
      } else if (node.type === 'directory') {
        console.log(`[DEBUG] filterNode: processing directory with ${Object.keys(node.children || {}).length} children`);
        const filteredChildren: Record<string, any> = {};
        for (const [childName, child] of Object.entries(node.children || {})) {
          const filteredChild = filterNode(child);
          if (filteredChild !== null) {
            filteredChildren[childName] = filteredChild;
          }
        }
        if (Object.keys(filteredChildren).length > 0) {
          console.log(`[DEBUG] filterNode: directory has ${Object.keys(filteredChildren).length} filtered children`);
          return {
            type: 'directory',
            children: filteredChildren
          };
        }
        console.log(`[DEBUG] filterNode: directory has no matching children`);
        return null;
      }
      console.log(`[DEBUG] filterNode: unknown node type: ${node.type}`);
      return null;
    };
    
    // Handle the case where tree might have a root structure
    if (tree.type === 'directory' && tree.children) {
      const filteredRoot = filterNode(tree);
      if (filteredRoot && filteredRoot.children) {
        return filteredRoot.children;
      }
      return {};
    }
    
    // For flat tree structure
    const result: Record<string, any> = {};
    for (const [name, node] of Object.entries(tree)) {
      const filteredNode = filterNode(node);
      if (filteredNode !== null) {
        result[name] = filteredNode;
      }
    }
    
    console.log(`[TestTreeDataProviderUtils] Filtered tree has ${Object.keys(result).length} top-level items`);
    return result;
  }

  static async getDirectoryChildren(runtime: string, testName: string, dirPath: string): Promise<TestTreeItem[]> {
    try {
      // Fetch the collated files tree
      const response = await fetch('http://localhost:3000/~/collated-files');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const tree = data.tree || {};
      
      // Filter tree to only include files relevant to this runtime and testName
      const filteredTree = this.filterTreeForRuntimeAndTest(tree, runtime, testName);
      
      // Navigate to the specified directory
      const normalizedDirPath = dirPath.startsWith('/') ? dirPath.substring(1) : dirPath;
      const dirParts = normalizedDirPath.split('/').filter(part => part.length > 0);
      
      let currentNode = filteredTree;
      for (const part of dirParts) {
        if (currentNode[part] && currentNode[part].type === 'directory') {
          currentNode = currentNode[part].children || {};
        } else {
          return [];
        }
      }
      
      // Convert current node's children to TestTreeItems
      const items: TestTreeItem[] = [];
      for (const [name, node] of Object.entries(currentNode)) {
        const item = this.convertNodeToItem(name, node, runtime, testName, dirPath);
        if (item) {
          items.push(item);
        }
      }
      
      // Sort items: directories first, then files
      items.sort((a, b) => {
        const aIsDir = a.data?.isFile === false;
        const bIsDir = b.data?.isFile === false;
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.label!.toString().localeCompare(b.label!.toString());
      });
      
      return items;
    } catch (error) {
      console.error('Error in getDirectoryChildren:', error);
      return [];
    }
  }


  private static convertTreeToItems(tree: Record<string, any>, runtime: string, testName: string): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    
    // Helper function to create a file item
    const createFileItem = (file: any): TestTreeItem => {
      const fileName = path.basename(file.path);
      let fileUri: vscode.Uri | undefined;
      const workspaceFolders = vscode.workspace.workspaceFolders;
        
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        // Handle the file path correctly
        let filePath = file.path;
          
        if (filePath.startsWith('/')) {
          fileUri = vscode.Uri.file(filePath);
        } else {
          // Treat as relative to workspace root
          fileUri = vscode.Uri.joinPath(workspaceRoot, filePath);
        }
      }
        
      // Choose icon based on file type
      let icon: vscode.ThemeIcon;
      if (file.fileType === 'source') {
        icon = new vscode.ThemeIcon("file-code");
      } else if (file.fileType === 'documentation') {
        icon = new vscode.ThemeIcon("book");
      } else if (file.fileType === 'log') {
        // For log files, color based on exit code
        if (file.exitCodeColor) {
          let colorId: string;
          switch (file.exitCodeColor) {
            case 'green':
              colorId = 'testing.iconPassed';
              break;
            case 'yellow':
              colorId = 'testing.iconQueued';
              break;
            case 'red':
              colorId = 'testing.iconFailed';
              break;
            default:
              colorId = 'testing.iconUnset';
          }
          icon = new vscode.ThemeIcon("output", new vscode.ThemeColor(colorId));
        } else {
          icon = new vscode.ThemeIcon("output");
        }
      } else if (file.fileType === 'test-results') {
        icon = new vscode.ThemeIcon("json");
      } else if (file.fileType === 'input') {
        icon = new vscode.ThemeIcon("arrow-down", new vscode.ThemeColor("testing.iconQueued"));
      } else if (file.fileType === 'output') {
        icon = new vscode.ThemeIcon("arrow-up", new vscode.ThemeColor("testing.iconPassed"));
      } else {
        icon = new vscode.ThemeIcon("file-text");
      }
        
      const treeItem = new TestTreeItem(
        fileName,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          fileName: file.path,
          path: file.path,
          isFile: true,
          fileType: file.fileType,
          exitCode: file.exitCode,
          exitCodeColor: file.exitCodeColor
        },
        fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : undefined,
        icon
      );
        
      // Set tooltip
      let typeLabel = 'File';
      if (file.fileType === 'source') {
        typeLabel = 'Source';
      } else if (file.fileType === 'documentation') {
        typeLabel = 'Documentation';
      } else if (file.fileType === 'log') {
        typeLabel = 'Log';
        if (file.exitCode !== undefined) {
          typeLabel += ` (exit code: ${file.exitCode})`;
        }
      } else if (file.fileType === 'test-results') {
        typeLabel = 'Test Results';
      } else if (file.fileType === 'input') {
        typeLabel = 'Input';
      } else if (file.fileType === 'output') {
        typeLabel = 'Output';
      }
      treeItem.tooltip = `${typeLabel}: ${file.path}`;
        
      return treeItem;
    };
    
    // Helper function to create a directory item
    const createDirectoryItem = (name: string, node: any): TestTreeItem => {
      const treeItem = new TestTreeItem(
        name,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          runtime,
          testName,
          path: name,
          isFile: false
        },
        undefined,
        new vscode.ThemeIcon("folder")
      );
      
      // Pre-populate children
      treeItem.children = [];
      for (const [childName, childNode] of Object.entries(node.children || {})) {
        if (childNode.type === 'file') {
          treeItem.children.push(createFileItem(childNode));
        } else if (childNode.type === 'directory') {
          treeItem.children.push(createDirectoryItem(childName, childNode));
        } else if (childNode.type === 'feature') {
          // Handle feature nodes
          treeItem.children.push(createFeatureItem(childName, childNode));
        }
      }
      
      return treeItem;
    };

    // Helper function to create a feature item
    const createFeatureItem = (name: string, feature: any): TestTreeItem => {
      const treeItem = new TestTreeItem(
        feature.name || name,
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          isFeature: true,
          feature: feature.feature,
          status: feature.status || 'unknown',
          clickable: false
        },
        undefined, // No command for features
        new vscode.ThemeIcon("symbol-string")
      );
      
      treeItem.tooltip = `Feature: ${feature.feature}\nStatus: ${feature.status}`;
      return treeItem;
    };
    
    // Process the tree structure
    // The tree should have source and output sections
    const processNode = (node: any, nodeName: string): void => {
      console.log(`[DEBUG] Processing node: ${nodeName}, type: ${node.type}`);
      
      if (node.type === 'file') {
        // Add file directly (for backward compatibility)
        console.log(`[DEBUG] Adding file: ${nodeName}`);
        items.push(createFileItem(node));
      } else if (node.type === 'feature') {
        // Add feature directly
        console.log(`[DEBUG] Adding feature: ${nodeName}, feature: ${node.feature}`);
        items.push(createFeatureItem(nodeName, node));
      } else if (node.type === 'directory' && node.children) {
        console.log(`[DEBUG] Processing directory: ${nodeName} with ${Object.keys(node.children).length} children`);
        // Check if this is a special section (source, output) or a regular directory
        if (nodeName === 'source' || nodeName === 'output') {
          // Create a directory item for the section
          console.log(`[DEBUG] Creating directory item for ${nodeName === 'source' ? 'Source Files' : 'Output Files'}`);
          items.push(createDirectoryItem(nodeName === 'source' ? 'Source Files' : 'Output Files', node));
        } else {
          // For other directories, process their children
          console.log(`[DEBUG] Processing children of ${nodeName}:`, Object.keys(node.children));
          for (const [childName, childNode] of Object.entries(node.children)) {
            processNode(childNode, childName);
          }
        }
      } else {
        console.log(`[DEBUG] Unknown node type or structure: ${nodeName}, type: ${node.type}`);
      }
    };
    
    // Process all top-level nodes
    for (const [name, node] of Object.entries(tree)) {
      processNode(node, name);
    }
    
    // If no files were found, add a placeholder
    if (items.length === 0) {
      items.push(
        new TestTreeItem(
          "No files found",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          {
            runtime,
            testName,
            isFile: false
          },
          undefined,
          new vscode.ThemeIcon("info")
        )
      );
    }
    
    return items;
  }

  private static logTreeStructure(node: any, depth: number): void {
    const indent = '  '.repeat(depth);
    if (typeof node === 'object' && node !== null) {
      console.log(`${indent}type: ${node.type}, name: ${node.name || 'N/A'}, feature: ${node.feature || 'N/A'}`);
      if (node.children && typeof node.children === 'object') {
        console.log(`${indent}children:`);
        for (const [key, child] of Object.entries(node.children)) {
          console.log(`${indent}  ${key}:`);
          this.logTreeStructure(child, depth + 2);
        }
      }
    } else {
      console.log(`${indent}${node}`);
    }
  }

  private static convertNodeToItem(name: string, node: any, runtime: string, testName: string, parentPath: string): TestTreeItem | null {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    
    if (node.type === 'file') {
      const collapsibleState = vscode.TreeItemCollapsibleState.None;
      let fileUri: vscode.Uri | undefined;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        // Handle the file path correctly
        // The node.path might be relative to project root (e.g., "src/ts/Calculator.ts")
        // or absolute (e.g., "/full/path/src/ts/Calculator.ts")
        let filePath = node.path;
        
        // If the path starts with '/', it's absolute
        if (filePath.startsWith('/')) {
          fileUri = vscode.Uri.file(filePath);
        } else {
          // Otherwise, it's relative to the workspace root
          // But first, check if it exists relative to workspace root
          const fullPath = vscode.Uri.joinPath(workspaceRoot, filePath);
          // We'll create the URI anyway, and let the open command handle missing files
          fileUri = fullPath;
        }
      }
      
      // Choose icon based on file type
      let icon: vscode.ThemeIcon;
      if (node.fileType === 'input') {
        icon = new vscode.ThemeIcon("arrow-down", new vscode.ThemeColor("testing.iconQueued"));
      } else if (node.fileType === 'output') {
        icon = new vscode.ThemeIcon("arrow-up", new vscode.ThemeColor("testing.iconPassed"));
      } else if (node.fileType === 'both') {
        icon = new vscode.ThemeIcon("arrow-both", new vscode.ThemeColor("testing.iconUnset"));
      } else if (node.fileType === 'log') {
        // For log files, color based on exit code
        if (node.exitCodeColor) {
          let colorId: string;
          switch (node.exitCodeColor) {
            case 'green':
              colorId = 'testing.iconPassed';
              break;
            case 'yellow':
              colorId = 'testing.iconQueued';
              break;
            case 'red':
              colorId = 'testing.iconFailed';
              break;
            default:
              colorId = 'testing.iconUnset';
          }
          icon = new vscode.ThemeIcon("output", new vscode.ThemeColor(colorId));
        } else {
          icon = new vscode.ThemeIcon("output");
        }
      } else if (node.fileType === 'source') {
        icon = new vscode.ThemeIcon("file-code");
      } else if (node.fileType === 'documentation') {
        icon = new vscode.ThemeIcon("book");
      } else {
        icon = new vscode.ThemeIcon("file-text");
      }
      
      const treeItem = new TestTreeItem(
        name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          fileName: node.path,
          path: currentPath,
          isFile: true,
          fileType: node.fileType,
          exitCode: node.exitCode,
          exitCodeColor: node.exitCodeColor
        },
        fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : undefined,
        icon
      );
      
      if (node.fileType) {
        let typeLabel = 'File';
        if (node.fileType === 'input') {
          typeLabel = 'Input';
        } else if (node.fileType === 'output') {
          typeLabel = 'Output';
        } else if (node.fileType === 'both') {
          typeLabel = 'Input/Output';
        } else if (node.fileType === 'log') {
          typeLabel = 'Log';
          if (node.exitCode !== undefined) {
            typeLabel += ` (exit code: ${node.exitCode})`;
          }
        } else if (node.fileType === 'source') {
          typeLabel = 'Source';
        } else if (node.fileType === 'documentation') {
          typeLabel = 'Documentation';
        }
        treeItem.tooltip = `${typeLabel} file: ${node.path}`;
      }
      
      return treeItem;
    } else if (node.type === 'directory') {
      const collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      const treeItem = new TestTreeItem(
        name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          path: currentPath,
          isFile: false
        },
        undefined,
        new vscode.ThemeIcon("folder")
      );
      
      // Pre-populate children for this directory
      treeItem.children = Object.entries(node.children || {}).map(([childName, childNode]) => 
        this.convertNodeToItem(childName, childNode, runtime, testName, currentPath)
      ).filter(item => item !== null) as TestTreeItem[];
      
      return treeItem;
    } else if (node.type === 'feature') {
      // Handle feature nodes - they're non-clickable
      console.log(`[DEBUG] Converting feature node: ${name}, feature: ${node.feature}`);
      const collapsibleState = vscode.TreeItemCollapsibleState.None;
      // Features are non-clickable, so no command
      // Use a different icon for features
      const icon = new vscode.ThemeIcon("symbol-string");
      
      const treeItem = new TestTreeItem(
        node.name || name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          isFeature: true,
          feature: node.feature,
          status: node.status || 'unknown',
          // Mark as non-clickable
          clickable: false
        },
        undefined, // No command for features
        icon
      );
      
      // Set tooltip
      treeItem.tooltip = `Feature: ${node.feature}\nStatus: ${node.status}`;
      
      return treeItem;
    }
    
    return null;
  }
}
