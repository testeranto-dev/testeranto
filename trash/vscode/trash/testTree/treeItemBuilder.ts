// import * as vscode from "vscode";
// import { TestTreeItem } from "../../../TestTreeItem";
// import { TreeItemType } from "../../../types";

// export function createRefreshItem(): TestTreeItem {
//   return new TestTreeItem(
//     "Refresh now",
//     TreeItemType.Info,
//     vscode.TreeItemCollapsibleState.None,
//     {
//       description: "Update configuration from server",
//       refresh: true,
//     },
//     {
//       command: "testeranto.refresh",
//       title: "Refresh",
//       arguments: [],
//     },
//     new vscode.ThemeIcon(
//       "refresh",
//       new vscode.ThemeColor("testing.iconQueued"),
//     ),
//   );
// }

// export function createRuntimeCountItem(count: number): TestTreeItem {
//   return new TestTreeItem(
//     `📊 ${count} Runtime(s)`,
//     TreeItemType.Info,
//     vscode.TreeItemCollapsibleState.None,
//     {
//       description: "From HTTP /~/configs endpoint",
//       count: count,
//     },
//     undefined,
//     new vscode.ThemeIcon(
//       "server",
//       new vscode.ThemeColor("testing.iconUnset"),
//     ),
//   );
// }

// export function createRuntimeItem(runtimeKey: string, config: any): TestTreeItem {
//   return new TestTreeItem(
//     `${runtimeKey} (${config.runtime})`,
//     TreeItemType.Runtime,
//     vscode.TreeItemCollapsibleState.Collapsed,
//     {
//       runtime: config.runtime,
//       runtimeKey: runtimeKey,
//       testsCount: config.tests?.length || 0,
//     },
//     undefined,
//     new vscode.ThemeIcon("symbol-namespace"),
//   );
// }

// export function createTestItem(runtimeKey: string, testName: string): TestTreeItem {
//   const item = new TestTreeItem(
//     testName,
//     TreeItemType.Test,
//     vscode.TreeItemCollapsibleState.Collapsed,
//     { runtimeKey, testName },
//     {
//       command: "testeranto.launchAiderTerminal",
//       title: "Launch Aider",
//       arguments: [{ runtimeKey, testName }],
//     },
//     new vscode.ThemeIcon("beaker"),
//     "testItemWithAider",
//   );
//   item.tooltip = `Click to launch aider for this test.`;
//   return item;
// }

// export function createNoFilesItem(runtimeKey: string, testName: string): TestTreeItem[] {
//   return [
//     new TestTreeItem(
//       "No files found for this test",
//       TreeItemType.File,
//       vscode.TreeItemCollapsibleState.None,
//       {
//         runtimeKey,
//         testName,
//         description: `Check server logs for ${runtimeKey}/${testName}`,
//       },
//       undefined,
//       new vscode.ThemeIcon("info"),
//     ),
//     new TestTreeItem(
//       "Click to refresh",
//       TreeItemType.Info,
//       vscode.TreeItemCollapsibleState.None,
//       {
//         runtimeKey,
//         testName,
//         refresh: true,
//       },
//       {
//         command: "testeranto.refresh",
//         title: "Refresh",
//         arguments: [],
//       },
//       new vscode.ThemeIcon("refresh"),
//     ),
//   ];
// }

// // export function createErrorItems(runtimeKey: string, testName: string, error: any): TestTreeItem[] {
// //   return [
// //     new TestTreeItem(
// //       "Error loading files",
// //       TreeItemType.File,
// //       vscode.TreeItemCollapsibleState.None,
// //       {
// //         runtimeKey,
// //         testName,
// //         description: error.message,
// //       },
// //       undefined,
// //       new vscode.ThemeIcon("error"),
// //     ),
// //     new TestTreeItem(
// //       "Check if server is running",
// //       TreeItemType.Info,
// //       vscode.TreeItemCollapsibleState.None,
// //       {
// //         runtimeKey,
// //         testName,
// //         serverCheck: true,
// //       },
// //       {
// //         command: "testeranto.startServer",
// //         title: "Start Server",
// //         arguments: [],
// //       },
// //       new vscode.ThemeIcon("server"),
// //     ),
// //   ];
// // }
