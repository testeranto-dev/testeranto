import React, { useMemo } from 'react';
import { GraphData, VizConfig, VizComponentProps } from '../core/types';
import { projectGraph } from '../core/projection';
import { applyStyles } from '../core/styling';
import { layoutGrid, layoutForce, layoutTree, layoutTimeline } from '../core/layout';

// Define TreeConfig interface locally since we need it for type checking
interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation?: 'horizontal' | 'vertical';
  nodeSeparation?: number;
  levelSeparation?: number;
}

export const BaseChart: React.FC<VizComponentProps> = ({
  data,
  config,
  width,
  height,
  onNodeClick,
  onNodeHover
}) => {
  // Project the graph data (without useMemo)
  const projectedGraph = projectGraph(data, config.projection);

  // Apply layout (without useMemo)
  const nodes = projectedGraph.nodes;
  let laidOutNodes = [...nodes];
  
  switch (config.projection.layout) {
    case 'grid':
      laidOutNodes = layoutGrid(nodes, config.projection.spacing);
      break;
    case 'force':
      laidOutNodes = layoutForce(nodes, data.edges);
      break;
    case 'tree':
      if (data.edges) {
        // Cast config to TreeConfig to access tree-specific properties
        const treeConfig = config as TreeConfig;
        laidOutNodes = layoutTree(
          nodes, 
          data.edges, 
          treeConfig.rootId,
          treeConfig.orientation,
          treeConfig.nodeSeparation,
          treeConfig.levelSeparation
        );
      }
      break;
    case 'timeline':
      if (config.projection.xAttribute) {
        laidOutNodes = layoutTimeline(nodes, config.projection.xAttribute);
      }
      break;
    default:
      // No layout - use projected coordinates directly
      laidOutNodes = nodes.map(node => ({
        ...node,
        screenX: node.x * width,
        screenY: node.y * height
      }));
  }
  
  const laidOutGraph = {
    ...projectedGraph,
    nodes: laidOutNodes
  };

  // Apply styles (without useMemo)
  const styledGraph = applyStyles(laidOutGraph, config.style);

  // Render nodes
  const renderNodes = () => {
    return styledGraph.nodes.map((node) => {
      const x = node.screenX || node.x * width;
      const y = node.screenY || node.y * height;
      
      const nodeProps = {
        key: node.id,
        cx: x,
        cy: y,
        r: node.size,
        fill: node.color,
        onClick: () => onNodeClick?.(node),
        onMouseEnter: () => onNodeHover?.(node),
        onMouseLeave: () => onNodeHover?.(null),
        style: { cursor: 'pointer' }
      };
      
      switch (node.shape) {
        case 'square':
          return (
            <rect
              {...nodeProps}
              x={x - node.size}
              y={y - node.size}
              width={node.size * 2}
              height={node.size * 2}
            />
          );
        case 'diamond':
          return (
            <polygon
              {...nodeProps}
              points={`${x},${y - node.size} ${x + node.size},${y} ${x},${y + node.size} ${x - node.size},${y}`}
            />
          );
        default: // circle
          return <circle {...nodeProps} />;
      }
    });
  };

  // Render edges
  const renderEdges = () => {
    if (!styledGraph.edges) return null;
    
    return styledGraph.edges.map((edge, index) => {
      const sourceNode = styledGraph.nodes.find(n => n.id === edge.source);
      const targetNode = styledGraph.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const x1 = sourceNode.screenX || sourceNode.x * width;
      const y1 = sourceNode.screenY || sourceNode.y * height;
      const x2 = targetNode.screenX || targetNode.x * width;
      const y2 = targetNode.screenY || targetNode.y * height;
      
      return (
        <line
          key={`edge-${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={config.style?.edgeColor || '#999'}
          strokeWidth={config.style?.edgeWidth || 1}
        />
      );
    });
  };

  // Render labels
  const renderLabels = () => {
    if (!config.style?.labels?.show) return null;
    
    return styledGraph.nodes.map((node) => {
      if (!node.label) return null;
      
      const x = node.screenX || node.x * width;
      const y = node.screenY || node.y * height;
      
      return (
        <text
          key={`label-${node.id}`}
          x={x}
          y={y + node.size + 15}
          textAnchor="middle"
          fontSize={config.style.labels?.fontSize || 12}
          fill="#333"
        >
          {node.label}
        </text>
      );
    });
  };

  return (
    <svg width={width} height={height} style={{ border: '1px solid #ccc' }}>
      {renderEdges()}
      {renderNodes()}
      {renderLabels()}
    </svg>
  );
};
