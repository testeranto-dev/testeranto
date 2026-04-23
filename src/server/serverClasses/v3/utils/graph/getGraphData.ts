/**
 * Get graph data
 */
export function getGraphData(): any {
  // Return empty graph structure
  return {
    nodes: [],
    edges: [],
    timestamp: new Date().toISOString()
  };
}
