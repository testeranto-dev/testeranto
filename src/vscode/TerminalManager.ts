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

  // Fetch aider processes from graph-data.json
  async fetchAiderProcesses(): Promise<any[]> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const graphDataPath = path.join(workspaceRoot, 'testeranto', 'reports', 'graph-data.json');
      
      if (!fs.existsSync(graphDataPath)) {
        return [];
      }

      const graphDataContent = fs.readFileSync(graphDataPath, 'utf-8');
      const graphData = JSON.parse(graphDataContent);
      
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

    // Get config key for the test
    const configKey = await this.getConfigKeyForTest(runtime, testName);
    if (!configKey) {
      terminal.sendText(`echo "Error: Could not find configuration for ${testName} (${runtime})"`);
      terminal.show();
      return terminal;
    }

    // Get the aider container name
    const containerName = this.getAiderContainerName(configKey, testName);

    // Get workspace root to find the message file
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      terminal.sendText(`echo "Error: Could not determine workspace root"`);
      terminal.show();
      return terminal;
    }

    // The container's working directory is /workspace
    // Use relative path from /workspace
    const relativeMessagePath = `testeranto/reports/${configKey}/${testName}/aider-message.txt`;
    
    // First, check if the container is running, start it if not
    terminal.sendText(`if ! docker ps --format "{{.Names}}" | grep -q "^${containerName}$"; then echo "Starting aider container..." && docker compose -f "${workspaceRoot}/testeranto/docker-compose.yml" up -d ${containerName} && sleep 2; fi`);
    
    // Run aider with the message file
    // Change to /workspace first, then pipe the file to aider
    terminal.sendText(`docker exec -i ${containerName} sh -c "cd /workspace && cat '${relativeMessagePath}' | aider --yes"`);

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
