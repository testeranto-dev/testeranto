import Graph from "graphology";
import type {
  GraphData,
  GraphEdgeAttributes,
  GraphNodeAttributes,
  GraphOperation,
  TesterantoGraph
} from "../../../../graph";
import { parseAgentMarkdown } from "../../../../shared/utilities/parseAgentMarkdown";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Base } from "../ServerBase";
import { addAgentNodesPure } from "../utils/graph/addAgentNodesPure";
import { addConfigNodesPure } from "../utils/graph/addConfigNodesPure";
import { addRuntimeNodesPure } from "../utils/graph/addRuntimeNodesPure";
import { addTestNodesPure } from "../utils/graph/addTestNodesPure";
import { addViewNodesPure } from "../utils/graph/addViewNodesPure";
import { generateEdgesPure } from "../utils/graph/generateEdgesPure";
import { updateAllAgentSliceFilesPure } from "../utils/graph/updateAllAgentSliceFilesPure";
import { generateViewSliceUtil } from "../utils/static/generateViewSliceUtil";
import { generateTerminalCommand } from "../utils/vscode/generateTerminalCommand";

/**
 * Server_Graph - Business Layer (-5)
 *
 * Extends: (Base of business layer)
 * Extended by: Server_VSCode (-4)
 * Provides: Graph management business logic
 */
export abstract class Server_Graph extends Server_Base {

  protected graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>;
  protected featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;
  protected projectRoot: string;
  // protected graphDataPath: string;

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    protected getCurrentTestResults: () => any,
    projectRoot?: string,
    protected resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode);

    this.projectRoot = projectRoot || process.cwd();
    this.resourceChangedCallback = resourceChangedCallback || ((path: string) => { });
    this.featureIngestor = configs.featureIngestor;

    this.graph = this.createGraph();
    // this.graphDataPath = this.initializeGraph();
  }

  // Graph creation and initialization
  protected createGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
    // Create a simple graph structure
    return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
      multi: false,
      allowSelfLoops: false,
      type: 'directed'
    });
  }

  // protected initializeGraph(): string {
  //   const graphDataPath = `${this.projectRoot}/testeranto/reports/graph-data.json`;
  //   // No logging in constructors per SOUL principles
  //   return graphDataPath;
  // }

  // Setup method called by Server.ts
  async setupGraph(): Promise<void> {
    // this.logBusinessMessage("Setting up graph component (V3 business logic)...");

    // V3 Server_Graph constructor business logic:
    // 1. Initialize graph
    // this.logBusinessMessage("Initializing graph...");
    // this.graph = this.createGraph();

    new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
      multi: false,
      allowSelfLoops: false,
      type: 'directed'
    });

    // this.graphDataPath = this.initializeGraph();

    // 2. Add nodes from configuration
    // this.logBusinessMessage("Adding nodes from configuration...");
    this.addConfigNodesFromConfig();
    this.addAgentNodesFromConfig();
    this.addTestNodesFromConfig();
    this.addRuntimeNodesFromConfig();
    this.addViewNodesFromConfig();

    // 3. Parse agent markdown files and enrich agent nodes with parsed data
    // this.logBusinessMessage("Parsing agent markdown files...");
    await this.enrichAgentNodesWithParsedMarkdown();

    // 4. Generate edges between nodes
    // this.logBusinessMessage("Generating edges...");
    this.generateEdges();

    // 5. Write view slice files
    // this.logBusinessMessage("Writing view slice files...");
    this.writeViewSliceFiles();

    // 6. Update agent slice files
    // this.logBusinessMessage("Updating agent slice files...");
    this.updateAllAgentSliceFiles();

    // 7. Save initial graph state
    // this.logBusinessMessage("Saving initial graph state...");
    await this.saveGraph();

    // this.logBusinessMessage("Graph component setup complete");
  }

  /**
   * Parse each agent's persona markdown file and store the parsed data
   * (personaBody, readFiles, addFiles) in the agent node's attributes.
   */
  private async enrichAgentNodesWithParsedMarkdown(): Promise<void> {

    for (const [agentName, agentConfig] of Object.entries(this.configs.agents || {})) {
      const personaFile = (agentConfig as any).persona;
      if (!personaFile) {
        this.logBusinessWarning(`Agent ${agentName} has no persona file, skipping markdown parsing`);
        continue;
      }

      const absolutePersonaPath = `${this.projectRoot}/${personaFile}`;
      const parsed = parseAgentMarkdown(absolutePersonaPath);

      // Find the agent node in the graph and enrich it
      const agentNode = this.graph.findNode(
        (n: any) => n.id === `agent:${agentName}` || n.label === agentName
      );
      if (!agentNode) {
        this.logBusinessWarning(`Agent node not found for ${agentName}, skipping enrichment`);
        continue;
      }

      // Store parsed data in the node's metadata
      agentNode.metadata = {
        ...agentNode.metadata,
        personaBody: parsed.personaBody,
        readFiles: parsed.readFiles,
        addFiles: parsed.addFiles,
        personaFilePath: personaFile,
      };

      this.logBusinessMessage(`Enriched agent node ${agentName} with parsed markdown data`);
    }
  }

  // V3 Server_Graph business logic: save graph with proper structure
  async saveGraph(): Promise<void> {
    // this.logBusinessMessage(`Saving graph to ${this.graphDataPath} (V3 business logic)...`);

    // Create graph data structure similar to V3
    const graphData: GraphData = {
      nodes: this.graph.nodes().map(nodeKey => ({
        id: nodeKey,
        ...this.graph.getNodeAttributes(nodeKey)
      })),
      edges: this.graph.edges().map(edgeKey => ({
        source: this.graph.source(edgeKey),
        target: this.graph.target(edgeKey),
        attributes: this.graph.getEdgeAttributes(edgeKey)
      })),
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'Server_Graph'
      }
    };

    // Write the graph data to disk so the debug view can read it
    // try {
    //   const content = JSON.stringify(graphData, null, 2);
    //   await this.writeFile(this.graphDataPath, content);
    //   // this.logBusinessMessage(`Graph data written to ${this.graphDataPath}`);
    // } catch (err: any) {
    //   this.logBusinessError(`Failed to write graph data to ${this.graphDataPath}:`, err);
    // }

    // Regenerate view slice files so that the debug graph (and other views)
    // reflect the latest graph state, including newly added file nodes.
    this.writeViewSliceFiles();

    // Call resource changed callback
    if (this.resourceChangedCallback) {
      // this.logBusinessMessage(`[saveGraph] calling resourceChangedCallback`);
      this.resourceChangedCallback('/~/graph');
    }
  }

  // V3 Server_Graph business logic: write view slice files
  protected writeViewSliceFiles(): void {
    // this.logBusinessMessage("Writing view slice files (V3 business logic)...");

    if (this.configs.views) {
      const graphData: GraphData = {
        nodes: this.graph.nodes().map(nodeKey => ({
          id: nodeKey,
          ...this.graph.getNodeAttributes(nodeKey)
        })),
        edges: this.graph.edges().map(edgeKey => ({
          source: this.graph.source(edgeKey),
          target: this.graph.target(edgeKey),
          attributes: this.graph.getEdgeAttributes(edgeKey)
        })),
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString()
        }
      };

      for (const [viewKey, viewConfig] of Object.entries(this.configs.views)) {
        // this.logBusinessMessage(`Writing slice for view: ${viewKey}`);
        // Use the utility function to write the slice file with graph data
        generateViewSliceUtil(viewKey, viewConfig, graphData).catch((err: any) => {
          this.logBusinessError(`Failed to write slice for view ${viewKey}:`, err);
        });
      }
    }

    // this.logBusinessMessage("View slice files written");
  }

  async cleanupGraph(): Promise<void> {
    // this.logBusinessMessage("Cleaning up graph component...");
    // Implementation would clean up graph resources
    // this.logBusinessMessage("Graph component cleaned up");
  }

  async notifyGraphStarted(): Promise<void> {
    // this.logBusinessMessage("Graph component notified of server start");
  }

  async notifyGraphStopped(): Promise<void> {
    // this.logBusinessMessage("Graph component notified of server stop");
  }

  // These methods are now implemented using V3 pure functions
  protected addAgentNodesFromConfig(): void {
    // this.logBusinessMessage("Adding agent nodes from configuration (V3)");
    // Remove any existing agent nodes (category 'agent') before adding new ones
    this.removeAgentNodes();
    const timestamp = new Date().toISOString();
    const operations = addAgentNodesPure(this.configs, timestamp);
    this.applyOperations(operations);
  }

  /**
   * Remove all nodes with type 'agent' (category 'process', type 'agent') and their edges.
   */
  private removeAgentNodes(): void {
    const agentNodeIds = this.graph.nodes()
      .filter(n => n.type?.type === 'agent')
      .map(n => n.id);

    for (const nodeId of agentNodeIds) {
      this.removeNode(nodeId);
    }
  }

  protected addViewNodesFromConfig(): void {
    this.logBusinessMessage("Adding view nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addViewNodesPure(this.configs, this.projectRoot, timestamp);
    this.applyOperations(operations);
  }

  protected addConfigNodesFromConfig(): void {
    this.logBusinessMessage("Adding config nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addConfigNodesPure(this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected addTestNodesFromConfig(): void {
    this.logBusinessMessage("Adding test nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addTestNodesPure(this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected addRuntimeNodesFromConfig(): void {
    this.logBusinessMessage("Adding runtime nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addRuntimeNodesPure(this.graph, this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected generateEdges(): void {
    this.logBusinessMessage("Generating graph edges (V3)");
    const timestamp = new Date().toISOString();
    const operations = generateEdgesPure(this.graph, this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected updateAllAgentSliceFiles(): void {
    this.logBusinessMessage("Updating all agent slice files (V3)");
    updateAllAgentSliceFilesPure(this.graph, this.projectRoot, this.configs);
  }

  // Public method to apply a graph update (called by Docker events watcher)
  applyUpdate(update: { operations: GraphOperation[]; timestamp: string }): void {
    // this.logBusinessMessage(`[applyUpdate] applying ${update.operations.length} operations from update at ${update.timestamp}`);
    this.applyOperations(update.operations);
  }

  // Helper to apply graph operations to the internal graph structure
  private applyOperations(operations: GraphOperation[]): void {
    // this.logBusinessMessage(`[applyOperations] applying ${operations.length} operations`);
    for (const op of operations) {
      // this.logBusinessMessage(`[applyOperations] operation: type=${op.type}, id=${op.data?.id || op.data?.source || '?'}`);
      switch (op.type) {
        case 'addNode':
          {
            const id = op.data.id || `node-${Date.now()}`;
            if (!this.graph.hasNode(id)) {
              const attrs = { ...op.data };
              delete (attrs as any).id;
              this.graph.addNode(id, attrs);
            }
          }
          break;
        case 'addEdge':
          {
            const { source, target, attributes } = op.data;
            if (!this.graph.hasEdge(source, target)) {
              this.graph.addEdge(source, target, attributes);
            }
          }
          break;
        case 'updateNode':
          {
            const nodeId = op.data.id;
            if (this.graph.hasNode(nodeId)) {
              this.graph.mergeNodeAttributes(nodeId, op.data);
            } else {
              this.logBusinessMessage(`[applyOperations] node not found for update: ${nodeId}`);
            }
          }
          break;
        case 'removeNode':
          {
            if (this.graph.hasNode(op.data.id)) this.graph.dropNode(op.data.id);
          }
          break;
        case 'updateEdge':
          {
            const { source, target } = op.data;
            const edgeKey = this.graph.edge(source, target);
            if (edgeKey !== undefined) {
              this.graph.mergeEdgeAttributes(edgeKey, op.data);
            } else {
              // this.logBusinessMessage(`[applyOperations] edge not found for update: ${source} -> ${target}`);
            }
          }
          break;
        case 'removeEdge':
          {
            const { source, target } = op.data;
            if (this.graph.hasEdge(source, target)) {
              this.graph.dropEdge(source, target);
            }
          }
          break;
      }
    }
  }

  /**
   * Remove all verb nodes for a given test (and their edges).
   */
  removeVerbNodesForTest(configKey: string, testName: string): void {
    const prefix = `verb:${configKey}:${testName}:`;
    const verbNodeIds = this.graph.nodes().filter(nodeKey =>
      nodeKey.startsWith(prefix)
    );

    for (const nodeId of verbNodeIds) {
      this.removeNode(nodeId);
    }
  }

  /**
   * Generate a consistent node ID for a file path.
   */
  protected getFileNodeId(filePath: string): string {
    return `file:${filePath}`;
  }

  // Public graph operations
  addNode(node: any): string {
    this.logBusinessMessage(`addNode: ${JSON.stringify(node)}`);
    const nodeId = node.id || `node-${Date.now()}`;
    if (this.graph.hasNode(nodeId)) {
      this.logBusinessMessage(`[addNode] node already exists, skipping: ${nodeId}`);
      return nodeId;
    }
    const attrs = { ...node };
    delete attrs.id;
    this.graph.addNode(nodeId, attrs);
    return nodeId;
  }

  updateNode(nodeId: string, data: any): void {
    this.logBusinessMessage(`updateNode ${nodeId}: ${JSON.stringify(data)}`);
    if (this.graph.hasNode(nodeId)) {
      this.graph.mergeNodeAttributes(nodeId, data);
    }
  }

  removeNode(nodeId: string): void {
    this.logBusinessMessage(`removeNode ${nodeId}`);
    if (this.graph.hasNode(nodeId)) {
      this.graph.dropNode(nodeId);
    }
  }

  getNode(nodeId: string): any {
    this.logBusinessMessage(`getNode ${nodeId}`);
    if (this.graph.hasNode(nodeId)) {
      return this.graph.getNodeAttributes(nodeId);
    }
    return null;
  }

  addEdge(edge: any): string {
    this.logBusinessMessage(`addEdge: ${JSON.stringify(edge)}`);
    const edgeKey = this.graph.addEdge(edge.source, edge.target, edge.attributes);
    return edgeKey;
  }

  updateEdge(edgeId: string, data: any): void {
    this.logBusinessMessage(`updateEdge ${edgeId}: ${JSON.stringify(data)}`);
    if (this.graph.hasEdge(edgeId)) {
      this.graph.mergeEdgeAttributes(edgeId, data);
    }
  }

  removeEdge(edgeId: string): void {
    this.logBusinessMessage(`removeEdge ${edgeId}`);
    if (this.graph.hasEdge(edgeId)) {
      this.graph.dropEdge(edgeId);
    }
  }

  queryNodes(filter: (node: any) => boolean): any[] {
    this.logBusinessMessage(`queryNodes`);
    return this.graph.nodes()
      .map(nodeId => ({ id: nodeId, ...this.graph.getNodeAttributes(nodeId) }))
      .filter(filter);
  }

  queryEdges(filter: (edge: any) => boolean): any[] {
    this.logBusinessMessage(`queryEdges`);
    return this.graph.edges()
      .map(edgeKey => ({
        source: this.graph.source(edgeKey),
        target: this.graph.target(edgeKey),
        ...this.graph.getEdgeAttributes(edgeKey),
      }))
      .filter(filter);
  }

  // async loadGraph(): Promise<void> {
  //   this.logBusinessMessage(`loadGraph from ${this.graphDataPath}`);
  //   // Implementation would load from file
  // }

  // Helper methods
  protected getProcessNode(nodeId: string): any {
    return this.getNode(nodeId);
  }

  protected determineIfAiderProcess(processNode: any): boolean {
    if (!processNode?.type) return false;
    // type can be a string like "aider_process" or an object like { category: 'process', type: 'aider' }
    if (typeof processNode.type === 'string') {
      return processNode.type.includes('aider');
    }
    if (typeof processNode.type === 'object' && processNode.type !== null) {
      return processNode.type.type === 'aider' || processNode.type.category === 'aider';
    }
    return false;
  }

  protected generateTerminalCommand(containerId: string, containerName: string, label:
    string, isAiderProcess: boolean): string {
    // Delegate to the shared utility function
    return generateTerminalCommand(containerId, containerName, label, isAiderProcess);
  }

  // async getContainerInfo(containerId: string): Promise<any> {
  //   this.logBusinessMessage(`getContainerInfo ${containerId}`);
  //   // Implementation would get container info from Docker
  //   return { State: { Running: true }, Name: containerId };
  // }

}
