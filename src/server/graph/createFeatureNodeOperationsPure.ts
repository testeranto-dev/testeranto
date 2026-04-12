
import type { GraphOperation } from '.';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';
import matter from 'gray-matter'

// Pure function to create feature node operations
export function createFeatureNodeOperationsPure(
  featureUrl: string,
  contentString: string,
  localPath: string | undefined,
  testId: string,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Extract feature information using pure function
  const { featureName, featureId } = extractFeatureInfoPure(featureUrl);

  const { data, content } = matter(contentString)

  // Prepare feature metadata
  const featureMetadata: Record<string, unknown> = {
    url: featureUrl,
    content: content || '', // Store full content for serialization, ensure it's a string
    contentPreview: (content || '').substring(0, 200) + ((content || '').length > 200 ? '...' : ''),
    frontmatter: data
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
      icon: 'document',
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

        }
      },
      timestamp
    });
  }

  return operations;
}
