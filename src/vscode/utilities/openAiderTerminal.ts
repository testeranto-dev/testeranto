import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function openAiderTerminal(
  containerName: string,
  label: string,
  agentName: string | undefined,
  terminals: Map<string, vscode.Terminal>,
  getWorkspaceRoot: () => string | null,
  containerId?: string
): Promise<vscode.Terminal> {
  const key = `aider:${containerName}`;
  let terminal = terminals.get(key);

  if (terminal && terminal.exitStatus === undefined) {
    terminal.show();
    return terminal;
  }

  const terminalName = agentName ? `Aider: ${agentName}` : `Aider: ${label}`;
  terminal = vscode.window.createTerminal(terminalName);
  terminals.set(key, terminal);

  const nodeId = `aider_process:agent:${containerName}`;
  const response = await fetch('http://localhost:3000/~/open-process-terminal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodeId,
      label: label || `Aider: ${containerName}`,
      containerId: containerId || containerName,
      serviceName: agentName || `aider-${containerName}`
    })
  });

  const command = await response.text();
  vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: command });

  terminal.show();
  return terminal;
}
