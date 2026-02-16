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

  async createAiderTerminal(runtimeKey: string | string | any, testName: string | any): Promise<vscode.Terminal> {
    // Helper function to extract string value from various input types
    const extractString = (value: any, isRuntime: boolean = false): string => {
      if (typeof value === 'string') {
        return value;
      }
      if (value && typeof value === 'object') {
        // Try to extract from common object structures
        if (isRuntime) {
          // For runtime, try to get from data.runtime or just the value
          return value.runtimeKey || value.data?.runtimeKey || value.label || value.name || String(value);
        } else {
          // For testName, try various property names
          return value.testName || value.data?.testName || value.label || value.name || String(value);
        }
      }
      return String(value || 'unknown');
    };

    // Extract string values
    const runtimeStr = runtimeKey; //extractString(runtime, true);
    const testNameStr = extractString(testName, false);

    // createAiderTerminal called with runtime: "node", testName: "src/ts/Calculator.test.ts"
    console.log(`[TerminalManager] createAiderTerminal called with runtime: "${runtimeStr}", testName: "${testNameStr}"`);
    console.log(`[TerminalManager] Original runtime:`, runtimeKey);
    console.log(`[TerminalManager] Original testName:`, testName);

    const key = this.getTerminalKey(runtimeStr, testNameStr);
    let terminal = this.terminals.get(key);

    // If terminal exists and is still running, just show it
    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    // Create a new terminal
    terminal = vscode.window.createTerminal(`Aider: ${testNameStr} (${runtimeStr})`);
    this.terminals.set(key, terminal);

    // await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${aiderServiceName}`);

    terminal.sendText(`cd Code/testeranto-example-project`)
    const tname = `nodetests-src_ts_calculator-test-ts-aider`
    terminal.sendText(`docker compose -f "testeranto/docker-compose.yml" run -it ${tname} aider`);

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

  createAllTerminals(): void {
    // Create terminals for all aider processes
    this.createAiderTerminals().catch(error => {
      console.error('Error in createAllTerminals:', error);
    });
  }
}
