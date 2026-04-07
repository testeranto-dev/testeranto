import fs, { writeFileSync, unlinkSync } from "fs";
import {
  getFullReportDir,
  getLogFilePath,
  DOCKER_COMPOSE_LOGS,
  type IDockerComposeResult,
  getContainerExitCodeFilePath,
  getStatusFilePath,
  type IR,
} from "../Server_Docker_Constants";
import {
  execSyncWrapper,
  consoleLog,
  processCwd,
  execAsync,
  consoleError,
  spawnWrapper,
  join,
  existsSync,
  readFileSync,
  readdirSync,
} from "../Server_Docker_Dependents";
import type { ITesterantoConfig } from "../../../../Types";

export const captureExistingLogs: IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName?: string,
): void => {
  // This function is called before starting service logging
  // We don't need to capture old logs since startServiceLoggingPure
  // will create fresh log files
  // However, we might want to clean up any old log files
  // For now, just log that we're starting fresh
  consoleLog(`[captureExistingLogs] Starting fresh logs for ${serviceName}`);
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

export const spawnPromise = (
  command: string,
  options?: { cwd?: string },
): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    // Use shell: true to let the shell handle command parsing (including quotes)
    const child = spawnWrapper(command, [], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      cwd: options?.cwd || processCwd(),
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

// Helper to clean test name for file paths (preserves directory structure)
const cleanTestNameForPath = (testName: string): string => {
  // Convert to lowercase
  let result = testName.toLowerCase();
  // Replace dots with hyphens in the filename part only
  const parts = result.split('/');
  const lastPart = parts[parts.length - 1];
  const cleanedLastPart = lastPart.replace(/\./g, '-');
  parts[parts.length - 1] = cleanedLastPart;
  result = parts.join('/');
  // Remove any other invalid characters (keep slashes, hyphens, underscores, alphanumeric)
  result = result.replace(/[^a-z0-9_\-/]/g, '');
  return result;
};

export const checkBundlesReady = (
  configs: ITesterantoConfig,
  cwd: string,
  failedConfigs: Set<string> = new Set()  // Add optional failedConfigs parameter
): boolean => {
  let allBundlesReady = true;
  let readyCount = 0;
  let totalCount = 0;

  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    // Skip configs that are already marked as failed
    if (failedConfigs.has(configKey)) {
      consoleLog(`[checkBundlesReady] Skipping failed config ${configKey}`);
      continue;
    }

    totalCount++;
    const bundleDir = `${cwd}/testeranto/bundles/${configKey}`;
    const inputFilesPath = `${bundleDir}/inputFiles.json`;

    // Check if inputFiles.json exists and has content
    if (!existsSync(inputFilesPath)) {
      consoleLog(`[checkBundlesReady] Bundle not ready for ${configKey}: inputFiles.json missing`);
      allBundlesReady = false;
      continue;
    }

    try {
      const fileContent = readFileSync(inputFilesPath, 'utf-8');
      if (fileContent.trim().length === 0) {
        consoleLog(`[checkBundlesReady] Bundle not ready for ${configKey}: inputFiles.json empty`);
        allBundlesReady = false;
        continue;
      }

      // Check if there are actual bundle files
      const bundleFiles = readdirSync(bundleDir);
      const hasBundleFiles = bundleFiles.some(file =>
        file.endsWith('.js') || file.endsWith('.mjs') ||
        file.endsWith('.py') || file.endsWith('.go') ||
        file.endsWith('.rb') || file.endsWith('.rs') ||
        file.endsWith('.java') || file.endsWith('.class')
      );

      if (!hasBundleFiles && bundleFiles.length <= 1) { // Only inputFiles.json
        consoleLog(`[checkBundlesReady] Bundle not ready for ${configKey}: no bundle files`);
        allBundlesReady = false;
      } else {
        readyCount++;
        consoleLog(`[checkBundlesReady] ✅ Bundle ready for ${configKey}: ${bundleFiles.length} files`);
      }
    } catch (error) {
      consoleLog(`[checkBundlesReady] Error checking bundle for ${configKey}: ${error}`);
      allBundlesReady = false;
    }
  }

  return allBundlesReady;
};

export const captureContainerExitCode = (
  serviceName: string,
  runtime: string,
  runTimeConfigKey: string,
  testName?: string,
): void => {
  const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
  const containerId = execSyncWrapper(containerIdCmd, {
    cwd: processCwd(),
  }).trim();

  if (containerId) {
    const inspectCmd = `docker inspect --format='{{.State.ExitCode}}' ${containerId}`;
    const exitCode = execSyncWrapper(inspectCmd, {
      cwd: processCwd(),
    }).trim();

    // Determine base name
    let baseName: string;
    if (testName) {
      // For test services, we need to extract the suffix from serviceName and append it with underscore
      const cleanedTestName = cleanTestNameForPath(testName);

      // Extract suffix from serviceName (e.g., "-bdd", "-check-0")
      const suffixMatch = serviceName.match(/-(bdd|check-\d+|aider|builder)$/);
      if (suffixMatch) {
        const suffix = suffixMatch[1]; // "bdd", "check-0", etc.
        baseName = `${cleanedTestName}_${suffix}`;
      } else {
        baseName = serviceName;
      }
    } else {
      baseName = serviceName;
    }

    const containerExitCodeFilePath = `${processCwd()}/testeranto/reports/${runTimeConfigKey}/${baseName}.container.exitcode`;
    writeFileSync(containerExitCodeFilePath, exitCode);

    consoleLog(
      `[Server_Docker] Container ${serviceName} (${containerId.substring(0, 12)}) exited with code ${exitCode}`,
    );

    const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
    const status = execSyncWrapper(statusCmd, {
      cwd: processCwd(),
    }).trim();
    const statusFilePath = `${processCwd()}/testeranto/reports/${runTimeConfigKey}/${baseName}.container.status`;
    writeFileSync(statusFilePath, status);
  } else {
    consoleLog(`[Server_Docker] No container found for service ${serviceName}`);
  }
};

export const makeReportDirectory = (testName: string, configKey: string) => {
  // Create directory for test reports based on the entrypoint
  // Follow the pattern: testeranto/reports/{configKey}/{testName}/
  // where testName is the entrypoint path (e.g., "src/ts/Calculator.test.node.ts")
  // This ensures tests.json can be written to the correct location
  const cwd = processCwd();
  const cleanTestName = testName.replace(/^\.\//, "");
  return join(cwd, "testeranto", "reports", configKey, cleanTestName);
};
