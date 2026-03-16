import fs, { existsSync, mkdirSync, readFileSync } from "fs";
import path, { join } from "path";
import type { IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { getInputFilePath, type IDockerComposeResult } from "./Server_Docker/Server_Docker_Constants";
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
  captureExistingLogs,
  executeDockerComposeCommand,
  getAiderProcessesPure,
  getOutputFilesPure,
  getProcessSummaryPure,
  handleAiderProcessesPure,
  informAiderPure,
  launchBddTestPure,
  launchChecksPure,
  loadInputFileOnce,
  spawnPromise,
  startBuilderServicesPure,
  startServiceLoggingPure,
  updateOutputFilesList,
  waitForAllTestsToCompletePure,
  watchInputFilePure,
  watchOutputFilePure,
} from "./Server_Docker/Server_Docker_Utils_Run";
import {
  buildWithBuildKitPure,
  generateServicesPure,
  writeComposeFile,
  writeConfigForExtensionOnStop,
  writeConfigForExtensionPure,
} from "./Server_Docker/Server_Docker_Utils_Setup";
import { Server_WS } from "./Server_WS";

export class Server_Docker extends Server_WS {
  private logProcesses: Map<string, { process: any; serviceName: string }> =
    new Map();
  inputFiles: any = {};
  outputFiles: any = {};
  private mode: IMode;

  // Store hashes for each test to detect which specific tests have changed
  // Structure: hashs[configKey][testName] = hash
  hashs: Record<string, Record<string, string>> = {};

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.mode = mode;
  }

  generateServices(): Record<string, any> {
    return generateServicesPure(this.configs, this.mode);
  }

  async start() {
    await super.start();
    this.writeConfigForExtension();
    await this.setupDockerCompose();

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
        console.log(
          `[Server_Docker] Processing test: ${testName} for configKey=${configKey}, runtime=${runtime}`,
        );
        if (!this.inputFiles[configKey][testName]) {
          this.inputFiles[configKey][testName] = [];
        }

        // Create directory for test reports based on the entrypoint
        // Follow the pattern: testeranto/reports/{configKey}/{testName}/
        // where testName is the entrypoint path (e.g., "src/ts/Calculator.test.node.ts")
        // This ensures tests.json can be written to the correct location
        const cwd = getCwdPure();
        const cleanTestName = testName.replace(/^\.\//, '');
        const reportDir = join(cwd, "testeranto", "reports", configKey, cleanTestName);
        try {
          if (!existsSync(reportDir)) {
            mkdirSync(reportDir, { recursive: true });
            console.log(`[Server_Docker] Created report directory: ${reportDir}`);
          }
        } catch (error: any) {
          console.error(`[Server_Docker] Failed to create report directory ${reportDir}:`, error);
        }

        if (this.mode === "dev") {
          console.log(
            `[Server_Docker] Watching input file for ${configKey}/${testName}`,
          );
          this.watchInputFile(runtime, testName);
          this.watchOutputFile(runtime, testName, configKey);
        } else {
          console.log(
            `[Server_Docker] Loading input file once for ${configKey}/${testName}`,
          );
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
    this.logMessage("[Server_Docker] Stopping server...");

    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      logProcess.process.kill("SIGTERM");
      this.logMessage(
        `[Server_Docker] Stopped log process for container ${containerId} (${logProcess.serviceName})`,
      );
    }
    this.logProcesses.clear();

    const result = await this.DC_down();
    this.resourceChanged("/~/processes");
    writeConfigForExtensionOnStop();
    await super.stop();

    this.logMessage("[Server_Docker] Server stopped successfully");
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
    console.log(
      `[Server_Docker] loadInputFileOnce called with runtime="${runtime}", testName="${testName}", configKey="${configKey}"`,
    );
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
    console.log(
      `[Server_Docker] After loadInputFileOnce, inputFiles[${configKey}] keys:`,
      Object.keys(this.inputFiles[configKey] || {}),
    );
  }

  async watchInputFile(runtime: IRunTime, testsName: string) {
    console.log(
      `[Server_Docker] watchInputFile called with runtime="${runtime}", testsName="${testsName}"`,
    );
    console.log(
      `[Server_Docker] Before watchInputFilePure, inputFiles[${testsName}] would be in config key: ${runtime}`,
    );

    const result = await watchInputFilePure(
      runtime,
      testsName,
      this.configs,
      this.mode,
      this.inputFiles,
      this.hashs,
      (inputFiles, hashs) => {
        console.log(
          `[Server_Docker] watchInputFilePure callback: updating inputFiles`,
        );
        console.log(
          `[Server_Docker] Updated inputFiles keys:`,
          Object.keys(inputFiles),
        );
        // Check if our test name is in the updated inputFiles
        for (const configKey in inputFiles) {
          console.log(
            `[Server_Docker] inputFiles[${configKey}] keys:`,
            Object.keys(inputFiles[configKey] || {}),
          );
        }
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
    console.log(
      `[Server_Docker] After watchInputFile, inputFiles keys:`,
      Object.keys(this.inputFiles),
    );
    // Log detailed structure
    for (const key in this.inputFiles) {
      console.log(
        `[Server_Docker] inputFiles[${key}] has ${Object.keys(this.inputFiles[key] || {}).length} tests:`,
        Object.keys(this.inputFiles[key] || {}),
      );
    }
  }

  async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    inputFiles?: any,
  ) {
    await informAiderPure(
      runtime,
      testName,
      configKey,
      configValue,
      inputFiles,
      (serviceName, runtime) =>
        captureExistingLogs(serviceName, runtime, getCwdPure()),
      () => this.writeConfigForExtension(),
    );
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
        captureExistingLogs(serviceName, runtime, getCwdPure()),
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
        captureExistingLogs(serviceName, runtime, getCwdPure()),
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
    console.log(
      `[Server_Docker] getInputFiles called with runtime="${runtime}", testName="${testName}"`,
    );

    // First, try to find the config key that matches either runtime type or config key
    let configKey: string | null = null;

    // Check if runtime is a config key
    if (this.configs?.runtimes && this.configs.runtimes[runtime]) {
      configKey = runtime;
    } else {
      // Try to find by runtime type
      for (const [key, configValue] of Object.entries(
        this.configs?.runtimes || {},
      )) {
        const config = configValue as any;
        if (config.runtime === runtime) {
          configKey = key;
          break;
        }
      }
    }

    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime "${runtime}"`);
      return [];
    }

    console.log(`[Server_Docker] Using configKey: ${configKey}`);

    // Check if we have input files in memory for this configKey and testName
    if (this.inputFiles[configKey] && this.inputFiles[configKey][testName]) {
      const files = this.inputFiles[configKey][testName];
      console.log(
        `[Server_Docker] Found ${files.length} files in memory for ${configKey}/${testName}`,
      );
      return files;
    }

    // If not in memory, try to load from file
    console.log(
      `[Server_Docker] No files in memory, trying to load from input file`,
    );

    // Get the actual runtime type for file path
    const config = this.configs?.runtimes[configKey] as any;
    const runtimeType = config?.runtime || runtime;

    try {
      const inputFilePath = getInputFilePath(runtimeType, configKey);
      console.log(
        `[Server_Docker] Looking for input file at: ${inputFilePath}`,
      );

      if (existsSync(inputFilePath)) {
        const fileContent = readFileSync(inputFilePath, "utf-8");
        const allTestsInfo = JSON.parse(fileContent);

        if (allTestsInfo[testName]) {
          const testInfo = allTestsInfo[testName];
          const files = testInfo.files || [];
          console.log(
            `[Server_Docker] Loaded ${files.length} files from ${inputFilePath} for test ${testName}`,
          );

          // Store in memory for future use
          if (!this.inputFiles[configKey]) {
            this.inputFiles[configKey] = {};
          }
          this.inputFiles[configKey][testName] = files;

          return files;
        } else {
          console.log(
            `[Server_Docker] Test ${testName} not found in ${inputFilePath}`,
          );
          // Check what tests are available
          const availableTests = Object.keys(allTestsInfo);
          console.log(`[Server_Docker] Available tests:`, availableTests);

          // Try to find a matching test name
          for (const availableTest of availableTests) {
            if (
              availableTest.includes(testName) ||
              testName.includes(availableTest)
            ) {
              console.log(
                `[Server_Docker] Found similar test: ${availableTest}`,
              );
              const testInfo = allTestsInfo[availableTest];
              const files = testInfo.files || [];

              // Store in memory
              if (!this.inputFiles[configKey]) {
                this.inputFiles[configKey] = {};
              }
              this.inputFiles[configKey][testName] = files;

              return files;
            }
          }
        }
      } else {
        console.log(
          `[Server_Docker] Input file does not exist: ${inputFilePath}`,
        );
      }
    } catch (error: any) {
      console.log(`[Server_Docker] Error loading input file: ${error.message}`);
    }

    console.log(
      `[Server_Docker] Returning empty array for ${configKey}/${testName}`,
    );
    return [];
  };

  public getOutputFiles = (runtime: string, testName: string): string[] => {
    console.log(
      `[Server_Docker] getOutputFiles called for ${runtime}/${testName}`,
    );
    console.log(
      `[Server_Docker] outputFiles keys:`,
      Object.keys(this.outputFiles),
    );

    const result = getOutputFilesPure(
      this.configs,
      this.outputFiles,
      runtime,
      testName,
    );

    console.log(
      `[Server_Docker] getOutputFilesPure returned ${result?.length || 0} files`,
    );
    if (result && result.length > 0) {
      console.log(`[Server_Docker] Files:`, result);
    } else {
      console.log(
        `[Server_Docker] No output files found in memory, checking directory...`,
      );
      // Check if there are any files in the output directory
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
    }

    return result || [];
  };

  public getTestResults = (runtime?: string, testName?: string): any[] => {
    console.log(
      `[Server_Docker] getTestResults called with runtime="${runtime}", testName="${testName}"`,
    );

    const testResults: any[] = [];
    const cwd = process.cwd();

    // If both runtime and testName are provided, look for specific test results
    if (runtime && testName) {
      console.log(
        `[Server_Docker] Looking for specific test results for ${runtime}/${testName}`,
      );

      // Look for test result files in the output directory
      const outputDir = path.join(cwd, "testeranto", "reports", runtime);
      console.log(`[Server_Docker] Looking for test results in: ${outputDir}`);

      if (!fs.existsSync(outputDir)) {
        console.log(
          `[Server_Docker] Output directory does not exist: ${outputDir}`,
        );
        return [];
      }

      // Get all JSON files in the output directory
      const files = fs
        .readdirSync(outputDir)
        .filter((file) => file.endsWith(".json"));
      console.log(
        `[Server_Docker] Found ${files.length} JSON files in output directory`,
      );

      // Create multiple patterns to match different naming conventions
      const patterns = [
        // Original pattern
        testName.replace("/", "_").replace(".", "-"),
        // Pattern with config key (if available)
        `${runtime}.${testName.replace("/", "_").replace(".", "-")}`,
        // Just the filename without path
        path.basename(testName).replace(".", "-"),
        // Try to match any file that contains parts of the test name
        testName.split("/").pop()?.replace(".", "-") || "",
      ].filter((pattern) => pattern.length > 0);

      console.log(
        `[Server_Docker] Looking for files matching patterns:`,
        patterns,
      );

      for (const file of files) {
        console.log(`[Server_Docker] Checking file: ${file}`);
        let matches = false;

        // Check if file matches any pattern
        for (const pattern of patterns) {
          if (pattern && file.includes(pattern)) {
            matches = true;
            break;
          }
        }

        // Also check if file starts with runtime (common pattern)
        if (!matches && file.startsWith(`${runtime}.`)) {
          const withoutRuntime = file.substring(runtime.length + 1);
          const testNameWithoutExt = testName.replace(/\.[^/.]+$/, "");
          const testNamePattern = testNameWithoutExt
            .replace("/", "_")
            .replace(".", "-");
          if (withoutRuntime.includes(testNamePattern)) {
            matches = true;
          }
        }

        if (matches) {
          try {
            const filePath = path.join(outputDir, file);
            console.log(
              `[Server_Docker] Reading test result file: ${filePath}`,
            );
            const content = fs.readFileSync(filePath, "utf-8");
            const result = JSON.parse(content);
            testResults.push({
              file,
              result,
              runtime,
            });
            console.log(`[Server_Docker] Added test result from ${file}`);
          } catch (error) {
            console.error(
              `[Server_Docker] Error reading test result file ${file}:`,
              error,
            );
          }
        }
      }
    } else {
      // If no parameters, get all test results from all runtimes
      console.log(`[Server_Docker] Getting all test results`);

      const reportsDir = path.join(cwd, "testeranto", "reports");
      console.log(
        `[Server_Docker] Looking in reports directory: ${reportsDir}`,
      );

      if (!fs.existsSync(reportsDir)) {
        console.log(
          `[Server_Docker] Reports directory does not exist: ${reportsDir}`,
        );
        return [];
      }

      // Get all runtime directories
      const runtimeDirs = fs.readdirSync(reportsDir).filter((item) => {
        const itemPath = path.join(reportsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      console.log(
        `[Server_Docker] Found ${runtimeDirs.length} runtime directories:`,
        runtimeDirs,
      );

      for (const runtimeDir of runtimeDirs) {
        const runtimePath = path.join(reportsDir, runtimeDir);
        const files = fs
          .readdirSync(runtimePath)
          .filter((file) => file.endsWith(".json"));

        console.log(
          `[Server_Docker] Found ${files.length} JSON files in ${runtimeDir}`,
        );

        for (const file of files) {
          try {
            const filePath = path.join(runtimePath, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const result = JSON.parse(content);

            // Extract test name from filename
            let testNameFromFile = file.replace(".json", "");
            // Remove runtime prefix if present
            if (testNameFromFile.startsWith(`${runtimeDir}.`)) {
              testNameFromFile = testNameFromFile.substring(
                runtimeDir.length + 1,
              );
            }

            testResults.push({
              file,
              result,
              runtime: runtimeDir,
              testName: testNameFromFile,
            });
          } catch (error) {
            console.error(
              `[Server_Docker] Error reading test result file ${file}:`,
              error,
            );
          }
        }
      }
    }

    console.log(`[Server_Docker] Returning ${testResults.length} test results`);
    return testResults;
  };

  public getAiderProcesses = (): any[] => {
    return getAiderProcessesPure(
      this.configs,
      this.getProcessSummary().processes,
    );
  };

  public handleAiderProcesses = (): any => {
    return handleAiderProcessesPure(this.configs, () =>
      this.getProcessSummary(),
    );
  };

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
