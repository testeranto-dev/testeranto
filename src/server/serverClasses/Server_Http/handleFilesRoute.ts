import type { FilesAndFoldersResponse, IFileRouteResponse } from "../../../api";
import type { Server_Graph } from "../Server_Graph";

export function handleFilesRoute(graphManager: Server_Graph): Response {
  const filesData = graphManager.getFilesAndFolders();

  // Build a tree structure from nodes and edges
  const nodes = filesData.nodes.map(node => ({
    id: node.id,
    type: node.type as 'file' | 'folder',
    label: node.label || '',
    description: node.description,
    status: node.status,
    priority: node.priority,
    timestamp: node.timestamp,
    metadata: node.metadata,
    icon: node.icon
  }));

  const edges = filesData.edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    attributes: {
      type: edge.attributes.type || '',
      timestamp: edge.attributes.timestamp,
      metadata: edge.attributes.metadata,
      directed: edge.attributes.directed
    }
  }));

  // Build tree structure
  let tree: TreeNode[] = [];
  try {
    tree = buildFileTree(nodes, edges);
  } catch (error) {
    console.error('[handleFilesRoute] Error building tree:', error);
    // Continue with empty tree
  }

  // Return both the original flat structure and the tree for backward compatibility
  const response = {
    tree,
    timestamp: new Date().toISOString()
  };

  console.log('[handleFilesRoute] Response includes tree with', tree.length, 'root nodes');

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  label?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  metadata?: Record<string, any>;
  icon?: string;
  children?: TreeNode[];
}

function buildFileTree(
  nodes: FilesAndFoldersResponse['nodes'],
  edges: FilesAndFoldersResponse['edges']
): TreeNode[] {
  try {
    // Create a map of node id to node
    const nodeMap = new Map<string, FilesAndFoldersResponse['nodes'][0]>();
    for (const node of nodes) {
      if (node && node.id) {
        nodeMap.set(node.id, node);
      }
    }

    // Find root nodes (nodes with no incoming 'contains' or 'parentOf' edges)
    const rootNodeIds = new Set<string>();
    for (const node of nodes) {
      if (node && node.id) {
        rootNodeIds.add(node.id);
      }
    }

    for (const edge of edges) {
      if (edge && edge.attributes &&
        (edge.attributes.type === 'contains' || edge.attributes.type === 'parentOf')) {
        rootNodeIds.delete(edge.target);
      }
    }

    // Build adjacency list for parent-child relationships
    const childrenMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (edge && edge.attributes &&
        (edge.attributes.type === 'contains' || edge.attributes.type === 'parentOf')) {
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, []);
        }
        childrenMap.get(edge.source)!.push(edge.target);
      }
    }

    // Helper to build tree recursively
    function buildTreeNode(nodeId: string): TreeNode | null {
      const node = nodeMap.get(nodeId);
      if (!node) {
        console.warn('[buildFileTree] Node not found:', nodeId);
        return null;
      }

      const path = node.metadata?.path || node.metadata?.filePath || node.label || '';
      const name = path.split('/').pop() || nodeId;

      const treeNode: TreeNode = {
        id: node.id,
        name,
        type: node.type,
        path,
        label: node.label,
        description: node.description,
        status: node.status,
        priority: node.priority,
        timestamp: node.timestamp,
        metadata: node.metadata,
        icon: node.icon
      };

      const childIds = childrenMap.get(nodeId) || [];
      if (childIds.length > 0) {
        const children: TreeNode[] = [];
        for (const childId of childIds) {
          const childNode = buildTreeNode(childId);
          if (childNode) {
            children.push(childNode);
          }
        }
        if (children.length > 0) {
          treeNode.children = children;
          // Sort children: folders first, then files, then by name
          treeNode.children.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return (a.name || '').localeCompare(b.name || '');
          });
        }
      }

      return treeNode;
    }

    // Build trees for all root nodes
    const rootTrees: TreeNode[] = [];
    for (const rootId of rootNodeIds) {
      const tree = buildTreeNode(rootId);
      if (tree) {
        rootTrees.push(tree);
      }
    }

    // Sort root trees
    rootTrees.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log('[buildFileTree] Built tree with', rootTrees.length, 'root nodes');
    return rootTrees;
  } catch (error) {
    console.error('[buildFileTree] Error:', error);
    return [];
  }
}
