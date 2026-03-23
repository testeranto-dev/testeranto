import fs, { existsSync, mkdirSync } from "fs";
import path, { join } from "path";
import chokidar from "chokidar";
import { Server_Docker } from "./Server_Docker";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { processTestResultIntoTree } from "./Server_Http/processTestResultIntoTree";
import { findNodeInTree } from "./StakeholderUtils";
import { addFileToTree } from "./utils/addFileToTree";
import { addSourceFilesToTree } from "./utils/addSourceFilesToTree";
import { addTestResultsToSourceFiles } from "./utils/addTestResultsToSourceFiles";
import { addTestResultStructureToNode } from "./utils/addTestResultStructureToNode";
import { collectTestResults } from "./utils/collectTestResults";
import { embedConfigInHtml } from "./utils/embedConfigInHtml";
import { extractLocalFilePath } from "./utils/extractLocalFilePath";
import { findSourceFileForTest } from "./utils/findSourceFileForTest";
import { generateFeatureTree } from "./utils/generateFeatureTree";
import { getConfigsData } from "./utils/getConfigsData";
import { getDocumentationData } from "./utils/getDocumentationData";
import { getDocumentationFilesFromGlob } from "./utils/getDocumentationFilesFromGlob";
import { getTestEntrypoints } from "./utils/getTestEntrypoints";
import { getTestResultsData } from "./utils/getTestResultsData";
import { isLocalFileUrl } from "./utils/isLocalFileUrl";

// Note: HTML and TypeScript files are now created in embedConfigInHtml()
// to ensure they always have the latest embedded configuration

export class Server extends Server_Docker {
  private documentationWatcher: chokidar.FSWatcher | null = null;
  private documentationFiles: Set<string> = new Set();

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  private async embedConfigInHtml(): Promise<void> {
    return embedConfigInHtml(this.configs);
  }

  private getDocumentationFilesFromGlob(): string[] {
    return getDocumentationFilesFromGlob(this.configs?.documentationGlob);
  }

  async start(): Promise<void> {
    // First, ensure the HTML file exists with embedded config
    await this.embedConfigInHtml();

    // Log config structure for debugging
    console.log(`[Server] Config structure:`);
    if (this.configs && this.configs.runtimes) {
      for (const [configKey, runtimeConfig] of Object.entries(
        this.configs.runtimes,
      )) {
        const config = runtimeConfig as any;
        console.log(`  ${configKey}:`);
        console.log(`    runtime: ${config.runtime}`);
        console.log(`    tests (${config.tests?.length || 0}):`);
        if (config.tests) {
          config.tests.forEach((test: string, i: number) => {
            console.log(`      ${i}: "${test}"`);
          });
        }
      }
    }

    // Then start the parent server
    await super.start();

    if (this.configs.documentationGlob) {
      console.log(
        `[Server] Documentation glob pattern: ${this.configs.documentationGlob}`,
      );
    } else {
      console.log("[Server] No documentationGlob configured in configs");
    }
  }

  private async generateStaticDataFile(): Promise<void> {
    const reportsDir = join(process.cwd(), "testeranto", "reports");

    // Collect all necessary data
    const data = {
      documentation: await this.getDocumentationData(),
      testResults: await this.getTestResultsData(),
      configs: this.getConfigsData(),
      timestamp: new Date().toISOString(),
      workspaceRoot: process.cwd(),
      // Generate the comprehensive feature tree
      featureTree: await this.generateFeatureTree(),
    };

    // Write to static file
    const dataPath = join(reportsDir, "data.json");
    await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2));
    console.log(`[Server] Static data file written to ${dataPath}`);
  }

  private async generateFeatureTree(): Promise<any> {
    return generateFeatureTree(this.configs);
  }

  private addFileToTree(tree: any, filePath: string, type: string): void {
    addFileToTree(tree, filePath, type);
  }

  private async processTestResultIntoTree(
    tree: any,
    testKey: string,
    testResult: any,
  ): Promise<void> {
    return processTestResultIntoTree(tree, testKey, testResult, this.configs);
  }

  private findNodeInTree(tree: any, path: string): any | null {
    return findNodeInTree(tree, path);
  }

  private isLocalFileUrl(feature: string): boolean {
    return isLocalFileUrl(feature);
  }

  private extractLocalFilePath(feature: string): string | null {
    return extractLocalFilePath(feature);
  }

  private async getDocumentationData(): Promise<any> {
    return getDocumentationData(this.configs);
  }

  private async addSourceFilesToTree(tree: any): Promise<void> {
    return addSourceFilesToTree(tree, this.configs);
  }

  private getTestEntrypoints(): string[] {
    return getTestEntrypoints(this.configs);
  }

  private async addTestResultsToSourceFiles(tree: any): Promise<void> {
    return addTestResultsToSourceFiles(tree, this.configs);
  }

  private async collectTestResults(): Promise<Record<string, any>> {
    const reportsDir = join(process.cwd(), "testeranto", "reports");
    return collectTestResults(reportsDir);
  }

  private findSourceFileForTest(testKey: string): string | null {
    return findSourceFileForTest(testKey, this.configs);
  }

  private async addTestResultStructureToNode(
    node: any,
    testData: any,
  ): Promise<void> {
    await addTestResultStructureToNode(node, testData);
  }

  private async getTestResultsData(): Promise<any> {
    return getTestResultsData();
  }

  private getConfigsData(): any {
    return getConfigsData(this.configs);
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  // Add a method to get the feature tree
  public async getFeatureTree(): Promise<any> {
    return await this.generateFeatureTree();
  }
}
