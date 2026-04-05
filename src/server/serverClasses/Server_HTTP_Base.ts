import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { handleOptions } from "./Server_Http/handleOptions";
import { serveStaticFile } from "./Server_Http/utils/utils";
import { GraphManager } from "../graph/index";
import { Palette } from "../../colors";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";
import { resetGraphDataPure } from "./utils/resetGraphDataPure";
import fs from 'fs';
import path from 'path';

export abstract class Server_HTTP_Base extends Server_Base {
  protected graphManager: GraphManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    console.log('[Server_HTTP_Base] Constructor called with configs:',
      configs ? `has runtimes: ${Object.keys(configs.runtimes || {}).length}` : 'configs is null/undefined');
    this.graphManager = new GraphManager(
      process.cwd(),
      configs.featureIngestor,
      configs
    );
  }

  async start(): Promise<void> {
    await super.start();

    // Generate and save graph data immediately on startup
    console.log('[Server_HTTP_Base] Generating initial graph data...');
    try {
      const graphData = await this.resetGraphData();
      console.log('[Server_HTTP_Base] Initial graph data generated successfully');
    } catch (error) {
      console.error('[Server_HTTP_Base] Error generating initial graph data:', error);
    }
  }

  async stop() {
    // Save graph before stopping
    if (this.graphManager) {
      this.graphManager.saveGraph();
    }
    await super.stop();
  }

  public async resetGraphData(): Promise<any> {
    console.log('[Server_HTTP_Base] resetGraphData() called');

    // Use the pure stateless function
    const fullGraphData = await resetGraphDataPure(
      this.graphManager,
      this.configs,
      this.getCurrentTestResults.bind(this)
    );

    console.log(`[Server_HTTP_Base] Saving full graph data structure in unified format...`);
    // Also save a standalone graph-data.json file for static mode
    this.saveGraphDataForStaticMode(fullGraphData);

    return fullGraphData;
  }

  // Save graph data for static mode access
  public saveGraphDataForStaticMode(fullGraphData: any): void {
    try {
      const projectRoot = process.cwd();
      const filePath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
      const dir = path.dirname(filePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[Server_HTTP_Base] Created directory: ${dir}`);
      }

      // Create a standalone graph data object for static mode in unified format
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

      // Always write the file on startup (as intended)
      console.log(`[Server_HTTP_Base] Writing graph-data.json to ${filePath}`);
      console.log(`[Server_HTTP_Base] Graph data structure keys:`, Object.keys(staticGraphData.data));
      if (staticGraphData.data.unifiedGraph) {
        console.log(`[Server_HTTP_Base] unifiedGraph has ${staticGraphData.data.unifiedGraph.nodes?.length || 0} nodes, ${staticGraphData.data.unifiedGraph.edges?.length || 0} edges`);
      }

      fs.writeFileSync(filePath, JSON.stringify(staticGraphData, null, 2), 'utf-8');
      console.log(`[Server_HTTP_Base] Successfully saved graph-data.json (${fs.statSync(filePath).size} bytes)`);

      // Verify the file was written correctly
      try {
        const writtenContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(writtenContent);
        console.log(`[Server_HTTP_Base] Verification: file contains ${parsed.data?.unifiedGraph?.nodes?.length || 0} nodes`);
      } catch (verifyError) {
        console.error(`[Server_HTTP_Base] Failed to verify written file:`, verifyError);
      }
    } catch (error) {
      console.error('[Server_HTTP_Base] Error saving static graph data:', error);
    }
  }

  protected getCurrentTestResults(): any {
    // This should be implemented by subclasses
    return {};
  }

  protected generateFeatureTree(): any {
    // Generate a tree structure from features
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
        // source depends on target
        if (tree[edge.source]) {
          tree[edge.source].parents.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].children.push(edge.source);
        }
      } else if (edge.attributes.type === 'blocks') {
        // source blocks target
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

  protected generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  protected generateFileTreeGraph(): any {
    // Generate a file tree graph based on the project structure
    // Only include: entry files, input files used by entry files, and feature references (URLs or files)
    const projectRoot = process.cwd();
    const testResults = this.getCurrentTestResults();

    // Use the pure stateless function
    return generateFileTreeGraphPure(projectRoot, this.configs, testResults);
  }

  // Handle markdown file changes by updating the specific file in the graph
  public async handleMarkdownFileChange(filePath: string): Promise<void> {
    const { handleMarkdownFileChange } = await import('../stakeholder/markdown');
    const result = await handleMarkdownFileChange(filePath, this.graphManager);

    // Broadcast update to WebSocket clients if we're a WS server
    if (this instanceof (await import('./Server_WS')).Server_WS && result) {
      const wsThis = this as any;
      wsThis.broadcast({
        type: 'graphUpdated',
        message: `Graph updated due to markdown file change: ${filePath}`,
        timestamp: new Date().toISOString(),
        data: {
          unifiedGraph: result
        }
      });
    }
  }

  // Save current graph to graph-data.json
  public saveCurrentGraph(): void {
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
          console.log(`[Server_HTTP_Base] Saved current graph to graph-data.json`);
        }
      }
    } catch (error) {
      console.error('[Server_HTTP_Base] Error saving current graph:', error);
    }
  }

  // Write markdown file with updated frontmatter using stakeholder utilities
  public async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    const { updateMarkdownFile } = await import('../stakeholder/markdown');
    await updateMarkdownFile(filePath, frontmatterData, contentBody);
    console.log(`[Server_HTTP_Base] Updated markdown file: ${filePath}`);
  }

  protected async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }

  protected handleOptions(): Response {
    return handleOptions();
  }
}
