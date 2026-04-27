// import * as vscode from 'vscode';

// export async function restartAiderProcess(
//   runtime: string,
//   testName: string,
//   terminals: Map<string, vscode.Terminal>,
//   getTerminalKey: (runtime: string, testName: string) => string
// ): Promise<void> {
//   try {
//     const key = getTerminalKey(runtime, testName);
//     let terminal = terminals.get(key);

//     if (!terminal || terminal.exitStatus !== undefined) {
//       terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
//       terminals.set(key, terminal);
//     }

//     terminal.sendText(`echo "To restart aider process for ${testName}, please use the server API"`);
//     terminal.sendText(`echo "The server manages all aider processes and graph updates"`);
//     terminal.show();

//     vscode.window.showInformationMessage(`Aider processes are managed by the server. Check the Aider Processes view.`);
//   } catch (error) {
//     console.error('Failed to handle aider process restart:', error);
//     vscode.window.showErrorMessage(`Failed to handle aider process: ${error}`);
//   }
// }
