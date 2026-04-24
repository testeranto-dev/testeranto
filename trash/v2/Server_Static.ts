import type { ITesterantoConfig } from "../../src/Types";
import type { IMode } from "../../src/server/types";
import { generateViewHtml, generateViewsIndexHtml } from './static/viewHtml';
import { generateViewBundleUtil } from './static/generateViewBundleUtil';
import { generateViewSlicesUtil } from './static/generateViewSlicesUtil';
import { generateViewHtmlFilesUtil } from './static/generateViewHtmlFilesUtil';
import { createErrorBundleUtil } from "./static/createErrorBundleUtil";
import { Server_Vscode } from "./Server_Vscode";

export class Server_Static extends Server_Vscode {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    console.log(`[Server] start()`)
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
      this.getGraphData.bind(this)
    );
  }

  private async getGraphDataForSlices(): Promise<any> {
    return this.getGraphData();
  }

  // Note: Slice creation is now handled by view-specific slice functions
  // or by passing the entire graph data to the view component
  // The view component is responsible for filtering what it needs

  // private getViewsModulePath(): string {
  //   // Return the path to the views module relative to the project root
  //   const projectRoot = process.cwd();
  //   return join(projectRoot, 'src', 'views');
  // }

}
