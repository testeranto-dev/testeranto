import Graph from "graphology";
import type { GraphData, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";
import { writeAgentSliceFile } from "./writeAgentSliceFile";

export function updateAllAgentSliceFilesPure(
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  configs: ITesterantoConfig
): void {
  if (!configs.agents) return;

  // Convert graphology graph to GraphData format
  const graphData: GraphData = {
    nodes: graph.nodes().map(nodeId => ({
      id: nodeId,
      ...graph.getNodeAttributes(nodeId),
    })),
    edges: graph.edges().map(edgeKey => ({
      source: graph.source(edgeKey),
      target: graph.target(edgeKey),
      attributes: graph.getEdgeAttributes(edgeKey),
    })),
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
    },
  };

  for (const [agentName, agentConfig] of Object.entries(configs.agents)) {
    if (typeof agentConfig.sliceFunction !== 'function') continue;

    const mockGraphManager = {
      getGraphData: () => graphData,
    };
    writeAgentSliceFile(projectRoot, agentName, agentConfig.sliceFunction(mockGraphManager));
  }
}
