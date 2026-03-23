import { writeFileSync } from "fs";
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
} from "../Server_Docker_Dependents";

export const captureExistingLogs: IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
): void => {
  const reportDir = getFullReportDir(processCwd(), runtime);
  const logFilePath = getLogFilePath(
    processCwd(),
    runtime,
    serviceName,
    runtimeConfigKey,
  );

  try {
    // First, check if the container exists (including stopped ones)
    const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -a -q ${serviceName}`;
    const containerId = execSyncWrapper(checkCmd, {
      cwd: processCwd(),
      encoding: "utf-8",
    }).trim();

    const cmd = `${DOCKER_COMPOSE_LOGS} ${serviceName} 2>/dev/null || true`;
    const existingLogs = execSyncWrapper(cmd, {
      cwd: processCwd(),
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

export const captureContainerExitCode = (
  serviceName: string,
  runtime: string,
  runTimeConfigKey: string,
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

    const containerExitCodeFilePath = getContainerExitCodeFilePath(
      processCwd(),
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
      cwd: processCwd(),
    }).trim();
    const statusFilePath = getStatusFilePath(
      processCwd(),
      runtime,
      serviceName,
      runTimeConfigKey,
    );
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
