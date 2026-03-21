import { ProjectedGraph, StyleConfig, StyledGraph, StyledNode } from './types';

export function applyStyles(
  projectedGraph: ProjectedGraph,
  styleConfig: StyleConfig = {}
): StyledGraph {
  const styledNodes: StyledNode[] = projectedGraph.nodes.map(node => {
    const size = getNodeSize(node, styleConfig.nodeSize);
    const color = getNodeColor(node, styleConfig.nodeColor);
    const shape = getNodeShape(node, styleConfig.nodeShape);
    const label = getNodeLabel(node, styleConfig.labels);
    
    return {
      ...node,
      size,
      color,
      shape,
      label
    };
  });
  
  return {
    ...projectedGraph,
    nodes: styledNodes
  };
}

function getNodeSize(node: StyledNode, sizeConfig?: number | ((node: StyledNode) => number)): number {
  if (typeof sizeConfig === 'function') {
    return sizeConfig(node);
  }
  return sizeConfig || 10;
}

function getNodeColor(node: StyledNode, colorConfig?: string | ((node: StyledNode) => string)): string {
  if (typeof colorConfig === 'function') {
    return colorConfig(node);
  }
  return colorConfig || '#3498db';
}

function getNodeShape(node: StyledNode, shapeConfig?: string | ((node: StyledNode) => string)): string {
  if (typeof shapeConfig === 'function') {
    return shapeConfig(node);
  }
  return shapeConfig || 'circle';
}

function getNodeLabel(node: StyledNode, labelsConfig?: StyleConfig['labels']): string | undefined {
  if (!labelsConfig?.show) return undefined;
  
  const attribute = labelsConfig.attribute || 'id';
  return node.attributes[attribute] || node.id;
}
