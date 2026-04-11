import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { Server_GraphManager } from "./Server_GraphManager";
import { handleOptions } from "./Server_Http/handleOptions";
import { serveStaticFile } from "./Server_Http/serveStaticFile";

export abstract class Server_HTTP_Base extends Server_Base {
  graphManager: Server_GraphManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    this.graphManager = new Server_GraphManager(
      configs,
      mode,
      () => this.getCurrentTestResults()
    );
  }

  async start(): Promise<void> {
    await super.start();

    // The graph is built from scratch in Server_GraphManager constructor
    // Write slice files
    try {
      await this.graphManager.writeViewSliceFiles();
    } catch (error) {
      console.error('[Server_HTTP_Base] Error writing view slice files:', error);
    }

    // Start capturing aider output for all agents
    try {
      console.log('[Server_HTTP_Base] Starting aider output capture for all agents');
      // this.graphManager.startCapturingAllAgentsOutput();
    } catch (error) {
      console.error('[Server_HTTP_Base] Error starting aider output capture:', error);
    }
  }

  async stop() {
    const graphManager = this.graphManager;
    graphManager.getGraphManager().saveGraph();
    await super.stop();
  }

  public async resetGraphData(): Promise<any> {
    return this.graphManager.resetGraphData();
  }

  // public saveGraphDataForStaticMode(fullGraphData: any): void {
  //   this.graphManager.saveGraphDataForStaticMode(fullGraphData);
  // }

  protected getCurrentTestResults(): any {
    return {};
  }

  protected generateFeatureTree(): any {
    return this.graphManager.generateFeatureTree();
  }

  protected generateFeatureGraph(): any {
    return this.graphManager.generateFeatureGraph();
  }

  protected generateFileTreeGraph(): any {
    return this.graphManager.generateFileTreeGraph();
  }

  public async handleMarkdownFileChange(filePath: string): Promise<void> {
    const result = await this.graphManager.handleMarkdownFileChange(filePath);
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
    // Save the graph and write slice files
    await this.saveCurrentGraph();
  }

  public async saveCurrentGraph(): Promise<void> {
    await this.graphManager.saveCurrentGraph();
  }

  public async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    await this.graphManager.writeMarkdownFile(filePath, frontmatterData, contentBody);
  }

  protected async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }

  protected handleOptions(): Response {
    return handleOptions();
  }
}
