import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph } from '../../graph/index';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';

export async function createFeatureFolderConnectionsPure(
  featureUrl: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  timestamp: string
): Promise<void> {
  const { featureId } = extractFeatureInfoPure(featureUrl);
  
  // Always create folder nodes for both URLs and local file paths
  // Create folder nodes for the feature's path and connect them
  const parentFolderId = createFolderNodesAndEdgesPure(
    featureUrl,
    projectRoot,
    operations,
    timestamp
  );

  console.log(`[GraphManager] Parent folder ID for feature ${featureId}: ${parentFolderId}`);

  // Connect feature to its immediate parent folder
  if (parentFolderId !== '') {
    // Check if edge already exists
    let folderEdgeExists = false;
    if (graph.hasEdge(parentFolderId, featureId)) {
      folderEdgeExists = true;
    }

    console.log(`[GraphManager] Edge from folder ${parentFolderId} to feature ${featureId} exists: ${folderEdgeExists}`);

    if (!folderEdgeExists) {
      operations.push({
        type: 'addEdge',
        data: {
          source: parentFolderId,
          target: featureId,
          attributes: {
            type: 'locatedIn',
            weight: 1
          }
        },
        timestamp
      });
      console.log(`[GraphManager] Added edge from folder ${parentFolderId} to feature ${featureId}`);
    }
  }
}
