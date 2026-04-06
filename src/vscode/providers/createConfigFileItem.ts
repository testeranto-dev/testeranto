import * as vscode from 'vscode';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';

export function createConfigFileItem(): TestTreeItem {
    const item = new TestTreeItem(
      "testeranto/testeranto.ts",
      TreeItemType.File,
      vscode.TreeItemCollapsibleState.None,
      {
        fileName: "testeranto/testeranto.ts",
        description: "Main configuration file",
        isFile: true,
        fileType: "config"
      },
      {
        command: "testeranto.openTesterantoConfig",
        title: "Open Testeranto Config",
        arguments: []
      },
      new vscode.ThemeIcon("settings-gear")
    );
    item.tooltip = "Click to open the main Testeranto configuration file";
    return item;
}
