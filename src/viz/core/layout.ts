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
  // Stub implementation - would use tree layout algorithm
  const root = rootId ? nodes.find(n => n.id === rootId) : nodes[0];
  
  return nodes.map((node, index) => ({
    ...node,
    screenX: index * 60,
    screenY: getDepth(node, edges, nodes) * 80
  }));
}

function getDepth(node: ProjectedNode, edges: Edge[], allNodes: ProjectedNode[]): number {
  // Simple depth calculation - would be more sophisticated in real implementation
  const incomingEdges = edges.filter(e => e.target === node.id);
  if (incomingEdges.length === 0) return 0;
  
  const sourceNodes = incomingEdges.map(e => allNodes.find(n => n.id === e.source));
  const maxDepth = Math.max(...sourceNodes.map(n => getDepth(n!, edges, allNodes)));
  return maxDepth + 1;
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
