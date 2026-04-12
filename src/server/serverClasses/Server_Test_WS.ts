import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { updateGraphWithInputFilesPure } from "./Server_Docker/updateGraphWithInputFilesPure";
import { getAiderProcessesPure } from "./Server_Docker/utils/getAiderProcessesPure";
import { Server_WS_HTTP } from "./Server_WS_HTTP";
import {
  createTestManagerComponentsUtil, launchBddTestUtil, launchChecksUtil, launchAiderUtil, addProcessNodeToGraphUtil, checkFilesLockedUtil
} from "./utils/testManagerCoreUtils";
import { getInputFilesHelper, getOutputFilesHelper, getTestResultsHelper, getProcessSummaryHelper } from "./utils/testManagerHelpers";


export abstract class Server_Test_WS extends Server_WS_HTTP {
  protected testFileManager: any;
  protected testResultsCollector: any;
  protected aiderMessageManager: any;
  protected testCompletionWaiter: any;
  protected inputFiles: any;
  protected hashs: any;
  protected outputFiles: any;
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected aiderProcesses: Map<string, any> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);

    const components = createTestManagerComponentsUtil(
      configs,
      mode,
      (path) => this.resourceChanged(path),
      () => this.getProcessSummary(),
      console.log,
      console.error,
      console.warn,
      () => process.cwd()
    );

    this.testFileManager = components.testFileManager;
    this.testResultsCollector = components.testResultsCollector;
    this.aiderMessageManager = components.aiderMessageManager;
    this.testCompletionWaiter = components.testCompletionWaiter;
    this.inputFiles = components.inputFiles;
    this.hashs = components.hashs;
    this.outputFiles = components.outputFiles;
    this.aiderProcesses = components.aiderProcesses;
  }

  protected resourceChanged(path: string): void {
  }

  protected getProcessSummary(): any {
    return {};
  }

  public async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void> {
    await launchBddTestUtil(
      runtime,
      testName,
      configKey,
      configValue,
      this.failedBuilderConfigs,
      (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey, testName),
      () => this.writeConfigForExtension(),
      (path) => this.resourceChanged(path),
      this.graphManager,
      this.createAiderMessageFile.bind(this)
    );
  }

  public async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void> {
    await launchChecksUtil(
      runtime,
      testName,
      configKey,
      configValue,
      this.failedBuilderConfigs,
      (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey, testName),
      () => this.writeConfigForExtension(),
      (path) => this.resourceChanged(path),
      this.graphManager,
      this.createAiderMessageFile.bind(this)
    );
  }

  public async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void> {
    await launchAiderUtil(
      runtime,
      testName,
      configKey,
      configValue,
      this.failedBuilderConfigs,
      this.createAiderMessageFile.bind(this),
      (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey, testName),
      (path) => this.resourceChanged(path),
      () => this.writeConfigForExtension(),
      (serviceName) => this.getContainerInfo(serviceName),
      this.aiderProcesses,
      this.graphManager,
      console.warn
    );
  }

  protected startServiceLogging(serviceName: string, runtime: string, runtimeConfigKey: string, testName: string): Promise<void> {
    return Promise.resolve();
  }

  protected writeConfigForExtension(): void {
  }

  protected getContainerInfo(serviceName: string): Promise<any> {
    return Promise.resolve({});
  }

  protected async createAiderMessageFile(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await this.aiderMessageManager.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );
  }


  public getInputFiles(runtime: string, testName: string): string[] {
    return getInputFilesHelper(this.testResultsCollector, runtime, testName);
  }

  public getOutputFiles(runtime: string, testName: string): string[] {
    return getOutputFilesHelper(this.testResultsCollector, runtime, testName);
  }

  public getTestResults(runtime?: string, testName?: string): any[] {
    return getTestResultsHelper(this.testResultsCollector, runtime, testName);
  }

  public getProcessSummaryFromTestManager(): any {
    return getProcessSummaryHelper(this.testResultsCollector);
  }

  public getAiderProcesses(): any[] {
    return getAiderProcessesPure({
      aiderProcesses: this.aiderProcesses,
    });
  }

  public getTestFileManager(): any {
    return this.testFileManager;
  }

  public getTestResultsCollector(): any {
    return this.testResultsCollector;
  }

  public setFailedBuilderConfigs(failedConfigs: Set<string>) {
    this.failedBuilderConfigs = failedConfigs;
  }

  public getFailedBuilderConfigs(): Set<string> {
    return this.failedBuilderConfigs;
  }

  public async isFilesLocked(): Promise<boolean> {
    return checkFilesLockedUtil(this.graphManager);
  }

  public async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ): Promise<void> {
    await addProcessNodeToGraphUtil(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      this.graphManager,
      console.log,
      console.error,
      console.warn,
      status
    );
  }

  async updateGraphWithInputFiles(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    inputFiles: string[],
    graphManager: any
  ): Promise<void> {
    await updateGraphWithInputFilesPure(
      runtime,
      testName,
      configKey,
      inputFiles,
      graphManager,
      console.log,
      console.error,
      console.warn
    );
  }

  async launchAgent(agentName: string, suffix: string): Promise<void> {
    console.log(`[Server_TestManagerBase] Agents are now created as Docker services at startup. Agent ${agentName} is already running.`);
  }
}
