import Graph from 'graphology';
import Attributes from 'graphology';

export type TesterantoGraph<N, E, G = {}> = Graph<N, E, G>;

// Node types in our graph
export type GraphNodeType =
  | 'feature'      // Markdown feature files
  | 'suite'        // Test suites
  | 'test'         // Individual tests
  | 'test_result'  // Test results
  | 'file'         // File system nodes
  | 'documentation' // Documentation nodes
  | 'runtime'      // Runtime nodes
  | 'config';      // Configuration nodes

// Edge types in our graph
export type GraphEdgeType =
  | 'dependsUpon'  // Feature depends on another feature
  | 'blocks'       // Feature blocks another feature
  | 'associatedWith' // Feature associated with test/suite
  | 'hasResult'    // Test has a result
  | 'belongsTo'    // Test belongs to a suite
  | 'locatedIn'    // Node located in file/directory
  | 'parentOf'     // Parent-child relationship for tree structure
  | 'runsOn'       // Suite/test runs on runtime
  | 'configuredBy'; // Configured by config

// Base node attributes
export interface GraphNodeAttributes extends Attributes {
  id: string;
  type: GraphNodeType;
  label: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  metadata?: Record<string, any>;
}

// Base edge attributes
export interface GraphEdgeAttributes extends Attributes {
  type: GraphEdgeType;
  weight?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

// Graph data structure for serialization
export interface GraphData {
  nodes: GraphNodeAttributes[];
  edges: Array<{
    source: string;
    target: string;
    attributes: GraphEdgeAttributes;
  }>;
  metadata?: {
    version: string;
    timestamp: string;
    source?: string;
  };
}

// Graph operations
export interface GraphOperation {
  type: 'addNode' | 'updateNode' | 'removeNode' | 'addEdge' | 'updateEdge' | 'removeEdge';
  data: any;
  timestamp: string;
}

// Graph update payload
export interface GraphUpdate {
  operations: GraphOperation[];
  timestamp: string;
}

// Create a new graph instance with our schema
export function createGraph(): Graph<GraphNodeAttributes, GraphEdgeAttributes> {
  return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
    multi: false,
    allowSelfLoops: false,
    type: 'directed'
  });
}

// Convert graph to serializable data
export function graphToData(graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>): GraphData {
  const nodes: GraphNodeAttributes[] = [];
  const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

  graph.forEachNode((node, attributes) => {
    nodes.push({ ...attributes, id: node });
  });

  graph.forEachEdge((edge, attributes, source, target) => {
    edges.push({
      source,
      target,
      attributes: { ...attributes }
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  };
}

// Load data into graph
export function dataToGraph(data: GraphData): Graph<GraphNodeAttributes, GraphEdgeAttributes> {
  const graph = createGraph();

  // Add nodes
  data.nodes.forEach(node => {
    graph.addNode(node.id, node);
  });

  // Add edges
  data.edges.forEach(edge => {
    graph.addEdge(edge.source, edge.target, edge.attributes);
  });

  return graph;
}

// Helper to create node attributes
export function createNodeAttributes(
  id: string,
  type: GraphNodeType,
  label: string,
  options?: Partial<Omit<GraphNodeAttributes, 'id' | 'type' | 'label'>>
): GraphNodeAttributes {
  return {
    id,
    type,
    label,
    description: options?.description,
    status: options?.status,
    priority: options?.priority,
    timestamp: options?.timestamp || new Date().toISOString(),
    metadata: options?.metadata
  };
}

// Helper to create edge attributes
export function createEdgeAttributes(
  type: GraphEdgeType,
  options?: Partial<Omit<GraphEdgeAttributes, 'type'>>
): GraphEdgeAttributes {
  return {
    type,
    weight: options?.weight,
    timestamp: options?.timestamp || new Date().toISOString(),
    metadata: options?.metadata
  };
}

// Helper to create a graph operation
export function createGraphOperation(
  type: GraphOperation['type'],
  data: any,
  timestamp?: string
): GraphOperation {
  return {
    type,
    data,
    timestamp: timestamp || new Date().toISOString()
  };
}

// Helper to create a graph update
export function createGraphUpdate(
  operations: GraphOperation[],
  timestamp?: string
): GraphUpdate {
  return {
    operations,
    timestamp: timestamp || new Date().toISOString()
  };
}

// Type guard to check if an object is GraphData
export function isGraphData(obj: any): obj is GraphData {
  return (
    obj &&
    Array.isArray(obj.nodes) &&
    obj.nodes.every((node: any) =>
      node &&
      typeof node.id === 'string' &&
      typeof node.type === 'string' &&
      typeof node.label === 'string'
    ) &&
    Array.isArray(obj.edges) &&
    obj.edges.every((edge: any) =>
      edge &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string' &&
      edge.attributes &&
      typeof edge.attributes.type === 'string'
    )
  );
}

// Merge two graph data objects
export function mergeGraphData(
  base: GraphData,
  update: GraphData
): GraphData {
  const nodeMap = new Map<string, GraphNodeAttributes>();
  const edgeMap = new Map<string, { source: string; target: string; attributes: GraphEdgeAttributes }>();

  // Add all nodes from base
  base.nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Update or add nodes from update
  update.nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Add all edges from base
  base.edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    edgeMap.set(key, { ...edge });
  });

  // Update or add edges from update
  update.edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    edgeMap.set(key, { ...edge });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'merged'
    }
  };
}

// Convert our GraphData to grafeovidajo's GraphData format
export function toGrafeovidajoGraphData(graphData: GraphData): {
  nodes: Array<{ id: string; attributes: Record<string, any> }>;
  edges?: Array<{ source: string; target: string; attributes?: Record<string, any> }>;
} {
  return {
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      attributes: {
        ...node,
        // Ensure we don't duplicate the id in attributes
        id: undefined
      }
    })),
    edges: graphData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      attributes: edge.attributes
    }))
  };
}

// Convert from grafeovidajo's GraphData format to our GraphData
export function fromGrafeovidajoGraphData(
  data: {
    nodes: Array<{ id: string; attributes: Record<string, any> }>;
    edges?: Array<{ source: string; target: string; attributes?: Record<string, any> }>
  }
): GraphData {
  return {
    nodes: data.nodes.map(node => ({
      id: node.id,
      type: node.attributes.type as GraphNodeType || 'feature',
      label: node.attributes.label || node.id,
      description: node.attributes.description,
      status: node.attributes.status,
      priority: node.attributes.priority,
      timestamp: node.attributes.timestamp,
      metadata: node.attributes.metadata
    })),
    edges: (data.edges || []).map(edge => ({
      source: edge.source,
      target: edge.target,
      attributes: {
        type: (edge.attributes?.type as GraphEdgeType) || 'associatedWith',
        weight: edge.attributes?.weight,
        timestamp: edge.attributes?.timestamp,
        metadata: edge.attributes?.metadata
      }
    })),
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'grafeovidajo'
    }
  };
}
