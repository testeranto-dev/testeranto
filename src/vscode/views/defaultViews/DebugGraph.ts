import type { GraphData } from "../../../graph";

export type DebugNode = {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  attributes?: Record<string, any>;
}

export type DebugEdge = {
  source: string;
  target: string;
  type?: string;
  weight?: number;
  attributes?: Record<string, any>;
}

export type IDebugGraph = {
  nodes: DebugNode[];
  edges: DebugEdge[];
  viewType: 'debug';
  timestamp: string;
}

export const DebugGraphSlicer = (graphData: GraphData): IDebugGraph => {
  const nodes: DebugNode[] = graphData.nodes.map(node => ({
    id: node.id,
    label: node.label,
    type: node.type,
    x: Math.random() * 800, // Default positions for sigma.js
    y: Math.random() * 600,
    size: 5,
    color: '#4a90e2',
    attributes: node.attributes
  }));

  const edges: DebugEdge[] = (graphData.edges || []).map(edge => ({
    source: edge.source,
    target: edge.target,
    type: edge.attributes?.type,
    weight: edge.attributes?.weight,
    attributes: edge.attributes
  }));

  return {
    nodes,
    edges,
    viewType: 'debug',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: DebugGraphSlicer,
  filePath: 'src/views/defaultViews/DebugGraphView.tsx'
}
