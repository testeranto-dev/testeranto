import Graph from "graphology";
import type {
  GraphEdgeAttributes,
  GraphNodeAttributes,
  GraphOperation,
  TesterantoGraph
} from "../../../../graph";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Base } from "../ServerBase";
import { addAgentNodesPure } from "../utils/graph/addAgentNodesPure";
import { addConfigNodesPure } from "../utils/graph/addConfigNodesPure";
import { addRuntimeNodesPure } from "../utils/graph/addRuntimeNodesPure";
import { addTestNodesPure } from "../utils/graph/addTestNodesPure";
import { addViewNodesPure } from "../utils/graph/addViewNodesPure";
import { applyOperations as applyOperationsUtil } from "../utils/graph/applyOperations";
import { createGraph as createGraphUtil } from "../utils/graph/createGraph";
import { generateEdgesPure } from "../utils/graph/generateEdgesPure";
import { updateAllAgentSliceFilesPure } from "../utils/graph/updateAllAgentSliceFilesPure";
import { generateTerminalCommand } from "../utils/vscode/generateTerminalCommand";
import { determineIfAiderProcess as determineIfAiderProcessUtil } from "./utils/graph/determineIfAiderProcess";
import { enrichAgentNodesWithParsedMarkdown as enrichAgentNodesWithParsedMarkdownUtil } from "./utils/graph/enrichAgentNodesWithParsedMarkdown";
import { getFileNodeId as getFileNodeIdUtil } from "./utils/graph/getFileNodeId";
import { removeAgentNodes as removeAgentNodesUtil } from "./utils/graph/removeAgentNodes";
import { removeVerbNodesForTest as removeVerbNodesForTestUtil } from "./utils/graph/removeVerbNodesForTest";
import { saveGraph as saveGraphUtil } from "./utils/graph/saveGraph";
import { writeViewSliceFiles as writeViewSliceFilesUtil } from "./utils/graph/writeViewSliceFiles";

export abstract class Server_Graph extends Server_Base {

  protected graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>;
  protected featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>;
  protected projectRoot: string;

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

    this.graph = createGraphUtil();
  }

  async setupGraph(): Promise<void> {
    this.graph = createGraphUtil();
    this.addConfigNodesFromConfig();
    this.addAgentNodesFromConfig();
    this.addTestNodesFromConfig();
    this.addRuntimeNodesFromConfig();
    this.addViewNodesFromConfig();
    await enrichAgentNodesWithParsedMarkdownUtil(this.graph, this.configs, this.projectRoot);
    this.generateEdges();
    writeViewSliceFilesUtil(this.graph, this.configs);
    this.updateAllAgentSliceFiles();
    await saveGraphUtil(this.graph, this.resourceChangedCallback!);
  }

  async saveGraph(): Promise<void> {
    await saveGraphUtil(this.graph, this.resourceChangedCallback!);
  }

  async cleanupGraph(): Promise<void> {
  }

  async notifyGraphStarted(): Promise<void> {
  }

  async notifyGraphStopped(): Promise<void> {
  }

  protected addAgentNodesFromConfig(): void {
    removeAgentNodesUtil(this.graph);
    const timestamp = new Date().toISOString();
    const operations = addAgentNodesPure(this.configs, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected addViewNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addViewNodesPure(this.configs, this.projectRoot, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected addConfigNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addConfigNodesPure(this.configs, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected addTestNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addTestNodesPure(this.configs, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected addRuntimeNodesFromConfig(): void {
    const timestamp = new Date().toISOString();
    const operations = addRuntimeNodesPure(this.graph, this.configs, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected generateEdges(): void {
    const timestamp = new Date().toISOString();
    const operations = generateEdgesPure(this.graph, this.configs, timestamp);
    applyOperationsUtil(this.graph, operations);
  }

  protected updateAllAgentSliceFiles(): void {
    updateAllAgentSliceFilesPure(this.graph, this.projectRoot, this.configs);
  }

  applyUpdate(update: { operations: GraphOperation[]; timestamp: string }): void {
    applyOperationsUtil(this.graph, update.operations);
  }

  removeVerbNodesForTest(configKey: string, testName: string): void {
    removeVerbNodesForTestUtil(this.graph, configKey, testName);
  }

  protected getFileNodeId(filePath: string): string {
    return getFileNodeIdUtil(filePath);
  }

  addNode(node: any): string {
    const nodeId = node.id || `node-${Date.now()}`;
    if (this.graph.hasNode(nodeId)) {
      return nodeId;
    }
    const attrs = { ...node };
    delete attrs.id;
    this.graph.addNode(nodeId, attrs);
    return nodeId;
  }

  updateNode(nodeId: string, data: any): void {
    if (this.graph.hasNode(nodeId)) {
      this.graph.mergeNodeAttributes(nodeId, data);
    }
  }

  removeNode(nodeId: string): void {
    if (this.graph.hasNode(nodeId)) {
      this.graph.dropNode(nodeId);
    }
  }

  getNode(nodeId: string): any {
    if (this.graph.hasNode(nodeId)) {
      return this.graph.getNodeAttributes(nodeId);
    }
    return null;
  }

  addEdge(edge: any): string {
    const edgeKey = this.graph.addEdge(edge.source, edge.target, edge.attributes);
    return edgeKey;
  }

  updateEdge(edgeId: string, data: any): void {
    if (this.graph.hasEdge(edgeId)) {
      this.graph.mergeEdgeAttributes(edgeId, data);
    }
  }

  removeEdge(edgeId: string): void {
    if (this.graph.hasEdge(edgeId)) {
      this.graph.dropEdge(edgeId);
    }
  }

  queryNodes(filter: (node: any) => boolean): any[] {
    return this.graph.nodes()
      .map(nodeId => ({ id: nodeId, ...this.graph.getNodeAttributes(nodeId) }))
      .filter(filter);
  }

  queryEdges(filter: (edge: any) => boolean): any[] {
    return this.graph.edges()
      .map(edgeKey => ({
        source: this.graph.source(edgeKey),
        target: this.graph.target(edgeKey),
        ...this.graph.getEdgeAttributes(edgeKey),
      }))
      .filter(filter);
  }

  protected getProcessNode(nodeId: string): any {
    return this.getNode(nodeId);
  }

  protected determineIfAiderProcess(processNode: any): boolean {
    return determineIfAiderProcessUtil(processNode);
  }

  protected generateTerminalCommand(containerId: string, containerName: string, label:
    string, isAiderProcess: boolean): string {
    return generateTerminalCommand(containerId, containerName, label, isAiderProcess);
  }

}
