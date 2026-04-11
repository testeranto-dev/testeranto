import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { IRunTime } from '../Types';

export class TerminalManager {
  private terminals: Map<string, vscode.Terminal> = new Map();

  getTerminalKey(runtime: string, testName: string): string {
    return `${runtime}:${testName}`;
  }

  createTerminal(runtime: string, testName: string): vscode.Terminal {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = vscode.window.createTerminal(`Testeranto: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    return terminal;
  }

  getTerminal(runtime: string, testName: string): vscode.Terminal | undefined {
    const key = this.getTerminalKey(runtime, testName);
    return this.terminals.get(key);
  }

  showTerminal(runtime: string, testName: string): vscode.Terminal | undefined {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.show();
    }
    return terminal;
  }

  sendTextToTerminal(runtime: string, testName: string, text: string): void {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.sendText(text);
    }
  }

  disposeTerminal(runtime: string, testName: string): void {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = this.terminals.get(key);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(key);
    }
  }

  disposeAll(): void {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
  }


  async fetchAiderProcesses(): Promise<any[]> {
    try {
      // Use the server API to get aider processes
      const response = await fetch('http://localhost:3000/~/aider-processes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aiderProcesses || [];
    } catch (error) {
      console.error('Failed to fetch aider processes from server:', error);
      return [];
    }
  }

  // Create terminals for all aider processes (but don't automatically start them)
  async createAiderTerminals(): Promise<void> {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      console.log(`Found ${aiderProcesses.length} aider processes`);

      // Don't automatically create terminals for aider processes
      // Aider needs user interaction, so we'll only create terminals on demand
      // Just log the available aider processes
      for (const process of aiderProcesses) {
        console.log(`Aider process available: ${process.testName} (${process.runtime}) - ${process.isActive ? 'running' : 'stopped'}`);
      }
    } catch (error) {
      console.error('Failed to fetch aider processes:', error);
    }
  }

  async createAiderTerminal(runtime: string, testName: string): Promise<vscode.Terminal> {
    const key = this.getTerminalKey(runtime, testName);
    let terminal = this.terminals.get(key);

    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);

    // Show immediate feedback
    terminal.sendText(`echo "Opening aider terminal for: ${testName}"`);
    terminal.sendText(`echo "Runtime: ${runtime}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Note: Aider terminal support requires server implementation."`);
    terminal.sendText(`echo "This endpoint may not be fully implemented yet."`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Attempting to connect to server..."`);

    try {
      // Try to use the existing open-process-terminal endpoint with appropriate parameters
      // We'll construct a nodeId that indicates this is an aider terminal
      const nodeId = `aider:${runtime}:${testName}`;
      const response = await fetch('http://localhost:3000/~/open-process-terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        
        if (data.success && data.script) {
          terminal.sendText(`echo "✅ Server provided terminal script"`);
          terminal.sendText(`echo "Executing..."`);
          terminal.sendText(`echo ""`);
          
          // Execute the script directly (it's already executable)
          const workspaceRoot = this.getWorkspaceRoot();
          if (workspaceRoot) {
            const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
            fs.writeFileSync(scriptPath, data.script, { mode: 0o755 });
            // Run the script directly - it has a shebang line
            terminal.sendText(`"${scriptPath}" && rm -f "${scriptPath}"`);
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
      terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
    }

    terminal.show();
    return terminal;
  }

  // Open a terminal to a specific container
  async openContainerTerminal(containerName: string, label: string, agentName?: string): Promise<vscode.Terminal> {
    const key = `container:${containerName}`;
    let terminal = this.terminals.get(key);

    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    const terminalName = agentName ? `Aider: ${agentName}` : `Container: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);

    // Show immediate feedback
    terminal.sendText(`echo "Opening terminal to container: ${containerName}"`);
    terminal.sendText(`echo "Label: ${label}"`);
    if (agentName) {
      terminal.sendText(`echo "Agent: ${agentName}"`);
    }
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server..."`);

    try {
      // Use the existing open-process-terminal endpoint
      const nodeId = `container:${containerName}`;
      const response = await fetch('http://localhost:3000/~/open-process-terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nodeId,
          label: label || `Container: ${containerName}`,
          containerId: containerName,
          serviceName: agentName || containerName
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
        
        terminal.sendText(`echo "❌ Server error: ${errorData.error || 'Failed to open container terminal'}"`);
        terminal.sendText(`echo "Message: ${errorData.message || 'No details provided'}"`);
        terminal.sendText(`echo ""`);
        terminal.sendText(`echo "You may need to manually connect to the container:"`);
        terminal.sendText(`echo "  docker exec -it ${containerName} /bin/sh"`);
      } else {
        const data = await response.json();
        
        if (data.success && data.script) {
          terminal.sendText(`echo "✅ Server provided terminal script"`);
          terminal.sendText(`echo "Executing..."`);
          terminal.sendText(`echo ""`);
          
          // Execute the script without trapping signals
          const workspaceRoot = this.getWorkspaceRoot();
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

  // Restart a specific aider process
  async restartAiderProcess(runtime: string, testName: string): Promise<void> {
    try {
      // As a thin client, we should ask the server to restart the aider process
      // For now, we'll just create a new terminal and show a message
      const key = this.getTerminalKey(runtime, testName);
      let terminal = this.terminals.get(key);

      if (!terminal || terminal.exitStatus !== undefined) {
        terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
        this.terminals.set(key, terminal);
      }

      terminal.sendText(`echo "To restart aider process for ${testName}, please use the server API"`);
      terminal.sendText(`echo "The server manages all aider processes and graph updates"`);
      terminal.show();
      
      vscode.window.showInformationMessage(`Aider processes are managed by the server. Check the Aider Processes view.`);
    } catch (error) {
      console.error('Failed to handle aider process restart:', error);
      vscode.window.showErrorMessage(`Failed to handle aider process: ${error}`);
    }
  }


  // Open a terminal to a Docker process using the server API
  async openProcessTerminal(nodeId: string, label: string, containerId: string, serviceName: string): Promise<vscode.Terminal> {
    const key = `process:${nodeId}`;
    let terminal = this.terminals.get(key);

    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    const terminalName = `Process: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);

    // Show immediate feedback
    terminal.sendText(`echo "Opening terminal for: ${label}"`);
    terminal.sendText(`echo "Node ID: ${nodeId}"`);
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server to get container information..."`);

    try {
      // Call the server API to handle terminal creation
      const response = await fetch('http://localhost:3000/~/open-process-terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      if (data.success && data.script) {
        // Use the script provided by the server
        terminal.sendText(`echo "✅ Server provided terminal script"`);
        terminal.sendText(`echo "Executing..."`);
        terminal.sendText(`echo ""`);
        
        // The script from server already includes #!/bin/sh
        // We need to execute it properly
        // Write to a temporary file and execute it
        const workspaceRoot = this.getWorkspaceRoot();
        if (workspaceRoot) {
          const scriptPath = path.join(workspaceRoot, `.testeranto_terminal_${Date.now()}.sh`);
          fs.writeFileSync(scriptPath, data.script, { mode: 0o755 });
          terminal.sendText(`/bin/sh "${scriptPath}" && rm -f "${scriptPath}"`);
        } else {
          // Fallback: use heredoc to execute the script
          // Escape any single quotes in the script
          const escapedScript = data.script.replace(/'/g, "'\"'\"'");
          terminal.sendText(`/bin/sh << 'EOF'\n${escapedScript}\nEOF`);
        }
      } else {
        terminal.sendText(`echo "⚠️ Server response indicates failure"`);
        terminal.sendText(`echo "Error: ${data.error || 'Unknown error'}"`);
        terminal.sendText(`echo "Message: ${data.message || 'No message'}"`);
      }
    } catch (error: any) {
      // If server API fails
      terminal.sendText(`echo "❌ Failed to connect to server"`);
      terminal.sendText(`echo "Error: ${error.message}"`);
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "Make sure the Testeranto server is running on port 3000."`);
      terminal.sendText(`echo "Run 'testeranto dev' in your project to start the server."`);
    }
    
    terminal.show();
    return terminal;
  }

  // Open a terminal to an aider container
  async openAiderTerminal(containerName: string, label: string, agentName?: string): Promise<vscode.Terminal> {
    if (!containerName) {
      const terminal = vscode.window.createTerminal(`Aider: ${label}`);
      terminal.sendText(`echo "❌ Error: No container name provided for aider terminal"`);
      terminal.show();
      return terminal;
    }
    
    const key = `aider:${containerName}`;
    let terminal = this.terminals.get(key);

    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    const terminalName = agentName ? `Aider: ${agentName}` : `Aider: ${label}`;
    terminal = vscode.window.createTerminal(terminalName);
    this.terminals.set(key, terminal);

    // Show immediate feedback
    terminal.sendText(`echo "Opening aider terminal to container: ${containerName}"`);
    terminal.sendText(`echo "Label: ${label}"`);
    if (agentName) {
      terminal.sendText(`echo "Agent: ${agentName}"`);
    }
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "Connecting to server..."`);

    try {
      // Use the existing open-process-terminal endpoint
      const nodeId = `aider-container:${containerName}`;
      const response = await fetch('http://localhost:3000/~/open-process-terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          
          // Execute the script without trapping signals
          const workspaceRoot = this.getWorkspaceRoot();
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

  private getWorkspaceRoot(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return null;
  }

  createAllTerminals(): void {
    // Create terminals for all aider processes
    this.createAiderTerminals().catch(error => {
      console.error('Error in createAllTerminals:', error);
    });
  }

}
