import type { GraphOperation, TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../graph';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';

export async function processInputFilesForTestPure(
  inputFiles: string[],
  entrypointId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  timestamp: string
): Promise<void> {
  for (const inputFile of inputFiles) {
    // Create file node for input file
    const fileNodeId = `file:${inputFile}`;
    const existingFileNode = graph.hasNode(fileNodeId);

    if (!existingFileNode) {
      operations.push({
        type: 'addNode',
        data: {
          id: fileNodeId,
          type: 'file',
          label: inputFile.split('/').pop() || inputFile,
          description: `Input file: ${inputFile}`,
          metadata: {
            filePath: inputFile,
            localPath: inputFile,
            url: `file://${inputFile}`
          }
        },
        timestamp
      });
    }

    // Create folder nodes for the input file's path
    const parentFolderId = createFolderNodesAndEdgesPure(
      inputFile,
      projectRoot,
      operations,
      timestamp
    );

    // Connect input file to its parent folder
    if (parentFolderId !== '') {
      const folderEdgeExists = graph.hasEdge(parentFolderId, fileNodeId);
      if (!folderEdgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: parentFolderId,
            target: fileNodeId,
            attributes: {
              type: 'locatedIn',

            }
          },
          timestamp
        });
      }
    }

    // Connect entrypoint to input file
    const entrypointToFileEdgeExists = graph.hasEdge(entrypointId, fileNodeId);
    if (!entrypointToFileEdgeExists) {
      operations.push({
        type: 'addEdge',
        data: {
          source: entrypointId,
          target: fileNodeId,
          attributes: {
            type: 'associatedWith',

          }
        },
        timestamp
      });
    }
  }
}
