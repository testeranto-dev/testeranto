import * as vscode from 'vscode';

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

  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      terminal.sendText(`echo "Error: ${errorText}"`);
    } else {
      const data = await response.json();
      if (data.command) {
        terminal.sendText(data.command);
      } else {
        terminal.sendText(`echo "No command returned from open-process-terminal endpoint"`);
      }
    }
  } catch (error: any) {
    terminal.sendText(`echo "Error: ${error.message}"`);
  }

  terminal.show();
  return terminal;
}
