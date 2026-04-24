import type { ITesterantoConfig } from "../../../src/server/Types";
import { writeAgentSliceFile } from "./graphFileUtils";

/**
 * Pure function to update agent slice file
 * Takes graphData instead of Server_Graph instance
 */
export function updateAgentSliceFilePure(
  graphData: any,
  projectRoot: string,
  configs: ITesterantoConfig,
  agentName: string
): void {
  try {
    if (!configs.agents) {
      console.error(`[graphSliceUtils] No agents configured`);
      return;
    }

    const agentConfig = configs.agents[agentName];
    if (!agentConfig) {
      console.error(`[graphSliceUtils] Agent ${agentName} not found in configs`);
      return;
    }

    if (typeof agentConfig.sliceFunction !== 'function') {
      console.error(`[graphSliceUtils] Agent ${agentName} has no valid sliceFunction`);
      return;
    }

    console.log(`[graphSliceUtils] Updating slice file for agent: ${agentName}`);

    // Generate the updated slice
    console.log(`[graphSliceUtils] Calling sliceFunction for ${agentName}`);
    // Create a mock graphManager object with just the data needed
    const mockGraphManager = {
      getGraphData: () => graphData
    };
    const sliceData = agentConfig.sliceFunction(mockGraphManager);

    // Log what's in the slice with the new structure
    const chatMessages = sliceData.data?.chatMessages || [];
    console.log(`[graphSliceUtils] Found ${chatMessages.length} chat messages in slice for ${agentName}`);

    if (chatMessages.length > 0) {
      console.log(`[graphSliceUtils] Chat messages in ${agentName} slice:`,
        chatMessages.map((msg: any) => ({
          from: msg.agentName,
          preview: msg.preview || msg.content?.substring(0, 50)
        })));
    }

    // Write the slice file
    writeAgentSliceFile(projectRoot, agentName, sliceData);

    console.log(`[graphSliceUtils] Updated agent slice for ${agentName} with viewType: ${sliceData.viewType || 'unknown'}`);
    if (sliceData.data?.summary) {
      console.log(`[graphSliceUtils] Summary:`, sliceData.data.summary);
    }
  } catch (error: any) {
    console.error(`[graphSliceUtils] Error updating agent slice file for ${agentName}:`, error);
    console.error(`[graphSliceUtils] Error stack:`, error.stack);
  }
}

/**
 * Pure function to update all agent slice files
 * Takes graphData instead of Server_Graph instance
 */
export function updateAllAgentSliceFilesPure(
  graphData: any,
  projectRoot: string,
  configs: ITesterantoConfig
): void {
  try {
    if (!configs.agents) {
      console.error(`[graphSliceUtils] No agents configured`);
      return;
    }

    console.log(`[graphSliceUtils] Updating all agent slice files. Number of agents: ${Object.keys(configs.agents).length}`);

    for (const [agentName, agentConfig] of Object.entries(configs.agents)) {
      console.log(`[graphSliceUtils] Processing agent: ${agentName}`);

      if (typeof agentConfig.sliceFunction !== 'function') {
        console.error(`[graphSliceUtils] Agent ${agentName} has no valid sliceFunction`);
        continue;
      }

      // Generate the updated slice
      console.log(`[graphSliceUtils] Calling sliceFunction for ${agentName}`);
      // Create a mock graphManager object with just the data needed
      const mockGraphManager = {
        getGraphData: () => graphData
      };
      const sliceData = agentConfig.sliceFunction(mockGraphManager);

      // Log what's in the slice with the new structure
      const chatMessages = sliceData.data?.chatMessages || [];
      console.log(`[graphSliceUtils] Agent ${agentName} slice has viewType: ${sliceData.viewType || 'unknown'}, ${chatMessages.length} chat messages`);

      if (chatMessages.length > 0) {
        console.log(`[graphSliceUtils] Chat messages in ${agentName} slice:`,
          chatMessages.map((msg: any) => ({ from: msg.agentName, preview: msg.preview || msg.content?.substring(0, 30) })));
      }

      // Write the slice file
      writeAgentSliceFile(projectRoot, agentName, sliceData);

      console.log(`[graphSliceUtils] Updated agent slice for ${agentName}`);
    }
  } catch (error) {
    console.error(`[graphSliceUtils] Error updating all agent slice files:`, error);
  }
}

/**
 * Pure function to get view nodes from graph data
 */
export function getViewNodesPure(graphData: any): any[] {
  return graphData.nodes.filter((node: any) => node.type === 'view');
}

/**
 * Pure function to get a specific view node from graph data
 */
export function getViewNodePure(graphData: any, viewKey: string): any {
  const viewNodes = getViewNodesPure(graphData);
  return viewNodes.find((node: any) => node.viewKey === viewKey);
}

/**
 * Pure function to get view slice from graph data
 */
export function getViewSlicePure(graphData: any, viewKey: string): {
  nodes: any[],
  edges: any[]
} {
  const viewNode = getViewNodePure(graphData, viewKey);
  if (!viewNode) {
    throw new Error(`View ${viewKey} not found in graph`);
  }

  const viewNodeId = viewNode.id;

  // Find edges where the view is connected
  const viewEdges = graphData.edges.filter((edge: any) =>
    edge.source === viewNodeId || edge.target === viewNodeId
  );

  // Find connected node IDs
  const connectedNodeIds = new Set<string>();
  viewEdges.forEach((edge: any) => {
    if (edge.source === viewNodeId) connectedNodeIds.add(edge.target);
    if (edge.target === viewNodeId) connectedNodeIds.add(edge.source);
  });

  // Get connected nodes
  const connectedNodes = graphData.nodes.filter((node: any) =>
    connectedNodeIds.has(node.id)
  );

  return {
    nodes: [viewNode, ...connectedNodes],
    edges: viewEdges
  };
}
