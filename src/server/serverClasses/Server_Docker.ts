import fs, { existsSync } from "fs";
import path from "path";
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
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
import {
  watchInputFilePure,
  watchOutputFilePure,
} from "./Server_Docker/utils/watch";
import {
  spawnPromise,
  captureExistingLogs,
  makeReportDirectory,
} from "./Server_Docker/utils";
import { generateUid, getAiderServiceName } from "./Server_Docker/Server_Docker_Constants";
import { execSync } from "child_process";
import process from "process";
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { TestResultsCollector } from "./Server_Docker/TestResultsCollector";
import { AiderMessageManager } from "./Server_Docker/AiderMessageManager";
import { BuilderServicesManager } from "./Server_Docker/BuilderServicesManager";
import { AiderImageBuilder } from "./Server_Docker/AiderImageBuilder";
import { TestCompletionWaiter } from "./Server_Docker/TestCompletionWaiter";
import { launchBddTestPure } from "./Server_Docker/utils/launchBddTestPure";
import { launchChecksPure } from "./Server_Docker/utils/launchChecksPure";
import { loadInputFileOnce } from "./Server_Docker/utils/loadInputFileOnce";
import { startServiceLoggingPure } from "./Server_Docker/utils/startServiceLoggingPure";
import { updateOutputFilesList } from "./Server_Docker/utils/updateOutputFilesList";
import { generateServicesPure } from "./Server_Docker/utils/generateServicesPure";
import { writeComposeFile } from "./Server_Docker/utils/writeComposeFile";
import { writeConfigForExtensionOnStop } from "./Server_Docker/utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./Server_Docker/utils/writeConfigForExtensionPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";

// TODO: TICKET-001 - Refactor logging system to separate test and builder services
// Current implementation uses a hack where testName presence distinguishes between
// test services (BDD/check) and builder services. This should be refactored into
// separate functions with clear interfaces.

export class Server_Docker extends Server_Docker_Compose {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
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
    this.testFileManager = new TestFileManager(configs, mode, (path) =>
      this.resourceChanged(path),
    );

    // Initialize testResultsCollector with inputFiles and outputFiles from testFileManager
    this.testResultsCollector = new TestResultsCollector(
      configs,
      mode,
      this.testFileManager.inputFiles,
      this.testFileManager.outputFiles,
    );

    // Initialize aiderMessageManager
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

  generateServices(): Record<string, any> {
    return generateServicesPure(this.configs, this.mode);
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
      consoleError('[Server_Docker] Builder image build failed:', error);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        this.failedBuilderConfigs.add(configKey);
      }
    }

    // Start builder services with error handling
    try {
      await this.dockerComposeManager.startBuilderServices();
    } catch (error) {
      consoleError('[Server_Docker] Failed to start builder services:', error);
      // Continue despite builder service failures
    }

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
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
          consoleError(`[Server_Docker] Error processing test ${testName} for config ${configKey}:`, error);
          // Continue with other tests
        }
      }
    }

    if (this.mode === "once") {
      try {
        await this.waitForAllTestsToComplete();
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
          consoleError("[Server_Docker] Error stopping services:", stopError);
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
    );
    this.inputFiles = result.inputFiles;
    this.hashs = result.hashs;
  }

  // Create aider message file for the test
  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    inputFiles?: any,
  ) {
    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );
    // Also launch the aider service when input files change
    await this.launchAider(runtime, testName, configKey, configValue);
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
  }

  // each test has zero or more "check" tests to be launched when inputFiles.json changes
  async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
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
  }

  async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    // Check if builder failed for this config
    if (this.failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker] Skipping aider for ${testName} because builder failed for config ${configKey}`);
      return;
    }

    // Create aider message file
    await this.createAiderMessageFile(
      runtime,
      testName,
      configKey,
      configValue,
    );

    // Launch aider service
    const uid = generateUid(configKey, testName);
    const aiderServiceName = getAiderServiceName(uid);

    // Start the aider service
    const { processCwd } = await import("./Server_Docker/Server_Docker_Dependents");

    try {
      // Start the aider service
      execSync(`docker compose -f "${processCwd()}/testeranto/docker-compose.yml" up -d ${aiderServiceName}`, {
        stdio: "inherit",
        cwd: processCwd(),
      });

      // Start logging for the aider service
      await this.startServiceLogging(aiderServiceName, runtime, configKey, testName);

      this.resourceChanged("/~/processes");
      this.writeConfigForExtension();

      consoleLog(`[Server_Docker] Started aider service: ${aiderServiceName}`);
    } catch (error: any) {
      consoleError(`[Server_Docker] Failed to start aider service ${aiderServiceName}:`, error);
    }
  }

  async setupDockerCompose() {
    writeComposeFile(this.generateServices());
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

  private collectAllTestResults = async (): Promise<Record<string, any>> => {
    const results = this.testResultsCollector.collectAllTestResults();
    return { results };
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

  private clearStoredLogs(serviceName: string, configKey: string, testName?: string): void {
    // Clear any stored log files for this service
    const reportsDir = `${processCwd()}/testeranto/reports/${configKey}`;
    try {
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir);

        // Determine which files to delete
        for (const file of files) {
          let shouldDelete = false;

          if (testName) {
            // Try to match the file naming pattern
            const cleanedTestName = testName.toLowerCase().replace(/\./g, '-').replace(/[^a-z0-9_\-/]/g, '');
            // The file should contain the cleaned test name and end with .log
            if (file.includes(cleanedTestName) && file.endsWith('.log')) {
              shouldDelete = true;
            }
          } else {
            // If no testName, delete files that might be related to the service
            // This is less precise but necessary for builder services
            if (file.includes(serviceName) && file.endsWith('.log')) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            const filePath = path.join(reportsDir, file);
            fs.unlinkSync(filePath);
            consoleLog(`[clearStoredLogs] Deleted old log file: ${filePath}`);
          }
        }
      }
    } catch (error) {
      consoleWarn(`[clearStoredLogs] Error clearing logs for ${serviceName}: ${error}`);
    }
  }

  private async clearBuilderLogs(): Promise<void> {
    // Clear logs for all builder services
    // Builder services are typically prefixed with 'builder_' or can be identified from configs
    // For now, we'll clear logs for services that are likely to be builder services

    // We can identify builder services from the configuration
    // Since we don't have direct access to builder service names, we'll clear logs for all services
    // that have been logged before
    // This is a temporary implementation
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      if (logProcess.serviceName.includes('builder') ||
        logProcess.serviceName.includes('build')) {

        // Stop the logging process
        try {
          logProcess.process.kill('SIGTERM');
        } catch (error) {
          consoleError(`[Server_Docker] Error stopping log process for ${logProcess.serviceName}:`, error);
        }
        // Remove from the map
        this.logProcesses.delete(containerId);
      }
    }

    // Also clear any stored log files if they exist
    // This would depend on your implementation
  }


  startServiceLogging = async (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
    testName?: string,
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

  private async buildAiderImage(): Promise<void> {
    try {
      await this.aiderImageBuilder.buildAiderImage();
    } catch (error) {
      consoleError('[Server_Docker] Failed to build aider image:', error);
      // Continue without the aider image
    }
  }

  private async startBuilderServices(): Promise<void> {
    // Clear builder logs before starting services
    await this.clearBuilderLogs();
    try {
      await this.builderServicesManager.startBuilderServices();
    } catch (error) {
      consoleError('[Server_Docker] Failed to start builder services:', error);
      // Don't rethrow - allow other services to continue
    }
  }

  private async waitForAllTestsToComplete(): Promise<void> {
    await this.testCompletionWaiter.waitForAllTestsToComplete();
  }

}
