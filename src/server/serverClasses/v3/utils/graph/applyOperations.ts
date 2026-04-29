import type { GraphOperation, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";
import type Graph from "graphology";

export function applyOperations(
  graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>,
  operations: GraphOperation[],
): void {
  for (const op of operations) {
    switch (op.type) {
      case 'addNode': {
        const nodeData = op.data as GraphNodeAttributes;
        if (!graph.hasNode(nodeData.id)) {
          graph.addNode(nodeData.id, nodeData);
        }
        break;
      }

      case 'addEdge': {
        const { source, target, attributes } = op.data as {
          source: string;
          target: string;
          attributes: GraphEdgeAttributes;
        };
        if (graph.hasNode(source) && graph.hasNode(target)) {
          if (!graph.hasEdge(source, target)) {
            graph.addEdge(source, target, attributes);
          }
        }
        break;
      }

      case 'updateNode': {
        const { id, ...attrs } = op.data as Partial<GraphNodeAttributes> & { id: string };
        if (graph.hasNode(id)) {
          graph.mergeNodeAttributes(id, attrs);
        }
        break;
      }

      case 'removeNode': {
        const { id } = op.data as { id: string };
        if (graph.hasNode(id)) {
          graph.dropNode(id);
        }
        break;
      }

      case 'updateEdge': {
        const { source, target, ...attrs } = op.data as {
          source: string;
          target: string;
        } & Partial<GraphEdgeAttributes>;
        const edgeKey = graph.edge(source, target);
        if (edgeKey !== undefined) {
          graph.mergeEdgeAttributes(edgeKey, attrs);
        }
        break;
      }

      case 'removeEdge': {
        const { source, target } = op.data as { source: string; target: string };
        const edgeKey = graph.edge(source, target);
        if (edgeKey !== undefined) {
          graph.dropEdge(edgeKey);
        }
        break;
      }
    }
  }
}
