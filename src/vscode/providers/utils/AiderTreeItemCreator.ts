// import * as vscode from 'vscode';
// import type { TestTreeItem } from '../../TestTreeItem';
// import { TreeItemType } from '../../types';

// interface GraphNode {
//   id: string;
//   type: string;
//   label: string;
//   metadata?: Record<string, any>;
// }

// export class AiderTreeItemCreator {
//   static createAiderProcessItem(node: GraphNode, entrypointNode?: GraphNode): TestTreeItem {
//     const metadata = node.metadata || {};
//     const status = metadata.status || 'stopped';
//     const exitCode = metadata.exitCode;
//     const isActive = metadata.isActive || false;
//     const containerId = metadata.containerId || 'unknown';
//     const containerName = metadata.aiderServiceName || metadata.containerName || 'unknown';
//     const runtime = metadata.runtime || 'unknown';
//     const testName = metadata.testName || 'unknown';
//     const configKey = metadata.configKey || 'unknown';
//     const agentName = metadata.agentName;
//     const isAgentAider = metadata.isAgentAider || false;

//     let label = node.label || containerName;
//     if (label === 'unknown' && node.id) {
//       const parts = node.id.split(':');
//       label = parts[parts.length - 1] || node.id;
//     }

//     let description = `${status}`;
//     if (exitCode !== undefined) {
//       description += ` (exit: ${exitCode})`;
//     }
//     if (!isActive) {
//       description += ' • inactive';
//     }
//     if (isAgentAider) {
//       description += ' • agent';
//     }

//     let icon: vscode.ThemeIcon;
//     if (isAgentAider) {
//       icon = new vscode.ThemeIcon('person', new vscode.ThemeColor('testing.iconPassed'));
//     } else if (status === 'running' && isActive) {
//       icon = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
//     } else if (status === 'exited') {
//       if (exitCode === 0) {
//         icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
//       } else {
//         icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
//       }
//     } else if (status === 'stopped') {
//       icon = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('testing.iconUnset'));
//     } else {
//       icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
//     }

//     const item = new TestTreeItem(
//       label,
//       TreeItemType.Info,
//       vscode.TreeItemCollapsibleState.None,
//       {
//         description,
//         status,
//         exitCode,
//         runtime,
//         testName,
//         configKey,
//         containerId,
//         containerName,
//         isActive,
//         aiderId: node.id,
//         agentName,
//         isAgentAider
//       },
//       {
//         command: 'testeranto.openAiderTerminal',
//         title: 'Open Aider Terminal',
//         arguments: [runtime, testName, containerId]
//       },
//       icon
//     );

//     let tooltip = `Type: ${node.type}\n`;
//     tooltip += `ID: ${node.id}\n`;
//     if (isAgentAider && agentName) {
//       tooltip += `Agent: ${agentName}\n`;
//     }
//     if (entrypointNode) {
//       tooltip += `Entrypoint: ${entrypointNode.label || entrypointNode.id}\n`;
//     }
//     tooltip += `Container: ${containerName}\n`;
//     tooltip += `Container ID: ${containerId}\n`;
//     tooltip += `Status: ${status}\n`;
//     tooltip += `Active: ${isActive ? 'Yes' : 'No'}\n`;
//     if (exitCode !== undefined) {
//       tooltip += `Exit Code: ${exitCode}\n`;
//     }
//     if (!isAgentAider) {
//       tooltip += `Runtime: ${runtime}\n`;
//       tooltip += `Test: ${testName}\n`;
//       tooltip += `Config: ${configKey}\n`;
//     }
//     if (metadata.startedAt) {
//       tooltip += `Started: ${metadata.startedAt}\n`;
//     }
//     if (metadata.lastActivity) {
//       tooltip += `Last Activity: ${metadata.lastActivity}\n`;
//     }

//     item.tooltip = tooltip;
//     return item;
//   }
// }
