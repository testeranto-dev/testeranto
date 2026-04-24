// import * as vscode from "vscode";
// import { registerTestCommands } from '../../commands/testCommands';
// import { registerProcessCommands } from '../../commands/processCommands';
// import { registerAgentCommands } from '../../commands/agentCommands';
// import { registerServerCommands } from '../../commands/serverCommands';
// import { registerConfigCommands } from '../../commands/configCommands';
// import { registerChatCommands } from '../../commands/chatCommands';
// import { showProcessLogs } from './showProcessLogs';
// import { openFile } from './openFile';
// // import { openServerWebview } from './openServerWebview';
// import type { TerminalManager } from '../../TerminalManager';
// import type { StatusBarManager } from '../../statusBarManager';
// import type { DockerProcessTreeDataProvider } from '../DockerProcessTreeDataProvider';
// import type { AiderProcessTreeDataProvider } from '../AiderProcessTreeDataProvider';
// import type { AgentTreeDataProvider } from '../AgentTreeDataProvider';
// import type { ChatTreeDataProvider } from '../ChatTreeDataProvider';

// export const registerCommands = (
//     context: vscode.ExtensionContext,
//     terminalManager: TerminalManager,
//     runtimeProvider: any,
//     statusBarManager: StatusBarManager,
//     dockerProcessProvider: DockerProcessTreeDataProvider,
//     aiderProcessProvider: AiderProcessTreeDataProvider,
//     fileTreeProvider: any,
//     agentProvider: AgentTreeDataProvider,
//     chatProvider: ChatTreeDataProvider
// ): vscode.Disposable[] => {
//     console.log('[VS Code] Registering commands');
//     const disposables: vscode.Disposable[] = [];

//     // Register commands from utility modules
//     disposables.push(...registerTestCommands(terminalManager));
//     disposables.push(...registerProcessCommands(dockerProcessProvider, aiderProcessProvider, fileTreeProvider));
//     disposables.push(...registerAgentCommands(agentProvider, chatProvider));
//     disposables.push(...registerServerCommands(statusBarManager, runtimeProvider));
//     disposables.push(...registerConfigCommands());
//     disposables.push(...registerChatCommands(chatProvider));

//     // Register standalone commands
//     disposables.push(openFile());
//     disposables.push(showProcessLogs());
//     // disposables.push(openServerWebview());

//     return disposables;
// }
