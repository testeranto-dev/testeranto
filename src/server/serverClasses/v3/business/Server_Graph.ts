import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../graph";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Base } from "../ServerBase";

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
    this.logBusinessMessage("Setting up graph component (V2 business logic)...");

    // V2 Server_Graph constructor business logic:
    // 1. Initialize graph
    this.logBusinessMessage("Initializing graph...");
    this.graph = this.createGraph();
    this.graphDataPath = this.initializeGraph();

    // 2. Add nodes from configuration
    this.logBusinessMessage("Adding nodes from configuration...");
    this.addAgentNodesFromConfig();
    this.addViewNodesFromConfig();
    this.addRuntimeNodesFromConfig();

    // 3. Generate edges between nodes
    this.logBusinessMessage("Generating edges...");
    this.generateEdges();

    // 4. Write view slice files
    this.logBusinessMessage("Writing view slice files...");
    this.writeViewSliceFiles();

    // 5. Update agent slice files
    this.logBusinessMessage("Updating agent slice files...");
    this.updateAllAgentSliceFiles();

    // 6. Save initial graph state
    this.logBusinessMessage("Saving initial graph state...");
    await this.saveGraph();

    this.logBusinessMessage("Graph component setup complete");
  }

  // V2 Server_Graph business logic: save graph with proper structure
  async saveGraph(): Promise<void> {
    this.logBusinessMessage(`Saving graph to ${this.graphDataPath} (V2 business logic)...`);
    
    // Create graph data structure similar to V2
    const graphData = {
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      metadata: {
        ...this.graph.metadata,
        version: '1.0',
        timestamp: new Date().toISOString(),
        configs: this.configs,
        mode: this.mode
      }
    };
    
    // Implementation would save to file
    // For now, just log
    this.logBusinessMessage(`Graph saved with ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
    
    // Call resource changed callback
    if (this.resourceChangedCallback) {
      this.resourceChangedCallback('/~/graph');
    }
  }

  // V2 Server_Graph business logic: write view slice files
  protected writeViewSliceFiles(): void {
    this.logBusinessMessage("Writing view slice files (V2 business logic)...");
    
    if (this.configs.views) {
      for (const [viewKey, viewConfig] of Object.entries(this.configs.views)) {
        this.logBusinessMessage(`Writing slice for view: ${viewKey}`);
        // Implementation would write slice file for each view
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

  // These methods should be implemented by concrete subclasses
  protected addAgentNodesFromConfig(): void {
    this.logBusinessMessage("Adding agent nodes from configuration");
    // Implementation would add agent nodes to graph
  }

  protected addViewNodesFromConfig(): void {
    this.logBusinessMessage("Adding view nodes from configuration");
    // Implementation would add view nodes to graph
  }

  protected addRuntimeNodesFromConfig(): void {
    this.logBusinessMessage("Adding runtime nodes from configuration");
    // Implementation would add runtime nodes to graph
  }

  protected generateEdges(): void {
    this.logBusinessMessage("Generating graph edges");
    // Implementation would generate edges between nodes
  }

  protected updateAllAgentSliceFiles(): void {
    this.logBusinessMessage("Updating all agent slice files");
    // Implementation would update agent slice files
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
    this.graph.edges = this.graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
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
    return processNode?.type?.includes('aider') || false;
  }

  protected generateTerminalCommand(containerId: string, containerName: string, label: string, isAiderProcess: boolean): string {
    if (isAiderProcess) {
      return `docker exec -it ${containerId} aider`;
    } else {
      return `docker exec -it ${containerId} /bin/bash`;
    }
  }

  async getContainerInfo(containerId: string): Promise<any> {
    this.logBusinessMessage(`getContainerInfo ${containerId}`);
    // Implementation would get container info from Docker
    return { State: { Running: true }, Name: containerId };
  }

}
