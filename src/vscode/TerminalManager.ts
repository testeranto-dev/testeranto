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

      // Extract aider nodes from graph
      const aiderNodes = graphData.data?.unifiedGraph?.nodes?.filter((node: any) =>
        node.type === 'aider' || node.type === 'aider_process'
      ) || [];

      return aiderNodes.map((node: any) => {
        const metadata = node.metadata || {};
        return {
          id: node.id,
          containerId: metadata.containerId || 'unknown',
          containerName: metadata.aiderServiceName || metadata.containerName || 'unknown',
          runtime: metadata.runtime || 'unknown',
          testName: metadata.testName || 'unknown',
          configKey: metadata.configKey || 'unknown',
          isActive: metadata.isActive || false,
          status: metadata.status || 'stopped',
          exitCode: metadata.exitCode,
          startedAt: metadata.startedAt || '',
          lastActivity: metadata.lastActivity
        };
      });
    } catch (error) {
      console.error('Failed to fetch aider processes from graph:', error);
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

    // Try to get the container name and attach to it
    const configKey = await this.getConfigKeyForTest(runtime, testName);
    if (configKey) {
      const containerName = this.getAiderContainerName(configKey, testName);
      // Send the entire script as a single command using POSIX sh syntax
      const script = `echo "Checking container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container is running. Attaching...";
  case "${containerName}" in
    *-builder)
      echo "Container is a builder container. Showing logs...";
      docker logs -f ${containerName}
      ;;
    *)
      echo "Container is not a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} is not running.";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "To start the container, run:";
  echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}";
  echo "";
fi
echo "Starting interactive shell...";
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec sh -i
fi`;
      terminal.sendText(script);
    } else {
      // Send a simpler script when config not found - wrap in a subshell
      const script = `bash -c '
set +e  # Continue on errors
echo "Could not find configuration for ${testName} (${runtime})"
echo "Aider and agent services are created as Docker services at server startup."
echo ""
echo "Available containers:"
docker ps --format "{{.Names}}"
echo ""
# Always start an interactive shell to keep terminal open
echo "Starting interactive shell..."
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec bash -i
fi
'`.trim();
      terminal.sendText(script);
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

    // Send the entire script as a single command using POSIX sh syntax
    let script: string;
    script = `echo "Checking container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container is running. Attaching...";
  case "${containerName}" in
    *-builder)
      echo "Container is a builder container. Showing logs...";
      docker logs -f ${containerName}
      ;;
    *)
      echo "Container is not a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} is not running.";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "To start the container, run:";
  echo "  docker compose -f testeranto/docker-compose.yml up -d ${containerName}";
  echo "";
fi
echo "Starting interactive shell...";
if [ -n "$SHELL" ]; then
  exec "$SHELL"
else
  exec sh -i
fi`;
    terminal.sendText(script);
    
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

  private async getConfigKeyForTest(runtime: string, testName: string): Promise<string | null> {
    try {
      const response = await fetch(ApiUtils.getConfigsUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.configs && data.configs.runtimes) {
        for (const [configKey, configValue] of Object.entries(data.configs.runtimes)) {
          const runtimeConfig = configValue as any;
          // Check if runtime matches (handle cases like 'webtests' vs 'web')
          const runtimeMatches =
            runtimeConfig.runtime === runtime ||
            configKey.toLowerCase().includes(runtime.toLowerCase()) ||
            runtime.toLowerCase().includes(configKey.toLowerCase());

          if (runtimeMatches) {
            const tests = runtimeConfig.tests || [];
            // Try exact match first
            if (tests.includes(testName)) {
              return configKey;
            }
            // Try matching by filename (without path)
            const testFileName = testName.split('/').pop();
            if (testFileName && tests.includes(testFileName)) {
              return configKey;
            }
            // Try matching any test that contains the testName as a substring
            for (const test of tests) {
              if (test.includes(testName) || testName.includes(test)) {
                return configKey;
              }
            }
            // Try cleaning the test name and comparing
            const cleanTestName = testName
              .toLowerCase()
              .replaceAll("/", "_")
              .replaceAll(".", "-")
              .replace(/[^a-z0-9_-]/g, "");
            for (const test of tests) {
              const cleanTest = test
                .toLowerCase()
                .replaceAll("/", "_")
                .replaceAll(".", "-")
                .replace(/[^a-z0-9_-]/g, "");
              if (cleanTest === cleanTestName) {
                return configKey;
              }
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      return null;
    }
  }

  private getAiderContainerName(configKey: string, testName: string): string {
    // Replicate the exact cleaning logic from Server_Docker_Constants.cleanTestName
    const cleanTestName = testName
      .toLowerCase()
      .replaceAll("/", "_")
      .replaceAll(".", "-")
      .replace(/[^a-z0-9_-]/g, "");
    const cleanConfigKey = configKey.toLowerCase();
    // The aider service name is generated using getAiderServiceName(uid) where uid = `${cleanConfigKey}-${cleanTestName}`
    // So the container name should be `${cleanConfigKey}-${cleanTestName}-aider`
    return `${cleanConfigKey}-${cleanTestName}-aider`;
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

    try {
      // Call the server API to get container information
      const response = await fetch('http://localhost:3000/~/open-process-terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodeId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorScript = `echo "Error: ${errorData.error || 'Failed to open terminal'}";
echo "Server response: ${JSON.stringify(errorData)}";
# Keep terminal open for debugging
exec $SHELL || exec bash -i`;
        terminal.sendText(errorScript);
        terminal.show();
        return terminal;
      }

      const data = await response.json();
      
      if (data.success) {
        const containerIdentifier = data.containerIdentifier;
        const containerStatus = data.containerStatus;
        
        // Send the entire script as a single command using POSIX sh syntax
        let script: string;
        // Use case statement for pattern matching
        script = `echo "Opening terminal to container: ${containerIdentifier}";
echo "Node ID: ${nodeId}";
echo "Type: ${data.nodeType}";
echo "";
case "${containerIdentifier}" in
  *-builder)
    echo "Container is a builder container. Showing logs (Ctrl+C to stop):";
    docker logs -f ${containerIdentifier}
    ;;
  *agent-*|*aider*)
    echo "Container is an agent or aider container. Attaching (Ctrl+P, Ctrl+Q to detach):";
    docker attach ${containerIdentifier}
    ;;
  *)
    echo "Container is not a builder/agent/aider container. Attaching:";
    docker exec -it ${containerIdentifier} /bin/sh
    ;;
esac`;
        terminal.sendText(script);
      } else {
        const errorScript = `echo "Server reported failure: ${data.error || 'Unknown error'}";
# Keep terminal open for debugging
exec $SHELL || exec sh -i`;
        terminal.sendText(errorScript);
      }
    } catch (error: any) {
      // If server API fails, don't try fallback - just show error
      const errorScript = `echo "Error calling server API: ${error.message}";
echo "Cannot open terminal without server connection.";
exec $SHELL || exec sh -i`;
      terminal.sendText(errorScript);
    }
    
    terminal.show();
    return terminal;
  }

  // Open a terminal to an aider container
  async openAiderTerminal(containerName: string, label: string, agentName?: string): Promise<vscode.Terminal> {
    // For aider terminals, we need to find the node ID first
    // Since we don't have it directly, we'll use the container name
    // In a real implementation, we should pass nodeId from the tree item
    // For now, use the container name directly
    
    if (!containerName) {
      const terminal = vscode.window.createTerminal(`Aider: ${label}`);
      terminal.sendText(`echo "Error: No container name provided for aider terminal"`);
      terminal.sendText(`echo "Available containers:"`);
      terminal.sendText(`docker ps --format "{{.Names}}"`);
      terminal.sendText(`exec $SHELL || exec bash -i`);
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

    // Send the entire script as a single command using POSIX sh syntax
    let script: string;
    // Use case statement for pattern matching in POSIX sh
    script = `echo "Opening terminal to container: ${containerName}";
if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then
  echo "Container found. Attaching...";
  case "${containerName}" in
    *agent-*|*aider*)
      echo "Container is an agent or aider container. Using docker attach to connect to aider process...";
      echo "Note: To detach, use Ctrl+P, Ctrl+Q";
      docker attach ${containerName}
      ;;
    *-builder)
      echo "Container is a builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
    *)
      echo "Container is not an agent/aider/builder container. Using docker exec with sh...";
      docker exec -it ${containerName} /bin/sh
      ;;
  esac
else
  echo "Container ${containerName} not found";
  echo "Available containers:";
  docker ps --format "{{.Names}}";
  echo "";
  echo "Starting host shell...";
  exec $SHELL || exec sh -i
fi`;
    terminal.sendText(script);
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
