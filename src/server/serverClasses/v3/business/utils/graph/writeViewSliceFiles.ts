import type { GraphData } from "react-force-graph-3d";
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../../graph";
import type { ITesterantoConfig } from "../../../../../../Types";
import { generateViewSliceUtil } from "../../../utils/static/generateViewSliceUtil";

export function writeViewSliceFiles(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  configs: ITesterantoConfig
): void {
  if (!configs.views) {
    return;
  }

  const graphData: GraphData = {
    nodes: graph.nodes().map(nodeKey => ({
      id: nodeKey,
      ...graph.getNodeAttributes(nodeKey)
    })),
    edges: graph.edges().map(edgeKey => ({
      source: graph.source(edgeKey),
      target: graph.target(edgeKey),
      attributes: graph.getEdgeAttributes(edgeKey)
    })),
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  };

  for (const [viewKey, viewConfig] of Object.entries(configs.views)) {
    generateViewSliceUtil(viewKey, viewConfig, graphData);
  }
}
