import * as vscode from "vscode";
import * as path from "path";
import { TestTreeItem } from "../../../TestTreeItem";
import { TreeItemType } from "../../../types";

export function convertTreeToItems(
  tree: Record<string, any>,
  runtime: string,
  testName: string,
): TestTreeItem[] {
  const items: TestTreeItem[] = [];

  const createFileItem = (file: any): TestTreeItem => {
    // Ensure file has required properties
    if (!file || typeof file !== 'object') {
      console.error('[treeConverter] Invalid file object:', file);
      // Return a placeholder item
      return new TestTreeItem(
        'Invalid file',
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          isFile: true,
          fileType: 'unknown'
        },
        undefined,
        new vscode.ThemeIcon('error')
      );
    }

    const filePath = file.path || '';
    const fileName = path.basename(filePath);
    let fileUri: vscode.Uri | undefined;
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri;
      if (filePath.startsWith("/")) {
        fileUri = vscode.Uri.file(filePath);
      } else {
        fileUri = vscode.Uri.joinPath(workspaceRoot, filePath);
      }
    }

    let icon: vscode.ThemeIcon;
    const fileType = file.fileType || '';
    if (fileType === "source") {
      icon = new vscode.ThemeIcon("file-code");
    } else if (fileType === "documentation") {
      icon = new vscode.ThemeIcon("book");
    } else if (fileType === "log") {
      if (file.exitCodeColor) {
        let colorId: string;
        switch (file.exitCodeColor) {
          case "green":
            colorId = "testing.iconPassed";
            break;
          case "yellow":
            colorId = "testing.iconQueued";
            break;
          case "red":
            colorId = "testing.iconFailed";
            break;
          default:
            colorId = "testing.iconUnset";
        }
        icon = new vscode.ThemeIcon("output", new vscode.ThemeColor(colorId));
      } else {
        icon = new vscode.ThemeIcon("output");
      }
    } else if (fileType === "test-results") {
      icon = new vscode.ThemeIcon("json");
    } else if (fileType === "input") {
      icon = new vscode.ThemeIcon(
        "arrow-down",
        new vscode.ThemeColor("testing.iconQueued"),
      );
    } else if (fileType === "output") {
      icon = new vscode.ThemeIcon(
        "arrow-up",
        new vscode.ThemeColor("testing.iconPassed"),
      );
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
        exitCodeColor: file.exitCodeColor,
      },
      fileUri
        ? {
          command: "vscode.open",
          title: "Open File",
          arguments: [fileUri],
        }
        : undefined,
      icon,
    );

    let typeLabel = "File";
    if (file.fileType === "source") {
      typeLabel = "Source";
    } else if (file.fileType === "documentation") {
      typeLabel = "Documentation";
    } else if (file.fileType === "log") {
      typeLabel = "Log";
      if (file.exitCode !== undefined) {
        typeLabel += ` (exit code: ${file.exitCode})`;
      }
    } else if (file.fileType === "test-results") {
      typeLabel = "Test Results";
    } else if (file.fileType === "input") {
      typeLabel = "Input";
    } else if (file.fileType === "output") {
      typeLabel = "Output";
    }
    treeItem.tooltip = `${typeLabel}: ${file.path}`;

    return treeItem;
  };

  const createDirectoryItem = (name: string, node: any): TestTreeItem => {
    const treeItem = new TestTreeItem(
      name,
      TreeItemType.File,
      vscode.TreeItemCollapsibleState.Collapsed,
      {
        runtime,
        testName,
        path: name,
        isFile: false,
      },
      undefined,
      new vscode.ThemeIcon("folder"),
    );

    treeItem.children = [];
    for (const [childName, childNode] of Object.entries(
      node.children || {},
    )) {
      if (childNode.type === "file") {
        treeItem.children.push(createFileItem(childNode));
      } else if (childNode.type === "directory") {
        treeItem.children.push(createDirectoryItem(childName, childNode));
      } else if (childNode.type === "feature") {
        treeItem.children.push(createFeatureItem(childName, childNode));
      }
    }

    return treeItem;
  };

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
        status: feature.status || "unknown",
        clickable: false,
      },
      undefined,
      new vscode.ThemeIcon("symbol-string"),
    );

    treeItem.tooltip = `Feature: ${feature.feature}\nStatus: ${feature.status}`;
    return treeItem;
  };

  const processNode = (node: any, nodeName: string): void => {
    console.log(`[DEBUG] Processing node: ${nodeName}, type: ${node.type}`);

    if (node.type === "file") {
      console.log(`[DEBUG] Adding file: ${nodeName}`);
      items.push(createFileItem(node));
    } else if (node.type === "feature") {
      console.log(
        `[DEBUG] Adding feature: ${nodeName}, feature: ${node.feature}`,
      );
      items.push(createFeatureItem(nodeName, node));
    } else if (node.type === "directory" && node.children) {
      console.log(
        `[DEBUG] Processing directory: ${nodeName} with ${Object.keys(node.children).length} children`,
      );
      if (nodeName === "source" || nodeName === "output" || nodeName === "logs") {
        let displayName = nodeName;
        if (nodeName === "source") displayName = "Source Files";
        else if (nodeName === "output") displayName = "Output Files";
        else if (nodeName === "logs") displayName = "Logs";

        console.log(
          `[DEBUG] Creating directory item for ${displayName}`,
        );
        items.push(
          createDirectoryItem(
            displayName,
            node,
          ),
        );
      } else {
        console.log(
          `[DEBUG] Processing children of ${nodeName}:`,
          Object.keys(node.children),
        );
        for (const [childName, childNode] of Object.entries(node.children)) {
          processNode(childNode, childName);
        }
      }
    } else {
      console.log(
        `[DEBUG] Unknown node type or structure: ${nodeName}, type: ${node.type}`,
      );
    }
  };

  for (const [name, node] of Object.entries(tree)) {
    processNode(node, name);
  }

  if (items.length === 0) {
    items.push(
      new TestTreeItem(
        "No files found",
        TreeItemType.File,
        vscode.TreeItemCollapsibleState.None,
        {
          runtime,
          testName,
          isFile: false,
        },
        undefined,
        new vscode.ThemeIcon("info"),
      ),
    );
  }

  return items;
}

export function logTreeStructure(node: any, depth: number): void {
  const indent = "  ".repeat(depth);
  if (typeof node === "object" && node !== null) {
    console.log(
      `${indent}type: ${node.type}, name: ${node.name || "N/A"}, feature: ${node.feature || "N/A"}`,
    );
    if (node.children && typeof node.children === "object") {
      console.log(`${indent}children:`);
      for (const [key, child] of Object.entries(node.children)) {
        console.log(`${indent}  ${key}:`);
        logTreeStructure(child, depth + 2);
      }
    }
  } else {
    console.log(`${indent}${node}`);
  }
}
