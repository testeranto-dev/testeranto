import fs from 'fs';
import path from 'path';
import type { GraphData, GraphEdgeAttributes, GraphNodeAttributes, GraphUpdate, TesterantoGraph } from "../../graph";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { addAgentNodesPure } from "./graph/addAgentNodesPure";
import { addViewNodesPure } from "./graph/addViewNodesPure";
import { addRuntimeNodesPure } from "./graph/addRuntimeNodesPure";
import { saveGraphPure } from "./graph/saveGraphPure";
import { getViewSlicePure } from "./graph/getViewSlicePure";
import { addChatMessageUtil } from "./graph/addChatMessageUtil";
import { cleanupAttributeNodesPure } from "./graph/cleanupAttributeNodesPure";
import { createGraph } from './graph/createGraph';
import { createGraphDataFilePure } from "./graph/createGraphDataFilePure";
import { generateEdgesPure } from "./graph/generateEdgesPure";
import { getGraphStatsPure } from "./graph/getGraphStatsPure";
import { applyUpdateUtil } from "./graph/graphOperations/applyUpdateUtil";
import { serializeToMarkdownUtil } from "./graph/graphOperations/serializeToMarkdownUtil";
import { graphToData } from "./graph/graphToData";
import { getAiderSlice, getFilesAndFoldersSlice, getProcessSlice, getRuntimeSlice } from "./graph/sliceUtils";
import { updateFromTestResultsPure } from "./graph/updateFromTestResultsPure";
import { Server_Base } from "./Server_Base";

export class Server_Graph extends Server_Base {
  protected graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;
  protected graphDataPath: string;
  protected projectRoot: string;
  protected resourceChanged: (path: string) => void;
  protected featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChanged?: (path: string) => void
  ) {
    super(configs, mode);

    this.projectRoot = projectRoot || process.cwd();
    this.resourceChanged = resourceChanged || ((path: string) => { });
    this.featureIngestor = configs.featureIngestor;

    this.graph = createGraph();
    this.graphDataPath = this.initializeGraph();

    // Initialize graph with configs
    this.addAgentNodesFromConfig();
    this.addViewNodesFromConfig();
    this.addRuntimeNodesFromConfig();
    this.generateEdges();
    this.writeViewSliceFiles();
  }

  private initializeGraph(): string {
    const graphDataPath = path.join(this.projectRoot, 'testeranto', 'reports', 'graph-data.json');
    return graphDataPath;
  }

  public saveGraph(): void {
    this.saveGraphUtil();
  }

  public saveGraphWithConfig(configs?: any): void {
    this.saveGraphUtil(configs);
  }

  public saveGraphDataForStaticMode(fullGraphData: any): void {
    const graphDataFile = createGraphDataFilePure(
      fullGraphData.unifiedGraph || fullGraphData
    );

    if (fullGraphData.configs) {
      graphDataFile.data.configs = fullGraphData.configs;
    }
    if (fullGraphData.vizConfig) {
      graphDataFile.data.vizConfig = fullGraphData.vizConfig;
    }

    const dir = path.dirname(this.graphDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.graphDataPath, JSON.stringify(graphDataFile, null, 2), 'utf-8');
    this.emitGraphSaved();
  }

  public getGraphDataPath(): string {
    return this.graphDataPath;
  }

  private emitGraphSaved(): void {
    // Placeholder for event emission
  }

  public getGraphData(): GraphData {
    return graphToData(this.graph);
  }

  public applyUpdate(update: GraphUpdate): GraphData {
    return applyUpdateUtil(
      update,
      this.graph,
      () => this.serializeToMarkdown()
    );
  }

  public async updateFromTestResults(testResults: any): Promise<GraphUpdate> {
    return updateFromTestResultsPure(
      testResults,
      this.graph,
      this.projectRoot,
      this.featureIngestor,
      this.configs
    );
  }

  public cleanupAttributeNodes(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = this.getGraphData();
    const operations = cleanupAttributeNodesPure(graphData, timestamp);
    return { operations, timestamp };
  }

  public generateEdges(): GraphUpdate {
    const timestamp = new Date().toISOString();
    const graphData = this.getGraphData();
    const operations = generateEdgesPure(graphData, this.configs, timestamp, this.projectRoot);
    return { operations, timestamp };
  }

  public getGraphStats(): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
    return getGraphStatsPure(this.graph);
  }

  public getFilesAndFolders(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getFilesAndFoldersSlice(this.graph);
  }

  public getProcessSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getProcessSlice(this.graph);
  }

  public getAiderSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getAiderSlice(this.graph);
  }

  public getRuntimeSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return getRuntimeSlice(this.graph);
  }

  public serializeToMarkdown(): void {
    serializeToMarkdownUtil(this.graph);
  }

  public async updateGraphWithAiderNode(params: {
    runtime: string;
    testName: string;
    configKey: string;
    aiderServiceName: string;
    containerId?: string;
  }): Promise<void> {
    const timestamp = new Date().toISOString();
    const aiderProcessId = `aider_process:${params.configKey}:${params.testName}`;
    
    const update: GraphUpdate = {
      operations: [{
        type: 'updateNode',
        data: {
          id: aiderProcessId,
          metadata: {
            containerId: params.containerId,
            serviceName: params.aiderServiceName,
            updatedAt: timestamp
          }
        },
        timestamp
      }],
      timestamp
    };
    
    this.applyUpdate(update);
  }

  async resetGraphData(): Promise<any> {
    await this.writeViewSliceFiles();
    const graphData = this.getGraphData();
    return {
      unifiedGraph: graphData,
      timestamp: new Date().toISOString()
    };
  }

  async writeViewSliceFiles(): Promise<void> {
    // This method should write view slice files to disk
    // For now, we'll implement a basic version
    const views = this.configs.views;
    if (!views) return;

    for (const [viewKey, _] of Object.entries(views)) {
      const sliceData = this.getViewSlice(viewKey);
      const slicePath = this.getSliceFilePath(viewKey);
      const dir = path.dirname(slicePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(slicePath, JSON.stringify(sliceData, null, 2), 'utf-8');
    }
  }

  public getSliceFilePath(viewKey: string): string {
    return `${this.projectRoot}/testeranto/slices/views/${viewKey}.json`;
  }

  public getAgentSliceFilePath(agentName: string): string {
    return `${this.projectRoot}/testeranto/slices/agents/${agentName}.json`;
  }

  async generateFeatureTree(): Promise<any> {
    const graphData = this.getGraphData();
    return { features: graphData.nodes.filter((n: any) => n.type === 'feature') };
  }

  generateFeatureGraph(): any {
    return this.getGraphData();
  }

  generateFileTreeGraph(): any {
    return { projectRoot: this.projectRoot, configs: this.configs, testResults: this.getCurrentTestResults() };
  }

  async handleMarkdownFileChange(filePath: string): Promise<void> {
    // According to SOUL.md, we should not have useless logging
    // This method should be implemented properly
    // For now, we'll leave it empty as it's not being used
  }

  async saveCurrentGraph(): Promise<void> {
    await this.writeViewSliceFiles();
    this.updateAllAgentSliceFiles();
  }

  async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    // This method should write markdown files
    // For now, we'll implement a basic version
    const content = `---\n${JSON.stringify(frontmatterData, null, 2)}\n---\n\n${contentBody || ''}`;
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  getGraphManager(): any {
    return this;
  }

  get graphManager(): Server_Graph {
    return this;
  }

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
    const sliceData = agentConfig.sliceFunction(this);
    const agentSliceFilePath = this.getAgentSliceFilePath(agentName);
    const dir = path.dirname(agentSliceFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(agentSliceFilePath, JSON.stringify(sliceData, null, 2), 'utf-8');
    return sliceData;
  }

  addChatMessage(agentName: string, content: string): void {
    const timestamp = new Date().toISOString();
    const update = addChatMessageUtil(agentName, content, timestamp);
    this.applyUpdate(update);
    this.updateAgentSliceFile(agentName);
  }

  private updateAgentSliceFile(agentName: string): void {
    // Update the agent slice file
    this.getAgentSlice(agentName);
  }

  public updateAllAgentSliceFiles(): void {
    if (!this.configs.agents) return;

    for (const agentName of Object.keys(this.configs.agents)) {
      this.updateAgentSliceFile(agentName);
    }
  }

  public addAgentNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addAgentNodesPure(this.configs, timestamp);
    
    if (operations.length > 0) {
      const update = { operations, timestamp };
      this.applyUpdate(update);
    }
  }

  private addViewNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addViewNodesPure(this.configs, this.projectRoot, timestamp);
    
    if (operations.length > 0) {
      const update = { operations, timestamp };
      this.applyUpdate(update);
    }
  }

  private addRuntimeNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addRuntimeNodesPure(this.configs, timestamp);
    
    if (operations.length > 0) {
      const update = { operations, timestamp };
      this.applyUpdate(update);
    }
  }

  private saveGraphUtil(configs?: any): void {
    const graphData = this.getGraphData();
    const result = saveGraphPure(graphData, this.graphDataPath, configs);
    
    if (!result.success) {
      // According to SOUL.md, we should propagate errors, not catch and log them
      // But we need to handle file system operations
      // For now, we'll throw the error
      throw new Error(`Failed to save graph: ${result.error}`);
    }
    
    // Write to file system
    const timestamp = new Date().toISOString();
    const version = '1.0';
    const graphDataFile = {
      timestamp,
      version,
      data: {
        unifiedGraph: graphData,
        vizConfig: {
          projection: {
            xAttribute: 'status',
            yAttribute: 'priority',
            xType: 'categorical' as const,
            yType: 'continuous' as const,
            layout: 'grid' as const
          },
          style: {
            nodeSize: 10,
            nodeColor: '#882255',
            nodeShape: 'circle' as const
          }
        },
        configs: configs || {}
      }
    };

    const dir = path.dirname(this.graphDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.graphDataPath, JSON.stringify(graphDataFile, null, 2), 'utf-8');
    this.emitGraphSaved();
  }

  getViewNodes(): any[] {
    const graphData = this.getGraphData();
    return graphData.nodes.filter((node: any) => node.type === 'view');
  }

  getViewNode(viewKey: string): any {
    const graphData = this.getGraphData();
    return graphData.nodes.find((node: any) => node.id === `view:${viewKey}`);
  }

  getViewSlice(viewKey: string): {
    nodes: any[],
    edges: any[]
  } {
    const graphData = this.getGraphData();
    return getViewSlicePure(graphData, viewKey);
  }

  getProcessNodes(): any[] {
    const graphData = this.getGraphData();
    return graphData.nodes.filter((node: any) => {
      return node.type &&
        typeof node.type === 'object' &&
        node.type.category === 'process';
    });
  }

  getProcessNode(processId: string): any {
    const graphData = this.getGraphData();
    return graphData.nodes.find((node: any) =>
      node.id === processId &&
      node.type &&
      typeof node.type === 'object' &&
      node.type.category === 'process'
    );
  }
}
