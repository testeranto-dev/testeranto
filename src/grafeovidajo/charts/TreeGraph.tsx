import React from 'react';
import { BaseChart, VizComponentProps } from './BaseChart';
import { VizConfig, GraphData } from '../core/types';

export interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation: 'horizontal' | 'vertical';
  nodeSeparation: number;
  levelSeparation: number;
}

export const TreeGraph: React.FC<VizComponentProps & { config: TreeConfig }> = (props) => {
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
