import path from 'path';
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { GraphManager } from '../graph';
import { LockManager } from '../graph/lockManager';
import type { IMode } from "../types";
import { addProcessNodeToGraphPure } from "./Server_Docker/addProcessNodeToGraphPure";
import { AiderMessageManager } from "./Server_Docker/AiderMessageManager";
import { clearStoredLogs } from "./Server_Docker/clearStoredLogs";
import { TestCompletionWaiter } from "./Server_Docker/TestCompletionWaiter";
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { TestResultsCollector } from "./Server_Docker/TestResultsCollector";
import { updateGraphWithInputFilesPure } from "./Server_Docker/updateGraphWithInputFilesPure";
import { captureExistingLogs } from "./Server_Docker/utils";
import { getAiderProcessesPure } from "./Server_Docker/utils/getAiderProcessesPure";
import { launchAiderPure } from "./Server_Docker/utils/launchAiderPure";
import { launchBddTestPure } from "./Server_Docker/utils/launchBddTestPure";
import { launchChecksPure } from "./Server_Docker/utils/launchChecksPure";

export class Server_TestManager {
  protected testFileManager: TestFileManager;
  protected testResultsCollector: TestResultsCollector;
  protected aiderMessageManager: AiderMessageManager;
  protected testCompletionWaiter: TestCompletionWaiter;
  protected inputFiles: any;
  protected hashs: any;
  protected outputFiles: any;
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected aiderProcesses: Map<string, any> = new Map();

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected resourceChanged: (path: string) => void,
    getProcessSummary: () => any,
    protected consoleLog: (message: string) => void,
    protected consoleError: (message: string, error?: any) => void,
    protected consoleWarn: (message: string) => void,
    protected processCwd: () => string
  ) {
    this.inputFiles = {};
    this.hashs = {};
    this.outputFiles = {};

    if (!this.aiderProcesses) {
      this.aiderProcesses = new Map();
    }
    this.testFileManager = new TestFileManager(configs, mode, resourceChanged);

    this.testResultsCollector = new TestResultsCollector(
      configs,
      mode,
      this.testFileManager.inputFiles,
      this.testFileManager.outputFiles,
    );

    this.aiderMessageManager = new AiderMessageManager(
      configs,
      mode,
      (configKey: string, testName: string) =>
        this.testFileManager.getInputFilesForTest(configKey, testName),
      (configKey: string, testName: string) =>
        this.testFileManager.getOutputFilesForTest(configKey, testName),
      consoleLog,
      consoleError,
    );

    this.testCompletionWaiter = new TestCompletionWaiter(
      consoleError,
      getProcessSummary,
      this.logProcesses,
    );
  }

  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
    writeConfigForExtension: () => void,
    graphManager?: any
  ) {
    const lockManager = new LockManager(graphManager.graph);

    // Check if any file nodes are locked by system restart
    if (lockManager.hasLockedFiles()) {
      this.consoleLog(`[Server_TestManager] Skipping BDD test ${testName} because files are locked for restart`);
      return;
    }

    if (this.failedBuilderConfigs.has(configKey)) {
      this.consoleLog(`[Server_TestManager] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
      return;
    }

    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );

    await launchBddTestPure(
      runtime,
      testName,
      configKey,
      configValue,
      (serviceName, runtime, configKey, testName) => {
        clearStoredLogs(serviceName, configKey, testName as string);
        return captureExistingLogs(serviceName, runtime, configKey, testName);
      },
      (serviceName, runtime, configKey, testName) =>
        startServiceLogging(serviceName, runtime, configKey, testName as string),
      // In unified approach, broadcast graph updates instead
      // TODO This should be defined in API 
      () => this.resourceChanged("/~/graph"),
      writeConfigForExtension,
    );

    await this.addProcessNodeToGraph('bdd', runtime, testName, configKey, configValue, undefined, graphManager);
  }

  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
    writeConfigForExtension: () => void,
    graphManager?: any
  ) {
    this.consoleLog(`[Server_TestManager] Launching checks for ${testName}`);

    // Check if files are locked before running checks
    if (graphManager && graphManager.graph) {

      const lockManager = new LockManager(graphManager.graph);

      // Check if any file nodes are locked by system restart
      if (lockManager.hasLockedFiles()) {
        this.consoleLog(`[Server_TestManager] Skipping checks for ${testName} because files are locked for restart`);
        return;
      }
    }

    if (this.failedBuilderConfigs.has(configKey)) {
      this.consoleLog(`[Server_TestManager] Skipping checks for ${testName} because builder failed for config ${configKey}`);
      return;
    }

    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );

    await launchChecksPure(
      runtime,
      testName,
      configKey,
      configValue,
      (serviceName, runtime, configKey, testName) => {
        clearStoredLogs(serviceName, configKey, testName);
        return captureExistingLogs(serviceName, runtime, configKey, testName);
      },
      (serviceName, runtime, configKey, testName) =>
        startServiceLogging(serviceName, runtime, configKey, testName),
      // In unified approach, broadcast graph updates instead
      () => this.resourceChanged("/~/graph"),
      writeConfigForExtension,
    );

    const checks = configValue.checks || [];
    for (let i = 0; i < checks.length; i++) {
      await this.addProcessNodeToGraph('check', runtime, testName, configKey, configValue, i, graphManager);
    }
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
    writeConfigForExtension: () => void,
    resourceChanged: (path: string) => void,
    getContainerInfo: (serviceName: string) => Promise<any>,
    graphManager: GraphManager
  ) {
    const lockManager = new LockManager(graphManager);

    // Check if any file nodes are locked by system restart
    if (lockManager.hasLockedFiles()) {
      this.consoleLog(`[Server_TestManager] Skipping aider for ${testName} because files are locked for restart`);
      return;
    }
    await launchAiderPure({
      runtime,
      testName,
      configKey,
      configValue,
      failedBuilderConfigs: this.failedBuilderConfigs,
      createAiderMessageFile: this.createAiderMessageFile.bind(this),
      startServiceLogging: startServiceLogging,
      resourceChanged: resourceChanged,
      writeConfigForExtension: writeConfigForExtension,
      getContainerInfo: getContainerInfo,
      aiderProcesses: this.aiderProcesses,
      updateGraphWithAiderNode: async (params) => {
        if (graphManager && typeof graphManager.updateGraphWithAiderNode === 'function') {
          await graphManager.updateGraphWithAiderNode(params);
        } else {
          this.consoleWarn('[Server_TestManager] GraphManager or updateGraphWithAiderNode not available');
        }
      },
    });

    await this.addProcessNodeToGraph('aider', runtime, testName, configKey, configValue, undefined, graphManager);
    // Graph updates will be broadcast via /~/graph
  }

  public async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    graphManager?: any
  ): Promise<void> {
    await addProcessNodeToGraphPure(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      graphManager,
      this.consoleLog,
      this.consoleError,
      this.consoleWarn
    );
    // Graph updates will be broadcast via /~/graph
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
      this.consoleLog,
      this.consoleError,
      this.consoleWarn
    );
    // Note: Slice notifications should be handled by the caller
    // since this method specifically updates file nodes
  }

  public getInputFiles = (runtime: string, testName: string): string[] => {
    return this.testResultsCollector.getInputFiles(runtime, testName);
  };

  public getOutputFiles = (runtime: string, testName: string): string[] => {
    const result = this.testResultsCollector.getOutputFiles(runtime, testName);
    const outputDir = path.join(
      process.cwd(),
      "testeranto",
      "reports",
      runtime,
    );
    return result || [];
  };

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    return this.testResultsCollector.getTestResults(runtime, testName);
  };

  public getProcessSummary = (): any => {
    if (this.testResultsCollector && typeof this.testResultsCollector.getProcessSummary === 'function') {
      return this.testResultsCollector.getProcessSummary();
    }
    return {};
  };

  public getAiderProcesses(): any[] {
    return getAiderProcessesPure({
      aiderProcesses: this.aiderProcesses,
    });
  }

  public getTestFileManager(): TestFileManager {
    return this.testFileManager;
  }

  public getTestResultsCollector(): TestResultsCollector {
    return this.testResultsCollector;
  }

  public setFailedBuilderConfigs(failedConfigs: Set<string>) {
    this.failedBuilderConfigs = failedConfigs;
  }

  public getFailedBuilderConfigs(): Set<string> {
    return this.failedBuilderConfigs;
  }

  /**
   * Check if files are locked (system in restart mode)
   * @param graphManager The graph manager instance
   * @returns boolean indicating if files are locked
   */
  public async isFilesLocked(graphManager?: any): Promise<boolean> {
    const lockManager = new LockManager(graphManager.graph);
    return lockManager.hasLockedFiles();
  }

  // Agents are now created as Docker services at startup, not dynamically
  // This method is kept for compatibility but does nothing
  async launchAgent(agentName: string, suffix: string): Promise<void> {
    console.log(`[Server_TestManager] Agents are now created as Docker services at startup. Agent ${agentName} is already running.`);
  }
}
