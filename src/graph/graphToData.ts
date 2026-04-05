import type { GraphData } from "grafeovidajo";
import type Graph from "graphology";
import type {
  GraphNodeAttributes, GraphEdgeAttributes, GraphNodeType, GraphEdgeType
} from ".";

// Convert graph to serializable data
export function graphToData(graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>): GraphData {
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
