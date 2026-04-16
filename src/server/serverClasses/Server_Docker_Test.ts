import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Aider } from "./Server_Aider";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
import { BuilderServicesManager } from "./Server_Docker/BuilderServicesManager";
import { clearStoredLogs } from "./Server_Docker/clearStoredLogs";
import { createLogFileNodePure } from "./Server_Docker/createLogFileNodePure";
import { getBaseServiceName } from "./Server_Docker/dockerServiceUtils";
import { getAiderServiceName, getBddServiceName } from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  execSyncWrapper,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { makeReportDirectory, spawnPromise } from "./Server_Docker/utils";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { generateAiderUpdatesPure } from "./Server_Docker_Test_utils/generateAiderUpdatesPure";
import { generateChecksUpdatesPure } from "./Server_Docker_Test_utils/generateChecksUpdatesPure";
import { getContainerInfoUtil } from "./Server_Docker_Test_utils/getContainerInfoUtil";
import { handleTestCompletedPure } from "./Server_Docker_Test_utils/handleTestCompletedUtil";
import { informAiderDockerUtil } from "./Server_Docker_Test_utils/informAiderDockerUtil";
import { getProcessLogsUtil } from "./Server_Docker_Test_utils/processLogsUtils";
import { startServiceLoggingUtil } from "./Server_Docker_Test_utils/startServiceLoggingUtil";
import { launchChecksPure } from "./Server_Docker_Test_utils/launchChecksPure";
import { launchBddTestUtil } from "./Server_Test_WS_utils/launchBddTestUtil";
import { getProcessSummaryHelper } from "./Server_Test_WS_utils/testManagerHelpers";
import { checkExistingTestResultsUtil } from "./utils/checkExistingTestResultsUtil";
import { processFeaturesFromTestResultsUtil } from "./utils/processFeaturesFromTestResultsUtil";
import { updateContainerInfoFromDockerUtil } from "./utils/updateContainerInfoFromDockerUtil";

export abstract class Server_Docker_Test extends Server_Aider {
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected builderServicesManager: BuilderServicesManager;
  protected aiderImageBuilder: AiderImageBuilder;
  protected failedBuilderConfigs: Set<string> = new Set();
  protected fileWatchers: Map<string, () => void> = new Map();
  protected testLaunchLocks: Map<string, boolean> = new Map();

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
    console.log("mark2")

    await this.checkExistingTestResults();

    if (this.mode === "dev") {
      await this.initializeFileWatching();
    }

    await super.start();
    
    // Start logging for all running services
    await this.startLoggingForAllServices();
  }

  private async startLoggingForAllServices(): Promise<void> {
    consoleLog(`[Server_Docker_Test] Starting logging for all running services`);
    
    try {
      // Get all services from docker-compose.yml
      const allServicesCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
      const allServicesOutput = execSyncWrapper(allServicesCmd, { cwd: processCwd() }).trim();
      const allServices = allServicesOutput.split('\n').map(s => s.trim());
      
      for (const serviceName of allServices) {
        // Skip builder services (already handled)
        if (serviceName.includes('builder')) {
          continue;
        }
        
        // Try to determine configKey from service name
        // Service names are like: nodetests-src_lib_tiposkripto_tests_calculator_calculator-test-node-ts-bdd
        // Config key is usually the first part before the first dash
        let configKey = 'nodetests'; // Default
        const firstDashIndex = serviceName.indexOf('-');
        if (firstDashIndex > 0) {
          configKey = serviceName.substring(0, firstDashIndex);
        }
        
        // Determine runtime based on config
        let runtime = 'node';
        const runtimeConfig = this.configs.runtimes[configKey];
        if (runtimeConfig) {
          runtime = runtimeConfig.runtime;
        }
        
        // For test name, we can try to extract it, but it's not critical for logging
        // The log file will use the service name if testName is undefined
        let testName: string | undefined = undefined;
        
        // Try to extract test name for BDD, check, and aider services
        if (serviceName.includes('-bdd') || serviceName.includes('-aider') || serviceName.includes('-check-')) {
          // Remove suffix to get base name
          let baseName = serviceName;
          if (serviceName.includes('-bdd')) {
            baseName = serviceName.replace('-bdd', '');
          } else if (serviceName.includes('-aider')) {
            baseName = serviceName.replace('-aider', '');
          } else if (serviceName.includes('-check-')) {
            // For check services, remove -check-\d+
            baseName = serviceName.replace(/-check-\d+$/, '');
          }
          
          // Remove configKey prefix
          if (baseName.startsWith(configKey + '-')) {
            baseName = baseName.substring(configKey.length + 1);
          }
          
          // Convert dashes back to slashes where appropriate
          // This is tricky because some dashes are part of the original path
          // For now, we'll use the modified name
          testName = baseName;
        }
        
        consoleLog(`[Server_Docker_Test] Starting logging for service: ${serviceName}, config: ${configKey}, test: ${testName || 'undefined'}`);
        await this.startServiceLogging(serviceName, runtime, configKey, testName);
      }
    } catch (error) {
      consoleError(`[Server_Docker_Test] Error starting logging for all services:`, error);
    }
  }

  private async checkExistingTestResults(): Promise<void> {
    await checkExistingTestResultsUtil(
      this.configs,
      processCwd,
      this.handleTestCompleted.bind(this),
      consoleWarn
    );
  }

  public async stop(): Promise<void> {
    // Clear process tracking
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop all unified watchers
    this.stopAllFileWatchers();

    // Notify about graph changes
    this.resourceChanged("/~/graph");

    // Write extension config
    writeConfigForExtensionOnStop();

    // Call parent stop to ensure proper cleanup chain
    await super.stop();
  }

  /**
   * Stop all active file watchers
   */
  private stopAllFileWatchers(): void {
    consoleLog(`[stopAllFileWatchers] Stopping ${this.unifiedWatchers.size} unified watchers`);
    
    // Stop all unified watchers
    for (const [configKey, watcher] of this.unifiedWatchers.entries()) {
      try {
        watcher.stop();
        consoleLog(`[stopAllFileWatchers] Stopped unified watcher for config ${configKey}`);
      } catch (error) {
        consoleError(`[stopAllFileWatchers] Error stopping unified watcher for ${configKey}:`, error);
      }
    }
    this.unifiedWatchers.clear();
    
    // Also clear the old fileWatchers map for compatibility
    consoleLog(`[stopAllFileWatchers] Also clearing ${this.fileWatchers.size} legacy file watchers`);
    const watchersToStop = Array.from(this.fileWatchers.entries());
    this.fileWatchers.clear();

    for (const [key, unwatch] of watchersToStop) {
      try {
        unwatch();
        consoleLog(`[stopAllFileWatchers] Stopped legacy watcher: ${key}`);
      } catch (error) {
        consoleError(`[stopAllFileWatchers] Error stopping legacy watcher ${key}:`, error);
      }
    }
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

  public getGraphManager(): any {
    // Return the graph manager if available
    return (this as any).graphManager || this;
  }

  public getProcessSummary = (): any => {
    return getProcessSummaryHelper(
      this.testResultsCollector,
      (this as any).dockerComposeManager
    );
  };

  public getProcessLogs = (processId: string): string[] => {
    return getProcessLogsUtil(processId, this.graph);
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
    consoleLog(`[Server_Docker_Test.startServiceLogging] Called for service: ${serviceName}, runtime: ${runtime}, config: ${runtimeConfigKey}, test: ${testName}`);
    
    // Log all Docker services to see what's available
    try {
      const allServicesCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
      const allServices = execSyncWrapper(allServicesCmd, { cwd: processCwd() }).trim();
      consoleLog(`[Server_Docker_Test.startServiceLogging] All available services: ${allServices}`);
      
      // Check if our service is in the list
      const servicesList = allServices.split('\n').map(s => s.trim());
      if (!servicesList.includes(serviceName)) {
        consoleWarn(`[Server_Docker_Test.startServiceLogging] Service ${serviceName} not found in docker-compose.yml!`);
        // Try to find a matching service
        const matchingServices = servicesList.filter(s => s.includes(serviceName) || serviceName.includes(s));
        if (matchingServices.length > 0) {
          consoleWarn(`[Server_Docker_Test.startServiceLogging] Found similar services: ${matchingServices.join(', ')}`);
        }
      }
    } catch (error) {
      consoleWarn(`[Server_Docker_Test.startServiceLogging] Could not list services:`, error);
    }
    
    await startServiceLoggingUtil(
      serviceName,
      runtime,
      runtimeConfigKey,
      testName,
      this.clearStoredLogs.bind(this),
      startServiceLoggingPure,
      (logFilePath: string, serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => {
        consoleLog(`[Server_Docker_Test.startServiceLogging] Log file created: ${logFilePath}`);
        // Call createLogFileNodePure with the server instance (this)
        createLogFileNodePure(
          logFilePath,
          serviceName,
          runtime,
          runtimeConfigKey,
          testName,
          this // This is the server instance
        );
      },
      processCwd,
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
      this // Use this instead of this.graphManager
    );
    // Graph updates will be broadcast via /~/graph
  }

  protected async getContainerInfo(serviceName: string): Promise<any> {
    return getContainerInfoUtil(
      serviceName,
      this.getGraphData.bind(this),
      consoleError
    );
  }

  protected async updateContainerInfoFromDocker(serviceName: string): Promise<void> {
    await updateContainerInfoFromDockerUtil(
      serviceName,
      this.getGraphData.bind(this),
      this.applyUpdate.bind(this),
      consoleLog,
      consoleError
    );
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

  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    const lockKey = `bdd:${configKey}:${testName}`;
    if (this.testLaunchLocks.get(lockKey)) {
      consoleLog(`[launchBddTest] Skipping ${testName} - already launching`);
      return;
    }

    this.testLaunchLocks.set(lockKey, true);
    try {
      await launchBddTestUtil(
        runtime,
        testName,
        configKey,
        configValue,
        this.failedBuilderConfigs,
        this.startServiceLogging,
        this.writeConfigForExtension.bind(this),
        this.resourceChanged.bind(this),
        this.addProcessNodeToGraph.bind(this),
        this.applyUpdate.bind(this),
        this.getBddServiceName.bind(this),
        this.startDockerService.bind(this),
        this.getContainerInfo.bind(this),
        consoleLog,
        consoleError,
        this.graphManager,
        this.createAiderMessageFile?.bind(this)
      );
    } finally {
      // Clear the lock after a delay to prevent immediate relaunch
      setTimeout(() => {
        this.testLaunchLocks.delete(lockKey);
      }, 5000);
    }
  }

  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    const lockKey = `checks:${configKey}:${testName}`;
    if (this.testLaunchLocks.get(lockKey)) {
      consoleLog(`[launchChecks] Skipping ${testName} - already launching`);
      return;
    }

    this.testLaunchLocks.set(lockKey, true);
    try {
      await launchChecksPure(
        runtime,
        testName,
        configKey,
        configValue,
        this.addProcessNodeToGraph.bind(this),
        this.getBaseServiceName.bind(this),
        generateChecksUpdatesPure,
        consoleLog,
        consoleError,
        this.applyUpdate.bind(this),
        this.startDockerService.bind(this),
        this.getContainerInfo.bind(this),
        this.getProcessNode.bind(this),
        this.startServiceLogging.bind(this)
      );
    } finally {
      setTimeout(() => {
        this.testLaunchLocks.delete(lockKey);
      }, 5000);
    }
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    const lockKey = `aider:${configKey}:${testName}`;
    if (this.testLaunchLocks.get(lockKey)) {
      consoleLog(`[launchAider] Skipping ${testName} - already launching`);
      return;
    }

    this.testLaunchLocks.set(lockKey, true);
    try {
      // Add process node to graph first
      await this.addProcessNodeToGraph(
        'aider',
        runtime,
        testName,
        configKey,
        configValue,
        undefined,
        'running'
      );

      // Generate updates and service name using pure function
      const { updates, serviceName } = generateAiderUpdatesPure(
        testName,
        configKey,
        this.getAiderServiceName.bind(this),
        consoleLog
      );

      // Apply updates to graph
      for (const update of updates) {
        this.applyUpdate(update);
      }

      // Start the Docker service (side effect)
      try {
        await this.startDockerService(serviceName);

        // Get container info after starting
        const containerInfo = await this.getContainerInfo(serviceName);
        const containerId = containerInfo?.Id;

        if (containerId) {
          // Update the process node with container information
          const aiderProcessId = `aider_process:${configKey}:${testName}`;
          const updateTimestamp = new Date().toISOString();
          const containerUpdate = {
            operations: [{
              type: 'updateNode' as const,
              data: {
                id: aiderProcessId,
                metadata: {
                  containerId: containerId,
                  serviceName: serviceName,
                  containerInfo: containerInfo,
                  updatedAt: updateTimestamp
                }
              },
              timestamp: updateTimestamp
            }],
            timestamp: updateTimestamp
          };
          this.applyUpdate(containerUpdate);
          consoleLog(`[launchAider] Updated aider process ${aiderProcessId} with container ${containerId}`);
        }
      } catch (error) {
        consoleError(`[launchAider] Failed to start service ${serviceName}:`, error);

        // Update aider_process node status to failed
        const aiderProcessId = `aider_process:${configKey}:${testName}`;
        const failureTimestamp = new Date().toISOString();
        const failureUpdate = {
          operations: [{
            type: 'updateNode' as const,
            data: {
              id: aiderProcessId,
              status: 'failed',
              metadata: {
                error: error instanceof Error ? error.message : String(error),
                finishedAt: failureTimestamp
              }
            },
            timestamp: failureTimestamp
          }],
          timestamp: failureTimestamp
        };
        this.applyUpdate(failureUpdate);
        throw error;
      }
    } finally {
      setTimeout(() => {
        this.testLaunchLocks.delete(lockKey);
      }, 5000);
    }
  }


  private unifiedWatchers: Map<string, any> = new Map();

  /**
   * Initialize file watching for all tests
   */
  async initializeFileWatching(): Promise<void> {
    consoleLog('[initializeFileWatching] Setting up unified file watching for all tests');

    // Create a unified watcher for each config
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      // Remove existing watcher if any
      const existingWatcher = this.unifiedWatchers.get(configKey);
      if (existingWatcher) {
        try {
          existingWatcher.stop();
          consoleLog(`[initializeFileWatching] Stopped existing watcher for config ${configKey}`);
        } catch (error) {
          consoleError(`[initializeFileWatching] Error stopping existing watcher:`, error);
        }
        this.unifiedWatchers.delete(configKey);
      }

      // Import and create new unified watcher
      const { UnifiedFileWatcher } = await import('./Server_Docker_Test_utils/unifiedFileWatcher/index');
      
      const watcher = new UnifiedFileWatcher({
        configKey,
        configValue,
        processCwd,
        consoleLog,
        consoleError,
        launchBddTest: this.launchBddTest.bind(this),
        launchChecks: this.launchChecks.bind(this),
        launchAider: this.launchAider.bind(this),
        onTestCompleted: async (configKey, testName, testResults, testsJsonPath) => {
          await this.handleTestCompleted(configKey, testName, testResults, testsJsonPath);
        }
      });
      
      await watcher.start();
      this.unifiedWatchers.set(configKey, watcher);
      consoleLog(`[initializeFileWatching] Started unified watcher for config ${configKey}`);
    }
  }

  /**
   * Watch inputFiles.json for a config and relaunch tests when hashes change
   */
  async watchInputFilesForConfig(
    configKey: string,
    configValue: any
  ): Promise<void> {
    // This method is now handled by the unified watcher
    consoleLog(`[watchInputFilesForConfig] Unified watcher handles ${configKey}`);
  }

  private async handleTestCompleted(
    configKey: string,
    testName: string,
    testResults: any,
    testsJsonPath: string
  ): Promise<void> {
    // Use the pure function with explicit dependencies
    await handleTestCompletedPure(
      configKey,
      testName,
      testResults,
      this.configs,
      this.updateProcessNodeStatus.bind(this),
      this.getGraphData.bind(this),
      this.updateEntrypointNode.bind(this),
      this.processFeaturesFromTestResults.bind(this),
      this.updateFromTestResults.bind(this),
      this.resourceChanged.bind(this)
    );
  }

  protected async processFeaturesFromTestResults(
    configKey: string,
    testName: string,
    testResults: any,
    timestamp: string
  ): Promise<void> {
    await processFeaturesFromTestResultsUtil(
      configKey,
      testName,
      testResults,
      timestamp,
      this.featureIngestor,
      this.getProcessNode.bind(this),
      this.applyUpdate.bind(this),
      consoleWarn,
      consoleError
    );
  }

  protected updateEntrypointNode(
    entrypointId: string,
    status: 'done' | 'failed',
    testResults: any,
    timestamp: string
  ): void {
    const update = {
      operations: [{
        type: 'updateNode' as const,
        data: {
          id: entrypointId,
          status: status,
          metadata: {
            ...this.getProcessNode(entrypointId)?.metadata || {},
            finishedAt: timestamp,
            testResults: testResults,
            updatedAt: timestamp
          }
        },
        timestamp
      }],
      timestamp
    };

    try {
      this.applyUpdate(update);
    } catch (error) {
      consoleError(`[Server_Docker_Test] Error updating entrypoint node ${entrypointId}:`, error);
    }
  }

  protected updateProcessNodeStatus(
    processId: string,
    status: 'running' | 'done' | 'failed',
    testResults: any,
    timestamp: string
  ): void {
    const processNode = this.getProcessNode(processId);
    if (!processNode) {
      consoleWarn(`[Server_Docker_Test] Process node ${processId} not found`);
      return;
    }

    const update = {
      operations: [{
        type: 'updateNode' as const,
        data: {
          id: processId,
          status: status,
          metadata: {
            ...processNode.metadata || {},
            finishedAt: timestamp,
            testResults: testResults,
            updatedAt: timestamp
          }
        },
        timestamp
      }],
      timestamp
    };

    try {
      this.applyUpdate(update);
    } catch (error) {
      consoleError(`[Server_Docker_Test] Error updating process node ${processId}:`, error);
    }
  }

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any
  ) {
    await informAiderDockerUtil(
      this,
      testName,
      configKey,
      this.getAiderServiceName.bind(this),
      this.restartDockerService.bind(this),
      consoleLog,
      consoleError,
      files,
      runtime
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

  public async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ): Promise<void> {
    await super.addProcessNodeToGraph(
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      status
    );
    // The parent method (Server_Test_WS.addProcessNodeToGraph) already saves the graph
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
