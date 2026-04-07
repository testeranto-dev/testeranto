import type { ITesterantoConfig } from "../../Types";
import { GraphManager } from "../graph/index";
import type { GraphNodeAttributes, GraphEdgeAttributes } from "../../graph/index";
import type { IMode } from "../types";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";
import { resetGraphDataPure } from "./utils/resetGraphDataPure";
import { saveGraphDataForStaticModePure } from "./utils/graphFileUtils";
import { Server_GraphManagerCore } from "./Server_GraphManagerCore";

export class Server_GraphManager {
  protected graphManager: GraphManager;
  protected projectRoot: string;
  protected core: Server_GraphManagerCore;

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected getCurrentTestResults: () => any,
    projectRoot?: string
  ) {
    this.projectRoot = projectRoot || process.cwd();
    this.graphManager = new GraphManager(
      this.projectRoot,
      configs.featureIngestor,
      configs
    );
    this.core = new Server_GraphManagerCore();
  }

  async resetGraphData(): Promise<any> {
    const fullGraphData = await resetGraphDataPure(
      this.graphManager,
      this.configs,
      this.getCurrentTestResults
    );

    saveGraphDataForStaticModePure(this.projectRoot, fullGraphData);

    return fullGraphData;
  }

  generateFeatureTree(): any {
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
    return this.core.generateFeatureTree(graphData);
  }

  generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  generateFileTreeGraph(): any {
    const testResults = this.getCurrentTestResults();
    return generateFileTreeGraphPure(this.projectRoot, this.configs, testResults);
  }

  async handleMarkdownFileChange(filePath: string): Promise<void> {
    const { handleMarkdownFileChange } = await import('../stakeholder/markdown');
    const result = await handleMarkdownFileChange(this.projectRoot, filePath, this.graphManager);
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
                nodeShape: 'circle' as const
              }
            },
            configs: this.configs
          };
          saveGraphDataForStaticModePure(this.projectRoot, fullGraphData);
        }
      }
    } catch (error) {
      console.error('[Server_GraphManager] Error saving current graph:', error);
    }
  }

  async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    const { updateMarkdownFile } = await import('../stakeholder/markdown');
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
