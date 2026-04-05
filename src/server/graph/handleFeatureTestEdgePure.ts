import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph } from '../../graph/index';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';

export async function handleFeatureTestEdgePure(
  featureUrl: string,
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  timestamp: string
): Promise<void> {
  // Only create edge if we have a valid testId
  if (!testId) {
    return;
  }

  const { featureId } = extractFeatureInfoPure(featureUrl);
  
  // Check if edge already exists and skip if it does
  let featureEdgeExists = false;
  if (graph.hasEdge(featureId, testId)) {
    featureEdgeExists = true;
  }
  console.log(`[GraphManager] Edge from ${featureId} to ${testId} exists: ${featureEdgeExists}`);

  // If edge exists, we need to remove the edge operation that was added by createFeatureNodeOperationsPure
  if (featureEdgeExists) {
    // Find and remove the edge operation
    const edgeOpIndex = operations.findIndex(op =>
      op.type === 'addEdge' &&
      op.data.source === featureId &&
      op.data.target === testId
    );
    if (edgeOpIndex !== -1) {
      operations.splice(edgeOpIndex, 1);
      console.log(`[GraphManager] Removed duplicate edge operation from ${featureId} to ${testId}`);
    }
  }
}
