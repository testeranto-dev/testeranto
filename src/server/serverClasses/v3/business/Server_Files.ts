import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphOperation } from "../../../../graph";
import { Server_Api_Routing } from "./Server_Api_Routing";
import { EventQueue } from "./utils/EventQueue";
import { parseTestResultVerbs } from "../utils/graph/parseTestResultVerbs";
import { getStoredHash, setStoredHash } from "./utils/storedHashes";
import { writeCompletionMarker } from "./utils/writeCompletionMarker";

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

  protected abstract writeFile(path: string, content: string): Promise<void>;

  protected abstract logBusinessMessage(message: string): void;

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
      const oldHash = getStoredHash(this.storedHashes, configKey, testName);

      if (newHash !== oldHash) {
        setStoredHash(this.storedHashes, configKey, testName, newHash);
        await this.scheduleTest(runtime, testName, configKey, configValue);
      }
    }
  }

  protected async handleTestResultChange(
    configKey: string,
    testName: string,
    testsJsonPath: string,
  ): Promise<void> {
    const content = await this.readFile(testsJsonPath);
    const testResult = JSON.parse(content);

    const verbOperations = parseTestResultVerbs(testResult, configKey, testName);
    this.removeVerbNodesForTest(configKey, testName);

    if (verbOperations.length > 0) {
      this.applyUpdate({
        operations: verbOperations,
        timestamp: new Date().toISOString(),
      });
    }

    const individualResults = testResult.individualResults || []; // fallback for missing field
    const features: string[] = [];
    for (const individualResult of individualResults) {
      const resultFeatures = individualResult.features || []; // fallback for missing field
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

    await writeCompletionMarker(
      this.joinPaths.bind(this),
      this.writeFile.bind(this),
      this.logBusinessMessage.bind(this),
      this.graph,
      configKey,
      testName,
      testResult,
      this.projectRoot,
    );

    const watcherKey = `${configKey}:${testName}`;
    if (!this.testResultWatchers.has(watcherKey)) {
      const unwatch = this.watchFile(testsJsonPath, async () => {
        await this.handleTestResultChange(configKey, testName, testsJsonPath);
      });
      this.testResultWatchers.set(watcherKey, unwatch);
    }
  }

  protected async handleFeatureFileChange(featurePath: string): Promise<void> {
    throw new Error(`handleFeatureFileChange not implemented for ${featurePath}`);
  }

  private storedHashes: Map<string, Map<string, string>> = new Map();
}
