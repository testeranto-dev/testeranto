import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Graph } from "./Server_Graph";
import { handleOptions } from "./utils/handleOptions";
import { serveStaticFile } from "./Server_Http/serveStaticFile";

export abstract class Server_HTTP_Graph extends Server_Graph {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    // Pass dummy functions that don't reference `this`
    super(configs, mode, () => ({}), process.cwd(), undefined);

    // Now that super() has been called, we can safely set the callbacks
    // TypeScript doesn't allow assigning to protected properties from outside,
    // but we can cast to any to bypass.
    // However, the parent class stores them as protected properties.
    // We need to override the methods that these callbacks point to.
    // Actually, the parent class uses these callbacks via `this.getCurrentTestResults` and `this.resourceChanged`.
    // Since we're in the derived class, we can override the methods directly.
    // But note: the parent class stores them as properties, not methods.
    // Let's reassign the properties.
    (this as any).getCurrentTestResults = this.getCurrentTestResultsImpl.bind(this);
    (this as any).resourceChanged = this.resourceChangedImpl.bind(this);
  }

  private getCurrentTestResultsImpl(): any {
    // Default implementation returns empty object
    return {};
  }

  private resourceChangedImpl(path: string): void {
    // Default implementation does nothing
    // Subclasses can override the resourceChanged method
    // which will be called via the callback
  }

  async start(): Promise<void> {
    await super.start();
    await this.writeViewSliceFiles();
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
