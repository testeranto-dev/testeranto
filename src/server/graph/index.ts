import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../Types";
import { graphToData } from '../../graph/graphToData';
import {
  type GraphData,
  type GraphEdgeAttributes,
  type GraphNodeAttributes,
  type GraphOperation,
  type GraphUpdate,
  type TesterantoGraph,
} from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { cleanupAttributeNodesPure } from './cleanupAttributeNodesPure';
import { connectAllTestsToEntrypointPure } from './connectAllTestsToEntrypointPure';
import { createEntrypointNodeOperationsPure } from './createEntrypointNodeOperationsPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { createGraphDataFilePure } from './createGraphDataFilePure';
import { createSimpleTestNodeOperationsPure } from './createSimpleTestNodeOperationsPure';
import { createTestNodeOperationsPure } from './createTestNodeOperationsPure';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';
import { generateEdgesPure } from './generateEdgesPure';
import { getGraphStatsPure } from './getGraphStatsPure';
import { hasFeatureUpdatesPure } from './hasFeatureUpdatesPure';
import { loadGraphPure } from './loadGraphPure';
import { processFeatureUrlPure } from './processFeatureUrlPure';
import { updateFromTestResultsPure } from './updateFromTestResultsPure';

export class GraphManager {
  private graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  private graphDataPath: string;

  private featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;

  constructor(
    private projectRoot: string,
    featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
    private config?: ITesterantoConfig
  ) {
    this.featureIngestor = featureIngestor;

    // Use the same file that the stakeholder app reads from
    this.graphDataPath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');

    // Load graph using pure function
    this.graph = loadGraphPure(this.graphDataPath, projectRoot);
  }

  // Load graph from file or create new
  private loadGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
    // Note: This method is kept for compatibility but not used in constructor
    // since we always start fresh
    return loadGraphPure(this.graphDataPath, this.projectRoot);
  }

  // Save graph to file in unified format
  public saveGraph(): void {
    try {
      const graphData = graphToData(this.graph);
      const dir = path.dirname(this.graphDataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Use pure function to create graph data file structure
      const graphDataFile = createGraphDataFilePure(graphData);

      // DO NOT try to preserve old data - always write new unified format
      fs.writeFileSync(this.graphDataPath, JSON.stringify(graphDataFile, null, 2), 'utf-8');
      console.log(`[GraphManager] Saved unified graph to ${this.graphDataPath} with ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
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
    const hasFeatureUpdates = hasFeatureUpdatesPure(update.operations, this.graph);

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

  // Helper to create folder nodes and connect them in a hierarchy for both local file paths and URLs
  private createFolderNodesAndEdges(
    pathStr: string,
    operations: GraphOperation[],
    timestamp: string
  ): string {
    return createFolderNodesAndEdgesPure(
      pathStr,
      this.projectRoot,
      operations,
      timestamp
    );
  }

  // Helper to process a feature URL using featureIngestor
  private async processFeatureUrl(featureUrl: string): Promise<{ content: string; localPath?: string }> {
    return processFeatureUrlPure(
      featureUrl,
      this.projectRoot,
      this.featureIngestor
    );
  }

  // Update graph from test results
  public async updateFromTestResults(testResults: TestResult | TestResult[]): Promise<GraphUpdate> {
    return updateFromTestResultsPure(
      testResults,
      this.graph,
      this.projectRoot,
      this.featureIngestor,
      this.config
    );
  }

  // Clean up attribute nodes (nodes that should be attributes of other nodes)
  public cleanupAttributeNodes(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = graphToData(this.graph);
    const operations = cleanupAttributeNodesPure(graphData, timestamp);
    return { operations, timestamp };
  }

  // Generate edges between related nodes
  public generateEdges(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = graphToData(this.graph);
    const operations = generateEdgesPure(graphData, this.config, timestamp, this.projectRoot);
    return { operations, timestamp };
  }

  // Get graph statistics
  public getGraphStats(): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
    const stats = getGraphStatsPure(this.graph);

    console.log(`[GraphManager] Graph stats: ${stats.nodes} nodes, ${stats.edges} edges`);
    console.log(`[GraphManager] Node types:`, stats.nodeTypes);
    console.log(`[GraphManager] Edge types:`, stats.edgeTypes);

    return stats;
  }

  // Serialize graph changes back to markdown frontmatter
  public serializeToMarkdown(): void {
    // Temporarily disabled: Skip serializing to markdown files
    console.log('[GraphManager] serializeToMarkdown is temporarily disabled');

    // Still save the graph
    this.saveGraph();
  }
}
