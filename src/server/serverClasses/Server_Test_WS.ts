import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { updateGraphWithInputFilesPure } from "./utils/updateGraphWithInputFilesPure";
import { getAiderProcessesPure } from "./Server_Test_WS_utils/getAiderProcessesPure";
import { Server_WS_HTTP } from "./Server_WS_HTTP";
import {
  getInputFilesHelper, getOutputFilesHelper, getTestResultsHelper, getProcessSummaryHelper
} from "./Server_Test_WS_utils/testManagerHelpers";
import type { GraphUpdate } from "../../graph";
import { checkFilesLockedUtil } from "./Server_Test_WS_utils/checkFilesLockedUtil";
import { createTestManagerComponentsUtil } from "./Server_Test_WS_utils/createTestManagerComponentsUtil";
import { addProcessNodeUtil } from "./Server_Test_WS_utils/addProcessNodeUtil";

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

  public abstract launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void>;

  public abstract launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void>;

  public abstract launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void>;

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

  public getTestManager(): any {
    // Return a test manager object with required methods
    // This is a stub implementation to prevent the error
    return {
      // Add any required methods here
    };
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
    return checkFilesLockedUtil(this);
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
    console.log(`[addProcessNodeToGraph] Adding process node: ${processType}, ${runtime}, ${testName}, ${configKey}`);

    // Convert IRunTime to string
    const runtimeString = runtime as string;

    // Create process node operations using the proper utility function
    const operations = addProcessNodeUtil(
      processType,
      runtimeString,
      testName,
      configKey,
      configValue,
      status || 'running'
    );

    console.log(`[addProcessNodeToGraph] Generated ${operations.length} operations`);

    if (operations.length > 0) {
      const update: GraphUpdate = {
        operations,
        timestamp: new Date().toISOString()
      };
      console.log(`[addProcessNodeToGraph] Applying update to graph...`);
      try {
        // Use this directly instead of this.graphManager
        const result = this.applyUpdate(update);
        console.log(`[addProcessNodeToGraph] Update applied, result:`, result ? 'has result' : 'no result');
      } catch (error) {
        console.error(`[addProcessNodeToGraph] Error applying update:`, error);
      }
    }

    // Ensure graph is saved immediately
    console.log(`[addProcessNodeToGraph] Saving graph...`);
    try {
      this.saveGraph();
      console.log(`[addProcessNodeToGraph] Graph saved`);
    } catch (error) {
      console.error(`[addProcessNodeToGraph] Error saving graph:`, error);
    }

    // Notify clients about the update
    this.resourceChanged('/~/process');
    this.resourceChanged('/~/graph');
    console.log(`[addProcessNodeToGraph] Resource change notifications sent`);
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
