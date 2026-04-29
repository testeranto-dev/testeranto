import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";

export function collectInputFiles(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  testNodeId: string,
): string[] {
  const inputFiles: string[] = [];
  for (const edgeKey of graph.edges()) {
    const source = graph.source(edgeKey);
    const target = graph.target(edgeKey);
    if (source === testNodeId && target.startsWith('file:')) {
      const fileNodeAttrs = graph.getNodeAttributes(target);
      if (fileNodeAttrs.metadata?.filePath) {
        inputFiles.push(fileNodeAttrs.metadata.filePath);
      }
    }
  }
  return inputFiles;
}

export function collectOutputFiles(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  testNodeId: string,
): string[] {
  const outputFiles: string[] = [];
  for (const edgeKey of graph.edges()) {
    const source = graph.source(edgeKey);
    const target = graph.target(edgeKey);
    if (target === testNodeId && source.startsWith('file:')) {
      const fileNodeAttrs = graph.getNodeAttributes(source);
      if (fileNodeAttrs.metadata?.filePath) {
        outputFiles.push(fileNodeAttrs.metadata.filePath);
      }
    }
  }
  return outputFiles;
}
