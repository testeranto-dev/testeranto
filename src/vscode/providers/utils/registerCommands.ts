import * as vscode from 'vscode';
import { TerminalManager } from '../../TerminalManager';
import { launchMarkdownAgentCommand } from '../../commands/launchMarkdownAgentCommand';

export function registerCommands(
  context: vscode.ExtensionContext,
  terminalManager: TerminalManager,
  runtimeProvider: any,
  statusBarManager: any,
  dockerProcessProvider: any,
  // aiderProcessProvider: any,
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
  // const refreshAiderProcessesCommand = vscode.commands.registerCommand('testeranto.refreshAiderProcesses', () => {
  //   if (aiderProcessProvider && typeof aiderProcessProvider.refresh === 'function') {
  //     aiderProcessProvider.refresh();
  //   }
  // });

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
    async (containerName: string, label: string, agentName?: string, containerId?: string) => {
      console.log(`[openAiderTerminal] Opening terminal for aider: ${label} (${containerName}), agent: ${agentName}, container: ${containerId}`);
      // Use the openAiderTerminal utility which calls the server API with the correct node ID format
      const terminal = await terminalManager.openAiderTerminal(containerName, label, agentName, containerId);
      terminal.show();
    }
  );

  // Register the launchMarkdownAgent command
  const outputChannel = vscode.window.createOutputChannel('Testeranto');
  const launchMarkdownAgentDisposable = launchMarkdownAgentCommand(context, outputChannel);

  // Restart aider process
  // const restartAiderProcessCommand = vscode.commands.registerCommand('testeranto.restartAiderProcess', async (runtime: string, testName: string) => {
  //   try {
  //     await terminalManager.restartAiderProcess(runtime, testName);
  //     vscode.window.showInformationMessage(`Restarted aider process for ${testName}`);
  //   } catch (error: any) {
  //     vscode.window.showErrorMessage(`Error restarting aider process: ${error.message}`);
  //   }
  // });

  return [
    refreshCommand,
    refreshDockerProcessesCommand,
    // refreshAiderProcessesCommand,
    refreshFileTreeCommand,
    refreshViewTreeCommand,
    refreshAgentsCommand,
    openFileCommand,
    openAiderTerminalCommand,
    launchMarkdownAgentDisposable,
    // restartAiderProcessCommand,
  ];
}
