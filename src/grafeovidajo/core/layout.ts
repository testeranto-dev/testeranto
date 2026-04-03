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
  rootId?: string,
  orientation?: 'horizontal' | 'vertical',
  nodeSeparation?: number,
  levelSeparation?: number
): ProjectedNode[] {
  // Build adjacency list for faster lookups
  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();
  
  // Initialize maps
  nodes.forEach(node => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });
  
  // Build adjacency lists
  edges.forEach(edge => {
    // Add to outgoing edges of source
    const sourceOutgoing = outgoingEdges.get(edge.source) || [];
    sourceOutgoing.push(edge.target);
    outgoingEdges.set(edge.source, sourceOutgoing);
    
    // Add to incoming edges of target
    const targetIncoming = incomingEdges.get(edge.target) || [];
    targetIncoming.push(edge.source);
    incomingEdges.set(edge.target, targetIncoming);
  });
  
  // Find root node(s) - nodes with no incoming edges
  let rootNodes: ProjectedNode[] = [];
  if (rootId) {
    const rootNode = nodes.find(n => n.id === rootId);
    if (rootNode) {
      rootNodes = [rootNode];
    }
  }
  
  if (rootNodes.length === 0) {
    rootNodes = nodes.filter(node => {
      const incoming = incomingEdges.get(node.id) || [];
      return incoming.length === 0;
    });
  }
  
  // If no root found (cyclic graph), use first node
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes = [nodes[0]];
  }
  
  // Calculate depth using BFS to avoid recursion issues
  const depthMap = new Map<string, number>();
  const queue: { nodeId: string; depth: number }[] = [];
  
  // Initialize queue with root nodes at depth 0
  rootNodes.forEach(root => {
    depthMap.set(root.id, 0);
    queue.push({ nodeId: root.id, depth: 0 });
  });
  
  // Process queue
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = current.depth;
    const currentNodeId = current.nodeId;
    
    // Get children (outgoing edges)
    const children = outgoingEdges.get(currentNodeId) || [];
    
    for (const childId of children) {
      // Only update if we found a shorter path (shouldn't happen in a tree)
      // or if node hasn't been visited yet
      if (!depthMap.has(childId)) {
        depthMap.set(childId, currentDepth + 1);
        queue.push({ nodeId: childId, depth: currentDepth + 1 });
      }
    }
  }
  
  // For any nodes not reached by BFS (disconnected components), assign depth
  nodes.forEach(node => {
    if (!depthMap.has(node.id)) {
      depthMap.set(node.id, 0);
    }
  });
  
  // Group nodes by depth
  const nodesByDepth = new Map<number, ProjectedNode[]>();
  nodes.forEach(node => {
    const depth = depthMap.get(node.id) || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Use provided separation values or defaults
  const levelSep = levelSeparation || 100;
  const nodeSep = nodeSeparation || 80;
  
  // Handle orientation
  const isHorizontal = orientation === 'horizontal';
  
  return nodes.map(node => {
    const depth = depthMap.get(node.id) || 0;
    const nodesAtDepth = nodesByDepth.get(depth) || [];
    const index = nodesAtDepth.findIndex(n => n.id === node.id);
    
    if (isHorizontal) {
      // Horizontal orientation: depth maps to x, index maps to y
      return {
        ...node,
        screenX: depth * levelSep,
        screenY: index * nodeSep
      };
    } else {
      // Vertical orientation (default): depth maps to y, index maps to x
      return {
        ...node,
        screenX: index * nodeSep,
        screenY: depth * levelSep
      };
    }
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
