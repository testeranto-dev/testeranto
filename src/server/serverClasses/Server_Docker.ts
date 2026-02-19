import ansiColors from "ansi-colors";
import { execSync, spawn } from "child_process";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { RUN_TIMES } from "../../runtimes";
import type { ICheck, IChecks, IRunTime, ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import {
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
} from "./Server_Docker_Utils";
import { Server_WS } from "./Server_WS";

export class Server_Docker extends Server_WS {
  private logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  inputFiles = {};
  outputFiles = {};

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  BaseCompose(services: any) {
    return {
      services,
      volumes: {
        node_modules: {
          driver: "local",
        },
      },
      networks: {
        allTests_network: {
          driver: "bridge",
        },
      },
    };
  }

  staticTestDockerComposeFile(
    runtime: IRunTime, container_name: string, command: string, config: ITestconfigV2, runtimeTestsName: string
  ) {
    return {
      build: {
        context: process.cwd(),
        dockerfile: config.runtimes[runtimeTestsName].dockerfile,
      },
      container_name,
      environment: {
        // NODE_ENV: "production",
        // ...config.env,
      },
      working_dir: "/workspace",
      command: command,
      networks: ["allTests_network"],
    };
  };

  bddTestDockerComposeFile(runtime: IRunTime, container_name: string, command: string) {
    // Find the dockerfile path from configs
    let dockerfilePath = '';
    for (const [key, value] of Object.entries(this.configs.runtimes)) {
      if (value.runtime === runtime) {
        dockerfilePath = value.dockerfile;
        break;
      }
    }

    // If no dockerfile found, use a default based on runtime
    if (!dockerfilePath) {
      throw (`[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(this.configs)}`)
    }

    const service: any = {
      build: {
        context: process.cwd(),
        dockerfile: dockerfilePath,
      },
      container_name,
      environment: {
        // NODE_ENV: "production",
        // ...config.env,
      },
      working_dir: "/workspace",
      volumes: [
        `${process.cwd()}/src:/workspace/src`,
        `${process.cwd()}/dist:/workspace/dist`,
        `${process.cwd()}/testeranto:/workspace/testeranto`,
      ],
      command: command,
      networks: ["allTests_network"],
    };

    return service;
  };

  aiderDockerComposeFile(container_name: string) {
    return {
      build: {
        context: process.cwd(),
        dockerfile: 'aider.Dockerfile',
      },
      container_name,
      environment: {
        // NODE_ENV: "production",
        // ...config.env,
      },
      volumes: [
        `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
        // Mount the entire workspace to allow aider to access files
        `${process.cwd()}:/workspace`,
      ],
      working_dir: "/workspace",
      command: "tail -f /dev/null",  // Keep container running
      networks: ["allTests_network"],
      tty: true,           // Allocate a pseudo-TTY
      stdin_open: true,    // Keep STDIN open even if not attached
    };
  };

  generateServices(
    // config: IBuiltConfig,
  ): Record<string, any> {

    const services: IService = {};

    // Add browser service (commented out until we have the Dockerfile)
    // services['browser'] = {
    //   build: {
    //     context: process.cwd(),
    //     dockerfile: 'src/server/runtimes/web/web.Dockerfile'
    //   },
    //   shm_size: '2gb',
    //   container_name: 'browser-allTests',
    //   ports: [
    //     '3000:3000',
    //     '9222:9222'
    //   ],
    //   networks: ["allTests_network"],
    // };



    // Track which runtimes we've already added builder services for
    const processedRuntimes = new Set<IRunTime>();

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

      // Add builder service for this runtime if not already added
      if (!processedRuntimes.has(runtime)) {
        const builderServiceName = getBuilderServiceName(runtime);

        // Ensure dockerfile path is valid and exists
        const fullDockerfilePath = path.join(process.cwd(), dockerfile);
        if (!fs.existsSync(fullDockerfilePath)) {
          throw (`[Server_Docker] Dockerfile not found at ${fullDockerfilePath}`);
        }

        // Get build command
        const buildCommand = runTimeToCompose[runtime][1](
          buildOptions,
          buildOptions,
          runtimeTestsName,
          runtimeTestsName

        );

        console.log(`[Server_Docker] [generateServices] ${runtime} build command: "${buildCommand}"`);

        services[builderServiceName] = {
          build: {
            context: process.cwd(),
            dockerfile: dockerfile,
          },
          container_name: builderServiceName,
          environment: {},
          working_dir: "/workspace",
          volumes: [
            `${process.cwd()}/src:/workspace/src`,
            `${process.cwd()}/dist:/workspace/dist`,
            `${process.cwd()}/testeranto:/workspace/testeranto`,
          ],
          command: buildCommand,
          networks: ["allTests_network"],
        };

        processedRuntimes.add(runtime);
      }

      // Add BDD and aider services for each test
      for (const tName of testsObj) {
        // Clean the test name for use in container names
        const cleanedTestName = cleanTestName(tName);

        // Generate UID using the runtimeTestsName (e.g., 'nodeTests') and clean test name
        const uid = `${runtimeTestsName.toLowerCase()}-${cleanedTestName}`;

        // Add BDD service for this test
        const bddCommandFunc = runTimeToCompose[runtime][2];
        const filePath = `testeranto/bundles/allTests/${runtime}/${tName}`;
        const bddCommand = bddCommandFunc(filePath, buildOptions, runtimeTestsName);

        console.log(`[Server_Docker] [generateServices] ${runtimeTestsName} BDD command: "${bddCommand}"`);

        services[getBddServiceName(uid)] = this.bddTestDockerComposeFile(runtime, getBddServiceName(uid), bddCommand);
        services[getAiderServiceName(uid)] = this.aiderDockerComposeFile(getAiderServiceName(uid));

        // iterate over checks to make services for each check
        checks.forEach((check: ICheck, ndx) => {
          // Call the check function to get the command string
          // We need to pass appropriate arguments - for now, pass an empty array
          const command = check([]);
          services[getCheckServiceName(uid, ndx)] = this.staticTestDockerComposeFile(
            runtime, getCheckServiceName(uid, ndx), command, this.configs, runtimeTestsName
          );
        })
      }
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
    await this.spawnPromise(downCmd);
    const buildResult = await this.DC_build();

    // Start builder services
    for (const runtimeName in this.configs.runtimes) {

      const runtime = this.configs.runtimes[runtimeName].runtime;

      // Don't initialize this.inputFiles[runtime] here - we'll use config keys instead
      const serviceName = getBuilderServiceName(runtime);
      await this.spawnPromise(`${DOCKER_COMPOSE_UP} ${serviceName}`);
      // Capture any existing logs first (overwrites the file)
      await this.captureExistingLogs(serviceName, runtime);
      // Then start logging new output (appends to the file)
      this.startServiceLogging(serviceName, runtime)
        .catch(error => console.error(`[Server_Docker] Failed to start logging for ${serviceName}:`, error));

      // Notify clients that processes resource has changed
      this.resourceChanged('/~/processes');
    }

    // await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d browser`);

    // // Wait for browser service to be healthy before starting web BDD services
    // console.log(`[Server_Docker] Waiting for browser container to be healthy...`);
    // await this.waitForContainerHealthy('browser-allTests', 60000); // 60 seconds max

    // Start aider services
    // for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
    //   const runtime = configValue.runtime
    //   // const testsObj = configValue[3];
    //   const tests = configValue.tests

    //   for (const testName of tests) {
    //     // Generate the UID exactly as DockerManager does
    //     const uid = `${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`;
    //     const aiderServiceName = `${uid}-aider`;

    //     console.log(`[Server_Docker] Starting aider service: ${aiderServiceName} for test ${testName}`);
    //     try {
    //       await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${aiderServiceName}`);
    //       // Capture any existing logs first (overwrites the file)
    //       await this.captureExistingLogs(aiderServiceName, runtime);
    //       // Then start logging new output (appends to the file)
    //       this.startServiceLogging(aiderServiceName, runtime)
    //         .catch(error => console.error(`[Server_Docker] Failed to start logging for ${aiderServiceName}:`, error));

    //       // Notify clients that processes resource has changed
    //       this.resourceChanged('/~/processes');
    //     } catch (error: any) {
    //       console.error(`[Server_Docker] Failed to start ${aiderServiceName}: ${error.message}`);
    //     }
    //   }
    // }

    // Start BDD test services
    // for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
    //   const runtime = configValue.runtime
    //   const tests = configValue.tests

    //   console.log(`[Server_Docker] Found tests for ${runtime}:`, (JSON.stringify(tests)));

    //   for (const testName of tests) {
    //     const uid = `${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`;
    //     const bddServiceName = `${uid}-bdd`;

    //   }
    // }

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
        this.watchInputFile(runtime, testName);

        // Also watch for output files
        this.watchOutputFile(runtime, testName, configKey);
        this.launchBddTest(runtime, testName, configKey, configValue);
        this.launchChecks(runtime, testName, configKey, configValue);
        // this.informAider(runtime, testName, ck, configValue, inputFiles);

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

    // Watch the directory for changes
    fs.watch(outputDir, (eventType, filename) => {
      if (filename) {
        console.log(`[Server_Docker] Output directory changed: ${eventType} ${filename} in ${outputDir}`);
        this.updateOutputFilesList(configKey, testName, outputDir);

        // Notify clients via WebSocket
        this.resourceChanged('/~/outputfiles');
      }
    });
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
      inputFilePath = getInputFilePath(runtime, testsName);
    } catch (error: any) {
      throw `not yet implemented: ${error.message}`;
    }

    // if (!configKey) throw 'idk'

    console.log(`[Server_Docker] Setting up file watcher for: ${inputFilePath} (configKey: ${configKey})`);
    // Initialize the structure if needed
    if (!this.inputFiles[configKey]) {
      this.inputFiles[configKey] = {};
    }

    // Read initial file content if it exists
    if (fs.existsSync(inputFilePath)) {
      const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
      const inputFiles = JSON.parse(fileContent);
      this.inputFiles[configKey][testsName] = inputFiles;
      console.log(`[Server_Docker] Loaded ${inputFiles.length} input files from ${inputFilePath}`);
    }

    fs.watchFile(inputFilePath, (curr, prev) => {
      console.log(`[Server_Docker] Input file changed: ${inputFilePath}`);

      const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
      const inputFiles = JSON.parse(fileContent);
      this.inputFiles[configKey!][testsName] = inputFiles;
      console.log(`[Server_Docker] Updated input files for ${configKey}/${testsName}: ${inputFiles.length} files`);

      this.resourceChanged('/~/inputfiles');

      // Find the configuration for this runtime and test
      for (const [ck, configValue] of Object.entries(this.configs.runtimes)) {
        if (configValue.runtime === runtime && configValue.tests.includes(testsName)) {
          this.launchBddTest(runtime, testsName, ck, configValue);
          this.launchChecks(runtime, testsName, ck, configValue);
          this.informAider(runtime, testsName, ck, configValue, inputFiles);
          break;
        }
      }
    });
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
      const inputFilesPath = `testeranto/bundles/allTests/${runtime}/${testName}-inputFiles.json`;
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

    console.log(`[Server_Docker] Starting BDD service: ${bddServiceName}, ${configKey}, ${testName}`);
    try {
      // Start the service
      await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`);

      // Capture any existing logs first (overwrites the file)
      await this.captureExistingLogs(bddServiceName, runtime);
      // Then start logging new output (appends to the file)
      this.startServiceLogging(bddServiceName, runtime)
        .catch(error => console.error(`[Server_Docker] Failed to start logging for ${bddServiceName}:`, error));

      // Notify clients that processes resource has changed
      this.resourceChanged('/~/processes');
      // Update the extension config to reflect the current state
      this.writeConfigForExtension();
    } catch (error: any) {
      console.error(`[Server_Docker] Failed to start ${bddServiceName}: ${error.message}`);
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
        await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`);
        // Start logging for this service
        this.startServiceLogging(checkServiceName, runtime)
          .catch(error => console.error(`[Server_Docker] Failed to start logging for ${checkServiceName}:`, error));

        // Also capture any existing logs
        this.captureExistingLogs(checkServiceName, runtime)
          .catch(error => console.error(`[Server_Docker] Failed to capture existing logs for ${checkServiceName}:`, error));

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
    // Create report directory
    const reportDir = getFullReportDir(process.cwd(), runtime);
    const logFilePath = getLogFilePath(process.cwd(), runtime, serviceName);

    try {
      // First, check if the container exists (including stopped ones)
      const checkCmd = `${DOCKER_COMPOSE_BASE} ps -a -q ${serviceName}`;
      const containerId = execSync(checkCmd, {
        // cwd: this.dockerManager.cwd,
        encoding: 'utf-8'
      }).toString().trim();

      if (!containerId) {
        console.debug(`[Server_Docker] No container found for service ${serviceName}`);
        return;
      }

      // Get existing logs from the container
      const cmd = `${DOCKER_COMPOSE_LOGS} ${serviceName} 2>/dev/null || true`;
      const existingLogs = execSync(cmd, {
        // cwd: this.dockerManager.cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      if (existingLogs && existingLogs.trim().length > 0) {
        // Overwrite the log file
        fs.writeFileSync(logFilePath, existingLogs);
        console.log(`[Server_Docker] Captured ${existingLogs.length} bytes of existing logs for ${serviceName}`);
      } else {
        // If no logs exist, create an empty file
        fs.writeFileSync(logFilePath, '');
      }

      // Also try to capture the container exit code if it has exited
      this.captureContainerExitCode(serviceName, runtime);
    } catch (error: any) {
      // It's okay if this fails - the container might not exist yet
      console.debug(`[Server_Docker] No existing logs for ${serviceName}: ${error.message}`);
    }
  }

  public async stop(): Promise<void> {

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

    const result = await this.DC_down();

    // Notify clients that processes resource has changed
    this.resourceChanged('/~/processes');
    // Update the extension config to indicate server has stopped
    this.writeConfigForExtensionOnStop();

    super.stop();
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
      this.writeComposeFile(services);

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

  private writeConfigForExtensionOnStop(): void {
    try {
      const configDir = path.join(process.cwd(), 'testeranto');
      const configPath = path.join(configDir, 'extension-config.json');

      // Ensure the directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(`[Server_Docker] Created directory: ${configDir}`);
      }

      const configData = {
        runtimes: [],
        timestamp: new Date().toISOString(),
        source: 'testeranto.ts',
        serverStarted: false
      };

      const configJson = JSON.stringify(configData, null, 2);
      fs.writeFileSync(configPath, configJson);
      console.log(`[Server_Docker] Updated extension config to indicate server stopped`);

    } catch (error: any) {
      console.error(`[Server_Docker] Failed to write extension config on stop:`, error);
    }
  }

  writeComposeFile(
    services: Record<string, IService>,
  ) {
    const dockerComposeFileContents = this.BaseCompose(services);

    fs.writeFileSync(
      'testeranto/docker-compose.yml',
      yaml.dump(dockerComposeFileContents, {
        lineWidth: -1,
        noRefs: true,
      })
    );
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

    // Open in append mode since captureExistingLogs may have already written to the file
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    const timestamp = new Date().toISOString();
    // Write a separator and header
    logStream.write(`\n=== Log started at ${timestamp} for service ${serviceName} ===\n\n`);

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
    // Get container ID including stopped containers
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
    const containerId = execSync(containerIdCmd, {
      // cwd: this.dockerManager.cwd
    }).toString().trim();

    if (containerId) {
      // Check if container exists and get its exit code
      const inspectCmd = `docker inspect --format='{{.State.ExitCode}}' ${containerId}`;
      const exitCode = execSync(inspectCmd, {
        // cwd: this.dockerManager.cwd
      }).toString().trim();

      // Write container exit code to a separate file
      const containerExitCodeFilePath = getContainerExitCodeFilePath(process.cwd(), runtime, serviceName);
      fs.writeFileSync(containerExitCodeFilePath, exitCode);

      console.log(`[Server_Docker] Container ${serviceName} (${containerId.substring(0, 12)}) exited with code ${exitCode}`);

      // Also capture the container's status
      const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
      const status = execSync(statusCmd, {
        // cwd: this.dockerManager.cwd
      }).toString().trim();
      const statusFilePath = getStatusFilePath(process.cwd(), runtime, serviceName);
      fs.writeFileSync(statusFilePath, status);

      // Notify clients that processes resource has changed
      this.resourceChanged('/~/processes');
      // Update the extension config to reflect the changed process state
      this.writeConfigForExtension();
    } else {
      console.debug(`[Server_Docker] No container found for service ${serviceName}`);
    }
  }

  spawnPromise(command: string) {
    console.log(`[spawnPromise] Executing: ${command}`);

    return new Promise<number>((resolve, reject) => {


      // Use shell: true to let the shell handle command parsing (including quotes)
      const child = spawn(command, {
        stdio: 'inherit',
        shell: true,
        // cwd: this.dockerManager.cwd
      });

      child.on('error', (error) => {
        console.error(`[spawnPromise] Failed to start process: ${error.message}`);
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`[spawnPromise] Process completed successfully`);
          resolve(code);
        } else {
          console.error(`[spawnPromise] Process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  public async DC_upAll(): Promise<IDockerComposeResult> {
    const result = await executeDockerComposeCommand(DC_COMMANDS.up, {
      errorMessage: 'docker compose up'
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.up);
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
        await this.spawnPromise(DC_COMMANDS.down);
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
        await this.spawnPromise(DC_COMMANDS.start);
        return { exitCode: 0, out: '', err: '', data: null };
      } catch (error: any) {
        console.error(`[Docker] docker compose start ❌ ${ansiColors.bgBlue(error.message.replaceAll('\\n', '\n'))}`);
        return { exitCode: 1, out: '', err: `Error starting services: ${error.message}`, data: null };
      }
    }
    return result;
  }

  public async DC_build(): Promise<IDockerComposeResult> {
    const result = await executeDockerComposeCommand(DC_COMMANDS.build, {
      errorMessage: 'docker-compose build'
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await this.spawnPromise(DC_COMMANDS.build);
        console.log(`[DC_build] Build completed successfully`);
        return { exitCode: 0, out: '', err: '', data: null };
      } catch (error: any) {
        console.error(`[Docker] docker-compose build ❌ ${ansiColors.bgBlue(error.message.replaceAll('\\n', '\n'))}`);
        return { exitCode: 1, out: '', err: `Error building services: ${error.message}`, data: null };
      }
    }
    return result;
  }

  autogenerateStamp(x: string) {
    return `# This file is autogenerated. Do not edit it directly
${x}
    `
  }

  public getLogsCommand(serviceName?: string, tail: number = 100): string {
    const base = `${DOCKER_COMPOSE_LOGS} --tail=${tail}`;
    return serviceName ? `${base} ${serviceName}` : base;
  }

  // private async exec(cmd: string, options: { cwd: string }): Promise<{ stdout: string; stderr: string }> {
  //   const execAsync = promisify(exec);
  //   return execAsync(cmd, { cwd: options.cwd });
  // }

}
