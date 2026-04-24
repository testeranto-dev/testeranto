import matter from "gray-matter";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../graph";
import { Server_Runtime } from "./Server_Runtime";
import { createFolderNodesAndEdges } from "../utils/createFolderNodesAndEdges";

export abstract class Server_Files extends Server_Runtime {
  protected inputFileWatchers: Map<string, () => void> = new Map();
  protected testResultWatchers: Map<string, () => void> = new Map();
  protected featureFileWatchers: Map<string, () => void> = new Map();

  protected abstract get graph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>;

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot: string,
    resourceChangedCallback: (path: string) => void,
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  protected abstract watchFile(path: string, callback: (event: string) => void): () => void;
  protected abstract unwatchFile(path: string): void;
  protected abstract readFile(path: string): Promise<string>;
  protected abstract fileExists(path: string): Promise<boolean>;
  protected abstract readdir(path: string): Promise<string[]>;
  protected abstract joinPaths(...paths: string[]): string;
  protected abstract resolvePath(path: string): string;
  protected abstract isAbsolutePath(path: string): boolean;

  protected abstract scheduleTest(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void>;

  protected abstract launchBddTest(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void>;

  protected abstract launchChecks(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void>;

  protected abstract updateGraphWithTestResult(
    configKey: string,
    testName: string,
    testResult: any,
  ): Promise<void>;

  protected async updateGraphWithInputFiles(
    configKey: string,
    testName: string,
    inputFiles: string[],
  ): Promise<void> {
    const entrypointId = `entrypoint:${configKey}:${testName}`;
    const timestamp = new Date().toISOString();

    const graph = this.graph;
    for (const inputFile of inputFiles) {
      const fileNodeId = `file:${inputFile}`;
      const existingFileNode = graph.nodes.find((n: any) => n.id === fileNodeId);

      if (!existingFileNode) {
        graph.nodes.push({
          id: fileNodeId,
          type: { category: 'file', type: 'inputFile' },
          label: inputFile.split('/').pop() || inputFile,
          description: `Input file: ${inputFile}`,
          metadata: {
            filePath: inputFile,
            localPath: inputFile,
            url: `file://${inputFile}`
          },
          timestamp
        });
      }

      const parentFolderId = createFolderNodesAndEdges(graph, inputFile, timestamp);

      if (parentFolderId) {
        const folderEdgeExists = graph.edges.find(
          (e: any) => e.source === parentFolderId && e.target === fileNodeId
        );
        if (!folderEdgeExists) {
          graph.edges.push({
            source: parentFolderId,
            target: fileNodeId,
            attributes: {
              type: { category: 'structural', type: 'locatedIn', directed: true },
              timestamp
            }
          });
        }
      }

      const entrypointToFileEdgeExists = graph.edges.find(
        (e: any) => e.source === entrypointId && e.target === fileNodeId
      );
      if (!entrypointToFileEdgeExists) {
        graph.edges.push({
          source: entrypointId,
          target: fileNodeId,
          attributes: {
            type: { category: 'association', type: 'associatedWith', directed: true },
            timestamp
          }
        });
      }
    }
  }

  protected abstract updateFeatureNode(
    featurePath: string,
    frontmatter: any,
  ): Promise<void>;

  protected abstract startDockerProcess(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void>;

  protected async startFileWatching(): Promise<void> {
    for (const [configKey] of Object.entries(this.configs.runtimes)) {
      const inputFilePath = this.joinPaths(
        this.projectRoot,
        "testeranto",
        "bundles",
        configKey,
        "inputFiles.json",
      );

      if (!(await this.fileExists(inputFilePath))) {
        continue;
      }

      const unwatch = this.watchFile(inputFilePath, async () => {
        await this.handleInputFileChange(configKey, inputFilePath);
      });
      this.inputFileWatchers.set(configKey, unwatch);
    }
  }

  protected async stopFileWatching(): Promise<void> {
    for (const unwatch of this.inputFileWatchers.values()) {
      unwatch();
    }
    this.inputFileWatchers.clear();

    for (const unwatch of this.testResultWatchers.values()) {
      unwatch();
    }
    this.testResultWatchers.clear();

    for (const unwatch of this.featureFileWatchers.values()) {
      unwatch();
    }
    this.featureFileWatchers.clear();
  }

  protected async handleInputFileChange(
    configKey: string,
    inputFilePath: string,
  ): Promise<void> {
    if (!(await this.fileExists(inputFilePath))) {
      return;
    }

    const content = await this.readFile(inputFilePath);
    const allTestsInfo = JSON.parse(content);

    const configValue = this.configs.runtimes[configKey];
    const runtime = configValue.runtime;
    const tests = configValue.tests;

    for (const testName of tests) {
      const testInfo = allTestsInfo[testName];
      if (!testInfo) {
        continue;
      }

      const newHash = testInfo.hash;
      const oldHash = this.getStoredHash(configKey, testName);

      if (newHash !== oldHash) {
        this.setStoredHash(configKey, testName, newHash);

        const inputFiles = testInfo.files;
        await this.updateGraphWithInputFiles(configKey, testName, inputFiles);

        // Also add edges from the test node to each input file
        const testNodeId = `test:${configKey}:${testName}`;
        const timestamp = new Date().toISOString();
        for (const inputFile of inputFiles) {
          const fileNodeId = `file:${inputFile}`;
          const edgeExists = this.graph.edges.find(
            (e: any) => e.source === testNodeId && e.target === fileNodeId
          );
          if (!edgeExists) {
            this.graph.edges.push({
              source: testNodeId,
              target: fileNodeId,
              attributes: {
                type: { category: 'association', type: 'associatedWith', directed: true },
                timestamp,
              },
            });
          }
        }

        await this.scheduleTest(runtime, testName, configKey, configValue);
      }
    }
  }

  protected async handleTestResultChange(
    configKey: string,
    testName: string,
    testsJsonPath: string,
  ): Promise<void> {
    if (!(await this.fileExists(testsJsonPath))) {
      return;
    }

    const content = await this.readFile(testsJsonPath);
    const testResult = JSON.parse(content);

    await this.updateGraphWithTestResult(configKey, testName, testResult);

    const individualResults = testResult.individualResults || [];
    const features: string[] = [];
    for (const individualResult of individualResults) {
      const resultFeatures = individualResult.features || [];
      for (const feature of resultFeatures) {
        if (typeof feature === "string" && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }

    for (const feature of features) {
      if (feature.startsWith("http://") || feature.startsWith("https://")) {
        continue;
      }

      const absoluteFeaturePath = this.resolvePath(feature);

      if (this.featureFileWatchers.has(absoluteFeaturePath)) {
        continue;
      }

      const unwatch = this.watchFile(absoluteFeaturePath, async () => {
        await this.handleFeatureFileChange(absoluteFeaturePath);
      });
      this.featureFileWatchers.set(absoluteFeaturePath, unwatch);
    }

    const watcherKey = `${configKey}:${testName}`;
    if (!this.testResultWatchers.has(watcherKey)) {
      const unwatch = this.watchFile(testsJsonPath, async () => {
        await this.handleTestResultChange(configKey, testName, testsJsonPath);
      });
      this.testResultWatchers.set(watcherKey, unwatch);
    }
  }

  protected async handleFeatureFileChange(featurePath: string): Promise<void> {
    if (!(await this.fileExists(featurePath))) {
      return;
    }

    const content = await this.readFile(featurePath);
    const { data: frontmatter } = matter(content);

    if (frontmatter) {
      await this.updateFeatureNode(featurePath, frontmatter);
    }
  }

  private storedHashes: Map<string, Map<string, string>> = new Map();

  private getStoredHash(configKey: string, testName: string): string | undefined {
    return this.storedHashes.get(configKey)?.get(testName);
  }

  private setStoredHash(configKey: string, testName: string, hash: string): void {
    if (!this.storedHashes.has(configKey)) {
      this.storedHashes.set(configKey, new Map());
    }
    this.storedHashes.get(configKey)!.set(testName, hash);
  }
}
