export function queryNodes(graph: any, filter: (node: any) => boolean): any[] {
  return graph.nodes.filter(filter);
}

export function queryEdges(graph: any, filter: (edge: any) => boolean): any[] {
  return graph.edges.filter(filter);
}

export function buildFileTreeFromGraph(nodes: any[], edges: any[]): any {
  // Implement the logic to build a file tree from nodes and edges
  return {};
}
