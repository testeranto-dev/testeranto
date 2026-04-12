import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Graph } from "./Server_Graph";
import { handleOptions } from "./Server_Http/handleOptions";
import { serveStaticFile } from "./Server_Http/serveStaticFile";

export abstract class Server_HTTP_Graph extends Server_Graph {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode, () => this.getCurrentTestResults(), process.cwd())
  }

  async start(): Promise<void> {
    await super.start();

    // The graph is built from scratch in Server_GraphManager constructor
    // Write slice files
    try {
      await this.writeViewSliceFiles();
    } catch (error) {
      console.error('[Server_HTTP_Base] Error writing view slice files:', error);
    }

  }

  async stop() {
    this.getGraphManager().saveGraph();
    await super.stop();
  }

  public async resetGraphData(): Promise<any> {
    return super.resetGraphData();
  }

  private getCurrentTestResults(): any {
    return {};
  }

  protected generateFeatureTree(): any {
    return super.generateFeatureTree();
  }

  protected generateFeatureGraph(): any {
    return super.generateFeatureGraph();
  }

  protected generateFileTreeGraph(): any {
    return super.generateFileTreeGraph();
  }

  public async handleMarkdownFileChange(filePath: string): Promise<void> {
    const result = await super.handleMarkdownFileChange(filePath);

    this.broadcast({
      type: 'graphUpdated',
      message: `Graph updated due to markdown file change: ${filePath}`,
      timestamp: new Date().toISOString(),
      data: {
        unifiedGraph: result
      }
    })

    // Save the graph and write slice files
    await this.saveCurrentGraph();
  }

  public async saveCurrentGraph(): Promise<void> {
    await super.saveCurrentGraph();
  }

  public async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    await super.writeMarkdownFile(filePath, frontmatterData, contentBody);
  }

  protected async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }

  protected handleOptions(): Response {
    return handleOptions();
  }
}
