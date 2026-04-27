import * as vscode from 'vscode';
import { buildAgentCommand } from '../utilities/buildAgentCommand';
import { sendCommandToTerminal } from '../utilities/sendCommandToTerminal';

/**
 * Parse YAML front matter from a markdown string.
 * Returns the front matter fields and the body.
 */
function parseMarkdownFrontMatter(content: string): {
  readFiles: string[];
  addFiles: string[];
  personaBody: string;
} {
  // Expect frontmatter delimited by `---`
  if (!content.startsWith('---')) {
    // No frontmatter – treat the whole file as the persona body
    return {
      personaBody: content,
      readFiles: [],
      addFiles: [],
    };
  }

  // Find the closing `---`
  const endOfFrontmatter = content.indexOf('---', 3);
  if (endOfFrontmatter === -1) {
    // Malformed – treat whole file as body
    return {
      personaBody: content,
      readFiles: [],
      addFiles: [],
    };
  }

  const frontmatterRaw = content.slice(3, endOfFrontmatter).trim();
  const body = content.slice(endOfFrontmatter + 3).trim();

  // Simple YAML parser for read/add lists
  const readFiles: string[] = [];
  const addFiles: string[] = [];

  const lines = frontmatterRaw.split('\n');
  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('read:')) {
      currentKey = 'read';
    } else if (trimmed.startsWith('add:')) {
      currentKey = 'add';
    } else if (trimmed.startsWith('- ') && currentKey) {
      const value = trimmed.slice(2).trim();
      if (currentKey === 'read') {
        readFiles.push(value);
      } else if (currentKey === 'add') {
        addFiles.push(value);
      }
    }
  }

  return {
    personaBody: body,
    readFiles,
    addFiles,
  };
}

export function launchMarkdownAgentCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): vscode.Disposable {
  return vscode.commands.registerCommand('testeranto.launchMarkdownAgent', async (filePath: string) => {
    outputChannel.appendLine(`[Testeranto] Launching markdown agent from file: ${filePath}`);

    try {
      // Read the markdown file
      const uri = vscode.Uri.file(filePath);
      const fileContent = (await vscode.workspace.fs.readFile(uri)).toString();

      // Parse the YAML front matter
      const { readFiles, addFiles, personaBody } = parseMarkdownFrontMatter(fileContent);

      // Get workspace root
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();

      // Build the agent command
      const profile = filePath.split('/').pop()?.replace('.md', '') || 'agent';
      const command = buildAgentCommand(
        profile,
        personaBody,
        readFiles,
        addFiles,
        filePath,
        workspaceRoot,
      );

      // Send the command to a terminal
      sendCommandToTerminal(command, `Agent: ${profile}`);

      vscode.window.showInformationMessage(`Agent command ready for ${profile}. Press Enter in the terminal to start the container.`);
    } catch (error: any) {
      outputChannel.appendLine(`[Testeranto] Failed to launch markdown agent: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to launch markdown agent: ${error.message}`);
    }
  });
}
// import * as vscode from 'vscode';
// import { buildAgentCommand } from '../utilities/buildAgentCommand';
// import { sendCommandToTerminal } from '../utilities/sendCommandToTerminal';

// /**
//  * Parse YAML front matter from a markdown string.
//  * Returns the front matter fields and the body.
//  */
// function parseMarkdownFrontMatter(content: string): {
//   readFiles: string[];
//   addFiles: string[];
//   personaBody: string;
// } {
//   // Expect frontmatter delimited by `---`
//   if (!content.startsWith('---')) {
//     // No frontmatter – treat the whole file as the persona body
//     return {
//       personaBody: content,
//       readFiles: [],
//       addFiles: [],
//     };
//   }

//   // Find the closing `---`
//   const endOfFrontmatter = content.indexOf('---', 3);
//   if (endOfFrontmatter === -1) {
//     // Malformed – treat whole file as body
//     return {
//       personaBody: content,
//       readFiles: [],
//       addFiles: [],
//     };
//   }

//   const frontmatterRaw = content.slice(3, endOfFrontmatter).trim();
//   const body = content.slice(endOfFrontmatter + 3).trim();

//   // Simple YAML parser for read/add lists
//   const readFiles: string[] = [];
//   const addFiles: string[] = [];

//   const lines = frontmatterRaw.split('\n');
//   let currentKey: string | null = null;

//   for (const line of lines) {
//     const trimmed = line.trim();
//     if (trimmed.startsWith('read:')) {
//       currentKey = 'read';
//     } else if (trimmed.startsWith('add:')) {
//       currentKey = 'add';
//     } else if (trimmed.startsWith('- ') && currentKey) {
//       const value = trimmed.slice(2).trim();
//       if (currentKey === 'read') {
//         readFiles.push(value);
//       } else if (currentKey === 'add') {
//         addFiles.push(value);
//       }
//     }
//   }

//   return {
//     personaBody: body,
//     readFiles,
//     addFiles,
//   };
// }

// export function launchMarkdownAgentCommand(
//   context: vscode.ExtensionContext,
//   outputChannel: vscode.OutputChannel
// ): vscode.Disposable {
//   return vscode.commands.registerCommand('testeranto.launchMarkdownAgent', async (filePath: string) => {
//     outputChannel.appendLine(`[Testeranto] Launching markdown agent from file: ${filePath}`);

//     try {
//       // Read the markdown file
//       const uri = vscode.Uri.file(filePath);
//       const fileContent = (await vscode.workspace.fs.readFile(uri)).toString();

//       // Parse the YAML front matter
//       const { readFiles, addFiles, personaBody } = parseMarkdownFrontMatter(fileContent);

//       // Get workspace root
//       const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd();

//       // Build the agent command
//       const profile = filePath.split('/').pop()?.replace('.md', '') || 'agent';
//       const command = buildAgentCommand(
//         profile,
//         personaBody,
//         readFiles,
//         addFiles,
//         filePath,
//         workspaceRoot,
//       );

//       // Send the command to a terminal
//       sendCommandToTerminal(command, `Agent: ${profile}`);

//       vscode.window.showInformationMessage(`Agent command ready for ${profile}. Press Enter in the terminal to start the container.`);
//     } catch (error: any) {
//       outputChannel.appendLine(`[Testeranto] Failed to launch markdown agent: ${error.message}`);
//       vscode.window.showErrorMessage(`Failed to launch markdown agent: ${error.message}`);
//     }
//   });
// }
