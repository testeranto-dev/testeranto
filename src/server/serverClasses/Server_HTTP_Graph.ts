import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Graph } from "./Server_Graph";
import { handleOptions } from "./utils/handleOptions";
import { serveStaticFile } from "./Server_Http/serveStaticFile";

export abstract class Server_HTTP_Graph extends Server_Graph {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    // We need to pass a proper resourceChanged callback to the parent
    // But we can't reference `this` before super()
    // So we'll pass a dummy function first, then override it
    super(configs, mode, () => ({}), process.cwd(), undefined);
    
    // Now we need to set up the resourceChanged callback properly
    // The parent class (Server_Graph) stores it as _resourceChangedCallback
    // We need to set it to call our resourceChanged method
    (this as any)._resourceChangedCallback = (path: string) => {
      // This will be called by Server_Graph.resourceChanged()
      // We need to ensure it triggers WebSocket notifications
      // Since Server_HTTP_Graph extends Server_HTTP which extends Server_WS_HTTP,
      // we can call this.resourceChanged() which will handle WebSocket
      this.resourceChanged(path);
    };
    
    // Also set up getCurrentTestResults
    (this as any).getCurrentTestResults = this.getCurrentTestResultsImpl.bind(this);
  }

  private getCurrentTestResultsImpl(): any {
    // Default implementation returns empty object
    return {};
  }

  async start(): Promise<void> {
    await super.start();
    this.writeViewSliceFiles();
    this.saveGraph();
  }

  async stop() {
    this.saveGraph();
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
