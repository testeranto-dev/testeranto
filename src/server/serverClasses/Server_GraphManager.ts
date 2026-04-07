import fs from 'fs';
import path from 'path';
import { Palette } from "../../colors";
import type { ITesterantoConfig } from "../../Types";
import { GraphManager } from "../graph/index";
import type { GraphNodeAttributes, GraphEdgeAttributes } from "../../graph/index";
import type { IMode } from "../types";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";
import { resetGraphDataPure } from "./utils/resetGraphDataPure";

export class Server_GraphManager {
  protected graphManager: GraphManager;

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected getCurrentTestResults: () => any
  ) {
    this.graphManager = new GraphManager(
      process.cwd(),
      configs.featureIngestor,
      configs
    );
  }

  async resetGraphData(): Promise<any> {
    const fullGraphData = await resetGraphDataPure(
      this.graphManager,
      this.configs,
      this.getCurrentTestResults
    );

    this.saveGraphDataForStaticMode(fullGraphData);

    return fullGraphData;
  }

  saveGraphDataForStaticMode(fullGraphData: any): void {
    try {
      const projectRoot = process.cwd();
      const filePath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
      const dir = path.dirname(filePath);

      const staticGraphData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          unifiedGraph: fullGraphData.unifiedGraph || { nodes: [], edges: [] },
          vizConfig: fullGraphData.vizConfig || {
            projection: {
              xAttribute: 'status',
              yAttribute: 'priority',
              xType: 'categorical',
              yType: 'continuous',
              layout: 'grid'
            },
            style: {
              nodeSize: 10,
              nodeColor: Palette.rust,
              nodeShape: 'circle'
            }
          },
          configs: fullGraphData.configs || {}
        }
      };

      fs.writeFileSync(filePath, JSON.stringify(staticGraphData, null, 2), 'utf-8');

      try {
        const writtenContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(writtenContent);
      } catch (verifyError) {
        console.error(`[Server_GraphManager] Failed to verify written file:`, verifyError);
      }
    } catch (error) {
      console.error('[Server_GraphManager] Error saving static graph data:', error);
    }
  }

  generateFeatureTree(): any {
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };

    const featureNodes = graphData.nodes.filter((node: any) => node.type === 'feature');
    const featureEdges = graphData.edges.filter((edge: any) =>
      edge.attributes.type === 'dependsUpon' || edge.attributes.type === 'blocks'
    );

    const tree: any = {};

    featureNodes.forEach((node: any) => {
      tree[node.id] = {
        ...node,
        children: [],
        parents: []
      };
    });

    featureEdges.forEach((edge: any) => {
      if (edge.attributes.type === 'dependsUpon') {
        if (tree[edge.source]) {
          tree[edge.source].parents.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].children.push(edge.source);
        }
      } else if (edge.attributes.type === 'blocks') {
        if (tree[edge.source]) {
          tree[edge.source].children.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].parents.push(edge.source);
        }
      }
    });

    return tree;
  }

  generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  generateFileTreeGraph(): any {
    const projectRoot = process.cwd();
    const testResults = this.getCurrentTestResults();
    return generateFileTreeGraphPure(projectRoot, this.configs, testResults);
  }

  async handleMarkdownFileChange(filePath: string): Promise<void> {
    const { handleMarkdownFileChange } = await import('../stakeholder/markdown');
    const result = await handleMarkdownFileChange(filePath, this.graphManager);
    return result;
  }

  saveCurrentGraph(): void {
    try {
      if (this.graphManager) {
        const graphData = this.graphManager.getGraphData();
        if (graphData) {
          const fullGraphData = {
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
                nodeShape: 'circle'
              }
            },
            configs: this.configs
          };
          this.saveGraphDataForStaticMode(fullGraphData);
        }
      }
    } catch (error) {
      console.error('[Server_GraphManager] Error saving current graph:', error);
    }
  }

  async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    const { updateMarkdownFile } = await import('../stakeholder/markdown');
    await updateMarkdownFile(filePath, frontmatterData, contentBody);
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
  getAgentSlice(agentName: string): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
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
    
    return agentConfig.sliceFunction(this.graphManager);
  }



}
