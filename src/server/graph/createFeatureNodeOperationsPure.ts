import { type GraphOperation } from '../../graph/index';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';

// Pure function to create feature node operations
export function createFeatureNodeOperationsPure(
  featureUrl: string,
  content: string,
  localPath: string | undefined,
  testId: string,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Extract feature information using pure function
  const { featureName, featureId } = extractFeatureInfoPure(featureUrl);

  // Prepare feature metadata
  const featureMetadata: Record<string, unknown> = {
    url: featureUrl,
    contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
  };

  if (localPath) {
    featureMetadata.localPath = localPath;
  }

  // Create feature node operation
  operations.push({
    type: 'addNode',
    data: {
      id: featureId,
      type: 'feature',
      label: featureName,
      description: `Feature: ${featureName}`,
      status: 'todo',
      metadata: featureMetadata
    },
    timestamp
  });

  // Connect feature to test only if testId is provided
  if (testId) {
    operations.push({
      type: 'addEdge',
      data: {
        source: featureId,
        target: testId,
        attributes: {
          type: 'associatedWith',
          weight: 1
        }
      },
      timestamp
    });
  }

  return operations;
}
