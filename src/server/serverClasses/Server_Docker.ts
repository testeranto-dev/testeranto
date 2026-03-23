import fs, { existsSync, mkdirSync, readFileSync } from "fs";
import path, { join } from "path";
import { execSync } from "child_process";
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

        // Create aider message file for the test
        await this.createAiderMessageFile(runtime, testName, configKey, configValue);

        await this.launchBddTest(runtime, testName, configKey, configValue);
        await this.launchChecks(runtime, testName, configKey, configValue);
      }
    }

    if (this.mode === "once") {
      try {
        await this.waitForAllTestsToComplete();
        
        // Give extra time for any pending I/O operations (like screenshots) to complete
        this.logMessage("[Server_Docker] Tests completed, waiting for pending operations...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Stop all services to ensure clean exit
        await this.stop();
        
        exitProcessPure(0);
      } catch (error: any) {
        this.logError("[Server_Docker] Error in once mode:", error);
        // Still try to stop services
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
        this.logError(`[Server_Docker] Error stopping log process ${containerId}:`, error);
      }
    }
    
    // Wait a bit for log processes to finish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.logProcesses.clear();

    // Stop Docker services
    const result = await this.DC_down();
    
    // Wait for Docker services to fully stop
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    await this.createAiderMessageFile(runtime, testName, configKey, configValue);
  }

  private async createAiderMessageFile(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    try {
      // Use the same logic as makeReportDirectory for consistency
      const reportDir = makeReportDirectory(testName, configKey);

      // Ensure the directory exists
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Create the aider message file path
      const messageFilePath = path.join(reportDir, "aider-message.txt");

      // Get input files for this specific test
      const inputFilesForTest = this.getInputFilesForTest(configKey, testName);
      // Get output files for this specific test
      const outputFilesForTest = this.getOutputFilesForTest(configKey, testName);

      // Build the message content
      let messageContent = "";
      
      // Add input files (source files)
      if (inputFilesForTest.length > 0) {
        messageContent += inputFilesForTest.map(file => `/add ${file}`).join('\n') + '\n\n';
      }
      
      // Add output files (logs, results)
      if (outputFilesForTest.length > 0) {
        messageContent += outputFilesForTest.map(file => `/read ${file}`).join('\n') + '\n\n';
      }
      
      messageContent += "Observe these logs and apply.\n\n";

      fs.writeFileSync(messageFilePath, messageContent);

      this.logMessage(`[Server_Docker] Created aider message file at ${messageFilePath}`);
    } catch (error: any) {
      this.logError(`[Server_Docker] Failed to create aider message file:`, error);
    }
  }

  private getInputFilesForTest(configKey: string, testName: string): string[] {
    // this.inputFiles is structured as: { [configKey]: { [testName]: string[] } }
    if (!this.inputFiles[configKey]) {
      return [];
    }
    if (!this.inputFiles[configKey][testName]) {
      return [];
    }
    // Ensure it's an array
    const files = this.inputFiles[configKey][testName];
    return Array.isArray(files) ? files : [];
  }

  private getOutputFilesForTest(configKey: string, testName: string): string[] {
    const files: string[] = [];
    const cwd = process.cwd();
    
    // Add files from this.outputFiles structure
    if (this.outputFiles[configKey] && this.outputFiles[configKey][testName]) {
      const outputFiles = this.outputFiles[configKey][testName];
      if (Array.isArray(outputFiles)) {
        files.push(...outputFiles);
      }
    }
    
    // Get the base report directory for this configKey
    const baseReportDir = path.join(cwd, "testeranto", "reports", configKey);
    
    // Scan for all files in the base report directory
    const scanAllFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) {
        return;
      }
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          // Always scan subdirectories
          scanAllFiles(fullPath);
        } else {
          // Add all files
          files.push(fullPath);
        }
      }
    };
    
    // Scan the base report directory
    if (fs.existsSync(baseReportDir)) {
      scanAllFiles(baseReportDir);
    }
    
    // Also scan for files in the parent directory (testeranto/reports/)
    const parentDir = path.join(cwd, "testeranto", "reports");
    if (fs.existsSync(parentDir)) {
      const parentItems = fs.readdirSync(parentDir, { withFileTypes: true });
      for (const item of parentItems) {
        const fullPath = path.join(parentDir, item.name);
        // Include files directly in reports/ directory (like build.log)
        if (item.isFile()) {
          files.push(fullPath);
        }
      }
    }
    
    // Remove duplicates and sort for consistency
    return [...new Set(files)].sort();
  }

  // each test has a bdd test to be launched when inputFiles.json changes
  async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) {
    // Create aider message file when test is launched
    await this.createAiderMessageFile(runtime, testName, configKey, configValue);

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
    await this.createAiderMessageFile(runtime, testName, configKey, configValue);

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
    // First, build the aider image
    await this.buildAiderImage();
    
    await buildWithBuildKitPure(this.configs, (error: any) => {
      this.logError(error);
    });
  }

  private async buildAiderImage(): Promise<void> {
    try {
      const dockerfilePath = path.join(process.cwd(), "aider.Dockerfile");
      
      // Check if the aider.Dockerfile exists
      if (!fs.existsSync(dockerfilePath)) {
        this.logMessage(`[Server_Docker] ⚠️ aider.Dockerfile not found at ${dockerfilePath}. Creating default.`);
        
        const defaultAiderDockerfile = `FROM python:3.11-slim
WORKDIR /workspace
RUN pip install --no-cache-dir aider-chat
# Create a non-root user for security
RUN useradd -m -u 1000 aider && chown -R aider:aider /workspace
USER aider
# Default command keeps container running
CMD ["tail", "-f", "/dev/null"]`;

        fs.writeFileSync(dockerfilePath, defaultAiderDockerfile);
        this.logMessage(`[Server_Docker] Created default ${dockerfilePath}`);
      }
      
      // Build the aider image
      this.logMessage(`[Server_Docker] Building aider image...`);
      execSync(`docker build -t testeranto-aider:latest -f ${dockerfilePath} .`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      this.logMessage(`[Server_Docker] ✅ Aider image built successfully`);
    } catch (error: any) {
      this.logError(`[Server_Docker] ❌ Aider image build failed:`, error);
      this.logMessage(`[Server_Docker] Aider services may not work, but continuing with other builds`);
    }
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
    
    // Additional wait to ensure all async operations (like screenshots) are complete
    // Check if there are any active processes still running
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds
    const checkInterval = 1000; // Check every second
    
    while (attempts < maxAttempts) {
      const summary = this.getProcessSummary();
      const activeProcesses = summary.processes?.filter((p: any) => p.isActive === true) || [];
      
      if (activeProcesses.length === 0) {
        // Also check if there are any pending operations in logProcesses
        if (this.logProcesses.size === 0) {
          break;
        }
      }
      
      this.logMessage(`[Server_Docker] Waiting for ${activeProcesses.length} active processes and ${this.logProcesses.size} log processes to complete...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      this.logMessage(`[Server_Docker] Timeout waiting for all processes to complete`);
    } else {
      this.logMessage(`[Server_Docker] All processes completed`);
    }
    
    // Wait specifically for screenshot files to be written
    // Check for any pending screenshot operations in the reports directory
    this.logMessage(`[Server_Docker] Checking for pending screenshot operations...`);
    await this.waitForScreenshots();
    
    // Final delay to ensure any pending I/O operations are flushed
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async waitForScreenshots(): Promise<void> {
    // Look for screenshot files in the reports directory
    const reportsDir = path.join(process.cwd(), "testeranto", "reports");
    if (!fs.existsSync(reportsDir)) {
      return;
    }
    
    // Maximum time to wait for screenshots (30 seconds)
    const maxWaitTime = 30000;
    const checkInterval = 1000;
    let elapsed = 0;
    
    while (elapsed < maxWaitTime) {
      // Find all .png files that might be in the process of being written
      const pngFiles: string[] = [];
      const findPngFiles = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            findPngFiles(fullPath);
          } else if (item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg')) {
            pngFiles.push(fullPath);
          }
        }
      };
      
      findPngFiles(reportsDir);
      
      // Check if any files are still being written by checking file modification times
      const now = Date.now();
      let anyRecentFiles = false;
      for (const file of pngFiles) {
        try {
          const stats = fs.statSync(file);
          // If file was modified in the last 2 seconds, it might still be writing
          if (now - stats.mtimeMs < 2000) {
            anyRecentFiles = true;
            this.logMessage(`[Server_Docker] Screenshot file ${file} was modified recently, waiting...`);
            break;
          }
        } catch (error) {
          // File might have been deleted, ignore
        }
      }
      
      if (!anyRecentFiles) {
        this.logMessage(`[Server_Docker] No recent screenshot files found, continuing...`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
    }
    
    if (elapsed >= maxWaitTime) {
      this.logMessage(`[Server_Docker] Timeout waiting for screenshots to complete`);
    } else {
      this.logMessage(`[Server_Docker] Screenshot operations completed`);
    }
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
