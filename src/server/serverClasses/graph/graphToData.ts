import type Graph from "graphology";
import type { GraphNodeAttributes, GraphEdgeAttributes, GraphData } from "../../../graph";

export function graphToData(graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>): GraphData {
  // Check if graph is undefined
  if (!graph) {
    console.error('[graphToData] Graph is undefined, returning empty data');
    return {
      nodes: [],
      edges: [],
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  const nodes: GraphNodeAttributes[] = [];
  const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

  graph.forEachNode((node, attributes) => {
    nodes.push({ ...attributes, id: node });
  });

  graph.forEachEdge((edge, attributes, source, target) => {
    edges.push({
      source,
      target,
      attributes: { ...attributes }
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  };
}
