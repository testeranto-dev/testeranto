import * as vscode from 'vscode';

/**
 * Opens a new VS Code terminal and sends the given command as a single input.
 * Sends a newline first to clear any shell banner, then sends the command.
 *
 * @param command      The full command string to execute.
 * @param terminalName A descriptive name for the terminal tab.
 */
export function sendCommandToTerminal(command: string, terminalName: string): void {
  const terminal = vscode.window.createTerminal(terminalName);
  terminal.show();

  // Send a newline to clear any banner, then send the command
  terminal.sendText('', true);
  terminal.sendText(command, true);
}
