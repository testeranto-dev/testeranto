import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../graph";

export function createFolderNodesAndEdges(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  filePath: string,
  timestamp: string,
): string | undefined {
  const pathParts = filePath.split('/').filter(Boolean);
  let currentPath = '';
  let parentFolderId: string | undefined;

  for (const part of pathParts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const folderNodeId = `folder:${currentPath}`;
    const existingFolderNode = graph.nodes.find((n: any) => n.id === folderNodeId);

    if (!existingFolderNode) {
      graph.nodes.push({
        id: folderNodeId,
        type: { category: 'file', type: 'folder' },
        label: part,
        description: `Folder: ${currentPath}`,
        metadata: {
          path: currentPath,
        },
        timestamp,
      });
    }

    if (parentFolderId) {
      const folderEdgeExists = graph.edges.find(
        (e: any) => e.source === parentFolderId && e.target === folderNodeId,
      );
      if (!folderEdgeExists) {
        graph.edges.push({
          source: parentFolderId,
          target: folderNodeId,
          attributes: {
            type: { category: 'structural', type: 'contains', directed: true },
            timestamp,
          },
        });
      }
    }

    parentFolderId = folderNodeId;
  }

  return parentFolderId;
}