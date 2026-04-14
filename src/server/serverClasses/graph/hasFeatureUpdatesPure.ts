import type { GraphOperation, TesterantoGraph, GraphNodeAttributes } from "../../../graph";

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
      // Check if it's a feature node or if the update affects frontmatter
      return existingAttributes?.type === 'feature' ||
        op.data.metadata?.requiresMarkdownUpdate === true;
    }
    return false;
  });
}
