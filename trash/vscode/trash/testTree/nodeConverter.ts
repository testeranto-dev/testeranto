// import * as vscode from "vscode";
// import { TestTreeItem } from "../../../TestTreeItem";
// import { TreeItemType } from "../../../types";

// export function convertNodeToItem(
//   name: string,
//   node: any,
//   runtime: string,
//   testName: string,
//   parentPath: string,
// ): TestTreeItem | null {
//   const currentPath = parentPath ? `${parentPath}/${name}` : name;

//   if (node.type === "file") {
//     const collapsibleState = vscode.TreeItemCollapsibleState.None;
//     let fileUri: vscode.Uri | undefined;
//     const workspaceFolders = vscode.workspace.workspaceFolders;

//     if (workspaceFolders && workspaceFolders.length > 0) {
//       const workspaceRoot = workspaceFolders[0].uri;
//       let filePath = node.path;

//       if (filePath.startsWith("/")) {
//         fileUri = vscode.Uri.file(filePath);
//       } else {
//         const fullPath = vscode.Uri.joinPath(workspaceRoot, filePath);
//         fileUri = fullPath;
//       }
//     }

//     let icon: vscode.ThemeIcon;
//     if (node.fileType === "input") {
//       icon = new vscode.ThemeIcon(
//         "arrow-down",
//         new vscode.ThemeColor("testing.iconQueued"),
//       );
//     } else if (node.fileType === "output") {
//       icon = new vscode.ThemeIcon(
//         "arrow-up",
//         new vscode.ThemeColor("testing.iconPassed"),
//       );
//     } else if (node.fileType === "both") {
//       icon = new vscode.ThemeIcon(
//         "arrow-both",
//         new vscode.ThemeColor("testing.iconUnset"),
//       );
//     } else if (node.fileType === "log") {
//       if (node.exitCodeColor) {
//         let colorId: string;
//         switch (node.exitCodeColor) {
//           case "green":
//             colorId = "testing.iconPassed";
//             break;
//           case "yellow":
//             colorId = "testing.iconQueued";
//             break;
//           case "red":
//             colorId = "testing.iconFailed";
//             break;
//           default:
//             colorId = "testing.iconUnset";
//         }
//         icon = new vscode.ThemeIcon("output", new vscode.ThemeColor(colorId));
//       } else {
//         icon = new vscode.ThemeIcon("output");
//       }
//     } else if (node.fileType === "source") {
//       icon = new vscode.ThemeIcon("file-code");
//     } else if (node.fileType === "documentation") {
//       icon = new vscode.ThemeIcon("book");
//     } else {
//       icon = new vscode.ThemeIcon("file-text");
//     }

//     const treeItem = new TestTreeItem(
//       name,
//       TreeItemType.File,
//       collapsibleState,
//       {
//         runtime,
//         testName,
//         fileName: node.path,
//         path: currentPath,
//         isFile: true,
//         fileType: node.fileType,
//         exitCode: node.exitCode,
//         exitCodeColor: node.exitCodeColor,
//       },
//       fileUri
//         ? {
//           command: "vscode.open",
//           title: "Open File",
//           arguments: [fileUri],
//         }
//         : undefined,
//       icon,
//     );

//     if (node.fileType) {
//       let typeLabel = "File";
//       if (node.fileType === "input") {
//         typeLabel = "Input";
//       } else if (node.fileType === "output") {
//         typeLabel = "Output";
//       } else if (node.fileType === "both") {
//         typeLabel = "Input/Output";
//       } else if (node.fileType === "log") {
//         typeLabel = "Log";
//         if (node.exitCode !== undefined) {
//           typeLabel += ` (exit code: ${node.exitCode})`;
//         }
//       } else if (node.fileType === "source") {
//         typeLabel = "Source";
//       } else if (node.fileType === "documentation") {
//         typeLabel = "Documentation";
//       }
//       treeItem.tooltip = `${typeLabel} file: ${node.path}`;
//     }

//     return treeItem;
//   } else if (node.type === "directory") {
//     const collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
//     const treeItem = new TestTreeItem(
//       name,
//       TreeItemType.File,
//       collapsibleState,
//       {
//         runtime,
//         testName,
//         path: currentPath,
//         isFile: false,
//       },
//       undefined,
//       new vscode.ThemeIcon("folder"),
//     );

//     treeItem.children = Object.entries(node.children || {})
//       .map(([childName, childNode]) =>
//         convertNodeToItem(
//           childName,
//           childNode,
//           runtime,
//           testName,
//           currentPath,
//         ),
//       )
//       .filter((item) => item !== null) as TestTreeItem[];

//     return treeItem;
//   } else if (node.type === "feature") {
//     console.log(
//       `[DEBUG] Converting feature node: ${name}, feature: ${node.feature}`,
//     );
//     const collapsibleState = vscode.TreeItemCollapsibleState.None;
//     const icon = new vscode.ThemeIcon("symbol-string");

//     const treeItem = new TestTreeItem(
//       node.name || name,
//       TreeItemType.File,
//       collapsibleState,
//       {
//         runtime,
//         testName,
//         isFeature: true,
//         feature: node.feature,
//         status: node.status || "unknown",
//         clickable: false,
//       },
//       undefined,
//       icon,
//     );

//     treeItem.tooltip = `Feature: ${node.feature}\nStatus: ${node.status}`;

//     return treeItem;
//   }

//   return null;
// }
