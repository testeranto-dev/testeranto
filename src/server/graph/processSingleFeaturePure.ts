import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph } from '../../graph/index';
import { processFeatureUrlPure } from './processFeatureUrlPure';
import { handleFeatureNodeOperationsPure } from './handleFeatureNodeOperationsPure';
import { handleFeatureTestEdgePure } from './handleFeatureTestEdgePure';
import { createFeatureFolderConnectionsPure } from './createFeatureFolderConnectionsPure';

export async function processSingleFeaturePure(
  featureUrl: string,
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor: ((url: string) => Promise<{ data: string; filepath: string }>) | undefined,
  timestamp: string
): Promise<void> {
  console.log(`[GraphManager] Processing feature: ${featureUrl}`);

  // Process the feature URL
  const { content, localPath } = await processFeatureUrlPure(
    featureUrl,
    projectRoot,
    featureIngestor
  );

  console.log(`[GraphManager] Processed feature URL, content length: ${content.length}, localPath: ${localPath}`);

  // Handle feature node operations
  await handleFeatureNodeOperationsPure(
    featureUrl,
    content,
    localPath,
    testId,
    operations,
    graph,
    timestamp
  );

  // Handle feature-test edge
  await handleFeatureTestEdgePure(
    featureUrl,
    testId,
    operations,
    graph,
    timestamp
  );

  // Create folder connections for the feature
  await createFeatureFolderConnectionsPure(
    featureUrl,
    operations,
    graph,
    projectRoot,
    timestamp
  );
}
