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

  // Use the open-process-terminal endpoint to get the terminal command
  try {
    const nodeId = `aider_process:agent:${containerName}`;
    const response = await fetch('http://localhost:3000/~/open-process-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        label,
        containerId: containerId || containerName,
        serviceName: agentName || containerName
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.command) {
        vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: data.command });
      }
    }
  } catch (error) {
    // Fallback to the shared utility if open-process-terminal endpoint fails
    const command = generateTerminalCommand(
      containerId || containerName,
      containerName,
      label,
      !!agentName
    );
    vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: command });
  }

  terminal.show();
  return terminal;
}
