import * as vscode from 'vscode';
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

  // Fetch aider processes from the server
  async fetchAiderProcesses(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:3000/~/aider-processes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aiderProcesses || [];
    } catch (error) {
      console.error('Failed to fetch aider processes:', error);
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

    // Get config key for the test
    const configKey = await this.getConfigKeyForTest(runtime, testName);
    if (!configKey) {
      // Try to fetch configs and log them for debugging
      try {
        const response = await fetch('http://localhost:3000/~/configs');
        if (response.ok) {
          const data = await response.json();
          terminal.sendText(`echo "Available configs:"`);
          if (data.configs && data.configs.runtimes) {
            for (const [key, value] of Object.entries(data.configs.runtimes)) {
              const config = value as any;
              terminal.sendText(`echo "  ${key}: runtime=${config.runtime}, tests=${JSON.stringify(config.tests || [])}"`);
            }
          }
        }
      } catch (error) {
        // Ignore
      }
      terminal.sendText(`echo "Error: Could not find configuration for ${testName} (${runtime})"`);
      terminal.sendText(`echo "Trying to guess container name..."`);
      
      // Try to guess the container name
      const guessedConfigKey = runtime.toLowerCase().includes('web') ? 'webtests' : runtime;
      const containerName = this.getAiderContainerName(guessedConfigKey, testName);
      terminal.sendText(`echo "Guessed container: ${containerName}"`);
      terminal.sendText(`docker exec -it ${containerName} /bin/bash || echo "Failed to connect to container"`);
      terminal.show();
      return terminal;
    }

    // Get the aider container name
    const containerName = this.getAiderContainerName(configKey, testName);
    
    // Get workspace root
    const workspaceRoot = this.getWorkspaceRoot();
    
    if (workspaceRoot) {
      terminal.sendText(`echo "=== Testeranto Aider Session ==="`);
      terminal.sendText(`echo "Test: ${testName}"`);
      terminal.sendText(`echo "Runtime: ${runtime}"`);
      terminal.sendText(`echo "Config: ${configKey}"`);
      terminal.sendText(`echo "Container: ${containerName}"`);
      terminal.sendText(`echo ""`);
      
      // Check if container is running
      terminal.sendText(`echo "1. Checking if container is running..."`);
      terminal.sendText(`if docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then echo "   ✓ Container is running"; else echo "   ⚠ Container not running, starting..." && docker compose -f "${workspaceRoot}/testeranto/docker-compose.yml" up -d ${containerName} && sleep 2; fi`);
      
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "2. Checking for aider message file..."`);
      const messageFilePath = `${workspaceRoot}/testeranto/reports/${configKey}/${testName}/aider-message.txt`;
      terminal.sendText(`if [ -f "${messageFilePath}" ]; then echo "   ✓ Found aider message file at ${messageFilePath}"; else echo "   ⚠ Aider message file not found at ${messageFilePath}"; fi`);
      
      terminal.sendText(`echo ""`);
      terminal.sendText(`echo "3. Starting interactive aider session..."`);
      terminal.sendText(`echo "   Type 'exit' to leave the container shell"`);
      terminal.sendText(`echo ""`);
      
      // Connect to the container with an interactive shell
      terminal.sendText(`docker exec -it ${containerName} /bin/bash -c "cd /workspace && echo 'Welcome to the aider container for ${testName}!' && echo '' && echo 'To start aider with the message file, run:' && echo '  cat /workspace/testeranto/reports/${configKey}/${testName}/aider-message.txt | aider --yes' && echo '' && echo 'Or start aider normally:' && echo '  aider' && echo '' && echo 'Current directory: \$(pwd)' && echo 'Files in current directory:' && ls -la && echo '' && /bin/bash"`);
    } else {
      terminal.sendText(`echo "Error: Could not determine workspace root"`);
      terminal.sendText(`echo "Trying to connect to container ${containerName}..."`);
      terminal.sendText(`docker exec -it ${containerName} /bin/bash`);
    }

    terminal.show();
    return terminal;
  }

  // Restart a specific aider process
  async restartAiderProcess(runtime: string, testName: string): Promise<void> {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      const process = aiderProcesses.find(p =>
        p.runtime === runtime && p.testName === testName
      );

      if (process) {
        const key = this.getTerminalKey(runtime, testName);
        let terminal = this.terminals.get(key);

        if (!terminal || terminal.exitStatus !== undefined) {
          terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
          this.terminals.set(key, terminal);
        }

        // Restart the container
        terminal.sendText(`docker restart ${process.containerId}`);
        // Wait a bit and then connect
        terminal.sendText(`sleep 2 && docker exec -it ${process.containerId} /bin/bash`);
        terminal.show();
      } else {
        vscode.window.showErrorMessage(`No aider process found for ${testName} (${runtime})`);
      }
    } catch (error) {
      console.error('Failed to restart aider process:', error);
      vscode.window.showErrorMessage(`Failed to restart aider process: ${error}`);
    }
  }

  private async getConfigKeyForTest(runtime: string, testName: string): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:3000/~/configs');
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
    // Clean the test name to match the container naming convention used in Server_Docker_Constants
    // We need to replicate the cleanTestName function from Server_Docker_Constants.ts
    // First, get just the filename without path
    const testFileName = testName.split('/').pop() || testName;
    const cleanTestName = testFileName
      .toLowerCase()
      .replaceAll("/", "_")
      .replaceAll(".", "-")
      .replace(/[^a-z0-9_-]/g, "");
    const cleanConfigKey = configKey.toLowerCase();
    return `${cleanConfigKey}-${cleanTestName}-aider`;
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
