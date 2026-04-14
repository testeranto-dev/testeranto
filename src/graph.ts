import type Graph from "graphology";
import type { Attributes } from "react";

// Extend the Graph type to include methods that exist in runtime but aren't in TypeScript definitions
export interface TesterantoGraph<N, E, G = {}> extends Graph<N, E, G> {
  // These methods exist in graphology but might not be in TypeScript definitions
  mergeNodeAttributes(node: string, attributes: Partial<N>): void;
  mergeEdgeAttributes(edge: string, attributes: Partial<E>): void;
  
  // Explicitly declare methods we use to ensure TypeScript knows about them
  addNode(key: string, attributes?: N): string;
  getNodeAttributes(node: string): N;
  hasNode(node: string): boolean;
  dropNode(node: string): void;
  addEdge(source: string, target: string, attributes?: E): string;
  edge(source: string, target: string): string | undefined;
  hasEdge(source: string, target: string): boolean;
  dropEdge(edge: string): void;
  nodes(): string[];
}

// Base node categories
export type NodeCategory = 'file' | 'verb' | 'process' | 'resource' | 'agent' | 'view' | 'chat';

// Specific node types within each category
export type FileNodeType = 'domain' | 'folder' | 'feature' | 'entrypoint' | 'inputFile' | 'outputFile' | 'documentation' | 'file';
export type VerbNodeType = 'given' | 'when' | 'then' | 'describe' | 'it' | 'confirm' | 'value' | 'should' | 'expected';
export type ProcessNodeType = 'builder' | 'bdd' | 'check' | 'aider' | 'docker_process';
export type ResourceNodeType = 'config' | 'runtime';
export type AgentNodeType = 'agent';
export type ViewNodeType = 'view';
export type ChatNodeType = 'chat_message';

// Unified node type with category and specific type
export type GraphNodeType = 
  | { category: 'file'; type: FileNodeType }
  | { category: 'verb'; type: VerbNodeType }
  | { category: 'process'; type: ProcessNodeType }
  | { category: 'resource'; type: ResourceNodeType }
  | { category: 'agent'; type: AgentNodeType }
  | { category: 'view'; type: ViewNodeType }
  | { category: 'chat'; type: ChatNodeType };

// Edge categories based on relationship semantics
export type EdgeCategory = 'structural' | 'temporal' | 'dependency' | 'ownership' | 'association';

// Specific edge types with directionality
export type StructuralEdgeType = 'parentOf' | 'locatedIn' | 'contains';
export type TemporalEdgeType = 'precedes' | 'follows' | 'blocks' | 'dependsUpon';
export type DependencyEdgeType = 'requires' | 'provides' | 'uses';
export type OwnershipEdgeType = 'has' | 'belongsTo' | 'owns' | 'partOf';
export type AssociationEdgeType = 'associatedWith' | 'relatedTo' | 'connectedTo';

// Edge type with category and specific type
export type GraphEdgeType = {
  category: EdgeCategory;
  type: StructuralEdgeType | TemporalEdgeType | DependencyEdgeType | OwnershipEdgeType | AssociationEdgeType;
  directed: boolean;
  // Optional constraints
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many';
  allowedSourceTypes?: GraphNodeType[];
  allowedTargetTypes?: GraphNodeType[];
};

// Base node attributes
export interface GraphNodeAttributes extends Attributes {
  id: string;
  type: GraphNodeType;
  icon?: string;
  label?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  metadata?: Record<string, any>;
  
  // Add lock properties for resource locking
  locked?: boolean;
  lockOwner?: string; // agent/test ID that holds the lock
  lockTimestamp?: string;
  lockType?: 'read' | 'write' | 'exclusive';
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
  // Validation metadata
  validated?: boolean;
  validationErrors?: string[];
}

// Type-safe node addition
export interface AddNodeOperation extends Omit<GraphOperation, 'data'> {
  type: 'addNode';
  data: {
    id: string;
    type: GraphNodeType;
    attributes: Omit<GraphNodeAttributes, 'id' | 'type'>;
  };
}

// Type-safe edge addition with validation
export interface AddEdgeOperation extends Omit<GraphOperation, 'data'> {
  type: 'addEdge';
  data: {
    source: string;
    target: string;
    type: GraphEdgeType;
    attributes: Omit<GraphEdgeAttributes, 'type'>;
  };
  // Pre-validation check
  isValidForSchema?: (schema: RelationshipSchema[]) => boolean;
}

// Graph update payload
export interface GraphUpdate {
  operations: GraphOperation[];
  timestamp: string;
}

// Graph data file structure for graph-data.json
export interface GraphDataFile {
  timestamp: string;
  version: string;
  data: {
    // Unified graph containing all nodes and relationships
    unifiedGraph: GraphData;
    vizConfig?: {
      projection: {
        xAttribute: string;
        yAttribute: string;
        xType: 'categorical' | 'continuous' | 'ordinal' | 'temporal';
        yType: 'categorical' | 'continuous' | 'ordinal' | 'temporal';
        layout: 'grid' | 'force' | 'tree' | 'timeline' | 'none';
      };
      style: {
        nodeSize: number;
        nodeColor: string;
        nodeShape: string;
      };
    };
    configs?: Record<string, unknown>;
    allTestResults?: Record<string, unknown>;
  };
}

// Helper functions for type checking
export function isFileNodeType(type: GraphNodeType): type is { category: 'file'; type: FileNodeType } {
  return type.category === 'file';
}

export function isVerbNodeType(type: GraphNodeType): type is { category: 'verb'; type: VerbNodeType } {
  return type.category === 'verb';
}

export function isProcessNodeType(type: GraphNodeType): type is { category: 'process'; type: ProcessNodeType } {
  return type.category === 'process';
}

export function isResourceNodeType(type: GraphNodeType): type is { category: 'resource'; type: ResourceNodeType } {
  return type.category === 'resource';
}

export function isAgentNodeType(type: GraphNodeType): type is { category: 'agent'; type: AgentNodeType } {
  return type.category === 'agent';
}

export function isViewNodeType(type: GraphNodeType): type is { category: 'view'; type: ViewNodeType } {
  return type.category === 'view';
}

export function isChatNodeType(type: GraphNodeType): type is { category: 'chat'; type: ChatNodeType } {
  return type.category === 'chat';
}

// Helper to create node types
export function createFileNodeType(type: FileNodeType): GraphNodeType {
  return { category: 'file', type };
}

export function createVerbNodeType(type: VerbNodeType): GraphNodeType {
  return { category: 'verb', type };
}

export function createProcessNodeType(type: ProcessNodeType): GraphNodeType {
  return { category: 'process', type };
}

export function createResourceNodeType(type: ResourceNodeType): GraphNodeType {
  return { category: 'resource', type };
}

export function createAgentNodeType(): GraphNodeType {
  return { category: 'agent', type: 'agent' };
}

export function createViewNodeType(): GraphNodeType {
  return { category: 'view', type: 'view' };
}

export function createChatNodeType(): GraphNodeType {
  return { category: 'chat', type: 'chat_message' };
}

// Helper to create edge types
export function createStructuralEdgeType(type: StructuralEdgeType, directed: boolean = true): GraphEdgeType {
  return { category: 'structural', type, directed };
}

export function createTemporalEdgeType(type: TemporalEdgeType, directed: boolean = true): GraphEdgeType {
  return { category: 'temporal', type, directed };
}

export function createDependencyEdgeType(type: DependencyEdgeType, directed: boolean = true): GraphEdgeType {
  return { category: 'dependency', type, directed };
}

export function createOwnershipEdgeType(type: OwnershipEdgeType, directed: boolean = true): GraphEdgeType {
  return { category: 'ownership', type, directed };
}

export function createAssociationEdgeType(type: AssociationEdgeType, directed: boolean = false): GraphEdgeType {
  return { category: 'association', type, directed };
}

// Schema defining valid connections between node types
export interface RelationshipSchema {
  sourceType: GraphNodeType;
  edgeType: GraphEdgeType;
  targetType: GraphNodeType;
  description: string;
  required?: boolean;
  maxCount?: number; // Maximum number of such edges from source
}

// Example schema definitions (can be extended)
export const RELATIONSHIP_SCHEMA: RelationshipSchema[] = [
  // File hierarchy
  {
    sourceType: createFileNodeType('folder'),
    edgeType: createStructuralEdgeType('contains', true),
    targetType: createFileNodeType('file'),
    description: 'Folder contains files',
    maxCount: undefined // unlimited
  },
  {
    sourceType: createFileNodeType('folder'),
    edgeType: createStructuralEdgeType('contains', true),
    targetType: createFileNodeType('folder'),
    description: 'Folder contains subfolders'
  },
  
  // Test structure
  {
    sourceType: createVerbNodeType('given'),
    edgeType: createOwnershipEdgeType('has', true),
    targetType: createVerbNodeType('when'),
    description: 'Given has When steps'
  },
  {
    sourceType: createVerbNodeType('when'),
    edgeType: createTemporalEdgeType('precedes', true),
    targetType: createVerbNodeType('when'),
    description: 'When precedes next When'
  },
  
  // Process relationships
  {
    sourceType: createFileNodeType('entrypoint'),
    edgeType: createOwnershipEdgeType('has', true),
    targetType: createProcessNodeType('bdd'),
    description: 'Entrypoint has BDD process'
  },
  
  // Agent relationships
  {
    sourceType: createAgentNodeType(),
    edgeType: createAssociationEdgeType('associatedWith', true),
    targetType: createChatNodeType(),
    description: 'Agent associated with chat messages'
  }
];
