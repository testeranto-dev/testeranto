import type { GraphNodeAttributes, GraphEdgeAttributes } from "../../../../graph";

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path?: string;
  children?: FileTreeNode[];
  metadata?: Record<string, any>;
}

/**
 * Build a recursive file tree from graph nodes and edges.
 * Automatically creates folder nodes for any file path that has a parent directory.
 */
export function buildFileTreeFromGraph(
  nodes: GraphNodeAttributes[],
  edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
): FileTreeNode[] {
  // Collect all file/folder nodes
  const fileNodes = nodes.filter(
    (n) =>
      n.type?.category === 'file' &&
      (n.type?.type === 'folder' || n.type?.type === 'file' || n.type?.type === 'inputFile' || n.type?.type === 'entrypoint')
  );

  // Build a map of node id -> node
  const nodeMap = new Map<string, GraphNodeAttributes>();
  for (const node of fileNodes) {
    nodeMap.set(node.id, node);
  }

  // Build adjacency: parent -> children based on 'locatedIn' edges
  const parentToChildren = new Map<string, string[]>();
  const childToParent = new Map<string, string>();

  for (const edge of edges) {
    if (
      edge.attributes?.type?.category === 'structural' &&
      edge.attributes?.type?.type === 'locatedIn'
    ) {
      const childId = edge.source;
      const parentId = edge.target;
      if (nodeMap.has(childId) && nodeMap.has(parentId)) {
        if (!parentToChildren.has(parentId)) {
          parentToChildren.set(parentId, []);
        }
        parentToChildren.get(parentId)!.push(childId);
        childToParent.set(childId, parentId);
      }
    }
  }

  // For file nodes that don't have a parent yet, create folder nodes based on their path
  const timestamp = new Date().toISOString();
  for (const node of fileNodes) {
    if (childToParent.has(node.id)) {
      continue; // already has a parent
    }

    // Determine the file path
    const filePath = node.metadata?.filePath || node.metadata?.localPath || node.id;
    if (!filePath) {
      continue;
    }

    // Split path into components
    const parts = filePath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      continue; // no parent directory
    }

    // Build folder nodes for each directory component
    let currentParentId: string | null = null;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parts.slice(0, i + 1).join('/');
      const folderId = `folder:${folderPath}`;

      if (!nodeMap.has(folderId)) {
        // Create a synthetic folder node
        const folderNode: GraphNodeAttributes = {
          id: folderId,
          type: { category: 'file', type: 'folder' },
          label: parts[i],
          description: `Folder: ${folderPath}`,
          metadata: {
            filePath: folderPath,
            localPath: folderPath,
          },
          timestamp,
        };
        nodeMap.set(folderId, folderNode);
        // We don't add it to the original nodes array, just for tree building
      }

      if (currentParentId) {
        // Ensure edge exists between parent and this folder
        if (!parentToChildren.has(currentParentId)) {
          parentToChildren.set(currentParentId, []);
        }
        if (!parentToChildren.get(currentParentId)!.includes(folderId)) {
          parentToChildren.get(currentParentId)!.push(folderId);
          childToParent.set(folderId, currentParentId);
        }
      }

      currentParentId = folderId;
    }

    // Connect the file node to its parent folder
    if (currentParentId) {
      if (!parentToChildren.has(currentParentId)) {
        parentToChildren.set(currentParentId, []);
      }
      if (!parentToChildren.get(currentParentId)!.includes(node.id)) {
        parentToChildren.get(currentParentId)!.push(node.id);
        childToParent.set(node.id, currentParentId);
      }
    }
  }

  // Find root nodes (those without a parent)
  const rootIds = Array.from(nodeMap.keys()).filter(
    (id) => !childToParent.has(id)
  );

  // Recursively build tree
  function buildNode(nodeId: string): FileTreeNode {
    const node = nodeMap.get(nodeId)!;
    const isFolder = node.type?.type === 'folder';
    const children = (parentToChildren.get(nodeId) || []).map(buildNode);

    return {
      id: nodeId,
      name: node.label || nodeId,
      type: isFolder ? 'folder' : 'file',
      path: node.metadata?.filePath || node.metadata?.localPath || nodeId,
      children: isFolder ? children : undefined,
      metadata: node.metadata,
    };
  }

  return rootIds.map(buildNode);
}
