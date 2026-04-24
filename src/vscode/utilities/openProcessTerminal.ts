import * as vscode from 'vscode';

export async function openProcessTerminal(
  nodeId: string,
  label: string,
  containerId: string,
  serviceName: string,
  terminals: Map<string, vscode.Terminal>,
  getWorkspaceRoot: () => string | null
): Promise<vscode.Terminal> {
  const key = `process:${nodeId}`;
  let terminal = terminals.get(key);

  if (terminal && terminal.exitStatus === undefined) {
    terminal.show();
    return terminal;
  }

  const terminalName = `Process: ${label}`;
  terminal = vscode.window.createTerminal(terminalName);
  terminals.set(key, terminal);

  // Show immediate feedback
  terminal.sendText(`echo "Opening terminal for: ${label}"`);
  terminal.sendText(`echo "Node ID: ${nodeId}"`);
  terminal.sendText(`echo ""`);
  terminal.sendText(`echo "Connecting to server to get container information..."`);

  try {
    const response = await fetch('http://localhost:3000/~/open-process-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, label, containerId, serviceName })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Server error: ${response.status} ${response.statusText}` };
      }
      terminal.sendText(`echo "❌ Server error: ${errorData.error || 'Failed to open terminal'}"`);
      terminal.sendText(`echo "Message: ${errorData.message || 'No details provided'}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Note: The server may not support this type of terminal."`);
      terminal.sendText(`echo "Check server logs for more information."`);
      terminal.show();
      return terminal;
    }

    const data = await response.json();

    if (data.success && data.command) {
      terminal.sendText(`echo "✅ Server provided terminal command"`);
      terminal.sendText(`echo "Container: ${data.containerId || 'unknown'}"`);
      terminal.sendText(`echo "Service: ${data.serviceName || 'unknown'}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "To detach from the container without stopping it:"`);
      terminal.sendText(`echo "  Press Ctrl+P, Ctrl+Q"`);
      terminal.sendText(`echo "To send Ctrl+C to the container:"`);
      terminal.sendText(`echo "  Press Ctrl+C"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Running command..."`);
      terminal.sendText(`echo ""`);
      terminal.sendText(data.command);
    } else {
      terminal.sendText(`echo "⚠️ Server response indicates failure"`);
      terminal.sendText(`echo "Error: ${data.error || 'Unknown error'}"`);
      terminal.sendText(`echo "Message: ${data.message || 'No message'}"`);
    }
  } catch (error: any) {
    terminal.sendText(`echo "❌ Failed to connect to server"`);
    terminal.sendText(`echo "Error: ${error.message}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
    terminal.sendText(`echo "Run 'testeranto dev' in your project to start the server."`);
  }

  terminal.show();
  return terminal;
}
