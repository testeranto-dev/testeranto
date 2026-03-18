import * as vscode from 'vscode';
import * as path from 'path';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import type { IRunTime } from '../../Types';

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  fullPath: string;
  isFile: boolean;
  fileType?: 'input' | 'output';
}

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
                title: 'Launch Aider Terminal',
                arguments: [runtimeKey, testName]
              },
              new vscode.ThemeIcon('terminal'),
              'testWithAider'
            );
            item.tooltip = `Click to launch aider terminal for ${testName}`;
            return item;
          });
        }
      }
    }
    return [];
  }

  static async getTestFileItems(runtime: string, testName: string): Promise<TestTreeItem[]> {
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
      
      // Convert the filtered tree to TestTreeItems
      const fileItems = this.convertTreeToItems(filteredTree, runtime, testName);
      
      if (fileItems.length > 0) {
        return fileItems;
      }
      
      return [
        new TestTreeItem(
          "No files available",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          { runtime, testName },
          undefined,
          new vscode.ThemeIcon("info")
        )
      ];
    } catch (error) {
      console.error('Error fetching collated files:', error);
      return [
        new TestTreeItem(
          "Error loading files",
          TreeItemType.File,
          vscode.TreeItemCollapsibleState.None,
          { runtime, testName },
          undefined,
          new vscode.ThemeIcon("error")
        )
      ];
    }
  }

  private static filterTreeForRuntimeAndTest(tree: Record<string, any>, runtime: string, testName: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    const filterNode = (node: any): any => {
      if (node.type === 'file') {
        // Check if this file belongs to the specified runtime and testName
        // First, check direct properties
        if (node.runtime === runtime && node.testName === testName) {
          return node;
        }
        // Also check if the file is associated with this runtime/test through arrays
        if (node.runtimes && node.runtimes.includes(runtime) && 
            node.tests && node.tests.includes(testName)) {
          return node;
        }
        // For output files, they might be associated with multiple tests
        // If it's an output file for this runtime, include it regardless of testName
        if (node.fileType === 'output' && node.runtime === runtime) {
          return node;
        }
        return null;
      } else if (node.type === 'directory') {
        const filteredChildren: Record<string, any> = {};
        for (const [childName, child] of Object.entries(node.children || {})) {
          const filteredChild = filterNode(child);
          if (filteredChild !== null) {
            filteredChildren[childName] = filteredChild;
          }
        }
        if (Object.keys(filteredChildren).length > 0) {
          return {
            type: 'directory',
            children: filteredChildren
          };
        }
        return null;
      }
      return null;
    };
    
    for (const [name, node] of Object.entries(tree)) {
      const filteredNode = filterNode(node);
      if (filteredNode !== null) {
        result[name] = filteredNode;
      }
    }
    
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

  static buildTreeItemsFromNode(
    node: TreeNode,
    runtime: string,
    testName: string
  ): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const child of sortedChildren) {
      const collapsibleState = child.isFile
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed;

      let fileUri: vscode.Uri | undefined;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (child.isFile && workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (child.fullPath.startsWith('/')) {
          fileUri = vscode.Uri.file(child.fullPath);
        } else {
          fileUri = vscode.Uri.joinPath(workspaceRoot, child.fullPath);
        }
      }

      // Choose icon based on file type
      let icon: vscode.ThemeIcon;
      if (child.isFile) {
        if (child.fileType === 'input') {
          icon = new vscode.ThemeIcon("arrow-down", new vscode.ThemeColor("testing.iconQueued"));
        } else if (child.fileType === 'output') {
          icon = new vscode.ThemeIcon("arrow-up", new vscode.ThemeColor("testing.iconPassed"));
        } else if (child.fileType === 'both') {
          icon = new vscode.ThemeIcon("arrow-both", new vscode.ThemeColor("testing.iconUnset"));
        } else {
          icon = new vscode.ThemeIcon("file-text");
        }
      } else {
        icon = new vscode.ThemeIcon("folder");
      }

      const treeItem = new TestTreeItem(
        child.name,
        TreeItemType.File,
        collapsibleState,
        {
          runtime,
          testName,
          fileName: child.fullPath,
          path: child.fullPath,
          isFile: child.isFile,
          fileType: child.fileType
        },
        child.isFile && fileUri ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri]
        } : undefined,
        icon
      );

      // Add tooltip to indicate file type
      if (child.isFile && child.fileType) {
        let typeLabel = 'File';
        if (child.fileType === 'input') {
          typeLabel = 'Input';
        } else if (child.fileType === 'output') {
          typeLabel = 'Output';
        } else if (child.fileType === 'both') {
          typeLabel = 'Input/Output';
        }
        treeItem.tooltip = `${typeLabel} file: ${child.fullPath}`;
      }

      items.push(treeItem);
    }

    return items;
  }

  private static convertTreeToItems(tree: Record<string, any>, runtime: string, testName: string): TestTreeItem[] {
    const items: TestTreeItem[] = [];
    
    const convertNode = (name: string, node: any, parentPath: string = ''): TestTreeItem | null => {
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      
      if (node.type === 'file') {
        const collapsibleState = vscode.TreeItemCollapsibleState.None;
        let fileUri: vscode.Uri | undefined;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri;
          if (node.path.startsWith('/')) {
            fileUri = vscode.Uri.file(node.path);
          } else {
            fileUri = vscode.Uri.joinPath(workspaceRoot, node.path);
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
            path: node.path,
            isFile: true,
            fileType: node.fileType
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
        
        // Store children for later expansion
        treeItem.children = Object.entries(node.children || {}).map(([childName, childNode]) => 
          convertNode(childName, childNode, currentPath)
        ).filter(item => item !== null) as TestTreeItem[];
        
        return treeItem;
      }
      
      return null;
    };
    
    for (const [name, node] of Object.entries(tree)) {
      const item = convertNode(name, node);
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }

  private static convertNodeToItem(name: string, node: any, runtime: string, testName: string, parentPath: string): TestTreeItem | null {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    
    if (node.type === 'file') {
      const collapsibleState = vscode.TreeItemCollapsibleState.None;
      let fileUri: vscode.Uri | undefined;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        if (node.path.startsWith('/')) {
          fileUri = vscode.Uri.file(node.path);
        } else {
          fileUri = vscode.Uri.joinPath(workspaceRoot, node.path);
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
          fileType: node.fileType
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
    }
    
    return null;
  }
}
