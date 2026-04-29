import type { GraphEdgeAttributes, GraphNodeAttributes, TesterantoGraph } from "../../../../../graph";

export function removeVerbNodesForTest(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  configKey: string,
  testName: string
): void {
  const prefix = `verb:${configKey}:${testName}:`;
  const verbNodeIds = graph.nodes().filter((nodeKey: string) =>
    nodeKey.startsWith(prefix)
  );

  for (const nodeId of verbNodeIds) {
    if (graph.hasNode(nodeId)) {
      graph.dropNode(nodeId);
    }
  }
}
