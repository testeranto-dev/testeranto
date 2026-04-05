import type { GraphData } from "grafeovidajo";

// Convert our GraphData to grafeovidajo's GraphData format
export function toGrafeovidajoGraphData(graphData: GraphData): {
  nodes: Array<{ id: string; attributes: Record<string, any> }>;
  edges?: Array<{ source: string; target: string; attributes?: Record<string, any> }>;
} {
  return {
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      attributes: {
        ...node,
        // Ensure we don't duplicate the id in attributes
        id: undefined
      }
    })),
    edges: graphData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      attributes: edge.attributes
    }))
  };
}
