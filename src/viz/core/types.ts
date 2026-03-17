// Basic graph structure
export interface GraphData {
  nodes: Node[];
  edges?: Edge[];
}

export interface Node {
  id: string;
  attributes: Record<string, any>;
}

export interface Edge {
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

// Projection configuration
export interface ProjectionConfig {
  xAttribute?: string;
  yAttribute?: string;
  xType?: 'categorical' | 'continuous' | 'ordinal' | 'temporal';
  yType?: 'categorical' | 'continuous' | 'ordinal' | 'temporal';
  
  layout?: 'grid' | 'force' | 'tree' | 'timeline' | 'none';
  spacing?: {
    x: number;
    y: number;
  };
  
  xDomain?: [min: number, max: number] | string[];
  yDomain?: [min: number, max: number] | string[];
  
  xTransform?: (value: any) => number;
  yTransform?: (value: any) => number;
}

// Styling configuration
export interface StyleConfig {
  nodeSize?: number | ((node: Node) => number);
  nodeColor?: string | ((node: Node) => string);
  nodeShape?: 'circle' | 'square' | 'diamond' | ((node: Node) => string);
  edgeColor?: string;
  edgeWidth?: number;
  labels?: {
    show?: boolean;
    attribute?: string;
    fontSize?: number;
  };
}

// Complete visualization configuration
export interface VizConfig {
  projection: ProjectionConfig;
  style?: StyleConfig;
  interactivity?: {
    hover?: boolean;
    click?: boolean;
    drag?: boolean;
    zoom?: boolean;
  };
}

// Projected graph types
export interface ProjectedGraph {
  nodes: ProjectedNode[];
  edges?: ProjectedEdge[];
  bounds: {
    x: [min: number, max: number];
    y: [min: number, max: number];
  };
}

export interface ProjectedNode extends Node {
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
}

export interface ProjectedEdge extends Edge {
  sourceX?: number;
  sourceY?: number;
  targetX?: number;
  targetY?: number;
}

// Styled graph types
export interface StyledGraph extends ProjectedGraph {
  nodes: StyledNode[];
}

export interface StyledNode extends ProjectedNode {
  size: number;
  color: string;
  shape: string;
  label?: string;
}

// Main Viz Component Props
export interface VizComponentProps {
  data: GraphData;
  config: VizConfig;
  width: number;
  height: number;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
}
