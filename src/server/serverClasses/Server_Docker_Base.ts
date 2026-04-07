import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
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
import { makeReportDirectory, spawnPromise } from "./Server_Docker/utils";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { Server_TestManager } from "./Server_TestManager";
import { Server_WS } from "./Server_WS";

export abstract class Server_Docker_Base extends Server_WS {
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected testManager: Server_TestManager;
  protected builderServicesManager: BuilderServicesManager;
  protected aiderImageBuilder: AiderImageBuilder;
  protected failedBuilderConfigs: Set<string> = new Set();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);

    this.testManager = new Server_TestManager(
      configs,
      mode,
      (path) => this.resourceChanged(path),
      () => this.getProcessSummary(),
      consoleLog,
      consoleError,
      consoleWarn,
      processCwd
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

    // In unified approach, broadcast graph updates instead
    // TODO This should be defined in API 
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
    return this.testManager.getInputFiles(runtime, testName);
  };

  public getOutputFiles = (runtime: string, testName: string): string[] => {
    return this.testManager.getOutputFiles(runtime, testName);
  };

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    return this.testManager.getTestResults(runtime, testName);
  };

  public getProcessSummary = (): any => {
    const processSummary = this.testManager.getProcessSummary();
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
    console.log(`[Server_Docker_Base] Getting log URLs for process ${processId}`);
    
    // Get the graph manager
    const graphManager = this.graphManager?.getGraphManager();
    if (!graphManager) {
      throw new Error('Graph manager not available');
    }
    
    const graph = graphManager.getGraphData();
    
    // Find the process node
    const processNode = graph.nodes.find((node: any) => node.id === processId);
    if (!processNode) {
      throw new Error(`Process ${processId} not found in graph`);
    }
    
    // Find all file nodes connected to this process
    const connectedEdges = graph.edges.filter((edge: any) => 
      edge.source === processId
    );
    
    const logUrls: string[] = [];
    
    for (const edge of connectedEdges) {
      const fileNode = graph.nodes.find((node: any) => node.id === edge.target);
      if (fileNode && fileNode.type === 'file') {
        const metadata = fileNode.metadata || {};
        const url = metadata.url || `file://${metadata.filePath || metadata.localPath}`;
        
        if (url) {
          logUrls.push(url);
        }
      }
    }
    
    // If no URLs found, return the process metadata
    if (logUrls.length === 0) {
      const metadata = processNode.metadata || {};
      logUrls.push(
        `Process: ${processId}`,
        `Type: ${processNode.type}`,
        `Status: ${metadata.status || 'unknown'}`,
        `Container: ${metadata.containerId || 'none'}`,
        `Service: ${metadata.serviceName || 'none'}`,
        `No log files connected in graph`
      );
    }
    
    return logUrls;
  };

  public getAiderProcesses(): any[] {
    return this.testManager.getAiderProcesses();
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
      serverHttp.graphManager?.getGraphManager ? serverHttp.graphManager.getGraphManager() : null
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

  // Delegate to test manager
  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await this.testManager.launchBddTest(
      runtime,
      testName,
      configKey,
      configValue,
      this.startServiceLogging,
      () => this.writeConfigForExtension(),
      (this as any).graphManager?.getGraphManager ? (this as any).graphManager.getGraphManager() : null
    );
  }

  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await this.testManager.launchChecks(
      runtime,
      testName,
      configKey,
      configValue,
      this.startServiceLogging,
      () => this.writeConfigForExtension(),
      (this as any).graphManager?.getGraphManager ? (this as any).graphManager.getGraphManager() : null
    );
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    await this.testManager.launchAider(
      runtime,
      testName,
      configKey,
      configValue,
      this.startServiceLogging,
      () => this.writeConfigForExtension(),
      (path) => this.resourceChanged(path),
      (serviceName) => this.getContainerInfo(serviceName),
      (this as any).graphManager?.getGraphManager ? (this as any).graphManager.getGraphManager() : null
    );
  }

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any
  ) {
    consoleLog(`[Server_Docker_Base] Input files changed for ${testName}, updating aider`);
    await this.launchAider(runtime, testName, configKey, configValue);
  }

  public getTestManager(): Server_TestManager {
    return this.testManager;
  }

  public async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number
  ): Promise<void> {
    await this.testManager.addProcessNodeToGraph(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null
    );
  }

  // Agents are now created as Docker services at startup, not dynamically
  // This method is kept for compatibility but does nothing
  async createAgent(agentName: string, suffix: string, runtime?: string, testName?: string): Promise<void> {
    console.log(`[Server_Docker_Base] Agents are now created as Docker services at startup. Agent ${agentName} is already running.`);
    // Broadcast updates to relevant slices to refresh the view
    this.resourceChanged('/~/graph');
    this.resourceChanged('/~/aider');
    this.resourceChanged('/~/process');
    this.resourceChanged(`/~/agents/${agentName}`);
  }
}
