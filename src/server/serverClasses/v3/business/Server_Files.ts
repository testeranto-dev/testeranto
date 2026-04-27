import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../graph";
import { Server_Api_Routing } from "./Server_Api_Routing";
import { EventQueue } from "./utils/EventQueue";

export abstract class Server_Files extends Server_Api_Routing {
  protected inputFileWatchers: Map<string, () => void> = new Map();
  protected testResultWatchers: Map<string, () => void> = new Map();
  protected featureFileWatchers: Map<string, () => void> = new Map();

  protected fileEventQueue: EventQueue<{ configKey: string; inputFilePath: string }> = new EventQueue();

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
  protected abstract mkdir(path: string, recursive?: boolean): Promise<void>;
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

  // Graph manipulation methods removed.
  // File events are now handled by the file events watcher in Server_DockerCompose,
  // which produces GraphOperation objects and calls applyUpdate.
  // This follows the same pattern as the Docker events watcher.

  // Docker processes are now started by the Docker events watcher.
  // No need to manually start them from here.

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
        this.fileEventQueue.push({ configKey, inputFilePath });
      });
      this.inputFileWatchers.set(configKey, unwatch);
    }

    // Start draining the file event queue periodically
    setInterval(() => {
      this.fileEventQueue.drain(async (event) => {
        await this.handleInputFileChange(event.configKey, event.inputFilePath);
      });
    }, 500);
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

        // Graph manipulation is now handled by the file events watcher
        // which watches testeranto/bundles/{configKey}/inputFiles.json
        // and produces GraphOperation objects via handleFileEventUtil.
        // Only schedule the test here.
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

    // Graph manipulation (output file node, edge, test node update) is now handled
    // by the file events watcher which watches testeranto/reports/{configKey}/{testName}/tests.json
    // and produces GraphOperation objects via handleFileEventUtil.
    // Only process features here.

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

  // Feature file changes are now handled by the file events watcher
  // which watches documentation files and produces GraphOperation objects
  // via handleFileEventUtil.

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
