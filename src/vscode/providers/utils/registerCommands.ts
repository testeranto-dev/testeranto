import * as vscode from 'vscode';
import { TerminalManager } from '../../TerminalManager';
import { ApiUtils } from './apiUtils';

export function registerCommands(
  context: vscode.ExtensionContext,
  terminalManager: TerminalManager,
  runtimeProvider: any,
  statusBarManager: any,
  dockerProcessProvider: any,
  aiderProcessProvider: any,
  fileTreeProvider: any,
  agentProvider?: any
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

  // Register the openProcessTerminal command
  const openProcessTerminalCommand = vscode.commands.registerCommand(
    'testeranto.openProcessTerminal',
    async (processId: string, processLabel: string, containerId: string, serviceName: string) => {
      console.log(`[openProcessTerminal] Opening terminal for process: ${processId}, container: ${containerId}`);
      
      // Create a terminal
      const terminal = vscode.window.createTerminal(`Process: ${processLabel}`);
      terminal.show();
      
      // If we have a container ID, attach to it
      if (containerId && containerId !== 'unknown') {
        terminal.sendText(`echo "Attaching to container ${containerId} (${serviceName})"`);
        terminal.sendText(`docker exec -it ${containerId} /bin/bash || docker exec -it ${containerId} /bin/sh || echo "Cannot exec into container"`);
      } else {
        terminal.sendText(`echo "Process: ${processLabel}"`);
        terminal.sendText(`echo "No container ID available for direct attachment"`);
        terminal.sendText(`echo "You can view logs with: docker logs [container_name]"`);
      }
    }
  );

  // Start server command
  const startServerCommand = vscode.commands.registerCommand('testeranto.startServer', async () => {
    try {
      const response = await fetch('http://localhost:3000/~/up', { method: 'POST' });
      if (response.ok) {
        vscode.window.showInformationMessage('Server started');
        statusBarManager.updateServerStatus();
      } else {
        vscode.window.showErrorMessage('Failed to start server');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error starting server: ${error.message}`);
    }
  });

  // Check server command
  const checkServerCommand = vscode.commands.registerCommand('testeranto.checkServer', async () => {
    try {
      const response = await fetch('http://localhost:3000/~/configs');
      if (response.ok) {
        vscode.window.showInformationMessage('Server is running');
      } else {
        vscode.window.showWarningMessage('Server responded with error');
      }
    } catch (error) {
      vscode.window.showErrorMessage('Cannot connect to server');
    }
  });

  // Send chat message command
  const sendChatMessageCommand = vscode.commands.registerCommand('testeranto.sendChatMessage', async () => {
    const agent = await vscode.window.showInputBox({ prompt: 'Enter agent name' });
    if (!agent) return;
    
    const message = await vscode.window.showInputBox({ prompt: 'Enter message' });
    if (!message) return;
    
    try {
      const url = ApiUtils.getChatUrl(agent, message);
      const response = await fetch(url);
      if (response.ok) {
        vscode.window.showInformationMessage(`Message sent to ${agent}`);
      } else {
        vscode.window.showErrorMessage('Failed to send message');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error sending message: ${error.message}`);
    }
  });

  // Refresh chat command
  const refreshChatCommand = vscode.commands.registerCommand('testeranto.refreshChat', () => {
    // This would refresh the chat provider if it exists
    vscode.window.showInformationMessage('Chat refreshed');
  });

  // Clear chat command
  const clearChatCommand = vscode.commands.registerCommand('testeranto.clearChat', () => {
    // This would clear the chat if we had a chat provider
    vscode.window.showInformationMessage('Chat cleared');
  });

  // Launch agent command
  const launchAgentCommand = vscode.commands.registerCommand('testeranto.launchAgent', async (agentName?: string) => {
    const name = agentName || await vscode.window.showInputBox({ prompt: 'Enter agent name' });
    if (!name) return;
    
    try {
      const url = ApiUtils.getLaunchAgentUrl(name);
      const response = await fetch(url, { method: 'POST' });
      if (response.ok) {
        vscode.window.showInformationMessage(`Agent ${name} launched`);
      } else {
        vscode.window.showErrorMessage('Failed to launch agent');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error launching agent: ${error.message}`);
    }
  });

  // Test logging command
  const testLoggingCommand = vscode.commands.registerCommand('testeranto.testLogging', () => {
    vscode.window.showInformationMessage('Test logging command works!');
    console.log('[Testeranto] Test command executed successfully');
  });

  return [
    refreshCommand,
    refreshDockerProcessesCommand,
    refreshAiderProcessesCommand,
    refreshFileTreeCommand,
    openFileCommand,
    openAiderTerminalCommand,
    restartAiderProcessCommand,
    openProcessTerminalCommand,
    startServerCommand,
    checkServerCommand,
    sendChatMessageCommand,
    refreshChatCommand,
    clearChatCommand,
    launchAgentCommand,
    testLoggingCommand
  ];
}
