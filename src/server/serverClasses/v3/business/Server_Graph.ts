import type {
  TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphData,
  GraphOperation
} from "../../../../graph";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Base } from "../ServerBase";
import { addAgentNodesPure } from "../utils/graph/addAgentNodesPure";
import { addRuntimeNodesPure } from "../utils/graph/addRuntimeNodesPure";
import { addViewNodesPure } from "../utils/graph/addViewNodesPure";
import { generateEdgesPure } from "../utils/graph/generateEdgesPure";
import { updateAllAgentSliceFilesPure } from "../utils/graph/updateAllAgentSliceFilesPure";
import { generateTerminalCommand } from "../utils/vscode/generateTerminalCommand";
import { generateViewSliceUtil } from "../utils/static/generateViewSliceUtil";
import { parseAgentMarkdown } from "../../../../shared/utilities/parseAgentMarkdown";

/**
 * Server_Graph - Business Layer (-5)
 *
 * Extends: (Base of business layer)
 * Extended by: Server_VSCode (-4)
 * Provides: Graph management business logic
 */
export abstract class Server_Graph extends Server_Base {

  protected graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  protected featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;
  protected projectRoot: string;
  protected graphDataPath: string;

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
    this.graphDataPath = this.initializeGraph();
  }

  // Graph creation and initialization
  protected createGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
    // Create a simple graph structure
    return {
      nodes: [],
      edges: [],
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString()
      }
    } as TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  }

  protected initializeGraph(): string {
    const graphDataPath = `${this.projectRoot}/testeranto/reports/graph-data.json`;
    // No logging in constructors per SOUL principles
    return graphDataPath;
  }

  // Setup method called by Server.ts
  async setupGraph(): Promise<void> {
    this.logBusinessMessage("Setting up graph component (V3 business logic)...");

    // V3 Server_Graph constructor business logic:
    // 1. Initialize graph
    this.logBusinessMessage("Initializing graph...");
    this.graph = this.createGraph();
    this.graphDataPath = this.initializeGraph();

    // 2. Add nodes from configuration
    this.logBusinessMessage("Adding nodes from configuration...");
    this.addAgentNodesFromConfig();
    this.addRuntimeNodesFromConfig();
    this.addViewNodesFromConfig();

    // 3. Parse agent markdown files and enrich agent nodes with parsed data
    this.logBusinessMessage("Parsing agent markdown files...");
    await this.enrichAgentNodesWithParsedMarkdown();

    // 4. Generate edges between nodes
    this.logBusinessMessage("Generating edges...");
    this.generateEdges();

    // 5. Write view slice files
    this.logBusinessMessage("Writing view slice files...");
    this.writeViewSliceFiles();

    // 6. Update agent slice files
    this.logBusinessMessage("Updating agent slice files...");
    this.updateAllAgentSliceFiles();

    // 7. Save initial graph state
    this.logBusinessMessage("Saving initial graph state...");
    await this.saveGraph();

    this.logBusinessMessage("Graph component setup complete");
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
      const agentNode = this.graph.nodes.find(
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
    this.logBusinessMessage(`Saving graph to ${this.graphDataPath} (V3 business logic)...`);

    // Create graph data structure similar to V3
    const graphData: GraphData = {
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      metadata: {
        ...this.graph.metadata,
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'Server_Graph'
      }
    };

    // Write the graph data to disk so the debug view can read it
    try {
      const content = JSON.stringify(graphData, null, 2);
      await this.writeFile(this.graphDataPath, content);
      this.logBusinessMessage(`Graph data written to ${this.graphDataPath}`);
    } catch (err: any) {
      this.logBusinessError(`Failed to write graph data to ${this.graphDataPath}:`, err);
    }

    // Regenerate view slice files so that the debug graph (and other views)
    // reflect the latest graph state, including newly added file nodes.
    this.writeViewSliceFiles();

    // Call resource changed callback
    if (this.resourceChangedCallback) {
      this.logBusinessMessage(`[saveGraph] calling resourceChangedCallback`);
      this.resourceChangedCallback('/~/graph');
    }
  }

  // V3 Server_Graph business logic: write view slice files
  protected writeViewSliceFiles(): void {
    this.logBusinessMessage("Writing view slice files (V3 business logic)...");

    if (this.configs.views) {
      const graphData: GraphData = {
        nodes: this.graph.nodes,
        edges: this.graph.edges,
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString()
        }
      };

      for (const [viewKey, viewConfig] of Object.entries(this.configs.views)) {
        this.logBusinessMessage(`Writing slice for view: ${viewKey}`);
        // Use the utility function to write the slice file with graph data
        generateViewSliceUtil(viewKey, viewConfig, graphData).catch((err: any) => {
          this.logBusinessError(`Failed to write slice for view ${viewKey}:`, err);
        });
      }
    }

    this.logBusinessMessage("View slice files written");
  }

  async cleanupGraph(): Promise<void> {
    this.logBusinessMessage("Cleaning up graph component...");
    // Implementation would clean up graph resources
    this.logBusinessMessage("Graph component cleaned up");
  }

  async notifyGraphStarted(): Promise<void> {
    this.logBusinessMessage("Graph component notified of server start");
  }

  async notifyGraphStopped(): Promise<void> {
    this.logBusinessMessage("Graph component notified of server stop");
  }

  // These methods are now implemented using V3 pure functions
  protected addAgentNodesFromConfig(): void {
    this.logBusinessMessage("Adding agent nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addAgentNodesPure(this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected addViewNodesFromConfig(): void {
    this.logBusinessMessage("Adding view nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addViewNodesPure(this.configs, this.projectRoot, timestamp);
    this.applyOperations(operations);
  }

  protected addRuntimeNodesFromConfig(): void {
    this.logBusinessMessage("Adding runtime nodes from configuration (V3)");
    const timestamp = new Date().toISOString();
    const operations = addRuntimeNodesPure(this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected generateEdges(): void {
    this.logBusinessMessage("Generating graph edges (V3)");
    const timestamp = new Date().toISOString();
    const graphData: GraphData = {
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      metadata: {
        version: '1.0',
        timestamp
      }
    };
    const operations = generateEdgesPure(graphData, this.configs, timestamp);
    this.applyOperations(operations);
  }

  protected updateAllAgentSliceFiles(): void {
    this.logBusinessMessage("Updating all agent slice files (V3)");
    const graphData: GraphData = {
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString()
      }
    };
    updateAllAgentSliceFilesPure(graphData, this.projectRoot, this.configs);
  }

  // Public method to apply a graph update (called by Docker events watcher)
  applyUpdate(update: { operations: GraphOperation[]; timestamp: string }): void {
    this.logBusinessMessage(`[applyUpdate] applying ${update.operations.length} operations from update at ${update.timestamp}`);
    this.applyOperations(update.operations);
  }

  // Helper to apply graph operations to the internal graph structure
  private applyOperations(operations: GraphOperation[]): void {
    this.logBusinessMessage(`[applyOperations] applying ${operations.length} operations`);
    for (const op of operations) {
      this.logBusinessMessage(`[applyOperations] operation: type=${op.type}, id=${op.data?.id || op.data?.source || '?'}`);
      switch (op.type) {
        case 'addNode':
          {
            const existingNode = this.graph.nodes.find(n => n.id === op.data.id);
            if (existingNode) {
              this.logBusinessMessage(`[applyOperations] node already exists, skipping add: ${op.data.id}`);
            } else {
              this.logBusinessMessage(`[applyOperations] adding node: ${op.data.id}`);
              this.graph.nodes.push(op.data);
              this.logBusinessMessage(`[applyOperations] node added, total nodes: ${this.graph.nodes.length}`);
            }
          }
          break;
        case 'addEdge':
          {
            const existingEdge = this.graph.edges.find(e => e.source === op.data.source && e.target === op.data.target);
            if (existingEdge) {
              this.logBusinessMessage(`[applyOperations] edge already exists, skipping add: ${op.data.source} -> ${op.data.target}`);
            } else {
              this.logBusinessMessage(`[applyOperations] adding edge: ${op.data.source} -> ${op.data.target}`);
              this.graph.edges.push({
                source: op.data.source,
                target: op.data.target,
                attributes: op.data.attributes
              });
              this.logBusinessMessage(`[applyOperations] edge added, total edges: ${this.graph.edges.length}`);
            }
          }
          break;
        case 'updateNode':
          {
            const idx = this.graph.nodes.findIndex(n => n.id === op.data.id);
            if (idx !== -1) {
              this.logBusinessMessage(`[applyOperations] updating node: ${op.data.id} at index ${idx}`);
              this.graph.nodes[idx] = { ...this.graph.nodes[idx], ...op.data };
              this.logBusinessMessage(`[applyOperations] node updated`);
            } else {
              this.logBusinessMessage(`[applyOperations] node not found for update: ${op.data.id}`);
            }
          }
          break;
        case 'removeNode':
          this.logBusinessMessage(`[applyOperations] removing node: ${op.data.id}`);
          const beforeCount = this.graph.nodes.length;
          this.graph.nodes = this.graph.nodes.filter(n => n.id !== op.data.id);
          this.graph.edges = this.graph.edges.filter(e => e.source !== op.data.id &&
            e.target !== op.data.id);
          this.logBusinessMessage(`[applyOperations] node removed, nodes: ${beforeCount} -> ${this.graph.nodes.length}`);
          break;
        case 'updateEdge':
          {
            const idx = this.graph.edges.findIndex(e => e.source === op.data.source &&
              e.target === op.data.target);
            if (idx !== -1) {
              this.logBusinessMessage(`[applyOperations] updating edge: ${op.data.source} -> ${op.data.target} at index ${idx}`);
              this.graph.edges[idx] = { ...this.graph.edges[idx], ...op.data };
              this.logBusinessMessage(`[applyOperations] edge updated`);
            } else {
              this.logBusinessMessage(`[applyOperations] edge not found for update: ${op.data.source} -> ${op.data.target}`);
            }
          }
          break;
        case 'removeEdge':
          this.logBusinessMessage(`[applyOperations] removing edge: ${op.data.source} -> ${op.data.target}`);
          this.graph.edges = this.graph.edges.filter(e => !(e.source === op.data.source &&
            e.target === op.data.target));
          this.logBusinessMessage(`[applyOperations] edge removed`);
          break;
      }
    }
  }

  // Public graph operations
  addNode(node: any): string {
    this.logBusinessMessage(`addNode: ${JSON.stringify(node)}`);
    const nodeId = `node-${Date.now()}`;
    this.graph.nodes.push({ ...node, id: nodeId });
    return nodeId;
  }

  updateNode(nodeId: string, data: any): void {
    this.logBusinessMessage(`updateNode ${nodeId}: ${JSON.stringify(data)}`);
    const nodeIndex = this.graph.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      this.graph.nodes[nodeIndex] = { ...this.graph.nodes[nodeIndex], ...data };
    }
  }

  removeNode(nodeId: string): void {
    this.logBusinessMessage(`removeNode ${nodeId}`);
    this.graph.nodes = this.graph.nodes.filter(n => n.id !== nodeId);
    this.graph.edges = this.graph.edges.filter(e => e.source !== nodeId && e.target !==
      nodeId);
  }

  getNode(nodeId: string): any {
    this.logBusinessMessage(`getNode ${nodeId}`);
    return this.graph.nodes.find(n => n.id === nodeId) || null;
  }

  addEdge(edge: any): string {
    this.logBusinessMessage(`addEdge: ${JSON.stringify(edge)}`);
    const edgeId = `edge-${Date.now()}`;
    this.graph.edges.push({ ...edge, id: edgeId });
    return edgeId;
  }

  updateEdge(edgeId: string, data: any): void {
    this.logBusinessMessage(`updateEdge ${edgeId}: ${JSON.stringify(data)}`);
    const edgeIndex = this.graph.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex !== -1) {
      this.graph.edges[edgeIndex] = { ...this.graph.edges[edgeIndex], ...data };
    }
  }

  removeEdge(edgeId: string): void {
    this.logBusinessMessage(`removeEdge ${edgeId}`);
    this.graph.edges = this.graph.edges.filter(e => e.id !== edgeId);
  }

  queryNodes(filter: (node: any) => boolean): any[] {
    this.logBusinessMessage(`queryNodes`);
    return this.graph.nodes.filter(filter);
  }

  queryEdges(filter: (edge: any) => boolean): any[] {
    this.logBusinessMessage(`queryEdges`);
    return this.graph.edges.filter(filter);
  }

  async loadGraph(): Promise<void> {
    this.logBusinessMessage(`loadGraph from ${this.graphDataPath}`);
    // Implementation would load from file
  }

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
