/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Server_Docker_Utils_Run: Run-related pure functions for Server_Docker
import type { ICheck, IChecks, IRunTime, ITestconfigV2 } from "../../../Types";
import type { IMode } from "../../types";
import {
  cleanTestName,
  DOCKER_COMPOSE_LOGS,
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
  mkdirSync,
  processCwd,
  readdirSync,
  readFileSync,
  relative,
  sep,
  spawnWrapper,
  watch,
  watchFile,
  writeFileSync,
} from "./Server_Docker_Dependents";
import { getCwdPure } from "./Server_Docker_Utils";

export const spawnPromise = (
  command: string,
  options?: { cwd?: string },
): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    // Use shell: true to let the shell handle command parsing (including quotes)
    const child = spawnWrapper(command, [], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      cwd: options?.cwd || getCwdPure(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      // Also log to console for real-time debugging
      process.stdout.write(chunk);
    });

    child.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      // Also log to console for real-time debugging
      process.stderr.write(chunk);
    });

    child.on("error", (error: Error) => {
      reject(error);
    });

    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(code || 0);
      } else {
        reject(
          new Error(
            `Process exited with code ${code}\nCommand: ${command}\nstdout: ${stdout}\nstderr: ${stderr}`,
          ),
        );
      }
    });
  });
};

// Capture container exit code utility
export const captureContainerExitCode = (
  serviceName: string,
  runtime: string,
  runTimeConfigKey: string,
): void => {
  const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
  const containerId = execSyncWrapper(containerIdCmd, {
    cwd: getCwdPure(),
  }).trim();

  if (containerId) {
    const inspectCmd = `docker inspect --format='{{.State.ExitCode}}' ${containerId}`;
    const exitCode = execSyncWrapper(inspectCmd, {
      cwd: getCwdPure(),
    }).trim();

    const containerExitCodeFilePath = getContainerExitCodeFilePath(
      getCwdPure(),
      runtime,
      serviceName,
      runTimeConfigKey,
    );
    writeFileSync(containerExitCodeFilePath, exitCode);

    consoleLog(
      `[Server_Docker] Container ${serviceName} (${containerId.substring(0, 12)}) exited with code ${exitCode}`,
    );

    const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
    const status = execSyncWrapper(statusCmd, {
      cwd: getCwdPure(),
    }).trim();
    const statusFilePath = getStatusFilePath(
      getCwdPure(),
      runtime,
      serviceName,
      runTimeConfigKey,
    );
    writeFileSync(statusFilePath, status);
  } else {
    consoleLog(`[Server_Docker] No container found for service ${serviceName}`);
  }
};

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

export const getAiderProcessesPure = (
  configs: any,
  processes: any[],
): any[] => {
  const aiderProcesses = processes.filter(
    (process: any) => process.name && process.name.includes("-aider"),
  );

  return aiderProcesses.map((process: any) => {
    let runtime = "";
    let testName = "";
    let configKey = "";

    const name = process.name || process.containerName || "";
    if (name.includes("-aider")) {
      // Parse container name to extract runtime and test name
      // Format: {configKey}-{testName}-aider
      const match = name.match(/^(.+?)-(.+)-aider$/);
      if (match) {
        configKey = match[1];
        const testPart = match[2];

        //   find the runtime from configs
        for (const [key, configValue] of Object.entries(configs.runtimes)) {
          if (key === configKey) {
            runtime = configValue.runtime;
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

    const connectCommand = `docker exec -it ${process.containerId} aider`;

    return {
      ...process,
      name: name,
      containerId: process.containerId || "",
      runtime: runtime,
      testName: testName,
      configKey: configKey,
      status: process.status || "",
      state: process.state || "",
      isActive: process.isActive || false,
      exitCode: process.exitCode || null,
      startedAt: process.startedAt || null,
      finishedAt: process.finishedAt || null,
      connectCommand: connectCommand,
      terminalCommand: connectCommand,
      containerName: name,
      timestamp: new Date().toISOString(),
    };
  });
};

export const informAiderPure = async (
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  inputFiles: any,
  captureExistingLogs: (serviceName: string, runtime: string) => void,
  writeConfigForExtension: () => void,
): Promise<void> => {
  const uid = generateUid(configKey, testName);
  const aiderServiceName = getAiderServiceName(uid);
  const inputFilesPath = `testeranto/bundles/${runtime}/${testName}-inputFiles.json`;

  try {
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${aiderServiceName}`;
    const containerId = execSyncWrapper(containerIdCmd, {
      encoding: "utf-8",
    }).trim();

    if (!containerId) {
      throw `[Server_Docker] No container found for aider service: ${aiderServiceName}`;
    }

    const inputContent = readFileSync(inputFilesPath, "utf-8");

    // Send the input content to the aider process's stdin
    // We'll use docker exec to write to the main process's stdin (PID 1)
    // The -i flag keeps stdin open, and we pipe the content
    const sendInputCmd = `echo ${JSON.stringify(inputContent)} | docker exec -i ${containerId} sh -c 'cat > /proc/1/fd/0'`;

    execSyncWrapper(sendInputCmd, {
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch (error: any) {
    consoleError(
      `[Server_Docker] Failed to inform aider service ${aiderServiceName}: ${error.message}`,
    );
    captureExistingLogs(aiderServiceName, runtime);
  }
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
      docker compose -f "testeranto/docker-compose.yml" logs --no-color -f ${runtime}
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
    `${DOCKER_COMPOSE_BASE} ps -q ${runtime}`,
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

    captureContainerExitCode(serviceName, runtime, cwd);

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

// Pure function to watch output files
export const watchInputFilePure = async (
  runtime: IRunTime,
  testsName: string,
  configs: ITestconfigV2,
  mode: IMode,
  inputFiles: Record<string, Record<string, string[]>>,
  hashs: Record<string, Record<string, string>>,
  setState: (
    inputFiles: Record<string, Record<string, string[]>>,
    hashs: Record<string, Record<string, string>>,
  ) => void,
  launchBddTest: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) => Promise<void>,
  launchChecks: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) => Promise<void>,
  informAider: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any,
  ) => Promise<void>,
  resourceChanged: (path: string) => void,
  loadInputFileOnce: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
  ) => void,
): Promise<{
  inputFiles: Record<string, Record<string, string[]>>;
  hashs: Record<string, Record<string, string>>;
}> => {
  let configKey: string = "";
  for (const [key, configValue] of Object.entries(configs.runtimes)) {
    if (
      configValue.runtime === runtime &&
      configValue.tests.includes(testsName)
    ) {
      configKey = key;
      break;
    }
  }

  let inputFilePath: string;
  try {
    inputFilePath = getInputFilePath(runtime, configKey);
  } catch (error: any) {
    consoleWarn(
      `[Server_Docker] No input file path for ${runtime}/${configKey}: ${error.message}`,
    );
    return { inputFiles, hashs };
  }

  const newInputFiles = { ...inputFiles };
  const newHashs = { ...hashs };

  if (!newInputFiles[configKey]) {
    newInputFiles[configKey] = {};
  }

  if (!existsSync(inputFilePath)) {
    consoleWarn(`${inputFilePath} does not exist yet.`);
    return { inputFiles: newInputFiles, hashs: newHashs };
  }

  const fileContent = readFileSync(inputFilePath, "utf-8");
  const allTestsInfo = JSON.parse(fileContent);




  if (allTestsInfo[testsName]) {
    const testInfo = allTestsInfo[testsName];
    newInputFiles[configKey][testsName] = testInfo.files || [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testsName] = testInfo.hash || "";

    // Create directories for each test entrypoint to ensure test.json files can be placed correctly
    // According to the bug report, test.json files should follow the structure of the entrypoint
    // For each test in the input JSON, create the appropriate directory under testeranto/reports/{configKey}/
    const cwd = getCwdPure();
    for (const [currentTestName, testInfo] of Object.entries(allTestsInfo)) {
      if (testInfo && testInfo.files && Array.isArray(testInfo.files)) {
        for (const file of testInfo.files) {
          // The file path is the entrypoint (e.g., "src/ts/Calculator.test.node.mjs")
          // We need to create a directory structure under testeranto/reports/{configKey}/{filePath}/
          // But actually, we want the parent directory of where the test.json will be placed
          // According to the bug report, test.json should be at {entrypointPath}.tests.json
          // So we need to create the directory for the entrypoint path
          const entrypointPath = file;
          // Remove leading "./" if present
          const cleanPath = entrypointPath.replace(/^\.\//, '');
          // Create directory path: testeranto/reports/{configKey}/{cleanPath}/
          // According to the bug report, test.json should be placed at {entrypointPath}/tests.json
          // So we need to create a directory for the entire cleanPath (including the filename as a directory)
          const fullDirPath = join(cwd, "testeranto", "reports", configKey, cleanPath);
          // We need to create the directory for fullDirPath, not remove the last component
          // Because tests.json will be placed inside a directory named after the entrypoint file
          const dirToCreate = fullDirPath;
          try {
            if (!existsSync(dirToCreate)) {
              mkdirSync(dirToCreate, { recursive: true });
              consoleLog(`[Server_Docker] Created directory for test reports: ${dirToCreate}`);
            }
          } catch (error: any) {
            consoleWarn(`[Server_Docker] Failed to create directory ${dirToCreate}: ${error.message}`);
          }
        }
      }
    }

  } else {
    newInputFiles[configKey][testsName] = [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testsName] = "";
  }

  if (mode === "dev") {
    watchFile(inputFilePath, (curr, prev) => {
      if (!existsSync(inputFilePath)) {
        consoleWarn(`${inputFilePath} does not exist yet.`);
        return;
      }

      const fileContent = readFileSync(inputFilePath, "utf-8");
      const allTestsInfo = JSON.parse(fileContent);
      if (allTestsInfo[testsName]) {
        const testInfo = allTestsInfo[testsName];
        const newHash = testInfo.hash || "";
        const oldHash = newHashs[configKey]?.[testsName] || "";

        const updatedInputFiles = { ...newInputFiles };
        const updatedHashs = { ...newHashs };

        if (!updatedInputFiles[configKey]) {
          updatedInputFiles[configKey] = {};
        }
        if (!updatedHashs[configKey]) {
          updatedHashs[configKey] = {};
        }

        updatedInputFiles[configKey][testsName] = testInfo.files || [];
        updatedHashs[configKey][testsName] = newHash;

        setState(updatedInputFiles, updatedHashs);
        resourceChanged("/~/inputfiles");

        if (newHash !== oldHash) {
          for (const [ck, configValue] of Object.entries(configs.runtimes)) {
            if (
              configValue.runtime === runtime &&
              configValue.tests.includes(testsName)
            ) {
              launchBddTest(runtime, testsName, ck, configValue);
              launchChecks(runtime, testsName, ck, configValue);
              informAider(runtime, testsName, ck, configValue, testInfo.files);
              break;
            }
          }
        }
      }
    });
  } else {
    loadInputFileOnce(runtime, testsName, configKey);
  }

  return { inputFiles: newInputFiles, hashs: newHashs };
};

export const watchOutputFilePure = (
  configKey: string,
  testName: string,
  runtime: IRunTime,
  mode: IMode,
  outputFiles: Record<string, Record<string, string[]>>,
  resourceChanged: (path: string) => void,
  updateOutputFilesList: (
    outputFiles: Record<string, Record<string, string[]>>,
    configKey: string,
    testName: string,
    outputDir: string,
    projectRoot: string,
  ) => Record<string, Record<string, string[]>>,
): Record<string, Record<string, string[]>> => {
  const cwd = getCwdPure();
  const outputDir = getFullReportDir(cwd, runtime);
  const projectRoot = cwd;

  // Ensure the output directory exists
  if (!existsSync(outputDir)) {
    consoleLog(`[Server_Docker] Creating output directory: ${outputDir}`);
    mkdirSync(outputDir, { recursive: true });
  }

  let newOutputFiles = { ...outputFiles };
  if (!newOutputFiles[configKey]) {
    newOutputFiles[configKey] = {};
  }
  if (!newOutputFiles[configKey][testName]) {
    newOutputFiles[configKey][testName] = [];
  }

  newOutputFiles = updateOutputFilesList(
    newOutputFiles,
    configKey,
    testName,
    outputDir,
    projectRoot,
  );

  if (mode === "dev") {
    watch(outputDir, (eventType, filename) => {
      if (filename) {
        newOutputFiles = updateOutputFilesList(
          newOutputFiles,
          configKey,
          testName,
          outputDir,
          projectRoot,
        );
        resourceChanged("/~/outputfiles");
      }
    });
  }

  return newOutputFiles;
};

// Pure function to handle aider processes
export const handleAiderProcessesPure = (
  configs: any,
  getProcessSummary: () => any,
): any => {
  const summary = getProcessSummary();
  const aiderProcesses = getAiderProcessesPure(configs, summary.processes);
  return {
    aiderProcesses: aiderProcesses,
    timestamp: new Date().toISOString(),
    message: "Success",
  };
};

// Pure function to build aider image

// Pure function to start builder services
export const startBuilderServicesPure = async (
  configs: any,
  mode: IMode,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>,
): Promise<void> => {
  const builderServices: string[] = [];
  const processedRuntimes = new Set<string>();

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {
    const runtime = runtimeTests.runtime;

    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
      const builderServiceName = getBuilderServiceName(runtime);
      builderServices.push(builderServiceName);
    }
  }

  for (const serviceName of builderServices) {
    try {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`,
      );

      let runtimeForService = "";
      for (const [runtimeTestsName, runtimeTests] of Object.entries(
        configs.runtimes,
      )) {
        const runtime = runtimeTests.runtime;
        if (getBuilderServiceName(runtime) === serviceName) {
          runtimeForService = runtime;
          break;
        }
      }

      if (runtimeForService) {
        await startServiceLogging(serviceName, runtimeForService);
      }
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Failed to start builder service ${serviceName}:`,
        error.message,
      );
      // Continue with other services even if one fails
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

export type IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
) => void;

export const captureExistingLogs: IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
): void => {
  const reportDir = getFullReportDir(getCwdPure(), runtime);
  const logFilePath = getLogFilePath(
    getCwdPure(),
    runtime,
    serviceName,
    runtimeConfigKey,
  );

  try {
    // First, check if the container exists (including stopped ones)
    const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
    const containerId = execSyncWrapper(checkCmd, {
      cwd: getCwdPure(),
      encoding: "utf-8",
    }).trim();

    const cmd = `${DOCKER_COMPOSE_LOGS} ${runtime} 2>/dev/null || true`;
    const existingLogs = execSyncWrapper(cmd, {
      cwd: getCwdPure(),
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (existingLogs && existingLogs.trim().length > 0) {
      writeFileSync(logFilePath, existingLogs);
      consoleLog(
        `[Server_Docker] Captured ${existingLogs.length} bytes of existing logs for ${serviceName}`,
      );
    } else {
      // If no logs exist, create an empty file
      writeFileSync(logFilePath, "");
    }

    // Also try to capture the container exit code if it has exited
    captureContainerExitCode(serviceName, runtime, runtimeConfigKey);
  } catch (error: any) {
    // It's okay if this fails - the container might not exist yet
    consoleLog(
      `[Server_Docker] No existing logs for ${serviceName}: ${error.message}`,
    );
  }
};

export const executeDockerComposeCommand = async (
  command: string,
  options?: {
    useExec?: boolean;
    execOptions?: { cwd: string };
    errorMessage?: string;
  },
): Promise<IDockerComposeResult> => {
  const useExec = options?.useExec ?? false;
  const execOptions = options?.execOptions ?? { cwd: processCwd() };
  const errorMessage =
    options?.errorMessage ?? "Error executing docker compose command";

  try {
    if (useExec) {
      const { stdout, stderr } = await execAsync(command, execOptions);
      return {
        exitCode: 0,
        out: stdout,
        err: stderr,
        data: null,
      };
    } else {
      // For spawn-based commands, we need to handle them differently
      // Since spawnPromise is in Server_Docker.ts, we'll return a special result
      // and let the caller handle it
      return {
        exitCode: 0,
        out: "",
        err: "",
        data: { command, spawn: true },
      };
    }
  } catch (error: any) {
    consoleError(`[Docker] ${errorMessage}: ${error.message}`);
    return {
      exitCode: 1,
      out: "",
      err: `${errorMessage}: ${error.message}`,
      data: null,
    };
  }
};

// Note: DOCKER_COMPOSE_BASE needs to be imported or defined
const DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
