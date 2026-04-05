import type { GraphData } from "grafeovidajo";
import type { GraphNodeAttributes, GraphEdgeAttributes } from ".";

// Merge two graph data objects
export function mergeGraphData(
  base: GraphData,
  update: GraphData
): GraphData {
  const nodeMap = new Map<string, GraphNodeAttributes>();
  const edgeMap = new Map<string, { source: string; target: string; attributes: GraphEdgeAttributes }>();

  // Add all nodes from base
  base.nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Update or add nodes from update
  update.nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Add all edges from base
  base.edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    edgeMap.set(key, { ...edge });
  });

  // Update or add edges from update
  update.edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    edgeMap.set(key, { ...edge });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'merged'
    }
  };
}
