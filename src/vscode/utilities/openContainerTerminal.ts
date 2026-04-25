import * as vscode from 'vscode';
import { generateTerminalCommand } from '../../server/serverClasses/v3/utils/vscode/generateTerminalCommand';

export async function openContainerTerminal(
  containerName: string,
  label: string,
  agentName: string | undefined,
  terminals: Map<string, vscode.Terminal>,
  getWorkspaceRoot: () => string | null,
  containerId?: string
): Promise<vscode.Terminal> {
  const key = `container:${containerName}`;
  let terminal = terminals.get(key);

  if (terminal && terminal.exitStatus === undefined) {
    terminal.show();
    return terminal;
  }

  const terminalName = agentName ? `Aider: ${agentName}` : `Container: ${label}`;
  terminal = vscode.window.createTerminal(terminalName);
  terminals.set(key, terminal);

  // Use the shared utility to generate the command
  const command = generateTerminalCommand(
    containerId || containerName,
    containerName,
    label,
    !!agentName
  );

  vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: command });

  terminal.show();
  return terminal;
}
