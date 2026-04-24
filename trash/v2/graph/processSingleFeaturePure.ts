import { processFeatureUrlPure } from './processFeatureUrlPure';
import { handleFeatureNodeOperationsPure } from './handleFeatureNodeOperationsPure';
import { handleFeatureTestEdgePure } from './handleFeatureTestEdgePure';
import { createFeatureFolderConnectionsPure } from './createFeatureFolderConnectionsPure';
import type { GraphOperation, TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../graph';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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

  // Parse markdown frontmatter if it's a markdown file
  let frontmatter: Record<string, any> = {};
  let markdownContent = content;
  
  if (localPath && (localPath.endsWith('.md') || localPath.endsWith('.markdown'))) {
    try {
      // Parse frontmatter from markdown
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const frontmatterStr = frontmatterMatch[1];
        markdownContent = frontmatterMatch[2];
        
        try {
          frontmatter = yaml.load(frontmatterStr) as Record<string, any> || {};
        } catch (yamlError) {
          console.warn(`[processSingleFeaturePure] Error parsing YAML frontmatter for ${localPath}:`, yamlError);
        }
      }
    } catch (error) {
      console.warn(`[processSingleFeaturePure] Error processing markdown frontmatter for ${localPath}:`, error);
    }
  }

  // Handle feature node operations with frontmatter
  await handleFeatureNodeOperationsPure(
    featureUrl,
    markdownContent,
    localPath,
    testId,
    operations,
    graph,
    timestamp,
    frontmatter
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
