import * as vscode from "vscode";
import { TestTreeItem } from "../TestTreeItem";
import { TreeItemType } from "../types";

export const createErrorItems = (runtimeKey: string, testName: string, error?: Error) => {
  return [
    new TestTreeItem(
      'Error loading files',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: error?.message || 'Unknown error',
        runtimeKey,
        testName,
      },
      undefined,
      new vscode.ThemeIcon('error')
    )
  ];
}
