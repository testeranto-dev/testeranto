import type { GraphEdgeAttributes, GraphNodeAttributes, TesterantoGraph } from "../../../../../graph";

export function removeAgentNodes(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): void {
  const agentNodeIds = graph.nodes()
    .filter((n: { type?: { type: string } }) => n.type?.type === 'agent')
    .map((n: { id: string }) => n.id);

  for (const nodeId of agentNodeIds) {
    if (graph.hasNode(nodeId)) {
      graph.dropNode(nodeId);
    }
  }
}
