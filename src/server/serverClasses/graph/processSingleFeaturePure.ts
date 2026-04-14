import { processFeatureUrlPure } from './processFeatureUrlPure';
import { handleFeatureNodeOperationsPure } from './handleFeatureNodeOperationsPure';
import { handleFeatureTestEdgePure } from './handleFeatureTestEdgePure';
import { createFeatureFolderConnectionsPure } from './createFeatureFolderConnectionsPure';
import type { GraphOperation, TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../graph';

export async function processSingleFeaturePure(
  featureUrl: string,
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor: ((url: string) => Promise<{ data: string; filepath: string }>) | undefined,
  timestamp: string
): Promise<void> {

  // Process the feature URL
  const { content, localPath } = await processFeatureUrlPure(
    featureUrl,
    projectRoot,
    featureIngestor
  );

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
