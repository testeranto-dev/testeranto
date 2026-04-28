export function queryNodes(graph: any, filter: (node: any) => boolean): any[] {
  return graph
    .nodes()
    .map((nodeKey: string) => ({
      id: nodeKey,
      ...graph.getNodeAttributes(nodeKey),
    }))
    .filter(filter);
}

export function queryEdges(graph: any, filter: (edge: any) => boolean): any[] {
  return graph
    .edges()
    .map((edgeKey: string) => ({
      source: graph.source(edgeKey),
      target: graph.target(edgeKey),
      ...graph.getEdgeAttributes(edgeKey),
    }))
    .filter(filter);
}

export function buildFileTreeFromGraph(nodes: any[], edges: any[]): any {
  // Implement the logic to build a file tree from nodes and edges
  return {};
}
