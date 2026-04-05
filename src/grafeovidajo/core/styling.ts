import { ProjectedGraph, StyleConfig, StyledGraph, StyledNode } from './types';
import { Palette } from '../../colors';

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

  // Default color logic for test and test_result nodes
  const type = node.attributes?.type || 'unknown';

  // For test_result nodes, color based on result
  if (type === 'test_result') {
    const metadata = node.attributes?.metadata || {};
    const result = metadata.result;

    // Determine color based on result
    if (result === 0 || result === false) {
      return Palette.bluishGreen; // Success
    } else if (result > 0) {
      return Palette.amberGold; // Warning
    } else if (result < 0 || result === true) {
      return Palette.deepOrange; // Error
    }
    // Default for test_result
    return Palette.deepOrange;
  }

  // For test nodes, check if they have a failed status
  if (type === 'test') {
    const metadata = node.attributes?.metadata || {};
    const failed = metadata.failed;

    if (failed === false) {
      return Palette.bluishGreen; // Success
    } else if (failed === true) {
      return Palette.deepOrange; // Error
    }
  }

  // For other node types, use a default mapping
  const typeColors: Record<string, string> = {
    'feature': Palette.bluishGreen,
    'entrypoint': Palette.rust,
    'test': Palette.amberGold,
    'test_result': Palette.deepOrange,
    'file': Palette.warmGrey,
    'documentation': Palette.oliveDark,
    'config': Palette.charcoal,
    'attribute': Palette.amberGold,
    'folder': Palette.oliveDark,
    'domain': Palette.rust,
    'unknown': Palette.charcoal
  };

  return typeColors[type] || colorConfig || '#3498db';
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
