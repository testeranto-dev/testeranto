import { GraphData, ProjectionConfig, ProjectedGraph, ProjectedNode, ProjectedEdge } from './types';

export function projectGraph(
  graph: GraphData,
  config: ProjectionConfig
): ProjectedGraph {
  const nodes: ProjectedNode[] = [];
  const edges: ProjectedEdge[] = [];
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  // Filter out invalid nodes and ensure they have attributes
  const validNodes = (graph.nodes || []).filter(node => node && typeof node.id === 'string');
  
  // Project nodes
  for (const node of validNodes) {
    // Ensure node has attributes
    const nodeWithAttributes = {
      ...node,
      attributes: node.attributes || {}
    };
    
    const x = getProjectedValue(nodeWithAttributes, config.xAttribute, config.xType, config.xTransform);
    const y = getProjectedValue(nodeWithAttributes, config.yAttribute, config.yType, config.yTransform);
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    nodes.push({
      ...nodeWithAttributes,
      x,
      y
    });
  }
  
  // Project edges if they exist
  if (graph.edges) {
    for (const edge of graph.edges) {
      if (edge && edge.source && edge.target) {
        edges.push({
          ...edge,
          attributes: edge.attributes || {}
        });
      }
    }
  }
  
  return {
    nodes,
    edges: edges.length > 0 ? edges : undefined,
    bounds: {
      x: [minX, maxX],
      y: [minY, maxY]
    }
  };
}

function getProjectedValue(
  node: Node,
  attribute?: string,
  type?: string,
  transform?: (value: any) => number
): number {
  if (!attribute) return 0.5; // Default center position
  
  // Ensure node.attributes exists
  const attributes = node.attributes || {};
  const value = attributes[attribute];
  
  if (transform) {
    return transform(value);
  }
  
  // Default transformations based on type
  switch (type) {
    case 'continuous':
      return typeof value === 'number' ? value : 0;
    case 'categorical':
      // For categorical, we need a mapping - this is a stub
      return typeof value === 'string' ? value.charCodeAt(0) % 10 / 10 : 0;
    case 'ordinal':
      return typeof value === 'number' ? value : 0;
    case 'temporal':
      return value instanceof Date ? value.getTime() : 0;
    default:
      return typeof value === 'number' ? value : 0.5;
  }
}
