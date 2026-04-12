import type { GraphEdgeAttributes, GraphNodeAttributes } from "../../graph";
import type { ITesterantoConfig } from "../../Types";
import { GraphManager } from "../graph";
import { handleMarkdownFileChange } from "../graph/handleMarkdownFileChange";
import { updateMarkdownFile } from "../graph/updateMarkdownFile";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { addChatMessageUtil } from "./utils/chatUtils";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";
import { getAgentSliceFilePath, getSliceFilePath, writeAgentSliceFile, writeSliceFile } from "./utils/graphFileUtils";
import { addAgentNodesFromConfigUtil } from "./utils/graphManagerCoreUtils";
import { generateFeatureTreeUtil } from "./utils/graphManagerUtils";
import { addViewNodeToGraphUtil, addAgentNodeToGraphUtil } from "./utils/graphNodeOperationUtils";
import { addAgentNodeToGraph, addViewNodeToGraph, connectAgentToSliceNodes, connectViewToSliceNodes, getViewType } from "./utils/graphNodeUtils";
import { writeViewSliceFilesUtil } from "./utils/graphSliceFileUtils";
import { getViewNode, getViewNodes, getViewSlice, updateAgentSliceFile, updateAllAgentSliceFiles } from "./utils/graphSliceUtils";

export class Server_Graph extends Server_Base {
  protected graphManager: GraphManager;
  protected projectRoot: string;

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected getCurrentTestResults: () => any,
    projectRoot?: string
  ) {
    super(configs, mode);
    this.projectRoot = projectRoot || process.cwd();
    this.graphManager = new GraphManager(
      this.projectRoot,
      configs.featureIngestor,
      configs
    );

    // Add agent nodes to the graph immediately
    addAgentNodesFromConfigUtil(this.graphManager, this.configs);

    // Save the graph to ensure nodes are persisted
    this.graphManager.saveGraph();

    // Write slice files
    this.writeViewSliceFiles();
  }

  async resetGraphData(): Promise<any> {
    // The graph is built from scratch on startup
    // Just write slice files
    await this.writeViewSliceFiles();

    const graphData = this.graphManager.getGraphData();
    return {
      unifiedGraph: graphData,
      timestamp: new Date().toISOString()
    };
  }

  // Write slice files for all views and add view nodes to the graph
  async writeViewSliceFiles(): Promise<void> {
    await writeViewSliceFilesUtil(
      this.configs,
      this.graphManager,
      this.projectRoot,
      this.writeSliceFile.bind(this),
      this.writeAgentSliceFile.bind(this),
      this.addViewNodeToGraph.bind(this),
      this.addAgentNodeToGraph.bind(this),
      console.log,
      console.error
    );
  }

  // Write a slice to a file
  private async writeSliceFile(viewKey: string, sliceData: any): Promise<void> {
    writeSliceFile(this.projectRoot, viewKey, sliceData);
  }

  // Write an agent slice to a file
  protected async writeAgentSliceFile(agentName: string, sliceData: any): Promise<void> {
    writeAgentSliceFile(this.projectRoot, agentName, sliceData);
  }

  // Get the slice file path for a view
  public getSliceFilePath(viewKey: string): string {
    return getSliceFilePath(this.projectRoot, viewKey);
  }

  // Get the slice file path for an agent
  public getAgentSliceFilePath(agentName: string): string {
    return getAgentSliceFilePath(this.projectRoot, agentName);
  }

  // Add or update a view node in the graph
  private addViewNodeToGraph(viewKey: string, viewPath: string, sliceData: any): void {

    addViewNodeToGraphUtil(this.graphManager, this.projectRoot, viewKey, viewPath, sliceData);
  }

  // Add or update an agent node in the graph
  private addAgentNodeToGraph(agentName: string, agentConfig: any, sliceData: any): void {

    addAgentNodeToGraphUtil(this.graphManager, this.projectRoot, agentName, agentConfig, sliceData);
  }

  // Determine view type based on view key
  private getViewType(viewKey: string): string {
    return getViewType(viewKey);
  }

  // Connect view node to nodes in its slice
  private connectViewToSliceNodes(viewNodeId: string, sliceData: any): void {
    connectViewToSliceNodes(this.graphManager, viewNodeId, sliceData);
  }

  // Connect agent node to nodes in its slice
  private connectAgentToSliceNodes(agentNodeId: string, sliceData: any): void {
    connectAgentToSliceNodes(this.graphManager, agentNodeId, sliceData);
  }

  async generateFeatureTree(): Promise<any> {
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
    return generateFeatureTreeUtil(graphData);
  }

  generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  getGraphData(): any {
    if (!this.graphManager) {
      throw new Error('Graph manager not available');
    }
    return this.graphManager.getGraphData();
  }

  generateFileTreeGraph(): any {
    const testResults = this.getCurrentTestResults();
    return generateFileTreeGraphPure(this.projectRoot, this.configs, testResults);
  }

  async handleMarkdownFileChange(filePath: string): Promise<void> {
    const result = await handleMarkdownFileChange(this.projectRoot, filePath, this.graphManager);
    return result;
  }

  async saveCurrentGraph(): Promise<void> {
    // Use the graph manager's saveGraph method to ensure consistency
    this.graphManager.saveGraph();

    // Also write view slice files
    await this.writeViewSliceFiles();

    // Update all agent slice files to ensure they're current
    this.updateAllAgentSliceFiles();
  }

  async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    await updateMarkdownFile(this.projectRoot, filePath, frontmatterData, contentBody);
  }

  getGraphManager(): GraphManager {
    return this.graphManager;
  }

  // Get only files and folders from the graph
  getFilesAndFolders(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getFilesAndFolders();
  }

  // Get process slice (docker processes)
  getProcessSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getProcessSlice();
  }

  // Get aider slice (aider processes and agents)
  getAiderSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getAiderSlice();
  }

  // Get runtime slice (runtimes)
  getRuntimeSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getRuntimeSlice();
  }

  // Get slice for a specific agent
  getAgentSlice(agentName: string): any {
    if (!this.configs.agents) {
      throw new Error(`No agents configured`);
    }

    const agentConfig = this.configs.agents[agentName];
    if (!agentConfig) {
      throw new Error(`Agent ${agentName} not found in configuration`);
    }

    if (typeof agentConfig.sliceFunction !== 'function') {
      throw new Error(`Agent ${agentName} has invalid sliceFunction`);
    }

    const sliceData = agentConfig.sliceFunction(this.graphManager);

    // Write the slice to a file for persistence
    this.writeAgentSliceFile(agentName, sliceData);

    return sliceData;
  }

  // Add a chat message to the graph
  addChatMessage(agentName: string, content: string): void {

    addChatMessageUtil(this.graphManager, agentName, content);

    this.updateAgentSliceFile(agentName);
  }

  // Update a specific agent's slice file immediately
  private updateAgentSliceFile(agentName: string): void {
    updateAgentSliceFile(this.graphManager, this.projectRoot, this.configs, agentName);
  }

  // Update ALL agent slice files immediately
  public updateAllAgentSliceFiles(): void {
    updateAllAgentSliceFiles(this.graphManager, this.projectRoot, this.configs);
  }


  // Get all view nodes from the graph
  getViewNodes(): any[] {
    return getViewNodes(this.graphManager);
  }

  // Get a specific view node by viewKey
  getViewNode(viewKey: string): any {
    return getViewNode(this.graphManager, viewKey);
  }

  // Get nodes connected to a view
  getViewSlice(viewKey: string): {
    nodes: any[],
    edges: any[]
  } {
    return getViewSlice(this.graphManager, viewKey);
  }

}
