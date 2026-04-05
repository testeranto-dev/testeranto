import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import { ProjectedNode, Edge } from './types';

export interface ForceLayoutOptions {
  width?: number;
  height?: number;
  strength?: number;
  distance?: number;
  iterations?: number;
  center?: { x: number; y: number };
}

export function layoutForceWithD3(
  nodes: ProjectedNode[],
  edges?: Edge[],
  options: ForceLayoutOptions = {}
): ProjectedNode[] {
  const {
    width = 800,
    height = 600,
    strength = -300,
    distance = 100,
    iterations = 150,
    center = { x: width / 2, y: height / 2 }
  } = options;

  // If no edges or nodes, return nodes with default positions
  if (nodes.length === 0) {
    return nodes;
  }

  // Create a map of node IDs to their indices for quick lookup
  const nodeIdMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIdMap.set(node.id, index);
  });

  // Prepare nodes for d3-force
  const d3Nodes = nodes.map((node, i) => ({
    id: node.id,
    x: node.screenX || (i % 10) * 80,
    y: node.screenY || Math.floor(i / 10) * 80,
    radius: 10
  }));

  // Prepare links for d3-force, filtering out edges that reference non-existent nodes
  const d3Links: Array<{source: number; target: number; distance: number}> = [];
  
  if (edges && edges.length > 0) {
    for (const edge of edges) {
      const sourceIndex = nodeIdMap.get(edge.source);
      const targetIndex = nodeIdMap.get(edge.target);
      
      // Only add the link if both source and target nodes exist
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        d3Links.push({
          source: sourceIndex,
          target: targetIndex,
          distance: distance
        });
      } else {
        // Log missing nodes for debugging
        if (sourceIndex === undefined) {
          console.warn(`[forceLayout] Source node not found: ${edge.source}`);
        }
        if (targetIndex === undefined) {
          console.warn(`[forceLayout] Target node not found: ${edge.target}`);
        }
      }
    }
  }

  // If no valid links, use grid layout
  if (d3Links.length === 0) {
    return nodes.map((node, i) => ({
      ...node,
      screenX: node.screenX || (i % 10) * 80,
      screenY: node.screenY || Math.floor(i / 10) * 80
    }));
  }

  // Create force simulation
  const simulation = forceSimulation(d3Nodes as any)
    .force('charge', forceManyBody().strength(strength))
    .force('link', forceLink(d3Links as any).distance(distance))
    .force('center', forceCenter(center.x, center.y))
    .force('collision', forceCollide().radius(20))
    .stop();

  // Run simulation for specified number of iterations
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Map results back to ProjectedNode format
  return nodes.map((node, index) => {
    const d3Node = d3Nodes[index];
    return {
      ...node,
      screenX: d3Node ? d3Node.x : (node.screenX || node.x * width),
      screenY: d3Node ? d3Node.y : (node.screenY || node.y * height)
    };
  });
}
