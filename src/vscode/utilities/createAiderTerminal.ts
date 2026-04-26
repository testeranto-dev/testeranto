import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function createAiderTerminal(
  runtime: string,
  testName: string,
  terminals: Map<string, vscode.Terminal>,
  getTerminalKey: (runtime: string, testName: string) => string,
  getWorkspaceRoot: () => string | null
): Promise<vscode.Terminal> {
  const key = getTerminalKey(runtime, testName);
  let terminal = terminals.get(key);

  if (terminal && terminal.exitStatus === undefined) {
    terminal.show();
    return terminal;
  }

  terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
  terminals.set(key, terminal);

  // Show immediate feedback
  terminal.sendText(`echo "Opening aider terminal for: ${testName}"`);
  terminal.sendText(`echo "Runtime: ${runtime}"`);
  terminal.sendText(`echo ""`);
  terminal.sendText(`echo "Note: Aider terminal support requires server implementation."`);
  terminal.sendText(`echo "This endpoint may not be fully implemented yet."`);
  terminal.sendText(`echo ""`);
  terminal.sendText(`echo "Attempting to connect to server..."`);

  try {
    const nodeId = `aider:${runtime}:${testName}`;
    const response = await fetch('http://localhost:3000/~/open-process-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        label: `Aider: ${testName}`,
        containerId: '',
        serviceName: `aider-${runtime}-${testName}`
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
      terminal.sendText(`echo "❌ Server error: ${errorData.error || 'Failed to open aider terminal'}"`);
      terminal.sendText(`echo "Message: ${errorData.message || 'No details provided'}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Aider terminals may require additional server configuration."`);
    } else {
      const data = await response.json();
      if (data.success && data.command) {
        terminal.sendText(`echo "✅ Server provided terminal command"`);
        terminal.sendText(`echo "Executing..."`);
        terminal.sendText(`echo ""`);
        terminal.sendText(data.command);
      } else {
        terminal.sendText(`echo "⚠️ Server response indicates failure"`);
        terminal.sendText(`echo "Error: ${data.error || 'Unknown error'}"`);
      }
    }
  } catch (error: any) {
    terminal.sendText(`echo "❌ Failed to connect to server"`);
    terminal.sendText(`echo "Error: ${error.message}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
  }

  terminal.show();
  return terminal;
}
