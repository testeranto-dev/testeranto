import { ProjectedNode, Edge } from './types';

export function layoutGrid(
  nodes: ProjectedNode[],
  spacing: { x: number; y: number } = { x: 50, y: 50 }
): ProjectedNode[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });
  
  return sortedNodes.map((node, index) => ({
    ...node,
    screenX: index * spacing.x,
    screenY: Math.floor(index / 10) * spacing.y
  }));
}

export function layoutForce(
  nodes: ProjectedNode[],
  edges?: Edge[]
): ProjectedNode[] {
  // Stub implementation - would use force simulation
  return nodes.map(node => ({
    ...node,
    screenX: node.x * 100,
    screenY: node.y * 100
  }));
}

export function layoutTree(
  nodes: ProjectedNode[],
  edges: Edge[],
  rootId?: string
): ProjectedNode[] {
  // Find root node
  let root = rootId ? nodes.find(n => n.id === rootId) : null;
  if (!root) {
    // Find nodes with no incoming edges (roots)
    const nodeIds = new Set(nodes.map(n => n.id));
    const targetIds = new Set(edges.map(e => e.target));
    const rootIds = [...nodeIds].filter(id => !targetIds.has(id));
    root = nodes.find(n => n.id === rootIds[0]) || nodes[0];
  }
  
  // Calculate depth for each node
  const depthMap = new Map<string, number>();
  
  const calculateDepth = (nodeId: string): number => {
    if (depthMap.has(nodeId)) return depthMap.get(nodeId)!;
    
    const incomingEdges = edges.filter(e => e.target === nodeId);
    if (incomingEdges.length === 0) {
      depthMap.set(nodeId, 0);
      return 0;
    }
    
    // Get max depth of parents + 1
    const parentDepths = incomingEdges.map(e => calculateDepth(e.source));
    const depth = Math.max(...parentDepths) + 1;
    depthMap.set(nodeId, depth);
    return depth;
  };
  
  nodes.forEach(node => calculateDepth(node.id));
  
  // Group nodes by depth
  const nodesByDepth = new Map<number, ProjectedNode[]>();
  nodes.forEach(node => {
    const depth = depthMap.get(node.id) || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Position nodes
  const maxDepth = Math.max(...Array.from(nodesByDepth.keys()));
  const levelSeparation = 100;
  const nodeSeparation = 80;
  
  return nodes.map(node => {
    const depth = depthMap.get(node.id) || 0;
    const nodesAtDepth = nodesByDepth.get(depth) || [];
    const index = nodesAtDepth.findIndex(n => n.id === node.id);
    
    return {
      ...node,
      screenX: index * nodeSeparation,
      screenY: depth * levelSeparation
    };
  });
}

export function layoutTimeline(
  nodes: ProjectedNode[],
  timeAttribute: string
): ProjectedNode[] {
  // Stub implementation - would position nodes along timeline
  const timeNodes = nodes.map(node => ({
    node,
    time: node.attributes[timeAttribute]
  })).sort((a, b) => a.time - b.time);
  
  return timeNodes.map(({ node }, index) => ({
    ...node,
    screenX: index * 80,
    screenY: 50
  }));
}
