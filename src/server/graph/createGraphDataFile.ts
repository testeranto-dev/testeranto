// import type { GraphData, GraphDataFile } from ".";
// import { Palette } from "../../colors";

// // Helper to create a GraphDataFile
// export function createGraphDataFile(
//   unifiedGraph: GraphData,
//   options?: {
//     vizConfig?: GraphDataFile['data']['vizConfig'];
//     configs?: Record<string, unknown>; // Optional
//     allTestResults?: Record<string, unknown>; // Optional
//     timestamp?: string;
//     version?: string;
//   }
// ): GraphDataFile {
//   const data: {
//     unifiedGraph: GraphData;
//     vizConfig: GraphDataFile['data']['vizConfig'];
//     configs?: Record<string, unknown>;
//     allTestResults?: Record<string, unknown>;
//   } = {
//     unifiedGraph,
//     vizConfig: options?.vizConfig || {
//       projection: {
//         xAttribute: 'status',
//         yAttribute: 'priority',
//         xType: 'categorical',
//         yType: 'continuous',
//         layout: 'grid'
//       },
//       style: {
//         nodeSize: 10,
//         nodeColor: Palette.rust,
//         nodeShape: 'circle'
//       }
//     }
//   };

//   // Only include configs if provided
//   if (options?.configs !== undefined) {
//     data.configs = options.configs;
//   }
//   // DO NOT include allTestResults - this data should be in unifiedGraph

//   return {
//     timestamp: options?.timestamp || new Date().toISOString(),
//     version: options?.version || '1.0',
//     data
//   };
// }
