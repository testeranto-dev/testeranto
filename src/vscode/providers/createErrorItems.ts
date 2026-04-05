import { error } from "console";
import { TestTreeItem } from "../TestTreeItem";
import { TreeItemType } from "../types";

export const createErrorItems = (runtimeKey: string, testName: string) => {
  return [
    new TestTreeItem(
      'Error loading files',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: error.message || 'Unknown error',
        runtimeKey,
        testName,
      },
      undefined,
      new vscode.ThemeIcon('error')
    )
  ];
}