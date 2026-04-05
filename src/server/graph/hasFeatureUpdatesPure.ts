import { type GraphOperation, type TesterantoGraph, type GraphNodeAttributes } from '../../graph/index';

// Pure function to check if operations contain feature updates
export function hasFeatureUpdatesPure(
  operations: GraphOperation[],
  graph?: TesterantoGraph<GraphNodeAttributes, any> // Optional for checking existing node types
): boolean {
  return operations.some(op => {
    if (op.type === 'addNode' && op.data.type === 'feature') {
      return true;
    }
    if (op.type === 'updateNode' && graph) {
      const existingAttributes = graph.getNodeAttributes(op.data.id);
      return existingAttributes?.type === 'feature';
    }
    return false;
  });
}
