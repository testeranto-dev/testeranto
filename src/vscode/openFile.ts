import * as vscode from "vscode";
import * as path from "path";
import type { TestTreeItem } from "./TestTreeItem";
import { TreeItemType } from "./types";

export const openFile = () => {
  return vscode.commands.registerCommand(
    "testeranto.openFile",
    async (arg: TestTreeItem | { fileName: string; runtime?: string; testName?: string; isFile?: boolean; fileType?: string }) => {
      console.log('[CommandManager] openFile called with arg:', arg);

      let fileName: string | undefined;
      let itemLabel: string | undefined;

      // Handle both cases: TestTreeItem or data object
      if (arg && typeof arg === 'object') {
        if ('type' in arg && arg.type === TreeItemType.File) {
          // It's a TestTreeItem
          const item = arg as TestTreeItem;
          fileName = item.data?.fileName || item.label;
          itemLabel = item.label;
        } else if ('fileName' in arg) {
          // It's a data object passed via arguments
          fileName = arg.fileName;
          itemLabel = arg.fileName;
        }
      }

      if (!fileName) {
        console.error('[CommandManager] openFile called with invalid argument:', arg);
        vscode.window.showErrorMessage('Cannot open file: Invalid argument');
        return;
      }

      console.log('[CommandManager] Opening file:', fileName);
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri;
        let fileUri: vscode.Uri;

        if (fileName.startsWith('/')) {
          fileUri = vscode.Uri.file(fileName);
        } else {
          fileUri = vscode.Uri.joinPath(workspaceRoot, fileName);
        }
        console.log('[CommandManager] File URI:', fileUri.toString());

        try {
          const doc = await vscode.workspace.openTextDocument(fileUri);
          await vscode.window.showTextDocument(doc);
          console.log('[CommandManager] File opened successfully');
        } catch (err) {
          console.error('[CommandManager] Error opening file:', err);
          const files = await vscode.workspace.findFiles(`**/${path.basename(fileName)}`, null, 1);
          if (files.length > 0) {
            const doc = await vscode.workspace.openTextDocument(files[0]);
            await vscode.window.showTextDocument(doc);
          } else {
            vscode.window.showWarningMessage(`Could not open file: ${fileName}`);
          }
        }
      } else {
        vscode.window.showWarningMessage('No workspace folder open');
      }
    }
  )
}
