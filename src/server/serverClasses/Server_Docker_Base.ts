import path from 'path';
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { addProcessNodeToGraphPure } from "./Server_Docker/addProcessNodeToGraphPure";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
import { AiderMessageManager } from "./Server_Docker/AiderMessageManager";
import { BuilderServicesManager } from "./Server_Docker/BuilderServicesManager";
import { clearStoredLogs } from "./Server_Docker/clearStoredLogs";
import { createLogFileNodePure } from "./Server_Docker/createLogFileNodePure";
import { getContainerInfo } from "./Server_Docker/getContainerInfo";
import { getReportDirPure } from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { TestCompletionWaiter } from "./Server_Docker/TestCompletionWaiter";
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { TestResultsCollector } from "./Server_Docker/TestResultsCollector";
import { updateGraphWithInputFilesPure } from "./Server_Docker/updateGraphWithInputFilesPure";
import { captureExistingLogs, makeReportDirectory, spawnPromise } from "./Server_Docker/utils";
import { getAiderProcessesPure } from "./Server_Docker/utils/getAiderProcessesPure";
import { launchAiderPure } from "./Server_Docker/utils/launchAiderPure";
import { launchBddTestPure } from "./Server_Docker/utils/launchBddTestPure";
import { launchChecksPure } from "./Server_Docker/utils/launchChecksPure";
import { loadInputFileOnce } from "./Server_Docker/utils/loadInputFileOnce";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { updateOutputFilesList } from "./Server_Docker/utils/updateOutputFilesList";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { watchInputFilePure, watchOutputFilePure } from "./Server_Docker/utils/watch";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { Server_WS } from "./Server_WS";

export abstract class Server_Docker_Base extends Server_WS {
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected aiderProcesses: Map<string, any> = new Map();
  protected testFileManager: TestFileManager;
  protected testResultsCollector: TestResultsCollector;
  protected aiderMessageManager: AiderMessageManager;
  protected builderServicesManager: BuilderServicesManager;
  protected aiderImageBuilder: AiderImageBuilder;
  protected testCompletionWaiter: TestCompletionWaiter;
  protected inputFiles: any;
  protected hashs: any;
  protected outputFiles: any;
  protected failedBuilderConfigs: Set<string> = new Set();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    this.inputFiles = {};
    this.hashs = {};
    this.outputFiles = {};

    if (!this.aiderProcesses) {
      this.aiderProcesses = new Map();
    }
    this.testFileManager = new TestFileManager(configs, mode, (path) =>
      this.resourceChanged(path),
    );

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
      (message: string) => consoleLog(message),
      (message: string, error?: any) => consoleError(message, error),
    );

    // Initialize builder services manager
    this.builderServicesManager = new BuilderServicesManager(
      configs,
      mode,
      (serviceName: string, runtime: string, runtimeConfigKey: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey),
    );

    // Initialize aider image builder
    this.aiderImageBuilder = new AiderImageBuilder(
      (message: string) => consoleLog(message),
      (message: string, error?: any) => consoleError(message, error),
    );
    // Initialize test completion waiter
    this.testCompletionWaiter = new TestCompletionWaiter(
      (message: string) => consoleError(message),
      () => this.getProcessSummary(),
      this.logProcesses,
    );
  }

  async start(): Promise<void> {
    await super.start();
    getReportDirPure();
  }

  public async stop(): Promise<void> {
    // Clear any tracked processes (though there shouldn't be any with the new approach)
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.resourceChanged("/~/processes");
    writeConfigForExtensionOnStop();
    await super.stop();
  }

  async watchOutputFile(
    runtime: IRunTime,
    testName: string,
    configKey: string,
  ) {
    this.outputFiles = watchOutputFilePure(
      configKey,
      testName,
      runtime,
      this.mode,
      this.outputFiles,
      (path) => this.resourceChanged(path),
      updateOutputFilesList,
    );
  }

  protected loadInputFileOnce(
    runtime: IRunTime,
    testName: string,
    configKey: string,
  ): void {
    const result = loadInputFileOnce(
      this.inputFiles,
      this.hashs,
      configKey,
      testName,
      runtime,
      configKey,
    );
    this.inputFiles = result.inputFiles;
    this.hashs = result.hashs;
  }

  async watchInputFile(runtime: IRunTime, testsName: string) {
    const result = await watchInputFilePure(
      runtime,
      testsName,
      this.configs,
      this.mode,
      this.inputFiles,
      this.hashs,
      (inputFiles, hashs) => {
        this.inputFiles = inputFiles;
        this.hashs = hashs;
      },
      (runtime, testName, configKey, configValue) =>
        this.launchBddTest(runtime, testName, configKey, configValue),
      (runtime, testName, configKey, configValue) =>
        this.launchChecks(runtime, testName, configKey, configValue),
      (runtime, testName, configKey, configValue, files) =>
        this.informAider(runtime, testName, configKey, configValue, files),
      () => this.resourceChanged("/~/inputfiles"),
      (runtime, testName, configKey) =>
        this.loadInputFileOnce(runtime, testName, configKey),
      (runtime, testName, configKey, inputFiles) =>
        this.updateGraphWithInputFiles(runtime, testName, configKey, inputFiles),
    );
    this.inputFiles = result.inputFiles;
    this.hashs = result.hashs;
  }

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    consoleLog(`[Server_Docker_Base] Input files changed for ${testName}, updating aider`);

    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );
    // Also launch the aider service when input files change
    await this.launchAider(runtime, testName, configKey, configValue);
  }

  protected async updateGraphWithInputFiles(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    inputFiles: string[],
  ): Promise<void> {
    const serverHttp = this as any;
    await updateGraphWithInputFilesPure(
      runtime,
      testName,
      configKey,
      inputFiles,
      serverHttp.graphManager,
      consoleLog,
      consoleError,
      consoleWarn
    );
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

  // each test has a bdd test to be launched when inputFiles.json changes
  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    consoleLog(`[Server_Docker_Base] Launching BDD test for ${testName}`);

    if (this.failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker_Base] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
      return;
    }

    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );

    // Clear stored logs for all services associated with this test before starting
    // We don't know the exact service names, but startServiceLogging will handle it per service
    // For now, we'll rely on startServiceLogging to clear logs when it's called

    await launchBddTestPure(
      runtime,
      testName,
      configKey,
      configValue,
      (serviceName, runtime, configKey, testName) => {
        // Clear stored logs before capturing existing logs
        this.clearStoredLogs(serviceName, configKey, testName as string);
        return captureExistingLogs(serviceName, runtime, configKey, testName);
      },
      (serviceName, runtime, configKey, testName) =>
        this.startServiceLogging(serviceName, runtime, configKey, testName as string),
      () => this.resourceChanged("/~/processes"),
      () => this.writeConfigForExtension(),
    );

    await this.addProcessNodeToGraph('bdd', runtime, testName, configKey, configValue);
  }

  protected async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number
  ): Promise<void> {
    const serverHttp = this as any;
    await addProcessNodeToGraphPure(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      serverHttp.graphManager,
      consoleLog,
      consoleError,
      consoleWarn
    );
  }

  // each test has zero or more "check" tests to be launched when inputFiles.json changes
  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    consoleLog(`[Server_Docker_Base] Launching checks for ${testName}`);

    if (this.failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker_Base] Skipping checks for ${testName} because builder failed for config ${configKey}`);
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
        this.clearStoredLogs(serviceName, configKey, testName);
        return captureExistingLogs(serviceName, runtime, configKey, testName);
      },
      (serviceName, runtime, configKey, testName) =>
        this.startServiceLogging(serviceName, runtime, configKey, testName),
      () => this.resourceChanged("/~/processes"),
      () => this.writeConfigForExtension(),
    );

    // Add check process nodes to graph
    const checks = configValue.checks || [];
    for (let i = 0; i < checks.length; i++) {
      await this.addProcessNodeToGraph('check', runtime, testName, configKey, configValue, i);
    }
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await launchAiderPure({
      runtime,
      testName,
      configKey,
      configValue,
      failedBuilderConfigs: this.failedBuilderConfigs,
      createAiderMessageFile: this.createAiderMessageFile.bind(this),
      startServiceLogging: this.startServiceLogging,
      resourceChanged: this.resourceChanged.bind(this),
      writeConfigForExtension: this.writeConfigForExtension.bind(this),
      getContainerInfo: this.getContainerInfo.bind(this),
      aiderProcesses: this.aiderProcesses,
      updateGraphWithAiderNode: async (params) => {
        const serverHttp = this as any;
        if (serverHttp.graphManager && typeof serverHttp.graphManager.updateGraphWithAiderNode === 'function') {
          await serverHttp.graphManager.updateGraphWithAiderNode(params);
        } else {
          consoleWarn('[Server_Docker_Base] GraphManager or updateGraphWithAiderNode not available');
        }
      },
    });

    await this.addProcessNodeToGraph('aider', runtime, testName, configKey, configValue);
  }

  protected writeConfigForExtension(): void {
    writeConfigForExtensionPure(
      this.configs,
      this.mode,
      this.getProcessSummary(),
      processCwd(),
    );
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
    const processSummary = this.testResultsCollector.getProcessSummary();

    const buildErrors = (this as any).dockerComposeManager?.getBuildErrors?.();
    if (buildErrors && buildErrors.length > 0) {
      return {
        ...processSummary,
        buildErrors: buildErrors
      };
    }

    return processSummary;
  };

  public getProcessLogs = (processId: string): string[] => {
    // This is a placeholder implementation
    // In a real implementation, you would fetch logs from Docker or a log store
    return [
      `Logs for process ${processId}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Status: Placeholder implementation`,
      `To implement: Fetch actual logs from Docker container or log file`,
    ];
  };

  public getAiderProcesses(): any[] {
    return getAiderProcessesPure({
      aiderProcesses: this.aiderProcesses,
    });
  }

  protected clearStoredLogs(serviceName: string, configKey: string, testName: string): void {
    clearStoredLogs(serviceName, configKey, testName)
  }

  startServiceLogging = async (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
    testName: string,
  ) => {
    // Clear any stored logs for this service
    this.clearStoredLogs(serviceName, runtimeConfigKey, testName);

    // Run logging (captures logs once and exits immediately)
    // We don't need to track processes anymore
    await startServiceLoggingPure(
      serviceName,
      runtime,
      processCwd(),
      this.logProcesses,
      runtimeConfigKey,
      testName,
      (logFilePath, serviceName, runtime, runtimeConfigKey, testName) => {
        this.createLogFileNode(logFilePath, serviceName, runtime, runtimeConfigKey, testName);
      }
    );
    this.writeConfigForExtension();
  };

  protected async createLogFileNode(
    logFilePath: string,
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
    testName?: string
  ): Promise<void> {
    const serverHttp = this as any;
    await createLogFileNodePure(
      logFilePath,
      serviceName,
      runtime,
      runtimeConfigKey,
      testName,
      serverHttp.graphManager
    );
  }

  protected async getContainerInfo(serviceName: string): Promise<any> {
    return getContainerInfo(serviceName)
  }

  protected async waitForBundles(): Promise<Set<string>> {
    return await waitForBundlesPure({
      configs: this.configs,
      // processCwd,
      failedBuilderConfigs: this.failedBuilderConfigs,
      consoleLog,
      consoleWarn,
      maxWaitTime: 30000,
      checkInterval: 500,
    });
  }

  protected makeReportDirectory(testName: string, configKey: string): string {
    return makeReportDirectory(testName, configKey);
  }

  protected async spawnPromise(command: any): Promise<void> {
    return spawnPromise(command);
  }
}
