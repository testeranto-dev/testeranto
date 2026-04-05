import fs, { existsSync } from "fs";
import path from "path";
import process from "process";
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
import { AiderMessageManager } from "./Server_Docker/AiderMessageManager";
import { BuilderServicesManager } from "./Server_Docker/BuilderServicesManager";
import { clearStoredLogs } from "./Server_Docker/clearStoredLogs";
import { getContainerInfo } from "./Server_Docker/getContainerInfo";
import {
  getDockerComposeDownPure,
  getReportDirPure,
  logMessage,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  processCwd,
  processExit,
} from "./Server_Docker/Server_Docker_Dependents";
import { TestCompletionWaiter } from "./Server_Docker/TestCompletionWaiter";
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { TestResultsCollector } from "./Server_Docker/TestResultsCollector";
import {
  captureExistingLogs,
  makeReportDirectory,
  spawnPromise,
} from "./Server_Docker/utils";
import { getAiderProcessesPure } from "./Server_Docker/utils/getAiderProcessesPure";
import { launchAiderPure } from "./Server_Docker/utils/launchAiderPure";
import { launchBddTestPure } from "./Server_Docker/utils/launchBddTestPure";
import { launchChecksPure } from "./Server_Docker/utils/launchChecksPure";
import { loadInputFileOnce } from "./Server_Docker/utils/loadInputFileOnce";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { updateOutputFilesList } from "./Server_Docker/utils/updateOutputFilesList";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import {
  watchInputFilePure,
  watchOutputFilePure,
} from "./Server_Docker/utils/watch";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
// Note: waitForBundlesPure is imported dynamically to avoid circular dependencies

// TODO: TICKET-001 - Refactor logging system to separate test and builder services
// Current implementation uses a hack where testName presence distinguishes between
// test services (BDD/check) and builder services. This should be refactored into
// separate functions with clear interfaces.

export class Server_Docker extends Server_Docker_Compose {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
  private aiderProcesses: Map<string, any> = new Map();
  private testFileManager: TestFileManager;
  private testResultsCollector: TestResultsCollector;
  private aiderMessageManager: AiderMessageManager;
  private builderServicesManager: BuilderServicesManager;
  private aiderImageBuilder: AiderImageBuilder;
  private testCompletionWaiter: TestCompletionWaiter;
  private inputFiles: any;
  private hashs: any;
  private outputFiles: any;
  private failedBuilderConfigs: Set<string> = new Set();

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

  async start() {

    await super.start();

    this.dockerComposeManager.writeConfigForExtension(this.getProcessSummary());
    await this.dockerComposeManager.setupDockerCompose();

    getReportDirPure();

    await spawnPromise(getDockerComposeDownPure());

    // Build builder services with error handling
    try {
      const failedConfigs = await this.dockerComposeManager.buildWithBuildKit();
      // Store which configs failed
      for (const configKey of failedConfigs) {
        this.failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }
    } catch (error) {
      consoleError('[Server_Docker] Builder image build failed:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        this.failedBuilderConfigs.add(configKey);
      }
    }

    // Start builder services with error handling
    try {
      const failedBuilderConfigs = await this.dockerComposeManager.startBuilderServices();
      // Store which configs failed
      for (const configKey of failedBuilderConfigs) {
        this.failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }
      
      // Add builder process nodes for all configs
      for (const configKey of Object.keys(this.configs.runtimes)) {
        if (!failedBuilderConfigs.has(configKey)) {
          const configValue = this.configs.runtimes[configKey];
          await this.addProcessNodeToGraph('builder', configValue.runtime as IRunTime, '', configKey, configValue);
        }
      }
    } catch (error) {
      consoleError('[Server_Docker] Failed to start builder services:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        this.failedBuilderConfigs.add(configKey);
      }
    }

    // Wait for bundles to be ready before proceeding with tests
    this.failedBuilderConfigs = await waitForBundlesPure({
      configs: this.configs,
      processCwd,
      failedBuilderConfigs: this.failedBuilderConfigs,
      consoleLog,
      consoleWarn,
      maxWaitTime: 30000,
      checkInterval: 500,
    });

    // Create an array of all test launch promises
    const testLaunchPromises: Promise<void>[] = [];

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      // Skip configs with failed builders
      if (this.failedBuilderConfigs.has(configKey)) {
        consoleLog(`[Server_Docker] Skipping test services for failed config ${configKey}`);
        continue;
      }

      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
        testLaunchPromises.push((async () => {
          try {
            const reportDir = makeReportDirectory(testName, configKey);

            if (!existsSync(reportDir)) {
              fs.mkdirSync(reportDir, { recursive: true });
            }

            if (this.mode === "dev") {
              await this.testFileManager.watchInputFile(
                runtime,
                testName,
                (runtime, testName, configKey, configValue) =>
                  this.launchBddTest(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue) =>
                  this.launchChecks(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue, files) =>
                  this.informAider(
                    runtime,
                    testName,
                    configKey,
                    configValue,
                    files,
                  ),
                (runtime, testName, configKey) =>
                  this.testFileManager.loadInputFileOnce(
                    runtime,
                    testName,
                    configKey,
                  ),
                (runtime, testName, configKey, inputFiles) =>
                  this.updateGraphWithInputFiles(runtime, testName, configKey, inputFiles),
              );
              await this.testFileManager.watchOutputFile(
                runtime,
                testName,
                configKey,
              );
            } else {
              this.testFileManager.loadInputFileOnce(runtime, testName, configKey);
            }

            await this.createAiderMessageFile(
              runtime,
              testName,
              configKey,
              configValue,
            );
            await this.launchBddTest(runtime, testName, configKey, configValue);
            await this.launchChecks(runtime, testName, configKey, configValue);
            await this.launchAider(runtime, testName, configKey, configValue);
          } catch (error) {
            consoleError(`[Server_Docker] Error processing test ${testName} for config ${configKey}:`, error as string);
            // Continue with other tests
          }
        })());
      }
    }

    // Launch all tests in parallel
    await Promise.allSettled(testLaunchPromises);

    if (this.mode === "once") {
      try {
        await this.testCompletionWaiter.waitForAllTestsToComplete();
        logMessage(
          "[Server_Docker] Tests completed, waiting for pending operations...",
        );

        // Generate graph-data.json for dual-mode operation
        const { embedConfigInHtml } = await import("./utils/embedConfigInHtml");
        await embedConfigInHtml(this.configs);

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.stop();
        processExit(0);
      } catch (error: any) {
        consoleError("[Server_Docker] Error in once mode:", error);
        try {
          await this.stop();
        } catch (stopError) {
          consoleError("[Server_Docker] Error stopping services:", stopError as string);
        }
        processExit(1);
      }
    }
  }

  public async stop(): Promise<void> {
    // Clear any tracked processes (though there shouldn't be any with the new approach)
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop Docker services
    const result = await this.DC_down();

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

  private loadInputFileOnce(
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
    inputFiles?: any,
  ) {
    consoleLog(`[Server_Docker] Input files changed for ${testName}, updating aider`);
    
    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );
    // Also launch the aider service when input files change
    await this.launchAider(runtime, testName, configKey, configValue);
  }

  private async updateGraphWithInputFiles(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    inputFiles: string[],
  ): Promise<void> {
    console.log(`[Server_Docker] updateGraphWithInputFiles called:`, {
      runtime,
      testName,
      configKey,
      inputFilesCount: inputFiles?.length || 0,
      inputFiles
    });
    
    if (!inputFiles || inputFiles.length === 0) {
      console.log(`[Server_Docker] No input files provided, skipping`);
      return;
    }
    
    // We need to update the graph with input file nodes
    // Create a test result-like object with input files
    // Ensure testName is treated as a file path for proper entrypoint creation
    const processedTestName = testName.includes('.') ? testName : `${configKey}:${testName}`;
    const testResult = {
      configKey,
      runtime,
      testName: processedTestName,
      inputFiles,
      // Add required fields for TestResult interface
      failed: false,
      // Add empty individualResults to satisfy the interface
      individualResults: [],
      timestamp: new Date().toISOString()
    };

    console.log(`[Server_Docker] Created test result for graph update:`, testResult);

    // Update the graph using the graph manager
    // The graph manager is in the parent class Server_HTTP
    const serverHttp = this as any;
    if (serverHttp.graphManager && typeof serverHttp.graphManager.updateFromTestResults === 'function') {
      console.log(`[Server_Docker] Graph manager available, calling updateFromTestResults`);
      try {
        await serverHttp.graphManager.updateFromTestResults(testResult);
        console.log(`[Server_Docker] Updated graph with ${inputFiles.length} input files for ${testName}`);
      } catch (error) {
        console.error(`[Server_Docker] Error updating graph with input files:`, error);
      }
    } else {
      console.warn(`[Server_Docker] Graph manager not available for updating input files`);
    }
  }

  private async updateProcessNodeStatus(
    processId: string,
    status: 'running' | 'completed' | 'failed' | 'stopped',
    exitCode?: number
  ): Promise<void> {
    try {
      const serverHttp = this as any;
      if (serverHttp.graphManager && typeof serverHttp.graphManager.applyUpdate === 'function') {
        // Get current graph data to find the node
        const graphData = serverHttp.graphManager.getGraphData();
        const node = graphData.nodes.find((n: any) => n.id === processId);
        
        if (node) {
          const timestamp = new Date().toISOString();
          const update = {
            operations: [{
              type: 'updateNode',
              data: {
                id: processId,
                status,
                metadata: {
                  ...node.metadata,
                  exitCode,
                  completedAt: status !== 'running' ? timestamp : undefined
                }
              },
              timestamp
            }],
            timestamp
          };
          
          serverHttp.graphManager.applyUpdate(update);
          consoleLog(`[Server_Docker] Updated process node ${processId} status to ${status}`);
          
          // Save the graph after updating process status
          if (typeof serverHttp.graphManager.saveGraph === 'function') {
            serverHttp.graphManager.saveGraph();
            consoleLog(`[Server_Docker] Saved graph after updating process node status`);
            
            // Also save to graph-data.json
            if (typeof serverHttp.saveCurrentGraph === 'function') {
              try {
                serverHttp.saveCurrentGraph();
                consoleLog(`[Server_Docker] Updated graph-data.json with process status update`);
              } catch (error) {
                consoleError(`[Server_Docker] Error saving graph-data.json:`, error);
              }
            }
          }
          
          // Broadcast update
          if (serverHttp.broadcast && typeof serverHttp.broadcast === 'function') {
            serverHttp.broadcast({
              type: 'graphUpdated',
              message: `Process node ${processId} status updated to ${status}`,
              timestamp: new Date().toISOString(),
              data: {
                nodeUpdated: processId,
                status,
                exitCode
              }
            });
          }
        } else {
          consoleWarn(`[Server_Docker] Process node ${processId} not found in graph`);
        }
      }
    } catch (error) {
      consoleError(`[Server_Docker] Error updating process node status:`, error);
    }
  }

  private async createAiderMessageFile(
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
    consoleLog(`[Server_Docker] Launching BDD test for ${testName}`);
    
    // Check if builder failed for this config
    if (this.failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
      return;
    }

    // Create aider message file when test is launched
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
        this.clearStoredLogs(serviceName, configKey, testName);
        return captureExistingLogs(serviceName, runtime, configKey, testName);
      },
      (serviceName, runtime, configKey, testName) =>
        this.startServiceLogging(serviceName, runtime, configKey, testName),
      () => this.resourceChanged("/~/processes"),
      () => this.writeConfigForExtension(),
    );

    // Add BDD process node to graph
    await this.addProcessNodeToGraph('bdd', runtime, testName, configKey, configValue);
  }

  private async addProcessNodeToGraph(
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number
  ): Promise<void> {
    consoleLog(`[Server_Docker] addProcessNodeToGraph called: ${processType} for ${testName} (${configKey})`);
    try {
      // Get the graph manager from parent class
      const serverHttp = this as any;
      consoleLog(`[Server_Docker] graphManager exists: ${!!serverHttp.graphManager}`);
      consoleLog(`[Server_Docker] graphManager.applyUpdate is function: ${typeof serverHttp.graphManager?.applyUpdate === 'function'}`);
      
      if (serverHttp.graphManager && typeof serverHttp.graphManager.applyUpdate === 'function') {
        // Generate process ID
        let processId: string;
        let label: string;
        
        switch (processType) {
          case 'bdd':
            processId = `bdd_process:${configKey}:${testName}`;
            label = `BDD Process: ${testName}`;
            break;
          case 'check':
            processId = `check_process:${configKey}:${testName}:${checkIndex}`;
            label = `Check Process ${checkIndex}: ${testName}`;
            break;
          case 'aider':
            processId = `aider_process:${configKey}:${testName}`;
            label = `Aider Process: ${testName}`;
            break;
          case 'builder':
            processId = `builder_process:${configKey}`;
            label = `Builder Process: ${configKey}`;
            break;
          default:
            return;
        }

        const timestamp = new Date().toISOString();
        const operations = [];

        // Create process node operation
        const nodeAttributes = {
          id: processId,
          type: processType === 'bdd' ? 'bdd_process' : 
                processType === 'check' ? 'check_process' :
                processType === 'aider' ? 'aider_process' : 'builder_process',
          label: label,
          description: `${processType} process for ${testName} (${configKey})`,
          status: 'running',
          priority: 'medium',
          metadata: {
            runtime,
            testName,
            configKey,
            processType,
            checkIndex,
            timestamp
          }
        };

        operations.push({
          type: 'addNode',
          data: nodeAttributes,
          timestamp
        });

        // Create edge from entrypoint to process (for non-builder processes)
        if (processType !== 'builder') {
          const entrypointId = `entrypoint:${testName}`;
          const edgeType = processType === 'bdd' ? 'hasBddProcess' :
                          processType === 'check' ? 'hasCheckProcess' :
                          processType === 'aider' ? 'hasAiderProcess' : 'hasBuilderProcess';
          
          operations.push({
            type: 'addEdge',
            data: {
              source: entrypointId,
              target: processId,
              attributes: {
                type: edgeType,
                weight: 1,
                timestamp
              }
            },
            timestamp
          });
        } else {
          // For builder processes, first ensure config node exists
          const configNodeId = `config:${configKey}`;
          
          // Check if config node exists by trying to get it from the graph
          // We need to check if the node exists in the current graph data
          const graphData = serverHttp.graphManager.getGraphData();
          const configNodeExists = graphData.nodes.some((node: any) => node.id === configNodeId);
          
          if (!configNodeExists) {
            const configNodeAttributes = {
              id: configNodeId,
              type: 'config' as const,
              label: `Config: ${configKey}`,
              description: `Configuration for ${configKey}`,
              status: 'todo',
              priority: 'medium',
              metadata: {
                configKey,
                runtime: configValue.runtime,
                timestamp
              }
            };
            operations.push({
              type: 'addNode',
              data: configNodeAttributes,
              timestamp
            });
            consoleLog(`[Server_Docker] Created config node: ${configNodeId}`);
          }
          
          // Link builder process to config node
          operations.push({
            type: 'addEdge',
            data: {
              source: configNodeId,
              target: processId,
              attributes: {
                type: 'hasBuilderProcess',
                weight: 1,
                timestamp
              }
            },
            timestamp
          });
        }

        // Apply all operations at once
        const update = {
          operations,
          timestamp
        };
        
        serverHttp.graphManager.applyUpdate(update);
        consoleLog(`[Server_Docker] Added ${processType} process node to graph: ${processId}`);

        // Save the graph data after adding process nodes
        if (typeof serverHttp.graphManager.saveGraph === 'function') {
          serverHttp.graphManager.saveGraph();
          consoleLog(`[Server_Docker] Saved graph after adding ${processType} process node`);
          
          // Also save to graph-data.json
          if (typeof serverHttp.saveCurrentGraph === 'function') {
            try {
              serverHttp.saveCurrentGraph();
              consoleLog(`[Server_Docker] Updated graph-data.json with ${processType} process node`);
            } catch (error) {
              consoleError(`[Server_Docker] Error saving graph-data.json:`, error);
            }
          }
        }

        // Broadcast graph update via WebSocket if available
        if (serverHttp.broadcast && typeof serverHttp.broadcast === 'function') {
          serverHttp.broadcast({
            type: 'graphUpdated',
            message: `Graph updated with ${processType} process node`,
            timestamp: new Date().toISOString(),
            data: {
              nodeAdded: processId,
              processType,
              testName,
              configKey
            }
          });
        }
      } else {
        consoleLog(`[Server_Docker] Graph manager or applyUpdate not available`);
      }
    } catch (error) {
      consoleError(`[Server_Docker] Error adding process node to graph:`, error);
    }
  }

  // each test has zero or more "check" tests to be launched when inputFiles.json changes
  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    consoleLog(`[Server_Docker] Launching checks for ${testName}`);
    
    // Check if builder failed for this config
    if (this.failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker] Skipping checks for ${testName} because builder failed for config ${configKey}`);
      return;
    }

    // Create aider message file when checks are launched
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
        // Clear stored logs before capturing existing logs
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
    });

    // Add aider process node to graph
    await this.addProcessNodeToGraph('aider', runtime, testName, configKey, configValue);
  }

  private writeConfigForExtension(): void {
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
    // if (fs.existsSync(outputDir)) {
    //   const files = fs.readdirSync(outputDir);
    //   console.log(
    //     `[Server_Docker] Found ${files.length} files in ${outputDir}`,
    //   );
    // }

    return result || [];
  };

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    return this.testResultsCollector.getTestResults(runtime, testName);
  };

  public getProcessSummary = (): any => {
    const processSummary = this.testResultsCollector.getProcessSummary();
    // Add build errors if available
    if (this.dockerComposeManager) {
      const buildErrors = (this.dockerComposeManager as any).getBuildErrors?.();
      if (buildErrors && buildErrors.length > 0) {
        return {
          ...processSummary,
          buildErrors: buildErrors
        };
      }
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
    // Ensure this context is valid
    if (!this) {
      consoleWarn('[Server_Docker] getAiderProcesses called with invalid this context');
      return [];
    }

    // Ensure aiderProcesses is initialized
    if (!this.aiderProcesses) {
      consoleWarn('[Server_Docker] aiderProcesses not initialized, returning empty array');
      return [];
    }

    return getAiderProcessesPure({
      aiderProcesses: this.aiderProcesses,
    });
  }

  private clearStoredLogs(serviceName: string, configKey: string, testName: string): void {
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
    );
    this.writeConfigForExtension();
  };

  private async getContainerInfo(serviceName: string): Promise<any> {
    return getContainerInfo(serviceName)
  }


}
