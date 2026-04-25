import { Server_ApiSpec } from "./Server_ApiSpec";
import { generateViewBundleUtil } from "../utils/static/generateViewBundleUtil";
import { createErrorBundleUtil } from "../utils/static/createErrorBundleUtil";
import { generateViewHtmlUtil } from "../utils/static/generateViewHtmlUtil";
import { generateViewsIndexHtmlUtil } from "../utils/static/generateViewsIndexHtmlUtil";

/**
 * Server_Static - Business Layer (-1)
 * 
 * Extends: Server_ApiSpec (-1.5)
 * Extended by: Server (0)
 * Provides: Static file generation business logic
 */
export abstract class Server_Static extends Server_ApiSpec {

  // ========== Server_Static methods ==========
  generateViewHtml(viewKey: string, viewPath: string): string {
    return generateViewHtmlUtil(viewKey, viewPath);
  }

  async generateViewBundle(viewKey: string, viewPath: string): Promise<void> {
    await generateViewBundleUtil(
      viewKey,
      viewPath,
      this.createErrorBundle.bind(this)
    );
  }

  async generateViewSlices(): Promise<void> {
    this.logBusinessMessage(`Generating view slices (V2 business logic)...`);

    if (this.configs.views) {
      for (const [viewKey, viewConfig] of Object.entries(this.configs.views)) {
        this.logBusinessMessage(`Generating slice for view: ${viewKey}`);
        await this.generateViewSliceUtil(viewKey, viewConfig);
      }
    }

    this.logBusinessMessage("View slices generated");
  }

  async generateViewHtmlFiles(): Promise<void> {
    this.logBusinessMessage(`Generating view HTML files (V2 business logic)...`);


    this.logBusinessMessage(`Found ${Object.keys(this.configs.views).length} views`);

    for (const [viewKey, viewConfig] of Object.entries(this.configs.views)) {
      this.logBusinessMessage(`Generating HTML for view: ${viewKey} from ${viewConfig.filePath}`);

      try {
        const html = this.generateViewHtml(viewKey, viewConfig.filePath);
        this.logBusinessMessage(`Generated HTML for ${viewKey}`);

        await this.generateViewBundle(viewKey, viewConfig.filePath);
        this.logBusinessMessage(`Generated bundle for ${viewKey}`);

        await this.writeViewHtmlFileUtil(viewKey, html);
        this.logBusinessMessage(`Wrote HTML file for ${viewKey}`);

        this.logBusinessMessage(`HTML and bundle generated for view: ${viewKey}`);
      } catch (error) {
        this.logBusinessError(`Failed to generate view ${viewKey}:`, error);
      }
    }

    try {
      const indexHtml = this.generateViewsIndexHtml(this.configs.views);
      await this.writeViewsIndexHtmlUtil(indexHtml);
      this.logBusinessMessage(`Views index HTML generated`);
    } catch (error) {
      this.logBusinessError(`Failed to generate views index:`, error);
    }

    this.logBusinessMessage("View HTML files generated");
  }

  createErrorBundle(bundlePath: string, viewKey: string, errorMessage: string): void {
    createErrorBundleUtil(bundlePath, viewKey, errorMessage);
  }

  generateViewsIndexHtml(views: Record<string, any>): string {
    return generateViewsIndexHtmlUtil(views);
  }

  getStaticFilePath(relativePath: string): string {
    this.logBusinessMessage(`getStaticFilePath ${relativePath}`);
    return `/static/${relativePath}`;
  }

  isValidStaticFile(path: string): boolean {
    this.logBusinessMessage(`isValidStaticFile ${path}`);
    return true;
  }

  // Setup method called by Server.ts
  async setupViews(): Promise<void> {
    this.logBusinessMessage("Setting up view system...");
    await this.generateViewSlices();
    this.logBusinessMessage("View system setup complete");
  }

  async cleanupViews(): Promise<void> {
    this.logBusinessMessage("Cleaning up view system...");
    this.logBusinessMessage("View system cleaned up");
  }

  async notifyViewsStarted(): Promise<void> {
    this.logBusinessMessage("View system notified of server start");
  }

  async notifyViewsStopped(): Promise<void> {
    this.logBusinessMessage("View system notified of server stop");
  }

  // Workflow methods
  async startViewUpdates(): Promise<void> {
    this.logBusinessMessage("Starting view updates...");
    this.logBusinessMessage("View updates started");
  }

  async stopViewUpdates(): Promise<void> {
    this.logBusinessMessage("Stopping view updates...");
    this.logBusinessMessage("View updates stopped");
  }

  // ========== Abstract Methods for File Operations ==========
  // These methods need to be implemented by the technological layer
  protected abstract generateViewSliceUtil(viewKey: string, viewConfig: any): Promise<void>;
  protected abstract writeViewHtmlFileUtil(viewKey: string, html: string): Promise<void>;
  protected abstract writeViewsIndexHtmlUtil(html: string): Promise<void>;
}
