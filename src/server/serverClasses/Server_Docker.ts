import fs, { existsSync } from "fs";
import path from "path";
import type { IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import {
  getDockerComposeDownPure,
  getReportDirPure,
  logMessage,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
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
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { TestResultsCollector } from "./Server_Docker/TestResultsCollector";
import { AiderMessageManager } from "./Server_Docker/AiderMessageManager";
import { StakeholderAppBundler } from "./Server_Docker/StakeholderAppBundler";
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

export class Server_Docker extends Server_Docker_Compose {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
  private testFileManager: TestFileManager;
  private testResultsCollector: TestResultsCollector;
  private aiderMessageManager: AiderMessageManager;
  private stakeholderAppBundler: StakeholderAppBundler;
  private builderServicesManager: BuilderServicesManager;
  private aiderImageBuilder: AiderImageBuilder;
  private testCompletionWaiter: TestCompletionWaiter;
  private inputFiles: any;
  private hashs: any;
  private outputFiles: any;

  constructor(configs: ITestconfigV2, mode: IMode) {
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
    // Initialize stakeholderAppBundler
    this.stakeholderAppBundler = new StakeholderAppBundler(
      configs,
      (message: string) => console.warn(message),
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

    await this.bundleStakeholderApp();

    getReportDirPure();

    await spawnPromise(getDockerComposeDownPure());
    await this.dockerComposeManager.buildWithBuildKit();
    await this.dockerComposeManager.startBuilderServices();

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
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
      }
    }

    if (this.mode === "once") {
      try {
        await this.waitForAllTestsToComplete();
        logMessage(
          "[Server_Docker] Tests completed, waiting for pending operations...",
        );
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
    // First, stop all log processes
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      try {
        logProcess.process.kill("SIGTERM");
      } catch (error) {
        consoleError(
          `[Server_Docker] Error stopping log process ${containerId}:`,
          error,
        );
      }
    }

    // Wait a bit for log processes to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logProcesses.clear();

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
    // Create aider message file when test is launched
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
      (serviceName, runtime) =>
        captureExistingLogs(serviceName, runtime, configKey),
      (serviceName, runtime) =>
        this.startServiceLogging(serviceName, runtime, configKey),
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
      (serviceName, runtime) =>
        captureExistingLogs(serviceName, runtime, configKey),
      (serviceName, runtime) =>
        this.startServiceLogging(serviceName, runtime, configKey),
      () => this.resourceChanged("/~/processes"),
      () => this.writeConfigForExtension(),
    );
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
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log(
        `[Server_Docker] Found ${files.length} files in ${outputDir}`,
      );
    }

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
    return this.testResultsCollector.getProcessSummary();
  };

  startServiceLogging = (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => {
    this.logProcesses = startServiceLoggingPure(
      serviceName,
      runtime,
      processCwd(),
      this.logProcesses,
      runtimeConfigKey,
    );
    this.writeConfigForExtension();
  };

  private async buildAiderImage(): Promise<void> {
    await this.aiderImageBuilder.buildAiderImage();
  }

  private async startBuilderServices(): Promise<void> {
    await this.builderServicesManager.startBuilderServices();
  }

  private async waitForAllTestsToComplete(): Promise<void> {
    await this.testCompletionWaiter.waitForAllTestsToComplete();
  }

  private async bundleStakeholderApp(): Promise<void> {
    await this.stakeholderAppBundler.bundleStakeholderApp();
  }
}
