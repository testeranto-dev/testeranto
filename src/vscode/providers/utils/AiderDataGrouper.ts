// import * as vscode from 'vscode';
// import { TestTreeItem } from '../../TestTreeItem';
// import { TreeItemType } from '../../types';
// import { AiderTreeItemCreator } from './AiderTreeItemCreator';

// interface GraphNode {
//   id: string;
//   type: string;
//   label: string;
//   metadata?: Record<string, any>;
// }

// interface GraphEdge {
//   source: string;
//   target: string;
//   attributes: {
//     type: string;
//   };
// }

// interface GraphData {
//   nodes: GraphNode[];
//   edges: GraphEdge[];
// }

// export class AiderDataGrouper {
//   static getAiderProcessItems(graphData: GraphData | null, agents: any[]): TestTreeItem[] {
//     const items: TestTreeItem[] = [];

//     items.push(new TestTreeItem(
//       'Refresh',
//       TreeItemType.Info,
//       vscode.TreeItemCollapsibleState.None,
//       {
//         description: 'Reload graph data',
//         refresh: true
//       },
//       {
//         command: 'testeranto.refreshAiderProcesses',
//         title: 'Refresh',
//         arguments: []
//       },
//       new vscode.ThemeIcon('refresh')
//     ));

//     if (agents.length > 0) {
//       items.push(new TestTreeItem(
//         `Agents (${agents.length})`,
//         TreeItemType.Info,
//         vscode.TreeItemCollapsibleState.None,
//         {
//           description: 'User-defined agents with aider',
//           count: agents.length
//         },
//         undefined,
//         new vscode.ThemeIcon('server')
//       ));

//       for (const agent of agents) {
//         const agentName = agent.name;

//         const agentNodes = graphData?.nodes?.filter(node =>
//           node.type === 'agent' &&
//           node.metadata?.agentName === agentName
//         ) || [];

//         const agentAiderNodes = graphData?.nodes?.filter(node =>
//           node.type === 'aider_process' &&
//           node.metadata?.agentName === agentName
//         ) || [];

//         const agentItem = new TestTreeItem(
//           agentName,
//           TreeItemType.Runtime,
//           vscode.TreeItemCollapsibleState.Collapsed,
//           {
//             agentName,
//             description: `${agentAiderNodes.length} aider process(es)`,
//             count: agentAiderNodes.length
//           },
//           undefined,
//           new vscode.ThemeIcon('person')
//         );

//         agentItem.children = agentAiderNodes.map(node => AiderTreeItemCreator.createAiderProcessItem(node, null));
//         items.push(agentItem);
//       }
//     } else {
//       items.push(new TestTreeItem(
//         'No agents configured',
//         TreeItemType.Info,
//         vscode.TreeItemCollapsibleState.None,
//         {
//           description: 'No user-defined agents found'
//         },
//         undefined,
//         new vscode.ThemeIcon('info')
//       ));
//     }

//     if (graphData) {
//       const aiderNodes = graphData.nodes.filter(node =>
//         (node.type === 'aider' || node.type === 'aider_process') &&
//         !node.metadata?.agentName
//       );

//       if (aiderNodes.length > 0) {
//         items.push(new TestTreeItem(
//           `Aider Processes (${aiderNodes.length})`,
//           TreeItemType.Info,
//           vscode.TreeItemCollapsibleState.None,
//           {
//             description: 'Regular aider processes for tests',
//             count: aiderNodes.length
//           },
//           undefined,
//           new vscode.ThemeIcon('symbol-namespace')
//         ));

//         const entrypointMap = new Map<string, GraphNode[]>();

//         for (const aiderNode of aiderNodes) {
//           const connectedEdges = graphData.edges.filter(edge =>
//             edge.target === aiderNode.id &&
//             edge.attributes.type === 'hasAider'
//           );

//           let entrypointId = 'ungrouped';
//           for (const edge of connectedEdges) {
//             const entrypointNode = graphData.nodes.find(n => n.id === edge.source);
//             if (entrypointNode && entrypointNode.type === 'entrypoint') {
//               entrypointId = entrypointNode.id;
//               break;
//             }
//           }

//           if (!entrypointMap.has(entrypointId)) {
//             entrypointMap.set(entrypointId, []);
//           }
//           entrypointMap.get(entrypointId)!.push(aiderNode);
//         }

//         for (const [entrypointId, aiderNodes] of entrypointMap.entries()) {
//           let entrypointLabel = 'Ungrouped Aider Processes';
//           let entrypointNode: GraphNode | undefined;

//           if (entrypointId !== 'ungrouped') {
//             entrypointNode = graphData.nodes.find(n => n.id === entrypointId);
//             entrypointLabel = entrypointNode?.label || entrypointId;
//           }

//           const entrypointItem = new TestTreeItem(
//             entrypointLabel,
//             TreeItemType.Runtime,
//             vscode.TreeItemCollapsibleState.Collapsed,
//             {
//               entrypointId,
//               description: `${aiderNodes.length} aider process(es)`,
//               count: aiderNodes.length
//             },
//             undefined,
//             new vscode.ThemeIcon('file-text')
//           );

//           entrypointItem.children = aiderNodes.map(node => AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode));
//           items.push(entrypointItem);
//         }
//       } else if (agents.length === 0) {
//         items.push(new TestTreeItem(
//           'No aider processes found',
//           TreeItemType.Info,
//           vscode.TreeItemCollapsibleState.None,
//           {
//             description: 'No aider processes in graph'
//           },
//           undefined,
//           new vscode.ThemeIcon('info')
//         ));
//       }
//     }

//     return items;
//   }

//   static getAiderProcessesForEntrypoint(graphData: GraphData, entrypointId: string): TestTreeItem[] {
//     const connectedEdges = graphData.edges.filter(edge =>
//       edge.source === entrypointId &&
//       edge.attributes.type === 'hasAider'
//     );

//     const aiderNodes: GraphNode[] = [];
//     for (const edge of connectedEdges) {
//       const aiderNode = graphData.nodes.find(n => n.id === edge.target);
//       if (aiderNode && (aiderNode.type === 'aider' || aiderNode.type === 'aider_process')) {
//         aiderNodes.push(aiderNode);
//       }
//     }

//     const entrypointNode = graphData.nodes.find(n => n.id === entrypointId);
//     return aiderNodes.map(node => AiderTreeItemCreator.createAiderProcessItem(node, entrypointNode));
//   }
// }
