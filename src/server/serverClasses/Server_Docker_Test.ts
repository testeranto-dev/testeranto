import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
import { BuilderServicesManager } from "./Server_Docker/BuilderServicesManager";
import { clearStoredLogs } from "./Server_Docker/clearStoredLogs";
import { createLogFileNodePure } from "./Server_Docker/createLogFileNodePure";
import { getContainerInfo } from "./Server_Docker/getContainerInfo";
import { getAiderServiceName, getBddServiceName, getReportDirPure } from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { makeReportDirectory, spawnPromise } from "./Server_Docker/utils";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { Server_Test_WS } from "./Server_Test_WS";
import { getBaseServiceName } from "./utils/dockerServiceUtils";
import { startDockerServiceUtil, restartDockerServiceUtil } from "./utils/dockerCommandUtils";
import { launchBddTestDockerUtil, launchChecksDockerUtil, launchAiderDockerUtil, informAiderDockerUtil } from "./utils/dockerServiceMethodsUtils";
import { getProcessLogsUtil } from "./utils/processLogsUtils";
import { getProcessSummaryHelper } from "./utils/testManagerHelpers";
import { startServiceLoggingUtil } from "./utils/startServiceLoggingUtil";

export abstract class Server_Docker_Test extends Server_Test_WS {
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected builderServicesManager: BuilderServicesManager;
  protected aiderImageBuilder: AiderImageBuilder;
  protected failedBuilderConfigs: Set<string> = new Set();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);

    // Initialize builder services manager
    this.builderServicesManager = new BuilderServicesManager(
      configs,
      mode,
      (serviceName: string, runtime: string, runtimeConfigKey: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey),
    );

    // Initialize aider image builder
    this.aiderImageBuilder = new AiderImageBuilder(
      consoleLog,
      consoleError,
    );
  }

  async start(): Promise<void> {
    await super.start();
    getReportDirPure();
  }

  public async stop(): Promise<void> {
    // Clear any tracked processes
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.resourceChanged("/~/graph");
    writeConfigForExtensionOnStop();
    await super.stop();
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
    return super.getInputFiles(runtime, testName);
  };

  public getOutputFiles = (runtime: string, testName: string): string[] => {
    return super.getOutputFiles(runtime, testName);
  };

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    return super.getTestResults(runtime, testName);
  };

  public getProcessSummary = (): any => {
    return getProcessSummaryHelper(
      this.testResultsCollector,
      (this as any).dockerComposeManager
    );
  };

  public getProcessLogs = (processId: string): string[] => {
    const graphManager = this.getGraphManager();
    return getProcessLogsUtil(processId, graphManager);
  };

  public getAiderProcesses(): any[] {
    return super.getAiderProcesses();
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
    await startServiceLoggingUtil(
      serviceName,
      runtime,
      runtimeConfigKey,
      testName,
      this.clearStoredLogs.bind(this),
      startServiceLoggingPure,
      createLogFileNodePure,
      processCwd,
      this.graphManager,
      this.writeConfigForExtension.bind(this)
    );
  };

  protected async createLogFileNode(
    logFilePath: string,
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
    testName?: string
  ): Promise<void> {
    await createLogFileNodePure(
      logFilePath,
      serviceName,
      runtime,
      runtimeConfigKey,
      testName,
      this.graphManager
    );
    // Graph updates will be broadcast via /~/graph
  }

  protected async getContainerInfo(serviceName: string): Promise<any> {
    return getContainerInfo(serviceName)
  }

  protected async waitForBundles(): Promise<Set<string>> {
    return await waitForBundlesPure({
      configs: this.configs,
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

  // Delegate to parent implementation
  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await launchBddTestDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getBddServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await launchChecksDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getBaseServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await launchAiderDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getAiderServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any
  ) {
    await informAiderDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getAiderServiceName.bind(this),
      this.restartDockerService.bind(this),
      consoleLog,
      consoleError,
      files
    );
  }

  private getBddServiceName(configKey: string, testName: string): string {
    return getBddServiceName(configKey, testName);
  }

  private getAiderServiceName(configKey: string, testName: string): string {
    return getAiderServiceName(configKey, testName);
  }

  private getBaseServiceName(configKey: string, testName: string): string {
    return getBaseServiceName(configKey, testName);
  }

  private async startDockerService(serviceName: string): Promise<void> {
    await startDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  private async restartDockerService(serviceName: string): Promise<void> {
    await restartDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  public getTestManager(): any {
    // Return this instance since test manager functionality is now integrated
    return this;
  }

  public async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number
  ): Promise<void> {
    await super.addProcessNodeToGraph(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex
    );
  }

  /**
   * Agents are now started via docker-compose at server startup
   * This method is kept for compatibility but returns a simple response
   */
  async startAgent(agentName: string): Promise<{ success: boolean; message: string; containerId?: string }> {
    return {
      success: true,
      message: `Agent ${agentName} is already running (started at server startup)`
    };
  }
}
