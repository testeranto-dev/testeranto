import * as vscode from 'vscode';
import { TerminalManager } from '../TerminalManager';

export function registerOpenAiderTerminalCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
  terminalManager: TerminalManager
): void {
  // Command is already registered by CommandManager
  // This function is kept for compatibility but does not register the command again
  outputChannel.appendLine('[Testeranto] Skipping duplicate registration of testeranto.openAiderTerminal (already registered by CommandManager)');
}
