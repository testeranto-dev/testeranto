import React from 'react';
import type { GraphData } from '../../../graph';
import { type VizConfig, type VizComponentProps } from '../../../grafeovidajo';
import { BaseChart } from './BaseChart';

export interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation: 'horizontal' | 'vertical';
  nodeSeparation: number;
  levelSeparation: number;
}

import type { GraphData } from '../../../graph';
import type { ViewComponentProps } from '../BaseView';

// Define the specific props for TreeGraph
export interface TreeGraphProps extends ViewComponentProps<GraphData> {
  config: TreeConfig;
}

export const TreeGraph: React.FC<TreeGraphProps> = (props) => {
  // Extract tree structure from graph data by filtering to only include parentOf edges
  const extractTreeData = (graphData: GraphData): GraphData => {
    // Filter edges to only include parentOf relationships
    const treeEdges = graphData.edges?.filter(edge =>
      edge.attributes?.type === 'parentOf'
    ) || [];

    // Get all node IDs that are part of the tree (either source or target of parentOf edges)
    const treeNodeIds = new Set<string>();
    treeEdges.forEach(edge => {
      treeNodeIds.add(edge.source);
      treeNodeIds.add(edge.target);
    });

    // Filter nodes to only include those in the tree
    const treeNodes = graphData.nodes.filter(node =>
      treeNodeIds.has(node.id) || node.attributes?.type === 'feature'
    );

    return {
      nodes: treeNodes,
      edges: treeEdges,
      metadata: graphData.metadata
    };
  };

  const treeData = extractTreeData(props.data);

  return <BaseChart {...props} data={treeData} />;
};

// Wrapper component that uses BaseView
export const TreeGraphView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  const treeConfig: TreeConfig = {
    rootId: undefined,
    orientation: 'horizontal',
    nodeSeparation: 100,
    levelSeparation: 100
  };

  return (
    <BaseView
      slicePath={slicePath}
      component={TreeGraph}
      config={treeConfig}
      width={width}
      height={height}
    />
  );
};
