import type { GraphData, GraphEdgeAttributes, GraphNodeAttributes, TesterantoGraph } from "../../../../../graph";

export async function saveGraph(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  resourceChangedCallback: (path: string) => void
): Promise<void> {
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
      timestamp: new Date().toISOString(),
      source: 'Server_Graph'
    }
  };

  resourceChangedCallback('/~/graph');
}
