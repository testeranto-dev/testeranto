import * as vscode from 'vscode';
import { TerminalManager } from '../../TerminalManager';
import config from '../../../../testeranto/testeranto';

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
    async (containerName: string, label: string, agentName?: string, containerId?: string) => {
      console.log(`[openAiderTerminal] Opening terminal for aider: ${label} (${containerName}), agent: ${agentName}, container: ${containerId}`);
      // Use the openAiderTerminal utility which calls the server API with the correct node ID format
      const terminal = await terminalManager.openAiderTerminal(containerName, label, agentName, containerId);
      terminal.show();
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

  // Launch aider for a specific test with agent selection and optional message
  const launchAiderForTestCommand = vscode.commands.registerCommand('testeranto.launchAiderForTest', async (runtime: string, testName: string, configKey: string) => {
    try {
      // Determine agent profile selection
      const agentProfiles = Object.keys(config.agents || {});
      let selectedProfile: string | undefined;

      if (agentProfiles.length > 0) {
        const picked = await vscode.window.showQuickPick(
          agentProfiles,
          {
            placeHolder: 'Select agent profile',
            title: `Launch aider for ${testName}`
          }
        );

        if (!picked) {
          return; // User cancelled
        }
        selectedProfile = picked;
      }

      // Show input box pre-populated with the agent's message
      const agentConfig = selectedProfile ? config.agents?.[selectedProfile] : undefined;
      const defaultMessage = agentConfig?.message || '';
      const message = await vscode.window.showInputBox({
        prompt: 'Enter the message for aider to process (leave empty for interactive)',
        placeHolder: 'e.g., Fix the failing test by implementing the missing function',
        title: `Message for aider (${testName})`,
        value: defaultMessage,
        ignoreFocusOut: true
      });

      if (message === undefined) {
        return; // User cancelled
      }

      // Generate a unique requestUid for this async operation
      const requestUid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Call the server API to spawn an agent with test-specific load files
      const response = await fetch('http://localhost:3000/~/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: selectedProfile,
          message: message || undefined,
          testName,
          configKey,
          requestUid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      vscode.window.showInformationMessage(result.message);

      // Create a terminal and execute the returned shell script
      const terminal = vscode.window.createTerminal(`Agent: ${result.agentName}`);
      terminal.show();
      terminal.sendText(result.command);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error launching aider: ${error.message}`);
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
    launchAiderForTestCommand,
  ];
}
