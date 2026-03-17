/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Server_Docker_Utils_Run: Run-related pure functions for Server_Docker
import type { IRunTime, ITestconfigV2 } from "../../../Types";
import type { IMode } from "../../types";
import {
  DOCKER_COMPOSE_LOGS,
  generateUid,
  getBddServiceName,
  getBuilderServiceName,
  getCheckServiceName,
  getContainerExitCodeFilePath,
  getContainerInspectFormat,
  getExitCodeFilePath,
  getFullReportDir,
  getInputFilePath,
  getLogFilePath,
  getStatusFilePath,
  isContainerActive,
  WAIT_FOR_TESTS_CHECK_INTERVAL,
  WAIT_FOR_TESTS_INITIAL_DELAY,
  WAIT_FOR_TESTS_MAX_ATTEMPTS,
  type IDockerComposeResult,
} from "./Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  createWriteStream,
  execAsync,
  execSyncWrapper,
  existsSync,
  join,
  processCwd,
  readdirSync,
  readFileSync,
  relative,
  sep,
  spawnWrapper,
  writeFileSync,
} from "./Server_Docker_Dependents";
import { getCwdPure } from "./Server_Docker_Utils";
import { spawnPromise, captureContainerExitCode } from "./utils";

export type IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
) => void;


export const updateOutputFilesList = (
  outputFiles: Record<string, Record<string, string[]>>,
  configKey: string,
  testName: string,
  outputDir: string,
  projectRoot: string,
): Record<string, Record<string, string[]>> => {
  // Check if the output directory exists
  if (!existsSync(outputDir)) {
    consoleLog(`[Server_Docker] Output directory does not exist: ${outputDir}`);
    // Create a new object to avoid mutating the input
    const newOutputFiles = { ...outputFiles };
    if (!newOutputFiles[configKey]) {
      newOutputFiles[configKey] = {};
    }
    newOutputFiles[configKey][testName] = [];
    return newOutputFiles;
  }

  const files = readdirSync(outputDir);

  const testFiles = files.filter(
    (file) =>
      file.includes(testName.replace("/", "_").replace(".", "-")) ||
      file.includes(
        `${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`,
      ),
  );

  const relativePaths = testFiles.map((file) => {
    const absolutePath = join(outputDir, file);
    let relativePath = relative(projectRoot, absolutePath);
    relativePath = relativePath.split(sep).join("/");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  });

  // Create a new object to avoid mutating the input
  const newOutputFiles = { ...outputFiles };
  if (!newOutputFiles[configKey]) {
    newOutputFiles[configKey] = {};
  }
  newOutputFiles[configKey][testName] = relativePaths;

  return newOutputFiles;
};

export const loadInputFileOnce = (
  inputFiles: Record<string, Record<string, string[]>>,
  hashs: Record<string, Record<string, string>>,
  configKey: string,
  testName: string,
  runtime: string,
  configKeyParam: string,
): {
  inputFiles: Record<string, Record<string, string[]>>;
  hashs: Record<string, Record<string, string>>;
} => {
  const inputFilePath: string = getInputFilePath(runtime, configKeyParam);

  const newInputFiles = { ...inputFiles };
  const newHashs = { ...hashs };

  if (!newInputFiles[configKey]) {
    newInputFiles[configKey] = {};
  }

  const fileContent = readFileSync(inputFilePath, "utf-8");
  const allTestsInfo = JSON.parse(fileContent);
  if (allTestsInfo[testName]) {
    const testInfo = allTestsInfo[testName];
    newInputFiles[configKey][testName] = testInfo.files || [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testName] = testInfo.hash || "";
  } else {
    newInputFiles[configKey][testName] = [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testName] = "";
  }

  return { inputFiles: newInputFiles, hashs: newHashs };
};

export const getInputFilesPure = (
  configs: ITestconfigV2,
  inputFiles: Record<string, Record<string, string[]>>,
  runtime: string,
  testName: string,
): string[] => {
  let configKey: string | null = null;

  // First, try to find config where configValue.runtime === runtime
  for (const [key, configValue] of Object.entries(configs.runtimes)) {
    if (
      configValue.runtime === runtime &&
      configValue.tests.includes(testName)
    ) {
      configKey = key;
      break;
    }
  }

  // If not found, try to find config where key === runtime (config key passed instead of runtime type)
  if (!configKey) {
    for (const [key, configValue] of Object.entries(configs.runtimes)) {
      if (key === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
  }

  if (!configKey) {
    consoleLog(
      `[Server_Docker] No config found for runtime ${runtime} and test ${testName}`,
    );
    // Return empty array instead of throwing to prevent crashes
    return [];
  }

  // First, try to get files from in-memory structure
  if (
    inputFiles &&
    typeof inputFiles === "object" &&
    inputFiles[configKey] &&
    typeof inputFiles[configKey] === "object" &&
    inputFiles[configKey][testName]
  ) {
    const files = inputFiles[configKey][testName];
    if (Array.isArray(files) && files.length > 0) {
      consoleLog(
        `[Server_Docker] Found ${files.length} files in memory for ${configKey}/${testName}`,
      );
      return files;
    }
  }

  // If no files in memory, try to load from the input file directly
  consoleLog(
    `[Server_Docker] No files in memory for ${configKey}/${testName}, trying to load from input file`,
  );
  try {
    // Use the runtime type from the config, not the parameter
    const configRuntime = configs.runtimes[configKey]?.runtime;
    const inputFilePath = getInputFilePath(configRuntime || runtime, configKey);
    if (existsSync(inputFilePath)) {
      const fileContent = readFileSync(inputFilePath, "utf-8");
      const allTestsInfo = JSON.parse(fileContent);
      if (allTestsInfo[testName]) {
        const testInfo = allTestsInfo[testName];
        const files = testInfo.files || [];
        consoleLog(
          `[Server_Docker] Loaded ${files.length} files from ${inputFilePath} for test ${testName}`,
        );
        return files;
      } else {
        consoleLog(
          `[Server_Docker] Test ${testName} not found in ${inputFilePath}`,
        );
      }
    } else {
      consoleLog(`[Server_Docker] Input file does not exist: ${inputFilePath}`);
    }
  } catch (error: any) {
    consoleLog(`[Server_Docker] Error loading input file: ${error.message}`);
  }

  consoleLog(
    `[Server_Docker] Returning empty array for ${configKey}/${testName}`,
  );
  return [];
};

export const getOutputFilesPure = (
  configs: ITestconfigV2,
  outputFiles: Record<string, Record<string, string[]>>,
  runtime: string,
  testName: string,
): string[] => {
  let configKey: string | null = null;

  // First, try to find config where configValue.runtime === runtime
  for (const [key, configValue] of Object.entries(configs.runtimes)) {
    if (
      configValue.runtime === runtime &&
      configValue.tests.includes(testName)
    ) {
      configKey = key;
      break;
    }
  }

  // If not found, try to find config where key === runtime (config key passed instead of runtime type)
  if (!configKey) {
    for (const [key, configValue] of Object.entries(configs.runtimes)) {
      if (key === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
  }

  if (!configKey) {
    consoleLog(
      `[Server_Docker] No config found for runtime ${runtime} and test ${testName}`,
    );
    return [];
  }

  // Check if we have output files in memory under the configKey
  if (
    outputFiles &&
    typeof outputFiles === "object" &&
    outputFiles[configKey] &&
    typeof outputFiles[configKey] === "object" &&
    outputFiles[configKey][testName]
  ) {
    const files = outputFiles[configKey][testName];
    consoleLog(
      `[Server_Docker] Found ${files.length} output files in memory for ${configKey}/${testName}`,
    );
    return Array.isArray(files) ? files : [];
  }

  consoleLog(
    `[Server_Docker] No output files in memory for ${configKey}/${testName}`,
  );
  return [];
};

export const getProcessSummaryPure = (): any => {
  const cmd =
    'docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.State}}|{{.Command}}|{{.ID}}"';

  const output: string = execSyncWrapper(cmd);

  const lines = output
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  const processes = lines.map((line) => {
    const parts = line.split("|");
    // Ensure we have at least 7 parts, fill missing ones with empty strings
    const [
      name = "",
      image = "",
      status = "",
      ports = "",
      state = "",
      command = "",
      containerId = "",
    ] = parts;

    let exitCode = null;
    let startedAt = null;
    let finishedAt = null;

    const inspectCmd = `docker inspect --format='${getContainerInspectFormat()}' ${containerId} 2>/dev/null || echo ""`;
    const inspectOutput = execSyncWrapper(inspectCmd).trim();

    const [exitCodeStr, startedAtStr, finishedAtStr] = inspectOutput.split("|");
    if (exitCodeStr && exitCodeStr !== "" && exitCodeStr !== "<no value>") {
      exitCode = parseInt(exitCodeStr, 10);
    }
    if (startedAtStr && startedAtStr !== "" && startedAtStr !== "<no value>") {
      startedAt = startedAtStr;
    }
    if (
      finishedAtStr &&
      finishedAtStr !== "" &&
      finishedAtStr !== "<no value>"
    ) {
      finishedAt = finishedAtStr;
    }

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
      isActive: isContainerActive(state),

      health: "unknown", // We could add health check status here
    };
  });

  return {
    processes: processes,
    total: processes.length,
    timestamp: new Date().toISOString(),
  };
};

export const launchBddTestPure = async (
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  captureExistingLogs: (serviceName: string, runtime: string) => void,
  startServiceLogging: (serviceName: string, runtime: string) => Promise<void>,
  resourceChanged: () => void,
  writeConfigForExtension: () => void,
): Promise<void> => {
  const uid = generateUid(configKey, testName);
  const bddServiceName = getBddServiceName(uid);

  try {
    await spawnPromise(
      `docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`,
    );

    await captureExistingLogs(bddServiceName, runtime);

    await startServiceLogging(bddServiceName, runtime);

    resourceChanged();
    writeConfigForExtension();
  } catch (error: any) {
    // Even if starting failed, try to capture any logs that might exist
    captureExistingLogs(bddServiceName, runtime);
    // Still update the config even if there's an error
    writeConfigForExtension();
  }
};

export const launchChecksPure = async (
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  captureExistingLogs: IR,
  startServiceLogging: (serviceName: string, runtime: string) => Promise<void>,
  resourceChanged: () => void,
  writeConfigForExtension: () => void,
): Promise<void> => {
  const uid = generateUid(configKey, testName);
  const checks = configValue.checks || [];
  for (let i = 0; i < checks.length; i++) {
    const checkServiceName = getCheckServiceName(uid, i);
    try {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`,
      );
      // Capture any existing logs first
      captureExistingLogs(checkServiceName, runtime, configKey);
      await startServiceLogging(checkServiceName, runtime);
      resourceChanged();
    } catch (error: any) {
      captureExistingLogs(checkServiceName, runtime, configKey);
    }
  }

  writeConfigForExtension();
};

export const startServiceLoggingPure = (
  serviceName: string,
  runtime: string,
  cwd: string,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  runtimeConfigKey: string,
): Map<string, { process: any; serviceName: string }> => {
  const logFilePath = getLogFilePath(
    cwd,
    runtime,
    serviceName,
    runtimeConfigKey,
  );
  const exitCodeFilePath = getExitCodeFilePath(
    cwd,
    runtimeConfigKey,
    serviceName,
  );

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

  // Open in overwrite mode to replace old logs
  const logStream = createWriteStream(logFilePath, { flags: "w" });
  const timestamp = new Date().toISOString();
  logStream.write(
    `=== Log started at ${timestamp} for service ${runtime} ===\n\n`,
  );

  const child = spawnWrapper("bash", ["-c", logScript], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const containerId = execSyncWrapper(
    `${DOCKER_COMPOSE_BASE} ps -q ${serviceName}`,
    {
      cwd: cwd,
    },
  ).trim();

  child.stdout?.on("data", (data: any) => {
    logStream.write(data);
  });

  child.stderr?.on("data", (data: any) => {
    logStream.write(data);
  });

  child.on("error", (error: { message: any }) => {
    logStream.write(`\n=== Log process error: ${error.message} ===\n`);
    logStream.end();
    writeFileSync(exitCodeFilePath, "-1");
  });

  child.on("close", (code: { toString: () => any }) => {
    const endTimestamp = new Date().toISOString();
    logStream.write(
      `\n=== Log ended at ${endTimestamp}, process exited with code ${code} ===\n`,
    );
    logStream.end();

    writeFileSync(exitCodeFilePath, code?.toString() || "0");

    captureContainerExitCode(serviceName, runtime, runtimeConfigKey);

    if (containerId) {
      logProcesses.delete(containerId);
    } else {
      consoleWarn("containerId should exist");
    }
  });

  const trackingKey = containerId || serviceName;
  const newLogProcesses = new Map(logProcesses);
  newLogProcesses.set(trackingKey, { process: child, serviceName });
  return newLogProcesses;
};

// Pure function to start builder services
export const startBuilderServicesPure = async (
  configs: ITestconfigV2,
  mode: IMode,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>,
): Promise<void> => {
  const builderServices: Array<{
    serviceName: string;
    runtime: string;
    configKey: string;
  }> = [];
  const processedRuntimes = new Set<string>();
  let hasWebRuntime = false;

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {
    const runtime = runtimeTests.runtime;

    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
      const builderServiceName = getBuilderServiceName(runtime);
      builderServices.push({
        serviceName: builderServiceName,
        runtime: runtime,
        configKey: runtimeTestsName,
      });
    }

    if (runtime === "web") {
      hasWebRuntime = true;
    }
  }

  for (const { serviceName, runtime, configKey } of builderServices) {
    try {
      // For web runtime, the service name might be 'webtests' instead of 'web-builder'
      const actualServiceName = runtime === "web" ? "webtests" : serviceName;
        
      // First, try to build the image locally if it doesn't exist
      const imageName = `testeranto-${runtime}-${configKey}:latest`;
      const imageExistsCmd = `docker image inspect ${imageName} > /dev/null 2>&1`;

      try {
        execSyncWrapper(imageExistsCmd, { cwd: getCwdPure() });
        consoleLog(`[Server_Docker] Image ${imageName} exists locally`);
      } catch (imageError) {
        consoleLog(
          `[Server_Docker] Image ${imageName} not found locally, trying to build...`,
        );
        // Try to build the image
        const buildCmd = `docker build -f ${configs.runtimes[configKey].dockerfile} -t ${imageName} .`;
        try {
          execSyncWrapper(buildCmd, { cwd: getCwdPure() });
          consoleLog(`[Server_Docker] Built image ${imageName}`);
        } catch (buildError) {
          consoleWarn(
            `[Server_Docker] Could not build image ${imageName}: ${buildError.message}`,
          );
          // Continue anyway - docker-compose will try to build it
        }
      }

      // Start the service
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${actualServiceName}`,
      );

      await startServiceLogging(actualServiceName, runtime, configKey);
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Failed to start builder service ${serviceName}: ${error.message}`,
      );
      consoleError(`[Server_Docker] Full error: ${error.stack || error}`);
      // Continue with other services even if one fails
    }
  }

  // Start chrome-service if there's a web runtime
  if (hasWebRuntime) {
    try {
      consoleLog(`[Server_Docker] Starting chrome-service for web runtime`);

      // First, ensure chrome-service is in the docker-compose.yml
      const checkCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
      const servicesOutput = execSyncWrapper(checkCmd, { cwd: getCwdPure() });
      const services = servicesOutput
        .trim()
        .split("\n")
        .map((s) => s.trim());

      if (!services.includes("chrome-service")) {
        consoleWarn(
          `[Server_Docker] chrome-service not found in docker-compose.yml. Regenerating...`,
        );
        // We need to regenerate the docker-compose.yml
        // This should have been done by generateServicesPure, but let's check
        consoleWarn(
          `[Server_Docker] Available services: ${services.join(", ")}`,
        );
        // We'll try to start it anyway - docker-compose might handle missing services gracefully
      } else {
        consoleLog(
          `[Server_Docker] Found chrome-service in docker-compose.yml`,
        );
      }

      // Start chrome-service with a longer timeout
      consoleLog(`[Server_Docker] Starting chrome-service...`);
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d chrome-service`,
      );

      // Wait longer for the service to start (chromium can take time)
      consoleLog(`[Server_Docker] Waiting for chrome-service to start...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if chrome-service is running
      const psCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q chrome-service`;
      const containerId = execSyncWrapper(psCmd, { cwd: getCwdPure() }).trim();

      if (containerId) {
        consoleLog(
          `[Server_Docker] chrome-service container ID: ${containerId.substring(0, 12)}`,
        );

        // Check container status
        const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
        const status = execSyncWrapper(statusCmd, { cwd: getCwdPure() }).trim();
        consoleLog(`[Server_Docker] chrome-service status: ${status}`);

        // Wait a bit more if it's starting
        if (status === "starting" || status === "created") {
          consoleLog(
            `[Server_Docker] chrome-service is ${status}, waiting a bit more...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        // Start logging for chrome-service
        // Find any web runtime config key
        let webConfigKey = "";
        for (const [key, value] of Object.entries(configs.runtimes)) {
          if (value.runtime === "web") {
            webConfigKey = key;
            break;
          }
        }
        if (!webConfigKey) {
          // Use the first config key if no web runtime found
          webConfigKey = Object.keys(configs.runtimes)[0] || "default";
        }

        await startServiceLogging("chrome-service", "web", webConfigKey);
        consoleLog(`[Server_Docker] ✅ chrome-service started and logging`);
      } else {
        consoleWarn(
          `[Server_Docker] chrome-service container not found after start attempt`,
        );
        // Try to get logs to see what happened
        try {
          const logsCmd = `docker compose -f "testeranto/docker-compose.yml" logs chrome-service --tail=30`;
          const logs = execSyncWrapper(logsCmd, { cwd: getCwdPure() });
          consoleLog(`[Server_Docker] chrome-service logs:\n${logs}`);
        } catch (logError: any) {
          consoleWarn(
            `[Server_Docker] Could not get chrome-service logs: ${logError.message}`,
          );
        }
      }
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Failed to start chrome-service: ${error.message}`,
      );
      consoleError(`[Server_Docker] Full error: ${error.stack || error}`);

      // Don't fail the entire process if chrome-service fails
      consoleWarn(`[Server_Docker] Continuing without chrome-service...`);
    }
  }

  consoleLog("[Server_Docker] ✅ All builder services started");
};

// Pure function to wait for all tests to complete
export const waitForAllTestsToCompletePure = async (
  getProcessSummary: () => any,
): Promise<void> => {
  consoleLog("[Server_Docker] Once mode: Waiting for all tests to complete...");

  await new Promise((resolve) =>
    setTimeout(resolve, WAIT_FOR_TESTS_INITIAL_DELAY),
  );

  // We'll check periodically if all test containers have finished
  const maxAttempts = WAIT_FOR_TESTS_MAX_ATTEMPTS;
  const checkInterval = WAIT_FOR_TESTS_CHECK_INTERVAL;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const summary = getProcessSummary();

    const testContainers = summary.processes.filter((process: any) => {
      const name = process.name || "";
      return (
        name.includes("-bdd") ||
        name.includes("-check-") ||
        name.includes("-builder") ||
        name.includes("-aider")
      );
    });

    const runningContainers = testContainers.filter((process: any) => {
      const state = (process.state || "").toLowerCase();
      return (
        state === "running" || state === "restarting" || state === "created"
      );
    });

    if (runningContainers.length === 0) {
      consoleLog(
        `[Server_Docker] All ${testContainers.length} test containers have completed.`,
      );

      // Additional check: ensure all test containers have exit codes (not just stopped)
      const containersWithoutExitCode = testContainers.filter(
        (process: any) => {
          // If exitCode is null or undefined, the container might have exited abnormally
          // But we still consider it done
          return process.exitCode === null || process.exitCode === undefined;
        },
      );

      if (containersWithoutExitCode.length > 0) {
        consoleLog(
          `[Server_Docker] Note: ${containersWithoutExitCode.length} containers don't have exit codes yet`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      return;
    }

    runningContainers.forEach((container: any) => {
      consoleLog(
        `  - ${container.name || container.containerId}: state=${container.state}, status=${container.status}, exitCode=${container.exitCode}`,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  consoleWarn(
    "[Server_Docker] Timeout waiting for all tests to complete. Some tests may still be running.",
  );
  consoleLog("[Server_Docker] Forcing shutdown due to timeout...");
};

// Note: DOCKER_COMPOSE_BASE needs to be imported or defined
const DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
