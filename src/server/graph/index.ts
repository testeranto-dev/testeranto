import fs from 'fs';
import path from 'path';
import {
  type GraphData,
  type GraphNodeAttributes,
  type GraphEdgeAttributes,
  type GraphUpdate,
  type GraphOperation,
  createGraph,
  graphToData,
  dataToGraph,
  type TesterantoGraph
} from '../../graph/index';

// We'll use dynamic imports for optional dependencies
let yaml: any;
let glob: any;

async function ensureDeps() {
  if (!yaml) {
    yaml = await import('js-yaml');
  }
  if (!glob) {
    glob = await import('glob');
  }
}

// Server-side graph manager
export class GraphManager {
  private graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  private graphDataPath: string;

  constructor(private projectRoot: string) {
    this.graphDataPath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
    // Always start with a fresh graph on startup
    this.graph = createGraph();
    console.log('[GraphManager] Created fresh graph (clearing old data)');
    
    // Delete the old graph-data.json file if it exists
    this.clearOldGraphData();
  }

  // Clear old graph data file
  private clearOldGraphData(): void {
    try {
      if (fs.existsSync(this.graphDataPath)) {
        fs.unlinkSync(this.graphDataPath);
        console.log(`[GraphManager] Deleted old graph data file: ${this.graphDataPath}`);
      }
    } catch (error) {
      console.error('[GraphManager] Error deleting old graph data:', error);
    }
  }

  // Load graph from file or create new
  private loadGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
    // Note: This method is kept for compatibility but not used in constructor
    // since we always start fresh
    try {
      if (fs.existsSync(this.graphDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.graphDataPath, 'utf-8')) as GraphData;
        const graph = dataToGraph(data);
        console.log(`[GraphManager] Loaded graph with ${graph.order} nodes and ${graph.size} edges`);
        return graph;
      }
    } catch (error) {
      console.error('[GraphManager] Error loading graph:', error);
    }
    return createGraph();
  }

  // Save graph to file
  public saveGraph(): void {
    try {
      const data = graphToData(this.graph);
      const dir = path.dirname(this.graphDataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.graphDataPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`[GraphManager] Saved graph to ${this.graphDataPath} with ${data.nodes.length} nodes and ${data.edges.length} edges`);
    } catch (error) {
      console.error('[GraphManager] Error saving graph:', error);
    }
  }

  // Get current graph data
  public getGraphData(): GraphData {
    return graphToData(this.graph);
  }

  // Apply graph updates
  public applyUpdate(update: GraphUpdate): GraphData {
    update.operations.forEach(op => {
      try {
        switch (op.type) {
          case 'addNode':
            this.graph.addNode(op.data.id, op.data);
            break;
          case 'updateNode':
            this.graph.mergeNodeAttributes(op.data.id, op.data);
            break;
          case 'removeNode':
            this.graph.dropNode(op.data.id);
            break;
          case 'addEdge':
            this.graph.addEdge(op.data.source, op.data.target, op.data.attributes);
            console.log(`[GraphManager] Added edge: ${op.data.source} -> ${op.data.target} (${op.data.attributes.type})`);
            break;
          case 'updateEdge':
            const edge = this.graph.edge(op.data.source, op.data.target);
            if (edge) {
              this.graph.mergeEdgeAttributes(edge, op.data.attributes);
            }
            break;
          case 'removeEdge':
            const edgeToRemove = this.graph.edge(op.data.source, op.data.target);
            if (edgeToRemove) {
              this.graph.dropEdge(edgeToRemove);
            }
            break;
        }
      } catch (error) {
        console.error(`[GraphManager] Error applying operation ${op.type}:`, error);
      }
    });

    this.saveGraph();
    
    // Also serialize to markdown if there are feature updates
    const hasFeatureUpdates = update.operations.some(op => 
      op.type === 'addNode' && op.data.type === 'feature' ||
      op.type === 'updateNode' && this.graph.getNodeAttributes(op.data.id)?.type === 'feature'
    );
    
    if (hasFeatureUpdates) {
      this.serializeToMarkdown();
    }
    
    return this.getGraphData();
  }

  // Parse markdown files with YAML frontmatter to extract graph nodes
  public parseMarkdownFiles(globPattern: string): GraphUpdate {
    const operations: GraphOperation[] = [];
    const timestamp = new Date().toISOString();

    // Temporarily disabled: Skip parsing markdown files
    console.log('[GraphManager] parseMarkdownFiles is temporarily disabled');
    
    return {
      operations,
      timestamp
    };
  }

  // Update graph from test results
  public updateFromTestResults(testResults: any): GraphUpdate {
    const operations: GraphOperation[] = [];
    const timestamp = new Date().toISOString();
    
    // Log for debugging
    console.log(`[GraphManager] updateFromTestResults called with:`, {
      runtime: testResults.runtime,
      testName: testResults.testName,
      hasIndividualResults: testResults.individualResults && Array.isArray(testResults.individualResults),
      individualResultsCount: testResults.individualResults ? testResults.individualResults.length : 0
    });

    // Extract test information - handle various formats
    let runtime = testResults.runtime || 'unknown';
    let testName = testResults.testName || 'unknown';
    
    // Try to extract from metadata if not directly available
    if (runtime === 'unknown' && testResults.metadata) {
      runtime = testResults.metadata.runtime || runtime;
      testName = testResults.metadata.testName || testName;
    }
    
    // Sanitize runtime and testName to create valid node IDs
    // Replace any characters that might cause issues in node IDs
    const sanitizeForNodeId = (str: string): string => {
      return str.replace(/[^a-zA-Z0-9:_\-.]/g, '_');
    };
    
    runtime = sanitizeForNodeId(runtime);
    testName = sanitizeForNodeId(testName);
    
    // Create a suite node for this test
    const suiteId = `suite:${runtime}:${testName}`;
    
    // Check if suite node already exists
    const existingSuiteNode = this.graph.hasNode(suiteId);
    
    // Always create or update the suite node
    operations.push({
      type: existingSuiteNode ? 'updateNode' : 'addNode',
      data: {
        id: suiteId,
        type: 'suite',
        label: testName,
        description: `Test suite: ${testName} (${runtime})`,
        status: 'done',
        metadata: { 
          runtime, 
          testName,
          timestamp: new Date().toISOString()
        }
      },
      timestamp
    });

    // Handle individual test results (from tests.json format)
    if (testResults.individualResults && Array.isArray(testResults.individualResults)) {
      testResults.individualResults.forEach((individualResult: any, index: number) => {
        const stepName = individualResult.stepName || `Step ${index + 1}`;
        const testId = `test:${runtime}:${testName}:${index}`;
        
        // Check if test node already exists
        const existingTestNode = this.graph.hasNode(testId);
        
        // Create or update test node
        operations.push({
          type: existingTestNode ? 'updateNode' : 'addNode',
          data: {
            id: testId,
            type: 'test',
            label: stepName,
            description: `Test: ${stepName}`,
            status: individualResult.failed === false ? 'done' : 'blocked',
            priority: individualResult.failed === false ? 'low' : 'high',
            metadata: {
              runtime,
              testName,
              stepIndex: index,
              stepName,
              failed: individualResult.failed,
              features: individualResult.features || []
            }
          },
          timestamp
        });

        // Connect test to suite (only add edge if it doesn't exist)
        // Check if edge already exists
        let edgeExists = false;
        if (this.graph.hasEdge(suiteId, testId)) {
          edgeExists = true;
        }
        
        if (!edgeExists) {
          operations.push({
            type: 'addEdge',
            data: {
              source: suiteId,
              target: testId,
              attributes: {
                type: 'belongsTo',
                weight: 1
              }
            },
            timestamp
          });
        }

        // Process features if they exist
        if (individualResult.features && Array.isArray(individualResult.features)) {
          individualResult.features.forEach((featureUrl: string) => {
            // Extract feature name from URL
            const featureName = featureUrl.split('/').pop() || featureUrl;
            const featureId = `feature:${featureName}`;
            
            // Check if feature node already exists
            const existingFeatureNode = this.graph.hasNode(featureId);
            
            // Create or update feature node
            operations.push({
              type: existingFeatureNode ? 'updateNode' : 'addNode',
              data: {
                id: featureId,
                type: 'feature',
                label: featureName,
                description: `Feature: ${featureName}`,
                status: 'todo',
                metadata: { url: featureUrl }
              },
              timestamp
            });

            // Connect feature to test (only add edge if it doesn't exist)
            let featureEdgeExists = false;
            if (this.graph.hasEdge(featureId, testId)) {
              featureEdgeExists = true;
            }
            
            if (!featureEdgeExists) {
              operations.push({
                type: 'addEdge',
                data: {
                  source: featureId,
                  target: testId,
                  attributes: {
                    type: 'associatedWith',
                    weight: 1
                  }
                },
                timestamp
              });
            }
          });
        }
      });
    } 
    // Handle simple test result format
    else if (testResults.failed !== undefined) {
      const testId = `test:${runtime}:${testName}:0`;
      
      // Check if test node already exists
      const existingTestNode = this.graph.hasNode(testId);
      
      operations.push({
        type: existingTestNode ? 'updateNode' : 'addNode',
        data: {
          id: testId,
          type: 'test',
          label: testName,
          description: `Test: ${testName}`,
          status: testResults.failed === false ? 'done' : 'blocked',
          priority: testResults.failed === false ? 'low' : 'high',
          metadata: testResults
        },
        timestamp
      });

      // Connect test to suite (only add edge if it doesn't exist)
      let edgeExists = false;
      if (this.graph.hasEdge(suiteId, testId)) {
        edgeExists = true;
      }
      
      if (!edgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: suiteId,
            target: testId,
            attributes: {
              type: 'belongsTo',
              weight: 1
            }
          },
          timestamp
        });
      }
    }

    return {
      operations,
      timestamp
    };
  }

  // Generate edges between related nodes
  public generateEdges(): GraphUpdate {
    const operations: GraphOperation[] = [];
    const timestamp = new Date().toISOString();
    
    // Get all nodes
    const nodes = this.graph.nodes();
    
    // Create a map of node types
    const nodeMap = new Map();
    for (const nodeId of nodes) {
      const attributes = this.graph.getNodeAttributes(nodeId);
      nodeMap.set(nodeId, attributes);
    }
    
    // Generate edges based on node ID patterns and metadata
    for (const [nodeId, attributes] of nodeMap.entries()) {
      // Handle test nodes - connect them to their suite
      if (attributes.type === 'test') {
        // Extract runtime and testName from metadata or node ID
        const runtime = attributes.metadata?.runtime || 'unknown';
        const testName = attributes.metadata?.testName || 'unknown';
        
        if (runtime !== 'unknown' && testName !== 'unknown') {
          const suiteId = `suite:${runtime}:${testName}`;
          if (nodeMap.has(suiteId)) {
            // Check if edge already exists
            let edgeExists = false;
            if (this.graph.hasEdge(suiteId, nodeId)) {
              edgeExists = true;
            }
            
            if (!edgeExists) {
              operations.push({
                type: 'addEdge',
                data: {
                  source: suiteId,
                  target: nodeId,
                  attributes: {
                    type: 'belongsTo',
                    weight: 1
                  }
                },
                timestamp
              });
            }
          }
        }
      }
      
      // Handle feature nodes - connect them to tests that reference them
      if (attributes.type === 'feature') {
        const featureId = nodeId;
        const featureName = attributes.label || nodeId.replace('feature:', '');
        
        // Look for tests that have this feature in their metadata
        for (const [testNodeId, testAttributes] of nodeMap.entries()) {
          if (testAttributes.type === 'test') {
            const testFeatures = testAttributes.metadata?.features || [];
            if (testFeatures.some((f: string) => f.includes(featureName))) {
              // Check if edge already exists
              let edgeExists = false;
              if (this.graph.hasEdge(featureId, testNodeId)) {
                edgeExists = true;
              }
              
              if (!edgeExists) {
                operations.push({
                  type: 'addEdge',
                  data: {
                    source: featureId,
                    target: testNodeId,
                    attributes: {
                      type: 'associatedWith',
                      weight: 1
                    }
                  },
                  timestamp
                });
              }
            }
          }
        }
      }
    }
    
    return { operations, timestamp };
  }

  // Get graph statistics
  public getGraphStats(): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
    const nodes = this.graph.nodes();
    const edges = this.graph.edges();
    
    const nodeTypes: Record<string, number> = {};
    const edgeTypes: Record<string, number> = {};
    
    for (const nodeId of nodes) {
      const attributes = this.graph.getNodeAttributes(nodeId);
      const type = attributes.type || 'unknown';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    }
    
    for (const edge of edges) {
      const attributes = this.graph.getEdgeAttributes(edge);
      const type = attributes.type || 'unknown';
      edgeTypes[type] = (edgeTypes[type] || 0) + 1;
    }
    
    console.log(`[GraphManager] Graph stats: ${nodes.length} nodes, ${edges.length} edges`);
    console.log(`[GraphManager] Node types:`, nodeTypes);
    console.log(`[GraphManager] Edge types:`, edgeTypes);
    
    return {
      nodes: nodes.length,
      edges: edges.length,
      nodeTypes,
      edgeTypes
    };
  }

  // Serialize graph changes back to markdown frontmatter
  public serializeToMarkdown(): void {
    // Temporarily disabled: Skip serializing to markdown files
    console.log('[GraphManager] serializeToMarkdown is temporarily disabled');
    
    // Still save the graph
    this.saveGraph();
  }
}
