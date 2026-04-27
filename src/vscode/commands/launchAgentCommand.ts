import * as vscode from 'vscode';
import config from '../../../testeranto/testeranto';
import { buildAgentCommand } from '../utilities/buildAgentCommand';
import { sendCommandToTerminal } from '../utilities/sendCommandToTerminal';
import { getApiUrl } from '../../api';

export function launchAgentCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): vscode.Disposable {
  return vscode.commands.registerCommand('testeranto.launchAgent', async () => {
    outputChannel.appendLine('[Testeranto] Launching agent...');
    try {
      const profiles = Object.keys(config.agents || {});
      if (profiles.length === 0) {
        vscode.window.showErrorMessage('No agent profiles configured');
        return;
      }

      const selectedProfile = await vscode.window.showQuickPick(profiles, {
        placeHolder: 'Select agent profile to launch'
      });

      if (!selectedProfile) {
        return;
      }

      const agentConfig = config.agents?.[selectedProfile];
      if (!agentConfig) {
        vscode.window.showErrorMessage(`Agent profile '${selectedProfile}' not found in configuration`);
        return;
      }

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();

      const apiUrl = getApiUrl('getAgentSlice', { agentName: selectedProfile });
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout?.(3000) });
      if (!response.ok) {
        throw new Error(`Failed to fetch agent data from server: ${response.status}`);
      }
      const agentData = await response.json();
      const metadata = agentData.metadata || {};
      const personaBody = metadata.personaBody || "";
      const readFiles: string[] = metadata.readFiles || [];
      const addFiles: string[] = metadata.addFiles || [];
      const personaFilePath = metadata.personaFilePath || "";

      const editedMessage = await vscode.window.showInputBox({
        prompt: 'Edit the message for the agent (or press Enter to keep default)',
        value: personaBody,
        placeHolder: 'Enter the message for the agent',
        ignoreFocusOut: true,
      });
      if (editedMessage === undefined) {
        return;
      }
      const finalMessage = editedMessage;

      const command = buildAgentCommand(
        selectedProfile,
        finalMessage,
        readFiles,
        addFiles,
        personaFilePath,
        workspaceRoot,
      );

      outputChannel.appendLine(`[Testeranto] Agent command composed locally for profile: ${selectedProfile}`);

      sendCommandToTerminal(command, `Agent: ${selectedProfile}`);

      vscode.window.showInformationMessage(`Agent command ready for ${selectedProfile}. Press Enter in the terminal to start the container.`);

    } catch (error: any) {
      outputChannel.appendLine(`[Testeranto] Failed to launch agent: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to launch agent: ${error.message}`);
    }
  });
}
