import * as vscode from 'vscode';
// import { fetchAiderProcesses } from './utilities/fetchAiderProcesses';
// import { createAiderTerminals as createAiderTerminalsUtil } from './utilities/createAiderTerminals';
import { createAiderTerminal as createAiderTerminalUtil } from './utilities/createAiderTerminal';
import { openContainerTerminal as openContainerTerminalUtil } from './utilities/openContainerTerminal';
// import { restartAiderProcess as restartAiderProcessUtil } from './utilities/restartAiderProcess';
import { openAiderTerminal as openAiderTerminalUtil } from './utilities/openAiderTerminal';
import { getWorkspaceRoot as getWorkspaceRootUtil } from './utilities/getWorkspaceRoot';

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

  // DEPRECATED
  // We do not use the API in this way
  // All data should be loaded from a json file
  // you will receive WS updates when this file changes
  // async fetchAiderProcesses(): Promise<any[]> {
  //   return fetchAiderProcesses();
  // }

  // Create terminals for all aider processes (but don't automatically start them)
  // async createAiderTerminals(): Promise<void> {
  //   return createAiderTerminalsUtil();
  // }

  async createAiderTerminal(runtime: string, testName: string): Promise<vscode.Terminal> {
    return createAiderTerminalUtil(
      runtime,
      testName,
      this.terminals,
      this.getTerminalKey.bind(this),
      this.getWorkspaceRoot.bind(this)
    );
  }

  // Open a terminal to a specific container
  async openContainerTerminal(containerName: string, label: string, agentName?: string, containerId?: string): Promise<vscode.Terminal> {
    return openContainerTerminalUtil(
      containerName,
      label,
      agentName,
      this.terminals,
      this.getWorkspaceRoot.bind(this),
      containerId
    );
  }

  // Restart a specific aider process
  // async restartAiderProcess(runtime: string, testName: string): Promise<void> {
  //   return restartAiderProcessUtil(runtime, testName, this.terminals, this.getTerminalKey.bind(this));
  // }

  // Open a terminal to a Docker process using the server API
  async openProcessTerminal(nodeId: string, label: string, containerId: string, serviceName: string): Promise<vscode.Terminal> {
    // Use the unified spawn endpoint
    return this.openContainerTerminal(containerId, label, undefined, containerId);
  }

  // Open a terminal to an aider container
  async openAiderTerminal(containerName: string, label: string, agentName?: string, containerId?: string): Promise<vscode.Terminal> {
    return openAiderTerminalUtil(
      containerName,
      label,
      agentName,
      this.terminals,
      this.getWorkspaceRoot.bind(this),
      containerId
    );
  }

  private getWorkspaceRoot(): string | null {
    return getWorkspaceRootUtil();
  }

  // createAllTerminals(): void {
  //   // Create terminals for all aider processes
  //   this.createAiderTerminals().catch(error => {
  //     console.error('Error in createAllTerminals:', error);
  //   });
  // }
}
