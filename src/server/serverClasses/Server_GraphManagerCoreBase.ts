// import type { GraphData } from "../../graph";
// import type { ITesterantoConfig } from "../../Types";
// import type { GraphNode, GraphEdge } from "../../vscode/providers/logic/FileTreeLogic";
// import type { IMode } from "../types";
// import { Server_Base } from "./Server_Base";
// import {
//   generateFeatureTreeUtil,
//   getAgentSliceCoreUtil,
//   type FeatureTree,
// } from "./utils/graphManagerCoreUtils";

// export abstract class Server_GraphManagerCoreBase extends Server_Base {
//   constructor(configs: ITesterantoConfig, mode: IMode) {
//     super(configs, mode);
//   }

//   /**
//    * Generate a feature tree from graph data
//    */
//   protected generateFeatureTreeCore(graphData: GraphData): FeatureTree {
//     return generateFeatureTreeUtil(graphData);
//   }

//   /**
//    * Get slice for a specific agent
//    */
//   protected getAgentSliceCore(
//     graphData: GraphData,
//     agents: Record<string, any> | undefined,
//     agentName: string
//   ): { nodes: GraphNode[], edges: GraphEdge[] } {
//     return getAgentSliceCoreUtil(graphData, agents, agentName);
//   }
// }
