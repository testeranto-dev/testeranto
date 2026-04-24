import * as vscode from 'vscode';
import { TerminalManager } from '../../TerminalManager';

export function registerCommands(
  context: vscode.ExtensionContext,
  terminalManager: TerminalManager,
  runtimeProvider: any,
  statusBarManager: any,
  dockerProcessProvider: any,
  aiderProcessProvider: any,
  fileTreeProvider: any,
  agentProvider?: any,
  viewTreeProvider?: any
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Refresh command
  const refreshCommand = vscode.commands.registerCommand('testeranto.refresh', () => {
    if (runtimeProvider && typeof runtimeProvider.refresh === 'function') {
      runtimeProvider.refresh();
    }
  });

  // Refresh Docker processes
  const refreshDockerProcessesCommand = vscode.commands.registerCommand('testeranto.refreshDockerProcesses', () => {
    if (dockerProcessProvider && typeof dockerProcessProvider.refresh === 'function') {
      dockerProcessProvider.refresh();
    }
  });

  // Refresh Aider processes
  const refreshAiderProcessesCommand = vscode.commands.registerCommand('testeranto.refreshAiderProcesses', () => {
    if (aiderProcessProvider && typeof aiderProcessProvider.refresh === 'function') {
      aiderProcessProvider.refresh();
    }
  });

  // Refresh file tree
  const refreshFileTreeCommand = vscode.commands.registerCommand('testeranto.refreshFileTree', () => {
    if (fileTreeProvider && typeof fileTreeProvider.refresh === 'function') {
      fileTreeProvider.refresh();
    }
  });

  // Refresh view tree
  const refreshViewTreeCommand = vscode.commands.registerCommand('testeranto.refreshViewTree', () => {
    if (viewTreeProvider && typeof viewTreeProvider.refresh === 'function') {
      viewTreeProvider.refresh();
    }
  });

  // Refresh agents
  const refreshAgentsCommand = vscode.commands.registerCommand('testeranto.refreshAgents', () => {
    if (agentProvider && typeof agentProvider.refresh === 'function') {
      agentProvider.refresh();
    }
  });

  // Open file command
  const openFileCommand = vscode.commands.registerCommand('testeranto.openFile', async (args: { fileName: string; runtime?: string }) => {
    try {
      const { fileName, runtime } = args;
      if (!fileName) {
        vscode.window.showErrorMessage('No file specified');
        return;
      }

      // Try to open the file in VS Code
      const document = await vscode.workspace.openTextDocument(fileName);
      await vscode.window.showTextDocument(document);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error opening file: ${error.message}`);
    }
  });

  // Register the openAiderTerminal command
  const openAiderTerminalCommand = vscode.commands.registerCommand(
    'testeranto.openAiderTerminal',
    async (runtime: string, testName: string, containerId: string) => {
      console.log(`[openAiderTerminal] Opening terminal for aider: ${testName} (${runtime}), container: ${containerId}`);
      const terminal = await terminalManager.createAiderTerminal(runtime, testName);
      terminal.show();

      // If we have a container ID, we could attach to it
      if (containerId && containerId !== 'unknown') {
        terminal.sendText(`echo "Aider process for ${testName} (${runtime})"`);
        terminal.sendText(`echo "Container ID: ${containerId}"`);
        terminal.sendText(`echo "To attach: docker exec -it ${containerId} /bin/bash"`);
      }
    }
  );

  // Restart aider process
  const restartAiderProcessCommand = vscode.commands.registerCommand('testeranto.restartAiderProcess', async (runtime: string, testName: string) => {
    try {
      await terminalManager.restartAiderProcess(runtime, testName);
      vscode.window.showInformationMessage(`Restarted aider process for ${testName}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error restarting aider process: ${error.message}`);
    }
  });

  return [
    refreshCommand,
    refreshDockerProcessesCommand,
    refreshAiderProcessesCommand,
    refreshFileTreeCommand,
    refreshViewTreeCommand,
    refreshAgentsCommand,
    openFileCommand,
    openAiderTerminalCommand,
    restartAiderProcessCommand,
  ];
}
