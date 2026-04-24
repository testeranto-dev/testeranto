import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function openAiderTerminal(
  containerName: string,
  label: string,
  agentName: string | undefined,
  terminals: Map<string, vscode.Terminal>,
  getWorkspaceRoot: () => string | null
): Promise<vscode.Terminal> {
  if (!containerName) {
    const terminal = vscode.window.createTerminal(`Aider: ${label}`);
    terminal.sendText(`echo "❌ Error: No container name provided for aider terminal"`);
    terminal.show();
    return terminal;
  }

  const key = `aider:${containerName}`;
  let terminal = terminals.get(key);

  if (terminal && terminal.exitStatus === undefined) {
    terminal.show();
    return terminal;
  }

  const terminalName = agentName ? `Aider: ${agentName}` : `Aider: ${label}`;
  terminal = vscode.window.createTerminal(terminalName);
  terminals.set(key, terminal);

  // Show immediate feedback
  terminal.sendText(`echo "Opening aider terminal to container: ${containerName}"`);
  terminal.sendText(`echo "Label: ${label}"`);
  if (agentName) {
    terminal.sendText(`echo "Agent: ${agentName}"`);
  }
  terminal.sendText(`echo ""`);
  terminal.sendText(`echo "Connecting to server..."`);

  try {
    const nodeId = `aider-container:${containerName}`;
    const response = await fetch('http://localhost:3000/~/open-process-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        label: label || `Aider: ${containerName}`,
        containerId: containerName,
        serviceName: agentName || `aider-${containerName}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Server error: ${response.status} ${response.statusText}` };
      }
      terminal.sendText(`echo "❌ Server error: ${errorData.error || 'Failed to open aider container terminal'}"`);
      terminal.sendText(`echo "Message: ${errorData.message || 'No details provided'}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "You may need to manually attach to the aider container:"`);
      terminal.sendText(`echo "  docker attach ${containerName}"`);
      terminal.sendText(`echo "  (Use Ctrl+P, Ctrl+Q to detach)"`);
    } else {
      const data = await response.json();
      if (data.success && data.script) {
        terminal.sendText(`echo "✅ Server provided terminal script"`);
        terminal.sendText(`echo "Executing..."`);
        terminal.sendText(`echo ""`);
        const workspaceRoot = getWorkspaceRoot();
        if (workspaceRoot) {
          const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
          fs.writeFileSync(scriptPath, data.script, { mode: 0o755 });
          terminal.sendText(`/bin/sh "${scriptPath}" && rm -f "${scriptPath}"`);
        } else {
          const escapedScript = data.script.replace(/'/g, "'\"'\"'");
          terminal.sendText(`/bin/sh << 'EOF'\n${escapedScript}\nEOF`);
        }
      } else {
        terminal.sendText(`echo "⚠️ Server response indicates failure"`);
        terminal.sendText(`echo "Error: ${data.error || 'Unknown error'}"`);
      }
    }
  } catch (error: any) {
    terminal.sendText(`echo "❌ Failed to connect to server"`);
    terminal.sendText(`echo "Error: ${error.message}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Make sure the Testeranto server is running."`);
  }

  terminal.show();
  return terminal;
}
