import * as vscode from 'vscode';
import { TreeItemType, type TreeItemData } from './types';

export class TestTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: TreeItemType,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data?: TreeItemData,
    public readonly command?: vscode.Command,
    public readonly iconPath?: vscode.ThemeIcon,
    contextValue?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    if (data?.description) {
      this.description = data.description;
    }
    this.iconPath = iconPath || this.getDefaultIcon();
    this.contextValue = contextValue || this.getContextValue();
  }

  private getDefaultIcon(): vscode.ThemeIcon | undefined {
    switch (this.type) {
      case TreeItemType.Runtime:
        return new vscode.ThemeIcon("symbol-namespace");
      case TreeItemType.Test:
        return new vscode.ThemeIcon("beaker");
      case TreeItemType.File:
        return new vscode.ThemeIcon("file");
      case TreeItemType.Info:
        return new vscode.ThemeIcon("info");
      default:
        return undefined;
    }
  }

  private getContextValue(): string {
    switch (this.type) {
      case TreeItemType.Runtime:
        return 'runtimeItem';
      case TreeItemType.Test:
        return 'testItem';
      case TreeItemType.File:
        return 'fileItem';
      case TreeItemType.Info:
        return 'infoItem';
      default:
        return 'unknown';
    }
  }
}
