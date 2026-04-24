import type { GraphOperation, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";

export interface GraphState {
  nodes: GraphNodeAttributes[];
  edges: Array<{
    source: string;
    target: string;
    attributes: GraphEdgeAttributes;
  }>;
}

export function applyOperations(
  state: GraphState,
  operations: GraphOperation[],
): GraphState {
  const newState: GraphState = {
    nodes: [...state.nodes],
    edges: [...state.edges],
  };

  for (const op of operations) {
    switch (op.type) {
      case 'addNode':
        newState.nodes.push(op.data as GraphNodeAttributes);
        break;

      case 'addEdge':
        newState.edges.push({
          source: op.data.source,
          target: op.data.target,
          attributes: op.data.attributes,
        });
        break;

      case 'updateNode': {
        const idx = newState.nodes.findIndex(n => n.id === op.data.id);
        if (idx !== -1) {
          newState.nodes[idx] = { ...newState.nodes[idx], ...op.data };
        }
        break;
      }

      case 'removeNode':
        newState.nodes = newState.nodes.filter(n => n.id !== op.data.id);
        newState.edges = newState.edges.filter(
          e => e.source !== op.data.id && e.target !== op.data.id,
        );
        break;

      case 'updateEdge': {
        const idx = newState.edges.findIndex(
          e => e.source === op.data.source && e.target === op.data.target,
        );
        if (idx !== -1) {
          newState.edges[idx] = { ...newState.edges[idx], ...op.data };
        }
        break;
      }

      case 'removeEdge':
        newState.edges = newState.edges.filter(
          e => !(e.source === op.data.source && e.target === op.data.target),
        );
        break;
    }
  }

  return newState;
}
