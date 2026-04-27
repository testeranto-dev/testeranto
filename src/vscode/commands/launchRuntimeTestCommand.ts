import * as vscode from 'vscode';
import config from '../../../testeranto/testeranto';
import { buildRuntimeTestCommand } from '../utilities/buildAgentCommand';
import { sendCommandToTerminal } from '../utilities/sendCommandToTerminal';
import { getApiUrl } from '../../api';

export function launchRuntimeTestCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): vscode.Disposable {
  return vscode.commands.registerCommand('testeranto.runTest', async (
    runtimeArg?: string,
    testFileArg?: string,
    inputFilesArg?: string[]
  ) => {
    outputChannel.appendLine('[Testeranto] Running test...');
    try {
      let selectedRuntime: string;
      let selectedTestFile: string;
      let inputFiles: string[] = [];

      if (runtimeArg && testFileArg) {
        selectedRuntime = runtimeArg;
        selectedTestFile = testFileArg;
        inputFiles = inputFilesArg || [];
      } else {
        const runtimes = Object.keys(config.runtimes || {});
        if (runtimes.length === 0) {
          vscode.window.showErrorMessage('No runtimes configured');
          return;
        }

        const pickedRuntime = await vscode.window.showQuickPick(runtimes, {
          placeHolder: 'Select runtime to run test'
        });

        if (!pickedRuntime) {
          return;
        }
        selectedRuntime = pickedRuntime;

        const runtimeConfig = config.runtimes?.[selectedRuntime];
        if (!runtimeConfig) {
          vscode.window.showErrorMessage(`Runtime '${selectedRuntime}' not found in configuration`);
          return;
        }

        const testFiles = runtimeConfig.tests || [];
        if (testFiles.length === 0) {
          vscode.window.showErrorMessage(`No test files configured for runtime '${selectedRuntime}'`);
          return;
        }

        const pickedTestFile = await vscode.window.showQuickPick(testFiles, {
          placeHolder: 'Select test file to run'
        });

        if (!pickedTestFile) {
          return;
        }
        selectedTestFile = pickedTestFile;

        try {
          const apiUrl = getApiUrl('getRuntime');
          const response = await fetch(apiUrl, { signal: AbortSignal.timeout?.(3000) });
          if (response.ok) {
            const runtimeData = await response.json();
            const runtimeInfo = runtimeData.runtimes?.[selectedRuntime];
            if (runtimeInfo?.inputFiles?.[selectedTestFile]) {
              inputFiles = runtimeInfo.inputFiles[selectedTestFile];
            }
          }
        } catch (fetchError) {
          outputChannel.appendLine(`[Testeranto] Failed to fetch input files from graph: ${fetchError}`);
        }
      }

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();

      if (!inputFiles.includes('SOUL.md')) {
        inputFiles.push('SOUL.md');
      }
      if (!inputFiles.includes('README.md')) {
        inputFiles.push('README.md');
      }

      const defaultMessage = `Run the test file ${selectedTestFile}`;
      const editedMessage = await vscode.window.showInputBox({
        prompt: 'Edit the message for the test (or press Enter to keep default)',
        value: defaultMessage,
        placeHolder: 'Enter the message for the test',
        ignoreFocusOut: true,
      });
      if (editedMessage === undefined) {
        return;
      }
      const finalMessage = editedMessage;

      const command = buildRuntimeTestCommand(
        selectedRuntime,
        selectedTestFile,
        inputFiles,
        workspaceRoot,
        finalMessage
      );

      outputChannel.appendLine(`[Testeranto] Test command composed locally for runtime: ${selectedRuntime}, test: ${selectedTestFile}`);

      sendCommandToTerminal(command, `Test: ${selectedTestFile} (${selectedRuntime})`);

      vscode.window.showInformationMessage(`Test command ready for ${selectedTestFile}. Press Enter in the terminal to start the container.`);

    } catch (error: any) {
      outputChannel.appendLine(`[Testeranto] Failed to run test: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to run test: ${error.message}`);
    }
  });
}
