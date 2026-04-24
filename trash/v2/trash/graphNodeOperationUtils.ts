// /**
//  * Pure function to create operations for adding a view node to the graph
//  * Returns operations instead of applying them directly
//  */
// export function createAddViewNodeOperations(
//   projectRoot: string,
//   viewKey: string,
//   viewPath: string,
//   sliceData: any,
//   existingNode?: any
// ): any[] {
//   const viewNodeId = `view:${viewKey}`;
//   const timestamp = new Date().toISOString();

//   if (!existingNode) {
//     return [{
//       type: 'addNode',
//       data: {
//         id: viewNodeId,
//         type: 'view',
//         label: viewKey,
//         description: `View: ${viewKey}`,
//         status: 'done',
//         icon: 'eye',
//         metadata: {
//           viewKey,
//           viewPath,
//           sliceDataPath: `${projectRoot}/testeranto/slices/views/${viewKey}.json`,
//           timestamp
//         }
//       },
//       timestamp
//     }];
//   } else {
//     return [{
//       type: 'updateNode',
//       data: {
//         id: viewNodeId,
//         metadata: {
//           ...existingNode.metadata,
//           viewPath,
//           sliceDataPath: `${projectRoot}/testeranto/slices/views/${viewKey}.json`,
//           lastUpdated: timestamp
//         }
//       },
//       timestamp
//     }];
//   }
// }

// /**
//  * Pure function to create operations for adding an agent node to the graph
//  * Returns operations instead of applying them directly
//  */
// export function createAddAgentNodeOperations(
//   projectRoot: string,
//   agentName: string,
//   agentConfig: any,
//   sliceData: any,
//   existingNode?: any
// ): any[] {
//   const agentNodeId = `agent:${agentName}`;
//   const timestamp = new Date().toISOString();

//   if (!existingNode) {
//     return [{
//       type: 'addNode',
//       data: {
//         id: agentNodeId,
//         type: 'agent',
//         label: agentName,
//         description: `Agent: ${agentName}`,
//         status: 'done',
//         icon: 'user',
//         metadata: {
//           agentName,
//           load: agentConfig.load,
//           message: agentConfig.message,
//           sliceDataPath: `${projectRoot}/testeranto/slices/agents/${agentName}.json`,
//           timestamp
//         }
//       },
//       timestamp
//     }];
//   } else {
//     return [{
//       type: 'updateNode',
//       data: {
//         id: agentNodeId,
//         metadata: {
//           ...existingNode.metadata,
//           load: agentConfig.load,
//           message: agentConfig.message,
//           sliceDataPath: `${projectRoot}/testeranto/slices/agents/${agentName}.json`,
//           lastUpdated: timestamp
//         }
//       },
//       timestamp
//     }];
//   }
// }
