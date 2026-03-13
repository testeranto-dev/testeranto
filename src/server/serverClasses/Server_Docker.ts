// Define __promiseAll to prevent ReferenceError in bundled code
// This is a workaround for Bun bundler potentially transforming Promise.all
const __promiseAll = Promise.all.bind(Promise);

import ansiColors from "ansi-colors";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { RUN_TIMES } from "../../runtimes";
import type { ICheck, IChecks, IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { BuildKitBuilder } from "../buildkit/BuildKit_Utils";
import { nodeBuildKitBuild } from "../runtimes/node/docker";
import { webBuildKitBuild, chromeServiceConfig } from "../runtimes/web/docker";
import { golangBuildKitBuild } from "../runtimes/golang/docker";
import { rubyBuildKitBuild } from "../runtimes/ruby/docker";
import { rustBuildKitBuild } from "../runtimes/rust/docker";
import { javaBuildKitBuild } from "../runtimes/java/docker";
import { pythonBuildKitBuild } from "../runtimes/python/docker";
import {
  BaseCompose,
  staticTestDockerComposeFile,
  bddTestDockerComposeFile,
  aiderDockerComposeFile,
  cleanTestName,
  DC_COMMANDS,
  DOCKER_COMPOSE_BASE,
  DOCKER_COMPOSE_DOWN,
  DOCKER_COMPOSE_LOGS,
  DOCKER_COMPOSE_UP,
  executeDockerComposeCommand,
  generateUid,
  getAiderServiceName,
  getBddServiceName,
  getBuilderServiceName,
  getCheckServiceName,
  getContainerExitCodeFilePath,
  getContainerInspectFormat,
  getExitCodeFilePath,
  getFullReportDir,
  getInputFilePath,
  getLogFilePath,
  getRuntimeLabel,
  getStatusFilePath,
  isContainerActive,
  runTimeToCompose,
  spawnPromise,
  captureContainerExitCode,
  captureExistingLogs,
  type IDockerComposeResult,
  type IService,
  writeConfigForExtensionOnStop,
  writeComposeFile,
} from "./Server_Docker_Utils";
import { Server_WS } from "./Server_WS";

export class Server_Docker extends Server_WS {
  private logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  inputFiles: any = {};
  outputFiles: any = {};
  private mode: IMode;

  // Store hashes for each test to detect which specific tests have changed
  // Structure: hashs[configKey][testName] = hash
  hashs: Record<string, Record<string, string>> = {}

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.mode = mode;
  }

  generateServices(
    // config: IBuiltConfig,
  ): Record<string, any> {

    const services: IService = {};

    // Track which runtimes we've already added builder services for
    const processedRuntimes = new Set<IRunTime>();

    // Check if web runtime is present to add Chrome service
    let hasWebRuntime = false;

    // Iterate through each entry in the config Map
    for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {

      const runtime: IRunTime = runtimeTests.runtime as IRunTime;
      const dockerfile = runtimeTests.dockerfile;
      const buildOptions = runtimeTests.buildOptions;
      const testsObj = runtimeTests.tests;
      const checks: IChecks = runtimeTests.checks;

      // Only process if runtime is valid
      if (!RUN_TIMES.includes(runtime)) {
        throw `unknown runtime ${runtime}`;
      }

      // Track if web runtime is present
      if (runtime === 'web') {
        hasWebRuntime = true;
      }

      // Check if BuildKit is configured for this runtime
      const hasBuildKitOptions = runtimeTests.buildKitOptions !== undefined;

      // We require BuildKit for all builds
      if (!hasBuildKitOptions) {
        console.warn(`[Server_Docker] Warning: No BuildKit options configured for ${runtimeTestsName}. ` +
          `BuildKit is required for all builds.`);
      }

      // We need builder services to create test bundles
      // They'll use either the build field (traditional) or image field (BuildKit)
      if (!processedRuntimes.has(runtime)) {
        processedRuntimes.add(runtime);

        // Create builder service using the appropriate compose function
        const builderServiceName = getBuilderServiceName(runtime);
        const composeFunc = runTimeToCompose[runtime][0];

        // We need to determine the config paths
        // For now, use reasonable defaults
        const projectConfigPath = 'testeranto/testeranto.ts';
        const runtimeConfigPath = buildOptions;

        // Create the service
        services[builderServiceName] = composeFunc(
          this.configs,
          builderServiceName,
          projectConfigPath,
          runtimeConfigPath,
          runtimeTestsName
        );

        // Pass the mode to builder containers
        if (!services[builderServiceName].environment) {
          services[builderServiceName].environment = {};
        }
        services[builderServiceName].environment.MODE = this.mode;

        // If using BuildKit, replace build with image
        if (runtimeTests.buildKitOptions) {
          // Remove build field and add image field
          delete services[builderServiceName].build;
          services[builderServiceName].image = `testeranto-${runtime}-${runtimeTestsName}:latest`;
        }

        console.log(`[Server_Docker] Added builder service: ${builderServiceName} for ${runtime}`);
      }

      // Add BDD and aider services for each test
      for (const tName of testsObj) {
        // Clean the test name for use in container names
        const cleanedTestName = cleanTestName(tName);

        // Generate UID using the runtimeTestsName (e.g., 'nodeTests') and clean test name
        const uid = `${runtimeTestsName.toLowerCase()}-${cleanedTestName}`;

        // Add BDD service for this test
        const bddCommandFunc = runTimeToCompose[runtime][2];

        let f;
        if (runtime === "node" || runtime === "web") {
          f = tName.split('.').slice(0, -1).concat('mjs').join('.')
        } else {
          f = tName
        }

        const bddCommand = bddCommandFunc(f, buildOptions, runtimeTestsName);

        console.log(`[Server_Docker] [generateServices] ${runtimeTestsName} BDD command: "${bddCommand}"`);

        services[getBddServiceName(uid)] = bddTestDockerComposeFile(this.configs, runtime, getBddServiceName(uid), bddCommand);
        services[getAiderServiceName(uid)] = aiderDockerComposeFile(getAiderServiceName(uid));

        // Remove expose for web BDD services since Chrome is separate
        // Web BDD services don't need to expose Chrome ports anymore

        // iterate over checks to make services for each check
        checks.forEach((check: ICheck, ndx) => {
          // Call the check function to get the command string
          // We need to pass appropriate arguments - for now, pass an empty array
          const command = check([]);
          services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(
            runtime, getCheckServiceName(uid, ndx), command, this.configs, runtimeTestsName
          );
        })
      }
    }

    // Add Chrome service if web runtime is present
    if (hasWebRuntime) {
      services['chrome-service'] = chromeServiceConfig();
    }

    // Ensure all services use the same network configuration
    for (const serviceName in services) {
      if (!services[serviceName].networks) {
        services[serviceName].networks = ["allTests_network"];
      }
    }

    return services;
  }

  async start() {
    await super.start();

    // Write configuration to a JSON file for the VS Code extension to read
    this.writeConfigForExtension();
    await this.setupDockerCompose();

    // Ensure base reports directory exists
    const baseReportsDir = path.join(process.cwd(), "testeranto", "reports");
    try {
      fs.mkdirSync(baseReportsDir, { recursive: true });
      console.log(`[Server_Docker] Created base reports directory: ${baseReportsDir}`);
    } catch (error: any) {
      console.error(`[Server_Docker] Failed to create base reports directory ${baseReportsDir}: ${error.message}`);
    }

    const downCmd = DOCKER_COMPOSE_DOWN;
    await spawnPromise(downCmd);

    console.log('[Server_Docker] Building all runtimes with BuildKit');
    await this.buildWithBuildKit();

    // BuildKit builds images directly, but we still need builder services
    // to create test bundles. The builder services will use the BuildKit-built images.

    // Start all builder services to create test bundles
    console.log('[Server_Docker] Starting builder services to create test bundles');
    await this.startBuilderServices();

    // enumerate over runtimes and tests, running the bdd and static checks
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      // Initialize the configKey in inputFiles if it doesn't exist
      if (!this.inputFiles[configKey]) {
        this.inputFiles[configKey] = {};
      }

      for (const testName of tests) {
        // Initialize the testName entry if it doesn't exist
        if (!this.inputFiles[configKey][testName]) {
          this.inputFiles[configKey][testName] = [];
        }

        // In dev mode, watch for input file changes
        if (this.mode === 'dev') {
          this.watchInputFile(runtime, testName);
        } else {
          // In once mode, just load the input files once
          this.loadInputFileOnce(runtime, testName, configKey);
        }

        // Also watch for output files (only in dev mode)
        if (this.mode === 'dev') {
          this.watchOutputFile(runtime, testName, configKey);
        }

        // Launch tests and wait for them to start
        await this.launchBddTest(runtime, testName, configKey, configValue);
        await this.launchChecks(runtime, testName, configKey, configValue);
      }
    }

    // In once mode, wait for all tests to complete and then shut down
    if (this.mode === 'once') {
      try {
        console.log('[Server_Docker] Once mode: Waiting for tests to complete...');
        await this.waitForAllTestsToComplete();

        console.log('[Server_Docker] Once mode: All tests completed. Exiting now.');
        process.exit(0);
      } catch (error: any) {
        console.error('[Server_Docker] Error in once mode shutdown:', error);
        process.exit(1);
      }
    }
  }

  // Watch for output files in the reports directory
  async watchOutputFile(runtime: IRunTime, testName: string, configKey: string) {
    // Create the output directory path
    const outputDir = getFullReportDir(process.cwd(), runtime);

    // Initialize the output files structure
    if (!this.outputFiles[configKey]) {
      this.outputFiles[configKey] = {};
    }
    if (!this.outputFiles[configKey][testName]) {
      this.outputFiles[configKey][testName] = [];
    }

    console.log(`[Server_Docker] Setting up output file watcher for: ${outputDir} (configKey: ${configKey}, test: ${testName})`);

    // Read initial files if they exist
    this.updateOutputFilesList(configKey, testName, outputDir);

    // Only watch in dev mode
    if (this.mode === 'dev') {
      fs.watch(outputDir, (eventType, filename) => {
        if (filename) {
          console.log(`[Server_Docker] Output directory changed: ${eventType} ${filename} in ${outputDir}`);
          this.updateOutputFilesList(configKey, testName, outputDir);

          // Notify clients via WebSocket
          this.resourceChanged('/~/outputfiles');
        }
      });
    }
  }

  // Update the list of output files for a test
  private updateOutputFilesList(configKey: string, testName: string, outputDir: string) {
    try {
      const files = fs.readdirSync(outputDir);
      // Filter files that belong to this test (e.g., contain test name in filename)
      const testFiles = files.filter(file =>
        file.includes(testName.replace('/', '_').replace('.', '-')) ||
        file.includes(`${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`)
      );

      // Store relative paths from the project root
      const projectRoot = process.cwd();
      const relativePaths = testFiles.map(file => {
        const absolutePath = path.join(outputDir, file);
        // Make path relative to project root
        let relativePath = path.relative(projectRoot, absolutePath);
        // Normalize to forward slashes for consistency
        relativePath = relativePath.split(path.sep).join('/');
        // Ensure it starts with './' to indicate it's relative
        return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      });

      this.outputFiles[configKey][testName] = relativePaths;

      console.log(`[Server_Docker] Updated output files for ${configKey}/${testName}: ${relativePaths.length} files`);
      if (relativePaths.length > 0) {
        console.log(`[Server_Docker] Sample output file: ${relativePaths[0]}`);
      }
    } catch (error: any) {
      console.error(`[Server_Docker] Failed to read output directory ${outputDir}:`, error.message);
      this.outputFiles[configKey][testName] = [];
    }
  }

  // Load input file once without setting up a watcher
  private loadInputFileOnce(runtime: IRunTime, testName: string, configKey: string): void {
    let inputFilePath: string;
    try {
      inputFilePath = getInputFilePath(runtime, configKey);
    } catch (error: any) {
      console.warn(`[Server_Docker] Could not get input file path for ${runtime}/${configKey}: ${error.message}`);
      return;
    }

    console.log(`[Server_Docker] Loading input file once: ${inputFilePath} (configKey: ${configKey})`);

    // Initialize the structure if needed
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }

    // Read file content if it exists
    if (fs.existsSync(inputFilePath)) {
      try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        const allTestsInfo = JSON.parse(fileContent);
        // Extract the specific test's information
        if (allTestsInfo[testName]) {
          const testInfo = allTestsInfo[testName];
          this.inputFiles[configKey][testName] = testInfo.files || [];
          // Store the hash
          if (!this.hashs[configKey]) {
            this.hashs[configKey] = {};
          }
          this.hashs[configKey][testName] = testInfo.hash || '';
          console.log(`[Server_Docker] Loaded ${testInfo.files?.length || 0} input files for ${testName} from ${inputFilePath}, hash: ${testInfo.hash || 'none'}`);
        } else {
          console.warn(`[Server_Docker] Test ${testName} not found in ${inputFilePath}`);
          this.inputFiles[configKey][testName] = [];
          // Initialize hash if needed
          if (!this.hashs[configKey]) {
            this.hashs[configKey] = {};
          }
          this.hashs[configKey][testName] = '';
        }
      } catch (error: any) {
        console.warn(`[Server_Docker] Failed to read input file ${inputFilePath}: ${error.message}`);
      }
    } else {
      console.log(`[Server_Docker] Input file does not exist: ${inputFilePath}`);
    }
  }

  // when the input file changes, launch the tests
  async watchInputFile(runtime: IRunTime, testsName: string) {
    // Find the config key for this runtime and test
    let configKey: string = "";
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
        configKey = key;
        break;
      }
    }

    let inputFilePath: string;
    try {
      inputFilePath = getInputFilePath(runtime, configKey);
    } catch (error: any) {
      console.warn(`[Server_Docker] Could not get input file path for ${runtime}/${configKey}: ${error.message}`);
      return;
    }

    console.log(`[Server_Docker] 👀 Setting up file watcher for: ${inputFilePath} (configKey: ${configKey})`);
    console.log(`[Server_Docker]   Runtime: ${runtime}, Test: ${testsName}`);
    console.log(`[Server_Docker]   Mode: ${this.mode}`);

    // Initialize the structure if needed
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }

    // Read initial file content if it exists
    if (fs.existsSync(inputFilePath)) {
      try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        const allTestsInfo = JSON.parse(fileContent);
        // Extract the specific test's information
        if (allTestsInfo[testsName]) {
          const testInfo = allTestsInfo[testsName];
          this.inputFiles[configKey][testsName] = testInfo.files || [];
          // Store the hash
          if (!this.hashs[configKey]) {
            this.hashs[configKey] = {};
          }
          this.hashs[configKey][testsName] = testInfo.hash || '';
          console.log(`[Server_Docker] 📖 Loaded ${testInfo.files?.length || 0} input files for ${testsName} from ${inputFilePath}, hash: ${testInfo.hash || 'none'}`);
          if (testInfo.files && testInfo.files.length > 0) {
            console.log(`[Server_Docker]   Files: ${testInfo.files.slice(0, 3).map(f => path.basename(f)).join(', ')}${testInfo.files.length > 3 ? '...' : ''}`);
          }
        } else {
          console.warn(`[Server_Docker] ⚠️ Test ${testsName} not found in ${inputFilePath}`);
          this.inputFiles[configKey][testsName] = [];
          // Initialize hash if needed
          if (!this.hashs[configKey]) {
            this.hashs[configKey] = {};
          }
          this.hashs[configKey][testsName] = '';
        }
      } catch (error: any) {
        console.warn(`[Server_Docker] ⚠️ Failed to read input file ${inputFilePath}: ${error.message}`);
      }
    } else {
      console.log(`[Server_Docker] 📭 Input file does not exist yet: ${inputFilePath}`);
      console.log(`[Server_Docker]   Tests will be triggered when this file is created.`);
    }

    // Only set up file watcher in dev mode
    if (this.mode === 'dev') {
      try {
        fs.watchFile(inputFilePath, (curr, prev) => {
          console.log(`[Server_Docker] 🔄 Input file changed: ${inputFilePath}`);
          console.log(`[Server_Docker] 📊 Previous mtime: ${prev.mtime}, Current mtime: ${curr.mtime}`);

          // Check if file exists before trying to read it
          if (!fs.existsSync(inputFilePath)) {
            console.log(`[Server_Docker] ⚠️ Input file no longer exists: ${inputFilePath}`);
            return;
          }

          try {
            const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
            const allTestsInfo = JSON.parse(fileContent);
            // Extract the specific test's information
            if (allTestsInfo[testsName]) {
              const testInfo = allTestsInfo[testsName];
              const newHash = testInfo.hash || '';
              const oldHash = this.hashs[configKey!]?.[testsName] || '';
              
              // Update stored hash and input files
              this.inputFiles[configKey!][testsName] = testInfo.files || [];
              if (!this.hashs[configKey!]) {
                this.hashs[configKey!] = {};
              }
              this.hashs[configKey!][testsName] = newHash;
              
              console.log(`[Server_Docker] 📄 Updated input files for ${configKey}/${testsName}: ${testInfo.files?.length || 0} files`);
              console.log(`[Server_Docker]   Old hash: ${oldHash}, New hash: ${newHash}`);

              this.resourceChanged('/~/inputfiles');

              // Only trigger tests if the hash has changed
              if (newHash !== oldHash) {
                console.log(`[Server_Docker] 🔄 Hash changed for ${testsName}, triggering tests...`);
                // Find the configuration for this runtime and test
                for (const [ck, configValue] of Object.entries(this.configs.runtimes)) {
                  if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
                    console.log(`[Server_Docker] 🚀 Triggering tests for ${runtime}/${testsName} (config: ${ck})`);
                    console.log(`[Server_Docker]   ↳ Launching BDD test...`);
                    this.launchBddTest(runtime, testsName, ck, configValue);
                    console.log(`[Server_Docker]   ↳ Launching checks...`);
                    this.launchChecks(runtime, testsName, ck, configValue);
                    console.log(`[Server_Docker]   ↳ Informing aider...`);
                    this.informAider(runtime, testsName, ck, configValue, testInfo.files);
                    console.log(`[Server_Docker] ✅ All tests triggered for ${runtime}/${testsName}`);
                    break;
                  }
                }
              } else {
                console.log(`[Server_Docker] ⏭️ Hash unchanged for ${testsName}, skipping test execution`);
              }
            } else {
              console.warn(`[Server_Docker] ⚠️ Test ${testsName} not found in ${inputFilePath}`);
            }
          } catch (error: any) {
            console.error(`[Server_Docker] ❌ Failed to read or parse input file ${inputFilePath}: ${error.message}`);
          }
        });
      } catch (e: any) {
        console.error(`[Server_Docker] ❌ Failed to watch file ${inputFilePath}: ${e.message}`);
      }
    } else {
      // In once mode, just load the file once
      this.loadInputFileOnce(runtime, testsName, configKey!);
    }
  }

  // Alert the aider process that the context should be updated
  async informAider(runtime: IRunTime, testName: string, configKey: string, configValue: any, inputFiles?: any) {
    // Generate the UID exactly as in generateServices
    const uid = generateUid(configKey, testName);
    const aiderServiceName = getAiderServiceName(uid);

    console.log(`[Server_Docker] Informing aider service: ${aiderServiceName} about updated input files`);

    try {
      // First, get the container ID for the aider service
      const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${aiderServiceName}`;
      const containerId = execSync(containerIdCmd, {
        encoding: 'utf-8'
      }).toString().trim();

      if (!containerId) {
        console.error(`[Server_Docker] No container found for aider service: ${aiderServiceName}`);
        return;
      }

      console.log(`[Server_Docker] Found container ID: ${containerId} for ${aiderServiceName}`);

      // Read the input files content
      const inputFilesPath = `testeranto/bundles/${runtime}/${testName}-inputFiles.json`;
      let inputContent = '';
      try {
        inputContent = fs.readFileSync(inputFilesPath, 'utf-8');
        console.log(`[Server_Docker] Read input files from ${inputFilesPath}, length: ${inputContent.length}`);
      } catch (error: any) {
        console.error(`[Server_Docker] Failed to read input files: ${error.message}`);
        // Continue with empty content
      }

      // Send the input content to the aider process's stdin
      // We'll use docker exec to write to the main process's stdin (PID 1)
      // The -i flag keeps stdin open, and we pipe the content
      const sendInputCmd = `echo ${JSON.stringify(inputContent)} | docker exec -i ${containerId} sh -c 'cat > /proc/1/fd/0'`;
      console.log(`[Server_Docker] Executing command to send input to aider process`);

      try {
        execSync(sendInputCmd, {
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        console.log(`[Server_Docker] Successfully sent input to aider process`);
      } catch (error: any) {
        console.error(`[Server_Docker] Failed to send input via docker exec: ${error.message}`);
      }

    } catch (error: any) {
      console.error(`[Server_Docker] Failed to inform aider service ${aiderServiceName}: ${error.message}`);
      // Even if sending input failed, try to capture any logs that might exist
      this.captureExistingLogs(aiderServiceName, runtime)
        .catch(err => console.error(`[Server_Docker] Also failed to capture logs:`, err));
    }
  }

  // each test has a bdd test to be launched when inputFiles.json changes
  async launchBddTest(runtime: IRunTime, testName: string, configKey: string, configValue: any) {
    // Generate the UID exactly as in generateServices
    const uid = generateUid(configKey, testName);
    const bddServiceName = getBddServiceName(uid);

    console.log(`[Server_Docker] 🚀 Launching BDD test: ${bddServiceName}`);
    console.log(`[Server_Docker]   Config: ${configKey}, Test: ${testName}, Runtime: ${runtime}`);
    console.log(`[Server_Docker]   UID: ${uid}`);

    try {
      // Start the service
      console.log(`[Server_Docker]   Starting Docker service...`);
      await spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`);
      console.log(`[Server_Docker]   ✅ Docker service started`);

      // Capture any existing logs first (overwrites the file)
      console.log(`[Server_Docker]   Capturing existing logs...`);
      await this.captureExistingLogs(bddServiceName, runtime);

      // Then start logging new output (overwrites the file)
      console.log(`[Server_Docker]   Starting log capture...`);
      this.startServiceLogging(bddServiceName, runtime)
        .catch(error => console.error(`[Server_Docker] ❌ Failed to start logging for ${bddServiceName}:`, error));

      // Notify clients that processes resource has changed
      this.resourceChanged('/~/processes');
      // Update the extension config to reflect the current state
      this.writeConfigForExtension();

      console.log(`[Server_Docker] ✅ BDD test launched successfully: ${bddServiceName}`);
    } catch (error: any) {
      console.error(`[Server_Docker] ❌ Failed to start ${bddServiceName}: ${error.message}`);
      // Even if starting failed, try to capture any logs that might exist
      this.captureExistingLogs(bddServiceName, runtime)
        .catch(err => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      // Still update the config even if there's an error
      this.writeConfigForExtension();
    }
  }

  // each test has zero or more "check" tests to be launched when inputFiles.json changes
  async launchChecks(runtime: IRunTime, testName: string, configKey: string, configValue: any) {
    const uid = generateUid(configKey, testName);
    const checks = configValue.checks || [];
    for (let i = 0; i < checks.length; i++) {
      const checkServiceName = getCheckServiceName(uid, i);
      console.log(`[Server_Docker] Starting check service: ${checkServiceName}`);
      try {
        await spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`);
        // Capture any existing logs first
        this.captureExistingLogs(checkServiceName, runtime)
          .catch(error => console.error(`[Server_Docker] Failed to capture existing logs for ${checkServiceName}:`, error));

        // Then start logging fresh logs
        this.startServiceLogging(checkServiceName, runtime)
          .catch(error => console.error(`[Server_Docker] Failed to start logging for ${checkServiceName}:`, error));

        // Notify clients that processes resource has changed
        this.resourceChanged('/~/processes');
      } catch (error: any) {
        console.error(`[Server_Docker] Failed to start ${checkServiceName}: ${error.message}`);
        // Try to capture logs even if starting failed
        this.captureExistingLogs(checkServiceName, runtime)
          .catch(err => console.error(`[Server_Docker] Also failed to capture logs:`, err));
      }
    }
    // Update the extension config after launching all checks
    this.writeConfigForExtension();
  }

  private async captureExistingLogs(serviceName: string, runtime: string): Promise<void> {
    captureExistingLogs(serviceName, runtime, process.cwd());
  }

  public async stop(): Promise<void> {
    console.log('[Server_Docker] Stopping server...');

    // Stop all log processes first
    for (const [containerId, logProcess] of this.logProcesses.entries()) {
      try {
        logProcess.process.kill('SIGTERM');
        console.log(`[Server_Docker] Stopped log process for container ${containerId} (${logProcess.serviceName})`);
      } catch (error) {
        console.error(`[Server_Docker] Error stopping log process for ${containerId}:`, error);
      }
    }
    this.logProcesses.clear();

    // Stop all docker containers
    console.log('[Server_Docker] Stopping all docker containers...');
    const result = await this.DC_down();
    console.log(`[Server_Docker] Docker down result: ${result.exitCode === 0 ? 'success' : 'failed'}`);

    // Notify clients that processes resource has changed
    this.resourceChanged('/~/processes');
    // Update the extension config to indicate server has stopped
    writeConfigForExtensionOnStop();

    // Call parent stop
    await super.stop();

    console.log('[Server_Docker] Server stopped successfully');
  }

  async setupDockerCompose(
  ) {
    // First, ensure all necessary directories exist
    const composeDir = path.join(process.cwd(), "testeranto", "bundles");

    try {
      // Setup directories that are referenced in volume mounts
      const requiredDirs = [
        path.join(process.cwd(), "src"),
        path.join(process.cwd(), "dist"),
        path.join(process.cwd(), "testeranto"),
        composeDir
      ];


      const services = this.generateServices(
        // config,
      );
      writeComposeFile(services);

    } catch (err) {
      console.error(`Error in setupDockerCompose:`, err);
      throw err;
    }
  }

  private writeConfigForExtension(): void {
    try {
      const configDir = path.join(process.cwd(), 'testeranto');
      const configPath = path.join(configDir, 'extension-config.json');

      // Ensure the directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(`[Server_Docker] Created directory: ${configDir}`);
      }

      // Extract runtime information from configs
      const runtimesArray: Array<{
        key: string;
        runtime: string;
        label: string;
        tests: string[];
      }> = [];

      // Check if runtimes exists and is an object
      if (this.configs.runtimes && typeof this.configs.runtimes === 'object') {
        for (const [key, value] of Object.entries(this.configs.runtimes)) {

          // The value might be a function call result or an object
          // In the provided config, it's wrapped in parentheses, but when parsed it should be an object
          const runtimeObj = value as any;
          if (runtimeObj && typeof runtimeObj === 'object') {
            // Check for runtime property in various possible locations
            const runtime = runtimeObj.runtime;
            const tests = runtimeObj.tests || [];

            console.log(`[Server_Docker] Found runtime: ${runtime}, tests:`, tests);

            if (runtime) {
              runtimesArray.push({
                key,
                runtime: runtime,
                label: this.getRuntimeLabel(runtime),
                tests: Array.isArray(tests) ? tests : []
              });
            } else {
              console.warn(`[Server_Docker] No runtime property found for key: ${key}`, runtimeObj);
            }
          } else {
            console.warn(`[Server_Docker] Invalid runtime configuration for key: ${key}, value type: ${typeof value}`);
          }
        }
      } else {
        console.warn(`[Server_Docker] No runtimes found in config`);
      }

      // Get current process information
      const processSummary = this.getProcessSummary();

      const configData = {
        runtimes: runtimesArray,
        timestamp: new Date().toISOString(),
        source: 'testeranto.ts',
        serverStarted: true,
        processes: processSummary.processes || [],
        totalProcesses: processSummary.total || 0,
        lastUpdated: new Date().toISOString()
      };

      const configJson = JSON.stringify(configData, null, 2);
      fs.writeFileSync(configPath, configJson);
      console.log(`[Server_Docker] Updated extension config with ${processSummary.total || 0} processes`);

    } catch (error: any) {
      console.error(`[Server_Docker] Failed to write extension config:`, error);
    }
  }

  private getRuntimeLabel(runtime: string): string {
    return getRuntimeLabel(runtime);
  }

  public getInputFiles(runtime: string, testName: string): string[] {
    console.log(`[Server_Docker] getInputFiles called for ${runtime}/${testName}`);

    // First, find the config key for this runtime and testName
    let configKey: string | null = null;

    // Search through configs to find which configKey this runtime/testName belongs to
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }

    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }

    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);

    console.log("INPUT FILES", this.inputFiles);

    // Check if we have input files in memory under the configKey
    if (this.inputFiles &&
      typeof this.inputFiles === 'object' &&
      this.inputFiles[configKey] &&
      typeof this.inputFiles[configKey] === 'object' &&
      this.inputFiles[configKey][testName]) {
      const files = this.inputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} input files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }

    console.log(`[Server_Docker] No input files in memory for ${configKey}/${testName}`);
    console.log(`[Server_Docker] Available config keys:`, Object.keys(this.inputFiles || {}));
    if (this.inputFiles && this.inputFiles[configKey]) {
      console.log(`[Server_Docker] Tests in ${configKey}:`, Object.keys(this.inputFiles[configKey]));
    }
    return []
  }

  public getOutputFiles(runtime: string, testName: string): string[] {
    console.log(`[Server_Docker] getOutputFiles called for ${runtime}/${testName}`);

    // First, find the config key for this runtime and testName
    let configKey: string | null = null;

    // Search through configs to find which configKey this runtime/testName belongs to
    for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.runtime === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }

    if (!configKey) {
      console.log(`[Server_Docker] No config found for runtime ${runtime} and test ${testName}`);
      return [];
    }

    console.log(`[Server_Docker] Found config key: ${configKey} for ${runtime}/${testName}`);

    // Check if we have output files in memory under the configKey
    if (this.outputFiles &&
      typeof this.outputFiles === 'object' &&
      this.outputFiles[configKey] &&
      typeof this.outputFiles[configKey] === 'object' &&
      this.outputFiles[configKey][testName]) {
      const files = this.outputFiles[configKey][testName];
      console.log(`[Server_Docker] Found ${files.length} output files in memory for ${configKey}/${testName}`);
      return Array.isArray(files) ? files : [];
    }

    console.log(`[Server_Docker] No output files in memory for ${configKey}/${testName}`);
    return [];
  }

  public getAiderProcesses(): any[] {
    try {
      const summary = this.getProcessSummary();
      // Filter for aider containers
      const aiderProcesses = summary.processes.filter((process: any) =>
        process.name && process.name.includes('-aider')
      );

      // Enhance the aider processes with additional information
      return aiderProcesses.map((process: any) => {
        // Extract runtime and test name from container name
        let runtime = '';
        let testName = '';
        let configKey = '';

        const name = process.name || process.containerName || '';
        if (name.includes('-aider')) {
          // Parse container name to extract runtime and test name
          // Format: {configKey}-{testName}-aider
          const match = name.match(/^(.+?)-(.+)-aider$/);
          if (match) {
            configKey = match[1];
            const testPart = match[2];

            // Try to find the runtime from configs
            for (const [key, configValue] of Object.entries(this.configs.runtimes)) {
              if (key === configKey) {
                runtime = configValue.runtime;
                // Try to find the test name
                for (const t of configValue.tests) {
                  const cleanedTestName = cleanTestName(t);
                  if (cleanedTestName === testPart) {
                    testName = t;
                    break;
                  }
                }
                break;
              }
            }
          }
        }

        // Create the connect command
        const connectCommand = `docker exec -it ${process.containerId} aider`;

        return {
          ...process,
          name: name,
          containerId: process.containerId || '',
          runtime: runtime,
          testName: testName,
          configKey: configKey,
          status: process.status || '',
          state: process.state || '',
          isActive: process.isActive || false,
          exitCode: process.exitCode || null,
          startedAt: process.startedAt || null,
          finishedAt: process.finishedAt || null,
          connectCommand: connectCommand,
          terminalCommand: connectCommand,
          containerName: name,
          timestamp: new Date().toISOString()
        };
      });
    } catch (error: any) {
      console.error(`[Server_Docker] Error getting aider processes: ${error.message}`);
      return [];
    }
  }

  // HTTP endpoint handler for aider processes
  public handleAiderProcesses(): any {
    try {
      const aiderProcesses = this.getAiderProcesses();
      return {
        aiderProcesses: aiderProcesses,
        timestamp: new Date().toISOString(),
        message: "Success"
      };
    } catch (error: any) {
      console.error(`[Server_Docker] Error in handleAiderProcesses: ${error.message}`);
      return {
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: `Error: ${error.message}`
      };
    }
  }

  public getProcessSummary(): any {
    try {
      // Get all containers (including stopped ones) with additional fields
      const cmd = 'docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.State}}|{{.Command}}|{{.ID}}"';
      let output: string;
      try {
        output = execSync(cmd).toString();
      } catch (dockerError: any) {
        console.error(`[Server_Docker] Error running docker ps: ${dockerError.message}`);
        // Docker might not be running or available
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          error: `Docker not available: ${dockerError.message}`
        };
      }

      // Check if output is empty or null
      if (!output || output.trim() === '') {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: 'No docker containers found'
        };
      }

      const lines = output.trim().split('\n').filter(line => line.trim());

      // Handle case where there are no containers
      if (lines.length === 0) {
        return {
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: 'No docker containers found'
        };
      }

      const processes = lines.map(line => {
        const parts = line.split('|');
        // Ensure we have at least 7 parts, fill missing ones with empty strings
        const [name = '', image = '', status = '', ports = '', state = '', command = '', containerId = ''] = parts;

        // Get exit code for stopped containers
        let exitCode = null;
        let startedAt = null;
        let finishedAt = null;

        if (containerId && containerId.trim()) {
          try {
            // Use docker inspect to get detailed information
            const inspectCmd = `docker inspect --format='${getContainerInspectFormat()}' ${containerId} 2>/dev/null || echo ""`;
            const inspectOutput = execSync(inspectCmd).toString().trim();
            if (inspectOutput && inspectOutput !== '') {
              const [exitCodeStr, startedAtStr, finishedAtStr] = inspectOutput.split('|');
              if (exitCodeStr && exitCodeStr !== '' && exitCodeStr !== '<no value>') {
                exitCode = parseInt(exitCodeStr, 10);
              }
              if (startedAtStr && startedAtStr !== '' && startedAtStr !== '<no value>') {
                startedAt = startedAtStr;
              }
              if (finishedAtStr && finishedAtStr !== '' && finishedAtStr !== '<no value>') {
                finishedAt = finishedAtStr;
              }
            }
          } catch (error) {
            // Container might not exist, which is fine
            console.debug(`[Server_Docker] Could not inspect container ${containerId}: ${error}`);
          }
        }

        // Determine if container is active
        const isActive = isContainerActive(state);

        return {
          processId: name || containerId,
          containerId: containerId,
          command: command || image,
          image: image,
          timestamp: new Date().toISOString(),
          status: status,
          state: state,
          ports: ports,
          exitCode: exitCode,
          startedAt: startedAt,
          finishedAt: finishedAt,
          isActive: isActive,
          // Add additional fields that might be useful for the frontend

          health: 'unknown' // We could add health check status here
        };
      });

      return {
        processes: processes,
        total: processes.length,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`[Server_Docker] Unexpected error in getProcessSummary: ${error.message}`);
      return {
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: `Unexpected error: ${error.message}`
      };
    }
  }



  private async startServiceLogging(serviceName: string, runtime: string): Promise<void> {
    // Create report directory
    const reportDir = getFullReportDir(process.cwd(), runtime);

    try {
      fs.mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.error(`[Server_Docker] Failed to create report directory ${reportDir}: ${error.message}`);
      return;
    }

    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);
    const exitCodeFilePath = getExitCodeFilePath(process.cwd(), runtime, serviceName);

    // Start a process to capture logs - use a more robust approach
    // We'll use a shell script that handles waiting for the container
    const logScript = `
      # Wait for container to exist
      for i in {1..30}; do
        if docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName} > /dev/null 2>&1; then
          break
        fi
        sleep 1
      done
      # Capture logs from the beginning
      docker compose -f "testeranto/docker-compose.yml" logs --no-color -f ${serviceName}
    `;

    console.log(`[Server_Docker] Starting log capture for ${serviceName} to ${logFilePath}`);

    // Open in overwrite mode to replace old logs
    const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });
    const timestamp = new Date().toISOString();
    // Write a header
    logStream.write(`=== Log started at ${timestamp} for service ${serviceName} ===\n\n`);

    const child = spawn('bash', ['-c', logScript], {
      stdio: ['ignore', 'pipe', 'pipe'],
      // cwd: this.dockerManager.cwd
    });

    // Get container ID for tracking
    let containerId: string | null = null;
    try {
      // Try to get container ID, but don't fail if we can't
      const containerIdCmd = `${DOCKER_COMPOSE_BASE} ps -q ${serviceName}`;
      containerId = execSync(containerIdCmd, {
        // cwd: this.dockerManager.cwd
      }).toString().trim();
    } catch (error) {
      console.warn(`[Server_Docker] Could not get container ID for ${serviceName}, will track by service name`);
    }

    child.stdout?.on('data', (data) => {
      logStream.write(data);
    });

    child.stderr?.on('data', (data) => {
      logStream.write(data);
    });

    child.on('error', (error) => {
      console.error(`[Server_Docker] Log process error for ${serviceName}:`, error);
      logStream.write(`\n=== Log process error: ${error.message} ===\n`);
      logStream.end();
      // Write error exit code
      fs.writeFileSync(exitCodeFilePath, '-1');
    });

    child.on('close', (code) => {
      const endTimestamp = new Date().toISOString();
      logStream.write(`\n=== Log ended at ${endTimestamp}, process exited with code ${code} ===\n`);
      logStream.end();
      console.log(`[Server_Docker] Log process for ${serviceName} exited with code ${code}`);

      // Write exit code to file
      fs.writeFileSync(exitCodeFilePath, code?.toString() || '0');

      // Also capture the actual container exit code
      this.captureContainerExitCode(serviceName, runtime);

      if (containerId) {
        this.logProcesses.delete(containerId);
      } else {
        // Remove by service name if we couldn't get container ID
        for (const [id, proc] of this.logProcesses.entries()) {
          if (proc.serviceName === serviceName) {
            this.logProcesses.delete(id);
            break;
          }
        }
      }
    });

    // Track the process
    const trackingKey = containerId || serviceName;
    this.logProcesses.set(trackingKey, { process: child, serviceName });

    // Update the extension config to reflect the new running process
    this.writeConfigForExtension();
  }

  private async captureContainerExitCode(serviceName: string, runtime: string): Promise<void> {
    captureContainerExitCode(serviceName, runtime, process.cwd());
    // Notify clients that processes resource has changed
    this.resourceChanged('/~/processes');
    // Update the extension config to reflect the changed process state
    this.writeConfigForExtension();
  }


  public async DC_upAll(): Promise<IDockerComposeResult> {
    const result = await executeDockerComposeCommand(DC_COMMANDS.up, {
      errorMessage: 'docker compose up'
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(DC_COMMANDS.up);
        return { exitCode: 0, out: '', err: '', data: null };
      } catch (error: any) {
        console.error(`[Docker] docker compose up ❌ ${ansiColors.bgBlue(error.message.replaceAll('\\n', '\n'))}`);
        return { exitCode: 1, out: '', err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }

  public async DC_down(): Promise<IDockerComposeResult> {
    const result = await executeDockerComposeCommand(DC_COMMANDS.down, {
      errorMessage: 'docker compose down'
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(DC_COMMANDS.down);
        return { exitCode: 0, out: '', err: '', data: null };
      } catch (error: any) {
        console.log(`[DC_down] Error during down: ${error.message}`);
        return { exitCode: 1, out: '', err: `Error stopping services: ${error.message}`, data: null };
      }
    }
    return result;
  }

  public async DC_ps(): Promise<IDockerComposeResult> {
    return executeDockerComposeCommand(DC_COMMANDS.ps, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: 'Error getting service status'
    });
  }

  public async DC_logs(
    serviceName: string,
    options?: { follow?: boolean; tail?: number }
  ): Promise<IDockerComposeResult> {
    const tail = options?.tail ?? 100;
    const command = DC_COMMANDS.logs(serviceName, tail);
    return executeDockerComposeCommand(command, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: `Error getting logs for ${serviceName}`
    });
  }

  public async DC_configServices(): Promise<IDockerComposeResult> {
    return executeDockerComposeCommand(DC_COMMANDS.config, {
      useExec: true,
      execOptions: { cwd: process.cwd() },
      errorMessage: 'Error getting services from config'
    });
  }

  public async DC_start(): Promise<IDockerComposeResult> {
    const result = await executeDockerComposeCommand(DC_COMMANDS.start, {
      errorMessage: 'docker compose start'
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(DC_COMMANDS.start);
        return { exitCode: 0, out: '', err: '', data: null };
      } catch (error: any) {
        console.error(`[Docker] docker compose start ❌ ${ansiColors.bgBlue(error.message.replaceAll('\\n', '\n'))}`);
        return { exitCode: 1, out: '', err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }


  private async buildWithBuildKit(): Promise<void> {
    console.log('[Server_Docker] Starting BuildKit builds for all runtimes');

    // Check if BuildKit is available
    const buildKitAvailable = await BuildKitBuilder.checkBuildKitAvailable();
    console.log(`[Server_Docker] BuildKit available: ${buildKitAvailable}`);

    if (!buildKitAvailable) {
      throw new Error('BuildKit is not available. Please ensure Docker BuildKit is enabled. ' +
        'You can enable it by setting DOCKER_BUILDKIT=1 environment variable or ' +
        'by configuring Docker Desktop to use BuildKit.');
    }

    console.log('[Server_Docker] BuildKit is available. Building all runtimes...');

    const buildErrors: string[] = [];

    // Build aider image first
    console.log('[Server_Docker] Building aider image...');
    try {
      await this.buildAiderImage();
      console.log('[Server_Docker] ✅ Aider image built successfully');
    } catch (error: any) {
      console.error(`[Server_Docker] ❌ Aider image build failed:`, error.message);
      buildErrors.push(`aider: ${error.message}`);
    }

    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime = configValue.runtime;

      console.log(`[Server_Docker] Building ${runtime} runtime (${configKey})...`);

      try {
        // Build each runtime using BuildKit
        switch (runtime) {
          case 'node':
            console.log(`[Server_Docker] Building node runtime: ${configKey}`);
            await nodeBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (node)`);
            break;

          case 'web':
            console.log(`[Server_Docker] Building web runtime: ${configKey}`);
            await webBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (web)`);
            break;

          case 'golang':
            console.log(`[Server_Docker] Building golang runtime: ${configKey}`);
            await golangBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (golang)`);
            break;

          case 'ruby':
            console.log(`[Server_Docker] Building ruby runtime: ${configKey}`);
            await rubyBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (ruby)`);
            break;

          case 'rust':
            console.log(`[Server_Docker] Building rust runtime: ${configKey}`);
            await rustBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (rust)`);
            break;

          case 'java':
            console.log(`[Server_Docker] Building java runtime: ${configKey}`);
            await javaBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (java)`);
            break;

          case 'python':
            console.log(`[Server_Docker] Building python runtime: ${configKey}`);
            await pythonBuildKitBuild(this.configs, configKey);
            console.log(`[Server_Docker] ✅ BuildKit build successful for ${configKey} (python)`);
            break;

          default:
            throw new Error(`Unknown runtime: ${runtime} for ${configKey}`);
        }
      } catch (error: any) {
        console.error(`[Server_Docker] ❌ BuildKit build failed for ${configKey} (${runtime}):`, error.message);
        buildErrors.push(`${configKey} (${runtime}): ${error.message}`);
      }
    }

    // Check if any builds failed
    if (buildErrors.length > 0) {
      const errorMessage = `BuildKit builds failed for ${buildErrors.length} runtime(s):\n` +
        buildErrors.map(error => `  - ${error}`).join('\n');
      throw new Error(errorMessage);
    } else {
      console.log(`[Server_Docker] ✅ All BuildKit builds completed successfully!`);
    }
  }

  private async startBuilderServices(): Promise<void> {
    console.log('[Server_Docker] Starting all builder services...');

    // Get all builder service names
    const builderServices: string[] = [];
    const processedRuntimes = new Set<string>();

    for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
      const runtime = runtimeTests.runtime;

      if (!processedRuntimes.has(runtime)) {
        processedRuntimes.add(runtime);
        const builderServiceName = getBuilderServiceName(runtime);
        builderServices.push(builderServiceName);
      }
    }

    // Start each builder service
    for (const serviceName of builderServices) {
      console.log(`[Server_Docker] Starting builder service: ${serviceName}`);
      try {
        await spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`);
        console.log(`[Server_Docker] ✅ Builder service ${serviceName} started successfully`);

        // Start logging for this service
        // Find the runtime for this service
        let runtimeForService = '';
        for (const [runtimeTestsName, runtimeTests] of Object.entries(this.configs.runtimes)) {
          const runtime = runtimeTests.runtime;
          if (getBuilderServiceName(runtime) === serviceName) {
            runtimeForService = runtime;
            break;
          }
        }

        if (runtimeForService) {
          this.startServiceLogging(serviceName, runtimeForService)
            .catch(error => console.error(`[Server_Docker] Failed to start logging for ${serviceName}:`, error));
        }
      } catch (error: any) {
        console.error(`[Server_Docker] ❌ Failed to start builder service ${serviceName}:`, error.message);
        // Continue with other services even if one fails
      }
    }

    console.log('[Server_Docker] ✅ All builder services started');
  }

  private async buildAiderImage(): Promise<void> {
    const dockerfilePath = 'aider.Dockerfile';

    // Check if aider.Dockerfile exists
    if (!fs.existsSync(dockerfilePath)) {
      console.warn(`[Server_Docker] ⚠️ aider.Dockerfile not found at ${dockerfilePath}. Aider services may not work correctly.`);
      // Create a simple aider.Dockerfile if it doesn't exist
      const defaultAiderDockerfile = `FROM python:3.11-slim
WORKDIR /workspace
RUN pip install --no-cache-dir aider-chat
USER 1000
CMD ["tail", "-f", "/dev/null"]`;

      try {
        fs.writeFileSync(dockerfilePath, defaultAiderDockerfile);
        console.log(`[Server_Docker] Created default ${dockerfilePath}`);
      } catch (error: any) {
        console.error(`[Server_Docker] Failed to create ${dockerfilePath}: ${error.message}`);
        return;
      }
    }

    const buildKitOptions = {
      runtime: 'aider',
      configKey: 'aider',
      dockerfilePath: dockerfilePath,
      buildContext: process.cwd(),
      cacheMounts: [],
      targetStage: undefined,
      buildArgs: {}
    };

    console.log(`[Server_Docker] Building aider image with BuildKit...`);

    const result = await BuildKitBuilder.buildImage({
      ...buildKitOptions,
      // Override the image name
      runtime: 'aider',
      configKey: 'aider'
    });

    if (result.success) {
      console.log(`[Server_Docker] ✅ Aider image built successfully in ${result.duration}ms`);
    } else {
      console.error(`[Server_Docker] ❌ Aider image build failed: ${result.error}`);
      // Don't throw here, just log the error
      console.warn(`[Server_Docker] Aider services may not work, but continuing with other builds`);
    }
  }


  private async waitForAllTestsToComplete(): Promise<void> {
    console.log('[Server_Docker] Once mode: Waiting for all tests to complete...');

    // Wait a bit for containers to start
    console.log('[Server_Docker] Waiting 10 seconds for containers to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // We'll check periodically if all test containers have finished
    const maxAttempts = 120; // 10 minutes (5 seconds per attempt)
    const checkInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Get all containers
      const summary = this.getProcessSummary();

      // Filter for test containers (bdd, check, and builder services)
      const testContainers = summary.processes.filter((process: any) => {
        const name = process.name || '';
        // Include test-related containers
        return name.includes('-bdd') ||
          name.includes('-check-') ||
          name.includes('-builder') ||
          name.includes('-aider');
      });

      // Check if all test containers have finished (not running)
      const runningContainers = testContainers.filter((process: any) => {
        const state = (process.state || '').toLowerCase();
        return state === 'running' || state === 'restarting' || state === 'created';
      });

      if (runningContainers.length === 0) {
        console.log(`[Server_Docker] All ${testContainers.length} test containers have completed.`);

        // Additional check: ensure all test containers have exit codes (not just stopped)
        const containersWithoutExitCode = testContainers.filter((process: any) => {
          // If exitCode is null or undefined, the container might have exited abnormally
          // But we still consider it done
          return process.exitCode === null || process.exitCode === undefined;
        });

        if (containersWithoutExitCode.length > 0) {
          console.log(`[Server_Docker] Note: ${containersWithoutExitCode.length} containers don't have exit codes yet`);
          // Wait a bit more for exit codes to be recorded
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        return;
      }

      // Log detailed information about running containers
      console.log(`[Server_Docker] Waiting for ${runningContainers.length} test containers to finish... (attempt ${attempt + 1}/${maxAttempts})`);
      runningContainers.forEach((container: any) => {
        console.log(`  - ${container.name || container.containerId}: state=${container.state}, status=${container.status}, exitCode=${container.exitCode}`);
      });

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.warn('[Server_Docker] Timeout waiting for all tests to complete. Some tests may still be running.');
    // Force shutdown anyway
    console.log('[Server_Docker] Forcing shutdown due to timeout...');
  }

  public async DC_build(): Promise<IDockerComposeResult> {
    throw new Error('Traditional docker-compose build is not supported. Use BuildKit instead.');
  }

}
