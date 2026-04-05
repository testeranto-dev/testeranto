import Graph from 'graphology';
import Attributes from 'graphology';

export type TesterantoGraph<N, E, G = {}> = Graph<N, E, G>;

// Node types in our graph
export type GraphNodeType =
  | 'feature'      // Markdown feature files
  | 'entrypoint'   // Test entrypoints (files)
  | 'test'         // Individual tests
  | 'test_result'  // Test results
  | 'file'         // File system nodes
  | 'documentation' // Documentation nodes
  | 'config'       // Configuration nodes
  | 'attribute'    // Attribute nodes (for nodes like suite:14:content, suite:14:configKey, etc.)
  | 'folder'       // Folder nodes for directory structure
  | 'domain'       // Domain nodes for grouping external features by hostname
  | 'input_file'   // Input source files for tests
  // Verb nodes for testeranto test structure
  | 'given'        // BDD Given nodes
  | 'when'         // BDD When nodes
  | 'then'         // BDD Then nodes
  | 'describe'     // AAA Describe nodes
  | 'it'           // AAA It nodes
  | 'confirm'      // TDT Confirm nodes
  | 'value'        // TDT Value nodes
  | 'should'       // TDT Should nodes
  | 'expected'     // TDT Expected nodes
  // Docker process nodes
  | 'docker_process' // Docker container processes
  | 'bdd_process'  // BDD test process
  | 'check_process' // Check process
  | 'aider_process' // Aider process
  | 'builder_process' // Builder process
  | 'aider'        // Aider instance node

// Array of valid GraphNodeType values for validation
export const graphNodeTypeValues: GraphNodeType[] = [
  'feature',
  'entrypoint',
  'test',
  'test_result',
  'file',
  'documentation',
  'config',
  'attribute',
  'folder',
  'domain',
  'input_file',
  // Verb nodes for testeranto test structure
  'given',
  'when',
  'then',
  'describe',
  'it',
  'confirm',
  'value',
  'should',
  'expected',
  // Docker process nodes
  'docker_process',
  'bdd_process',
  'check_process',
  'aider_process',
  'builder_process',
  'aider'
];

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
  | 'configuredBy' // Configured by config
  // Verb relationship edges
  | 'hasGiven'     // Test has a Given
  | 'hasWhen'      // Given has a When
  | 'nextWhen'     // When leads to next When
  | 'hasThen'      // When has a Then
  | 'hasDescribe'  // Test has a Describe
  | 'hasIt'        // Describe has an It
  | 'hasConfirm'   // Test has a Confirm
  | 'hasValue'     // Confirm has a Value
  | 'hasShould'    // Value has a Should
  | 'hasExpected'  // Should has an Expected
  // Docker process relationship edges
  | 'hasProcess'   // Entrypoint has a process
  | 'hasBddProcess' // Entrypoint has a BDD process
  | 'hasCheckProcess' // Entrypoint has a check process
  | 'hasAiderProcess' // Entrypoint has an aider process
  | 'hasBuilderProcess' // Config has a builder process
  | 'processOf'    // Process belongs to entrypoint
  | 'hasAider'     // Entrypoint has an aider node

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
  icon?: string;
}

// Base edge attributes
export interface GraphEdgeAttributes extends Attributes {
  type: GraphEdgeType;
  weight?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
  directed?: boolean; // true for directed, false for undirected (default: true)
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
