// import type { ITesterantoConfig } from "../../../Types";
// import type { Server_Graph } from "../Server_Graph";

// export async function writeViewSliceFilesUtil(
//   configs: ITesterantoConfig,
//   graphManager: Server_Graph,
//   projectRoot: string,
//   resourceChanged: (path: string) => void
// ): Promise<void> {
//   const graphData = graphManager.getGraphData();

//   // Helper functions for writing slice files
//   const writeSliceFile = async (viewKey: string, sliceData: any): Promise<void> => {
//     // Implementation placeholder
//     console.log(`[writeViewSliceFilesUtil] Writing slice file for view ${viewKey}`);
//   };

//   const writeAgentSliceFile = async (agentName: string, sliceData: any): Promise<void> => {
//     // Implementation placeholder
//     console.log(`[writeViewSliceFilesUtil] Writing slice file for agent ${agentName}`);
//   };

//   const addViewNodeToGraph = (viewKey: string, viewPath: string, sliceData: any): void => {
//     // Implementation placeholder
//     console.log(`[writeViewSliceFilesUtil] Adding view node for ${viewKey}`);
//   };

//   const addAgentNodeToGraph = (agentName: string, agentConfig: any, sliceData: any): void => {
//     // Implementation placeholder
//     console.log(`[writeViewSliceFilesUtil] Adding agent node for ${agentName}`);
//   };

//   // Filter agent nodes
//   graphData.nodes.filter((node: any) => node.type === 'agent');

//   if (configs.views) {
//     for (const [viewKey, v] of Object.entries(configs.views)) {
//       try {
//         const sliceFunction = (v as any).slicer;
//         let sliceData: any;

//         if (sliceFunction) {
//           sliceData = sliceFunction(graphData);
//         } else {
//           sliceData = {
//             ...graphData,
//             metadata: {
//               ...graphData.metadata,
//               viewType: 'generic',
//               timestamp: new Date().toISOString()
//             }
//           };
//         }

//         await writeSliceFile(viewKey, sliceData);
//         addViewNodeToGraph(viewKey, (v as any).filePath, sliceData);

//       } catch (error: any) {
//         console.error(`[Server_GraphManager] Error processing view ${viewKey}:`, error);
//         // Continue with other views
//       }
//     }
//   }

//   // Write agent slice files
//   const agents = configs.agents;
//   if (agents) {
//     for (const [agentName, agentConfig] of Object.entries(agents)) {
//       try {
//         const sliceFunction = (agentConfig as any).sliceFunction;
//         if (typeof sliceFunction !== 'function') {
//           throw new Error(`Agent ${agentName} has no valid sliceFunction`);
//         }

//         const graphManagerForSlice = {
//           getGraphData: () => graphManager.getGraphData()
//         };

//         const sliceData = sliceFunction(graphManagerForSlice);
//         if (sliceData?.nodes?.length > 0) {
//           const sliceNodeTypes: Record<string, number> = {};
//           sliceData.nodes.forEach((node: any) => {
//             sliceNodeTypes[node.type] = (sliceNodeTypes[node.type] || 0) + 1;
//           });
//         }

//         await writeAgentSliceFile(agentName, sliceData);
//         addAgentNodeToGraph(agentName, agentConfig as any, sliceData);
//       } catch (error: any) {
//         console.error(`[Server_GraphManager] Error processing agent ${agentName}:`, error);
//         // Continue with other agents
//       }
//     }
//   }

//   // Call resourceChanged to notify clients
//   resourceChanged('/slices');
// }
