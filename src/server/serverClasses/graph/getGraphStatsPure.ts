import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../graph";

export function getGraphStatsPure(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
  const nodes = graph.nodes();
  const edges = graph.edges();

  const nodeTypes: Record<string, number> = {};
  const edgeTypes: Record<string, number> = {};

  for (const nodeId of nodes) {
    const attributes = graph.getNodeAttributes(nodeId);
    const type = attributes.type || 'unknown';
    nodeTypes[type] = (nodeTypes[type] || 0) + 1;
  }

  for (const edge of edges) {
    const attributes = graph.getEdgeAttributes(edge);
    const type = attributes.type || 'unknown';
    edgeTypes[type] = (edgeTypes[type] || 0) + 1;
  }

  return {
    nodes: nodes.length,
    edges: edges.length,
    nodeTypes,
    edgeTypes
  };
}
