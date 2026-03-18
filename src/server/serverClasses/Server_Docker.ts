import fs, { existsSync, mkdirSync, readFileSync } from "fs";
import path, { join } from "path";
import type { IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import {
  entryContent,
  getInputFilePath,
  type IDockerComposeResult,
} from "./Server_Docker/Server_Docker_Constants";
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
  getInputFilesPure,
  getOutputFilesPure,
  getProcessSummaryPure,
  launchBddTestPure,
  launchChecksPure,
  loadInputFileOnce,
  startBuilderServicesPure,
  startServiceLoggingPure,
  updateOutputFilesList,
  waitForAllTestsToCompletePure,
} from "./Server_Docker/Server_Docker_Utils_Run";
import {
  buildWithBuildKitPure,
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
import { getTestResultsPure } from "./Server_Docker/Server_Docker_Utils_Run";
import * as esbuild from 'esbuild';

export class Server_Docker extends Server_WS {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
  inputFiles: any = {};
  outputFiles: any = {};

  // Store hashes for each test to detect which specific tests have changed
  // Structure: hashs[configKey][testName] = hash
  hashs: Record<string, Record<string, string>> = {};

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  generateServices(): Record<string, any> {
    return generateServicesPure(this.configs, this.mode);
  }

  async start() {
    // First, ensure the HTML report is set up
    // The Server class will handle this via embedConfigInHtml()
    await super.start();

    this.writeConfigForExtension();
    await this.setupDockerCompose();

    // Bundle stakeholder app (after HTML is created)
    await this.bundleStakeholderApp();

    getReportDirPure();

    await spawnPromise(getDockerComposeDownPure());
    await this.buildWithBuildKit();
    await this.startBuilderServices();

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      if (!this.inputFiles[configKey]) {
        this.inputFiles[configKey] = {};
      }

      for (const testName of tests) {
        if (!this.inputFiles[configKey][testName]) {
          this.inputFiles[configKey][testName] = [];
        }

        const reportDir = makeReportDirectory(testName, configKey)

        if (!existsSync(reportDir)) {
          mkdirSync(reportDir, { recursive: true });
        }

        if (this.mode === "dev") {
          this.watchInputFile(runtime, testName);
          this.watchOutputFile(runtime, testName, configKey);
        } else {
          this.loadInputFileOnce(runtime, testName, configKey);
        }

        await this.launchBddTest(runtime, testName, configKey, configValue);
        await this.launchChecks(runtime, testName, configKey, configValue);
      }
    }

    if (this.mode === "once") {
      try {
        await this.waitForAllTestsToComplete();
        exitProcessPure(0);
      } catch (error: any) {
        this.logError("[Server_Docker] Error in once mode:", error);
        exitProcessPure(1);
      }
    }
  }

  public async stop(): Promise<void> {
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      logProcess.process.kill("SIGTERM");
    }
    this.logProcesses.clear();

    const result = await this.DC_down();
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
    // temporarily disabled
    // 
    // await informAiderPure(
    //   runtime,
    //   testName,
    //   configKey,
    //   configValue,
    //   inputFiles,
    //   (serviceName, runtime) =>
    //     captureExistingLogs(serviceName, runtime, configKey),
    //   () => this.writeConfigForExtension(),
    // );
  }

  // each test has a bdd test to be launched when inputFiles.json changes
  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
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
    return getInputFilesPure(this.configs, this.inputFiles, runtime, testName);
  };

  public getOutputFiles = (runtime: string, testName: string): string[] => {
    const result = getOutputFilesPure(
      this.configs,
      this.outputFiles,
      runtime,
      testName,
    );

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

  // getDocumentationFiles is no longer needed since documentation files are embedded in HTML

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    return getTestResultsPure(runtime, testName)
  };

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

  public getProcessSummary = (): any => {
    return getProcessSummaryPure();
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

  private async bundleStakeholderApp(): Promise<void> {
    try {
      const entryPoint = join(process.cwd(), "testeranto", "reports", "index.tsx");
      const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

      // Check if there's a custom React component specified
      let customComponentPath = this.configs.stakeholderReactModule;

      if (customComponentPath) {
        // Read the custom component path and create an entry point that uses it
        const absolutePath = join(process.cwd(), customComponentPath);

        await fs.promises.writeFile(entryPoint, entryContent(absolutePath));
      } else {
        // Use the default entry point
        // Copy the default index.tsx if it doesn't exist
        if (!existsSync(entryPoint)) {
          const defaultEntry = join(__dirname, "index.tsx");
          if (existsSync(defaultEntry)) {
            await fs.promises.copyFile(defaultEntry, entryPoint);
          }
        }
      }

      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        format: "esm",
        platform: "browser",
        target: "es2020",
        jsx: "automatic",
        outfile: outfile,

      });

    } catch (error: any) {
      console.warn(`Failed to bundle stakeholder app: ${error.message}`);
    }
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

  private async buildWithBuildKit(): Promise<void> {
    await buildWithBuildKitPure(this.configs, (error: any) => {
      this.logError(error);
    });
  }

  private async startBuilderServices(): Promise<void> {
    await startBuilderServicesPure(
      this.configs,
      this.mode,
      (serviceName: string, runtime: string, runtimeConfigKey: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey),
    );
  }

  private async waitForAllTestsToComplete(): Promise<void> {
    await waitForAllTestsToCompletePure(() => this.getProcessSummary());
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
}
