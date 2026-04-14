// import type { Server_Graph } from "../Server_Graph";
// import { getSliceFilePath, getAgentSliceFilePath } from "../graph/graphFileUtils";

// export function getViewType(viewKey: string): string {
//   switch (viewKey) {
//     case 'featuretree':
//       return 'feature-tree';
//     case 'debugVisualization':
//       return 'debug';
//     case 'Kanban':
//       return 'kanban';
//     case 'Gantt':
//       return 'gantt';
//     case 'Eisenhower':
//       return 'eisenhower';
//     default:
//       return 'generic';
//   }
// }

// export function addViewNodeToGraph(
//   graphManager: Server_Graph,
//   projectRoot: string,
//   viewKey: string,
//   viewPath: string,
//   sliceData: any
// ): void {
//   try {
//     const viewNodeId = `view:${viewKey}`;
//     const timestamp = new Date().toISOString();

//     // Create view node attributes
//     const viewNodeAttributes: any = {
//       id: viewNodeId,
//       type: 'view',
//       label: `View: ${viewKey}`,
//       description: `A view for ${viewKey}`,
//       viewKey: viewKey,
//       viewPath: viewPath,
//       sliceFilePath: getSliceFilePath(projectRoot, viewKey),
//       sliceNodeCount: sliceData?.nodes?.length || 0,
//       sliceEdgeCount: sliceData?.edges?.length || 0,
//       timestamp: timestamp,
//       metadata: {
//         frontmatter: {
//           title: `View: ${viewKey}`,
//           type: 'view',
//           viewType: getViewType(viewKey)
//         }
//       }
//     };

//     // Check if the view node already exists by getting graph data
//     const graphData = graphManager.getGraphData();
//     const existingNode = graphData.nodes.find((node: any) => node.id === viewNodeId);

//     const operationType = existingNode ? 'updateNode' : 'addNode';

//     const operations = [{
//       type: operationType,
//       data: viewNodeAttributes,
//       timestamp: timestamp
//     }];

//     const update = {
//       operations,
//       timestamp
//     };

//     graphManager.applyUpdate(update);

//     // Connect view node to relevant nodes in its slice
//     connectViewToSliceNodes(graphManager, viewNodeId, sliceData);

//   } catch (error) {
//     console.error(`Error adding view node for ${viewKey}:`, error);
//   }
// }

// export function addAgentNodeToGraph(
//   graphManager: Server_Graph,
//   projectRoot: string,
//   agentName: string,
//   agentConfig: any,
//   sliceData: any
// ): void {
//   try {
//     const agentNodeId = `agent:${agentName}`;
//     const timestamp = new Date().toISOString();

//     // Calculate item counts from the new slice structure
//     const chatMessageCount = sliceData.data?.chatMessages?.length || 0;
//     const featureCount = sliceData.data?.features?.length || 0;
//     const configCount = sliceData.data?.configs?.length || 0;
//     const entrypointCount = sliceData.data?.entrypoints?.length || 0;
//     const documentationCount = sliceData.data?.documentation?.length || 0;

//     const totalItems = chatMessageCount + featureCount + configCount +
//       entrypointCount + documentationCount;

//     // Create agent node attributes
//     const agentNodeAttributes: any = {
//       id: agentNodeId,
//       type: 'agent',
//       label: `Agent: ${agentName}`,
//       description: agentConfig.message ? agentConfig.message.substring(0, 100) + '...' : `Agent ${agentName}`,
//       agentName: agentName,
//       agentConfig: {
//         load: agentConfig.load || [],
//         hasSliceFunction: typeof agentConfig.sliceFunction === 'function'
//       },
//       sliceFilePath: getAgentSliceFilePath(projectRoot, agentName),
//       sliceItemCount: totalItems,
//       sliceStructure: sliceData.viewType || 'unknown',
//       timestamp: timestamp,
//       metadata: {
//         frontmatter: {
//           title: `Agent: ${agentName}`,
//           type: 'agent',
//           agentType: 'user-defined'
//         },
//         sliceSummary: sliceData.data?.summary || {}
//       }
//     };

//     // Create operations to add or update the agent node
//     const operations: any[] = [
//       {
//         type: 'addNode',
//         data: agentNodeAttributes,
//         timestamp: timestamp
//       }
//     ];

//     // Apply the update
//     const update = {
//       operations: operations,
//       timestamp: timestamp
//     };

//     graphManager.applyUpdate(update);

//   } catch (error) {
//     console.error(`Error adding agent node for ${agentName}:`, error);
//   }
// }

// export function connectViewToSliceNodes(
//   graphManager: GraphManager,
//   viewNodeId: string,
//   sliceData: any
// ): void {
//   try {
//     const timestamp = new Date().toISOString();
//     const operations: any[] = [];

//     // Add connections to nodes in the slice
//     if (sliceData?.nodes) {
//       for (const node of sliceData.nodes) {
//         const nodeId = node.id;

//         // Add edge from view to node
//         operations.push({
//           type: 'addEdge',
//           data: {
//             source: viewNodeId,
//             target: nodeId,
//             attributes: {
//               type: 'hasView',
//               timestamp: timestamp,
//               directed: true
//             }
//           },
//           timestamp: timestamp
//         });

//         // Add edge from node to view
//         operations.push({
//           type: 'addEdge',
//           data: {
//             source: nodeId,
//             target: viewNodeId,
//             attributes: {
//               type: 'viewOf',
//               timestamp: timestamp,
//               directed: true
//             }
//           },
//           timestamp: timestamp
//         });
//       }
//     }

//     if (operations.length > 0) {
//       const update = {
//         operations,
//         timestamp
//       };
//       graphManager.applyUpdate(update);
//     }
//   } catch (error) {
//     console.error(`Error connecting view ${viewNodeId} to slice nodes:`, error);
//   }
// }

// export function connectAgentToSliceNodes(
//   graphManager: GraphManager,
//   agentNodeId: string,
//   sliceData: any
// ): void {
//   try {
//     const timestamp = new Date().toISOString();
//     const operations: any[] = [];

//     // Add connections to nodes in the slice
//     if (sliceData?.nodes) {
//       for (const node of sliceData.nodes) {
//         const nodeId = node.id;

//         // Add edge from agent to node
//         operations.push({
//           type: 'addEdge',
//           data: {
//             source: agentNodeId,
//             target: nodeId,
//             attributes: {
//               type: 'hasAgent',
//               timestamp: timestamp,
//               directed: true
//             }
//           },
//           timestamp: timestamp
//         });

//         // Add edge from node to agent
//         operations.push({
//           type: 'addEdge',
//           data: {
//             source: nodeId,
//             target: agentNodeId,
//             attributes: {
//               type: 'agentOf',
//               timestamp: timestamp,
//               directed: true
//             }
//           },
//           timestamp: timestamp
//         });
//       }
//     }

//     if (operations.length > 0) {
//       const update = {
//         operations: operations,
//         timestamp: timestamp
//       };
//       graphManager.applyUpdate(update);
//     }
//   } catch (error) {
//     console.error(`Error connecting agent ${agentNodeId} to slice nodes:`, error);
//   }
// }
