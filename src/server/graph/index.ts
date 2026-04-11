import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../Types";
import { graphToData } from '../../graph/graphToData';
import { dataToGraph } from '../../graph/dataToGraph';
import { createGraph } from '../../graph/createGraph';
import {
  type GraphData,
  type GraphEdgeAttributes,
  type GraphNodeAttributes,
  type GraphOperation,
  type GraphUpdate,
  type TesterantoGraph,
} from '../../graph/index';
import { createAiderNodeGraphOperationsPure } from '../serverClasses/Server_Docker/utils/launchAiderPure';
import type { TestResult } from "../types/testResults";
import { cleanupAttributeNodesPure } from './cleanupAttributeNodesPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { createGraphDataFilePure } from './createGraphDataFilePure';
import { generateEdgesPure } from './generateEdgesPure';
import { getGraphStatsPure } from './getGraphStatsPure';
import { hasFeatureUpdatesPure } from './hasFeatureUpdatesPure';
// import { loadGraphPure } from './loadGraphPure';
import { processFeatureUrlPure } from './processFeatureUrlPure';
import { updateFromTestResultsPure } from './updateFromTestResultsPure';
import { parseMarkdownFilesPure } from './utils/markdownParseUtils';
import { generateMarkdownContent } from './utils/markdownUtils';
import {
  getAiderSlice,
  getFilesAndFoldersSlice,
  getProcessSlice,
  getRuntimeSlice
} from './utils/sliceUtils';
import yaml from 'js-yaml';

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
    console.log(`[GraphManager] Graph data path: ${this.graphDataPath}`);

    // Always create a fresh graph - don't load old data
    // This ensures ZERO chat messages at startup
    this.graph = createGraph();
    console.log(`[GraphManager] Created fresh graph`);
    
    // Save the initial empty graph
    console.log(`[GraphManager] Saving initial graph...`);
    this.saveGraph();
    console.log(`[GraphManager] Initial graph saved`);
  }

  // Load graph from file or create new
  // private loadGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
  //   // Note: This method is kept for compatibility but not used in constructor
  //   // since we always start fresh
  //   return loadGraphPure(this.graphDataPath, this.projectRoot);
  // }

  // Save graph to file in unified format
  public saveGraph(): void {
    try {
      if (!this.graph) {
        console.error('[GraphManager] Cannot save graph: graph is undefined');
        return;
      }
      
      const graphData = graphToData(this.graph);
      console.log(`[GraphManager] Converting graph to data: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
      
      const dir = path.dirname(this.graphDataPath);
      console.log(`[GraphManager] Directory path: ${dir}`);
      console.log(`[GraphManager] Full file path: ${this.graphDataPath}`);
      
      if (!fs.existsSync(dir)) {
        console.log(`[GraphManager] Creating directory: ${dir}`);
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`[GraphManager] Directory created successfully`);
        } catch (mkdirError) {
          console.error(`[GraphManager] Failed to create directory ${dir}:`, mkdirError);
          return;
        }
      }

      // Use pure function to create graph data file structure
      const graphDataFile = createGraphDataFilePure(graphData);
      console.log(`[GraphManager] Created graph data file structure`);

      // DO NOT try to preserve old data - always write new unified format
      const jsonContent = JSON.stringify(graphDataFile, null, 2);
      console.log(`[GraphManager] JSON content length: ${jsonContent.length} characters`);
      
      try {
        fs.writeFileSync(this.graphDataPath, jsonContent, 'utf-8');
        console.log(`[GraphManager] Successfully wrote to ${this.graphDataPath}`);
      } catch (writeError) {
        console.error(`[GraphManager] Failed to write to ${this.graphDataPath}:`, writeError);
        // Try to write to a temp location as fallback
        const tempPath = path.join(process.cwd(), 'temp-graph-data.json');
        console.log(`[GraphManager] Trying fallback location: ${tempPath}`);
        try {
          fs.writeFileSync(tempPath, jsonContent, 'utf-8');
          console.log(`[GraphManager] Successfully wrote to fallback location: ${tempPath}`);
        } catch (tempError) {
          console.error(`[GraphManager] Failed to write to fallback location:`, tempError);
        }
        return;
      }
      
      console.log(`[GraphManager] Saved graph to ${this.graphDataPath} with ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
      
      // Verify the file was written
      if (fs.existsSync(this.graphDataPath)) {
        const stats = fs.statSync(this.graphDataPath);
        console.log(`[GraphManager] File verified: ${stats.size} bytes`);
        if (stats.size === 0) {
          console.error(`[GraphManager] WARNING: File is empty (0 bytes)!`);
        }
      } else {
        console.error(`[GraphManager] ERROR: File was not created at ${this.graphDataPath}`);
      }
      
      // Notify that graph was saved (for slice updates)
      this.emitGraphSaved();
    } catch (error) {
      console.error('[GraphManager] Error saving graph:', error);
      // Log the full error stack
      if (error instanceof Error) {
        console.error('[GraphManager] Error stack:', error.stack);
      }
    }
  }
  
  // Emit event when graph is saved
  private emitGraphSaved(): void {
    // This is a placeholder for event emission
    // In a real implementation, this would emit an event that Server_GraphManager listens to
    console.log('[GraphManager] Graph saved, slices should be updated');
  }

  // Get current graph data
  public getGraphData(): GraphData {
    return graphToData(this.graph);
  }

  // Apply graph updates
  public applyUpdate(update: GraphUpdate): GraphData {
    console.log(`[GraphManager] Applying update with ${update.operations.length} operations`);
    
    update.operations.forEach(op => {
      try {
        switch (op.type) {
          case 'addNode':
            console.log(`[GraphManager] Adding node: ${op.data.id} (${op.data.type})`);
            this.graph.addNode(op.data.id, op.data);
            break;
          case 'updateNode':
            console.log(`[GraphManager] Updating node: ${op.data.id}`);
            // For feature nodes, we need to update metadata.content and metadata.frontmatter when attributes change
            const existingAttrs = this.graph.getNodeAttributes(op.data.id);
            if (existingAttrs.type === 'feature') {
              // Merge the new attributes, but preserve existing metadata if not provided
              const currentMetadata = existingAttrs.metadata || {};
              const updatedMetadata = op.data.metadata || {};

              // Create merged metadata
              const mergedMetadata = {
                ...currentMetadata,
                ...updatedMetadata
              };

              // Create merged attributes
              const mergedAttrs = {
                ...op.data,
                metadata: mergedMetadata
              };

              // Merge the attributes
              this.graph.mergeNodeAttributes(op.data.id, mergedAttrs);

              // Get the updated attributes
              const updatedAttrs = this.graph.getNodeAttributes(op.data.id);

              // Generate updated markdown content
              const content = generateMarkdownContent(updatedAttrs);
              if (content) {
                // Parse the new frontmatter from the generated content
                const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
                const match = content.match(frontmatterRegex);
                let newFrontmatter: Record<string, any> = {};

                if (match) {
                  try {
                    const yamlContent = match[1];
                    newFrontmatter = yaml.load(yamlContent) || {};
                  } catch (error) {
                    console.error(`[GraphManager] Error parsing YAML frontmatter from generated content:`, error);
                  }
                }

                // Update metadata.content and metadata.frontmatter
                this.graph.mergeNodeAttributes(op.data.id, {
                  metadata: {
                    ...updatedAttrs.metadata,
                    content: content,
                    frontmatter: newFrontmatter
                  }
                });
              }
            } else {
              this.graph.mergeNodeAttributes(op.data.id, op.data);
            }
            break;
          case 'removeNode':
            console.log(`[GraphManager] Removing node: ${op.data.id}`);
            this.graph.dropNode(op.data.id);
            break;
          case 'addEdge':
            console.log(`[GraphManager] Adding edge: ${op.data.source} -> ${op.data.target}`);
            this.graph.addEdge(op.data.source, op.data.target, op.data.attributes);
            break;
          case 'updateEdge':
            console.log(`[GraphManager] Updating edge: ${op.data.source} -> ${op.data.target}`);
            const edge = this.graph.edge(op.data.source, op.data.target);
            if (edge) {
              this.graph.mergeEdgeAttributes(edge, op.data.attributes);
            }
            break;
          case 'removeEdge':
            console.log(`[GraphManager] Removing edge: ${op.data.source} -> ${op.data.target}`);
            const edgeToRemove = this.graph.edge(op.data.source, op.data.target);
            if (edgeToRemove) {
              this.graph.dropEdge(edgeToRemove);
            }
            break;
        }
      } catch (error) {
        console.warn(`[GraphManager] Error applying operation ${op.type}:`, error);
      }
    });

    this.saveGraph();

    // Check if there are feature updates and serialize to markdown
    const hasFeatureUpdates = hasFeatureUpdatesPure(update.operations, this.graph);
    if (hasFeatureUpdates) {
      console.log(`[GraphManager] Has feature updates, serializing to markdown`);
      this.serializeToMarkdown();
    }

    return this.getGraphData();
  }

  // Parse markdown files with YAML frontmatter to extract graph nodes
  public parseMarkdownFiles(globPattern: string): GraphUpdate {
    const { operations, timestamp } = parseMarkdownFilesPure(
      globPattern,
      this.projectRoot,
      (nodeId: string) => this.graph.hasNode(nodeId)
    );
    return { operations, timestamp };
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

  // Update graph with input files for a specific test
  public async updateGraphWithInputFiles(
    runtime: string,
    testName: string,
    configKey: string,
    inputFiles: string[]
  ): Promise<GraphUpdate> {
    const timestamp = new Date().toISOString();
    const operations: GraphOperation[] = [];

    // Find or create the entrypoint node for this test
    const entrypointId = `entrypoint:${testName}`;
    const existingEntrypointNode = this.graph.hasNode(entrypointId);

    if (!existingEntrypointNode) {
      // Create entrypoint node if it doesn't exist
      operations.push({
        type: 'addNode',
        data: {
          id: entrypointId,
          type: 'entrypoint',
          label: testName.split('/').pop() || testName,
          description: `Test entrypoint: ${testName}`,
          status: 'todo',
          icon: 'file-text',
          metadata: {
            configKey,
            filePath: testName,
            runtime,
            timestamp
          }
        },
        timestamp
      });
    }

    // Process each input file
    for (const inputFile of inputFiles) {
      // Create file node for input file
      const fileNodeId = `file:${inputFile}`;
      const existingFileNode = this.graph.hasNode(fileNodeId);

      if (!existingFileNode) {
        operations.push({
          type: 'addNode',
          data: {
            id: fileNodeId,
            type: 'file',
            label: inputFile.split('/').pop() || inputFile,
            description: `Input file: ${inputFile}`,
            metadata: {
              filePath: inputFile,
              localPath: inputFile,
              url: `file://${inputFile}`,
              isInputFile: true
            }
          },
          timestamp
        });
      } else {
        // console.log(`[GraphManager] File node already exists: ${fileNodeId}`);
      }

      // Create folder nodes for the input file's path
      const parentFolderId = this.createFolderNodesAndEdges(
        inputFile,
        operations,
        timestamp
      );

      // Connect input file to its parent folder
      if (parentFolderId !== '') {
        const folderEdgeExists = this.graph.hasEdge(parentFolderId, fileNodeId);
        if (!folderEdgeExists) {
          operations.push({
            type: 'addEdge',
            data: {
              source: parentFolderId,
              target: fileNodeId,
              attributes: {
                type: 'locatedIn',

              }
            },
            timestamp
          });
        }
      }

      // Connect entrypoint to input file
      const entrypointToFileEdgeExists = this.graph.hasEdge(entrypointId, fileNodeId);
      if (!entrypointToFileEdgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: entrypointId,
            target: fileNodeId,
            attributes: {
              type: 'associatedWith',

            }
          },
          timestamp
        });
      }
    }

    // Apply the operations
    if (operations.length > 0) {
      const update = { operations, timestamp };
      this.applyUpdate(update);
      // console.log(`[GraphManager] Applied ${operations.length} operations for input files`);
      return update;
    }

    return { operations: [], timestamp };
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

  public getGraphStats(): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
    return getGraphStatsPure(this.graph);
  }

  // Get only files and folders from the graph
  public getFilesAndFolders(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getFilesAndFoldersSlice(this.graph);
  }

  // Get process slice (docker processes)
  public getProcessSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getProcessSlice(this.graph);
  }

  // Get aider slice (aider processes)
  public getAiderSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getAiderSlice(this.graph);
  }

  // Get runtime slice (runtimes)
  public getRuntimeSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getRuntimeSlice(this.graph);
  }

  public serializeToMarkdown(): void {
    // Get all feature nodes from the graph
    const featureNodes = this.graph.nodes().filter(nodeId => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      return attrs.type === 'feature';
    });
    let writtenCount = 0;
    let errorCount = 0;

    for (const nodeId of featureNodes) {
      try {
        const attrs = this.graph.getNodeAttributes(nodeId);
        const metadata = attrs.metadata || {};
        const localPath = metadata.localPath as string | undefined;

        // Generate markdown content with YAML frontmatter from node attributes
        const content = generateMarkdownContent(attrs);

        fs.writeFileSync(localPath, content, 'utf-8');

        // Update the node's metadata.content to keep graph in sync
        this.graph.mergeNodeAttributes(nodeId, {
          metadata: {
            ...metadata,
            content: content
          }
        });

        writtenCount++;

      } catch (error) {
        // console.error(`[GraphManager] Error serializing feature ${nodeId}:`, error);
        errorCount++;
      }
    }

  }

  // Generate markdown content with YAML frontmatter from node attributes
  public generateMarkdownContent(attrs: any): string | null {
    return generateMarkdownContent(attrs);
  }

  public async updateGraphWithAiderNode(params: {
    runtime: string;
    testName: string;
    configKey: string;
    aiderServiceName: string;
    containerId?: string;
  }): Promise<void> {
    const timestamp = new Date().toISOString();
    const operations = createAiderNodeGraphOperationsPure({
      ...params,
      timestamp
    });
    const update: GraphUpdate = {
      operations,
      timestamp
    };
    this.applyUpdate(update);
    this.saveGraph();
  }

  // // Create aider node for an entrypoint (for manual testing)
  // public createAiderNodeForEntrypoint(entrypointId: string, aiderServiceName: string, containerId?: string): void {
  //   const timestamp = new Date().toISOString();
  //   const aiderNodeId = `aider:${aiderServiceName}`;

  //   // Create aider node
  //   this.graph.addNode(aiderNodeId, {
  //     id: aiderNodeId,
  //     type: 'aider',
  //     label: `Aider: ${aiderServiceName}`,
  //     description: `Aider instance for ${entrypointId}`,
  //     status: 'done',
  //     icon: 'aider',
  //     metadata: {
  //       aiderServiceName,
  //       containerId,
  //       timestamp
  //     }
  //   });

  //   // Connect entrypoint to aider node
  //   if (this.graph.hasNode(entrypointId)) {
  //     this.graph.addEdge(entrypointId, aiderNodeId, {
  //       type: 'hasAider',

  //       timestamp
  //     });
  //   }

  //   // Connect aider to docker process if containerId exists
  //   if (containerId) {
  //     const dockerProcessId = `docker_process:${containerId}`;
  //     if (this.graph.hasNode(dockerProcessId)) {
  //       this.graph.addEdge(aiderNodeId, dockerProcessId, {
  //         type: 'hasProcess',

  //         timestamp
  //       });
  //     }
  //   }

  //   this.saveGraph();
  // }
}
