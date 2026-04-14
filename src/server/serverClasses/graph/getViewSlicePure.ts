import type { GraphData } from "../../../graph";

export function getViewSlicePure(
  graphData: GraphData,
  viewKey: string
): {
  nodes: any[],
  edges: any[]
} {
  // Filter nodes related to the view
  const viewNode = graphData.nodes.find((node: any) => node.id === `view:${viewKey}`);
  if (!viewNode) {
    return { nodes: [], edges: [] };
  }

  // For now, return a simple implementation
  // In reality, this would filter based on view-specific logic
  const nodes = graphData.nodes.filter((node: any) => {
    // Basic filtering logic - can be enhanced based on view configuration
    return node.type === 'view' || node.type === 'entrypoint' || 
           (node.type && typeof node.type === 'object' && node.type.category === 'process');
  });

  const edges = graphData.edges.filter((edge: any) => {
    return nodes.some((node: any) => node.id === edge.source) && 
           nodes.some((node: any) => node.id === edge.target);
  });

  return { nodes, edges };
}
