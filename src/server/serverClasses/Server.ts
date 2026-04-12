import { join } from "path";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Docker } from './Server_Docker';
import { generateViewHtml, generateViewsIndexHtml } from './utils/viewHtml';
import { generateViewBundleUtil } from './utils/generateViewBundleUtil';
import { generateViewSlicesUtil } from './utils/generateViewSlicesUtil';
import { generateViewHtmlFilesUtil } from './utils/generateViewHtmlFilesUtil';

export class Server extends Server_Docker {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    await this.generateViewSlices();
    await this.generateViewHtmlFiles();
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  private async generateViewHtmlFiles(): Promise<void> {
    await generateViewHtmlFilesUtil(
      this.configs,
      this.generateViewBundle.bind(this)
    );
  }

  private generateViewHtml(viewKey: string, viewPath: string): string {
    return generateViewHtml(viewKey, viewPath)
  }

  private generateViewsIndexHtml(views: Record<string, any>): string {
    return generateViewsIndexHtml(views);
  }

  private createErrorBundle(bundlePath: string, viewKey: string, errorMessage: string): void {
    // Import synchronously since this is called from generateViewBundle which is already async
    // We'll use require to avoid top-level await issues
    const { createErrorBundleUtil } = require('./utils/createErrorBundleUtil');
    createErrorBundleUtil(bundlePath, viewKey, errorMessage);
  }

  private async generateViewBundle(viewKey: string, viewPath: string): Promise<void> {
    await generateViewBundleUtil(
      viewKey,
      viewPath,
      this.createErrorBundle.bind(this)
    );
  }

  private async generateViewSlices(): Promise<void> {
    await generateViewSlicesUtil(
      this.configs,
      this.getGraphDataForSlices.bind(this)
    );
  }

  private async getGraphDataForSlices(): Promise<any> {

    const graphData = this.graphManager.getGraphData();
    if (!graphData) {
      throw new Error('No graph data available for generating view slices');
    }
    return graphData;
  }

  // Note: Slice creation is now handled by view-specific slice functions
  // or by passing the entire graph data to the view component
  // The view component is responsible for filtering what it needs

  private getViewsModulePath(): string {
    // Return the path to the views module relative to the project root
    const projectRoot = process.cwd();
    return join(projectRoot, 'src', 'views');
  }

}
