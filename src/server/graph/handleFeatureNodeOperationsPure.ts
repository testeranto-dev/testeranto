import {
  type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph
} from '../../graph/index';
import { createFeatureNodeOperationsPure } from './createFeatureNodeOperationsPure';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';

export async function handleFeatureNodeOperationsPure(
  featureUrl: string,
  content: string,
  localPath: string,
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  timestamp: string
): Promise<void> {
  const featureOps = createFeatureNodeOperationsPure(
    featureUrl,
    content,
    localPath,
    testId,
    timestamp
  );

  const { featureId } = extractFeatureInfoPure(featureUrl);
  const existingFeatureNode = graph.hasNode(featureId);

  // Add feature operations to the main list
  for (const op of featureOps) {
    // If node already exists and operation is 'addNode', change it to 'updateNode'
    if (op.type === 'addNode' && existingFeatureNode) {
      operations.push({
        type: 'updateNode',
        data: op.data,
        timestamp: op.timestamp
      });
    } else {
      operations.push(op);
    }
  }
}
