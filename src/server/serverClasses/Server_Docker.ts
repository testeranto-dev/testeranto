import fs, { existsSync } from "fs";
import path from "path";
import type { IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { type IDockerComposeResult } from "./Server_Docker/Server_Docker_Constants";
import { consoleError } from "./Server_Docker/Server_Docker_Dependents";
import {
  exitProcessPure,
  getCwdPure,
  getDockerComposeCommandsPure,
  getDockerComposeDownPure,
  getReportDirPure,
  logMessagePure,
} from "./Server_Docker/Server_Docker_Utils";
import {
  generateServicesPure,
  writeComposeFile,
  writeConfigForExtensionOnStop,
  writeConfigForExtensionPure,
} from "./Server_Docker/Server_Docker_Utils_Setup";
import { Server_WS } from "./Server_WS";
import {
  watchInputFilePure,
  watchOutputFilePure,
} from "./Server_Docker/utils/watch";
// import {
//   informAiderPure,
//   getAiderProcessesPure,
//   handleAiderProcessesPure,
// } from "./Server_Docker/utils/aider";
import {
  spawnPromise,
  captureExistingLogs,
  executeDockerComposeCommand,
  makeReportDirectory,
} from "./Server_Docker/utils";
import { TestFileManager } from "./Server_Docker/TestFileManager";
import { DockerComposeManager } from "./Server_Docker/DockerComposeManager";
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

export class Server_Docker extends Server_WS {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
  private testFileManager: TestFileManager;
  private dockerComposeManager: DockerComposeManager;
  private testResultsCollector: TestResultsCollector;
  private aiderMessageManager: AiderMessageManager;
  private stakeholderAppBundler: StakeholderAppBundler;
  private builderServicesManager: BuilderServicesManager;
  private aiderImageBuilder: AiderImageBuilder;
  private testCompletionWaiter: TestCompletionWaiter;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.testFileManager = new TestFileManager(configs, mode, (path) =>
      this.resourceChanged(path),
    );
    this.dockerComposeManager = new DockerComposeManager(
      configs,
      mode,
      (message: string, error?: any) => this.logError(message, error),
      (message: string) => this.logMessage(message),
      (path: string) => this.resourceChanged(path),
      () => this.getProcessSummary(),
      (serviceName: string, runtime: string, runtimeConfigKey: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey),
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
      (message: string) => this.logMessage(message),
      (message: string, error?: any) => this.logError(message, error),
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
      (message: string) => this.logMessage(message),
      (message: string, error?: any) => this.logError(message, error),
    );
    // Initialize test completion waiter
    this.testCompletionWaiter = new TestCompletionWaiter(
      (message: string) => this.logMessage(message),
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
        this.logMessage(
          "[Server_Docker] Tests completed, waiting for pending operations...",
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.stop();
        exitProcessPure(0);
      } catch (error: any) {
        this.logError("[Server_Docker] Error in once mode:", error);
        try {
          await this.stop();
        } catch (stopError) {
          this.logError("[Server_Docker] Error stopping services:", stopError);
        }
        exitProcessPure(1);
      }
    }
  }

  public async stop(): Promise<void> {
    // First, stop all log processes
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      try {
        logProcess.process.kill("SIGTERM");
      } catch (error) {
        this.logError(
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

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    inputFiles?: any,
  ) {
    // Create aider message file for the test
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
      getCwdPure(),
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

  public collectAllTestResults = (): any[] => {
    return this.testResultsCollector.collectAllTestResults();
  };

  public getProcessSummary = (): any => {
    return this.testResultsCollector.getProcessSummary();
  };

  private async startServiceLogging(
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ): Promise<void> {
    this.logProcesses = startServiceLoggingPure(
      serviceName,
      runtime,
      getCwdPure(),
      this.logProcesses,
      runtimeConfigKey,
    );
    this.writeConfigForExtension();
  }

  public async DC_upAll(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.up, {
      errorMessage: "docker compose up",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.up);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logError(`[Docker] docker compose up ❌ ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  public async DC_down(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.down, {
      errorMessage: "docker compose down",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.down);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logMessage(`[DC_down] Error during down: ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error stopping services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  public async DC_ps(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    return executeDockerComposeCommand(commands.ps, {
      useExec: true,
      execOptions: { cwd: getCwdPure() },
      errorMessage: "Error getting service status",
    });
  }

  public async DC_logs(
    serviceName: string,
    options?: { follow?: boolean; tail?: number },
  ): Promise<IDockerComposeResult> {
    const tail = options?.tail ?? 100;
    const commands = getDockerComposeCommandsPure();
    const command = commands.logs(serviceName, tail);
    return executeDockerComposeCommand(command, {
      useExec: true,
      execOptions: { cwd: getCwdPure() },
      errorMessage: `Error getting logs for ${serviceName}`,
    });
  }

  public async DC_configServices(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    return executeDockerComposeCommand(commands.config, {
      useExec: true,
      execOptions: { cwd: getCwdPure() },
      errorMessage: "Error getting services from config",
    });
  }

  public async DC_start(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.start, {
      errorMessage: "docker compose start",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.start);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logError(`[Docker] docker compose start ❌ ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  private async buildAiderImage(): Promise<void> {
    await this.aiderImageBuilder.buildAiderImage();
  }

  private async startBuilderServices(): Promise<void> {
    await this.builderServicesManager.startBuilderServices();
  }

  private async waitForAllTestsToComplete(): Promise<void> {
    await this.testCompletionWaiter.waitForAllTestsToComplete();
  }

  private logMessage(message: string): void {
    logMessagePure(message);
  }

  private logError(message: string, error?: any): void {
    if (error) {
      consoleError(`${message} ${error}`);
    } else {
      consoleError(message);
    }
  }

  private async bundleStakeholderApp(): Promise<void> {
    await this.stakeholderAppBundler.bundleStakeholderApp();
  }

  // public getAiderProcesses = (): any[] => {
  //   return getAiderProcessesPure(
  //     this.configs,
  //     this.getProcessSummary().processes,
  //   );
  // };

  // public handleAiderProcesses = (): any => {
  //   return handleAiderProcessesPure(this.configs, () =>
  //     this.getProcessSummary(),
  //   );
  // };

  // private async buildWithBuildKit(): Promise<void> {
  //   // First, build the aider image
  //   await this.buildAiderImage();

  //   await buildWithBuildKitPure(this.configs, (error: any) => {
  //     this.logError(error);
  //   });
  // }
}
