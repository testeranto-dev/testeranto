// Basic graph structure for VS Code extension
export interface GraphData {
  nodes: Node[];
  edges?: Edge[];
  metadata?: Record<string, any>;
}

export interface Node {
  id: string;
  type?: string;
  label?: string;
  description?: string;
  icon?: string;
  metadata?: Record<string, any>;
  attributes?: Record<string, any>;
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
