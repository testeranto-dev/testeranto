import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph } from '../../graph/index';
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
  // Use pure function to create feature node operations
  const featureOps = createFeatureNodeOperationsPure(
    featureUrl,
    content,
    localPath,
    testId,
    timestamp
  );

  console.log(`[GraphManager] Created ${featureOps.length} feature operations`);

  const { featureId } = extractFeatureInfoPure(featureUrl);
  const existingFeatureNode = graph.hasNode(featureId);

  console.log(`[GraphManager] Feature ID: ${featureId}, exists in graph: ${existingFeatureNode}`);

  // Add feature operations to the main list
  for (const op of featureOps) {
    console.log(`[GraphManager] Processing feature operation: ${op.type} for ${featureId}`);
    // If node already exists and operation is 'addNode', change it to 'updateNode'
    if (op.type === 'addNode' && existingFeatureNode) {
      operations.push({
        type: 'updateNode',
        data: op.data,
        timestamp: op.timestamp
      });
      console.log(`[GraphManager] Changed addNode to updateNode for existing feature ${featureId}`);
    } else {
      operations.push(op);
      console.log(`[GraphManager] Added ${op.type} operation for ${featureId}`);
    }
  }
}
