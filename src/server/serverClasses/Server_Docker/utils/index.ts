import { writeFileSync } from "fs";
import {
  getFullReportDir,
  getLogFilePath,
  DOCKER_COMPOSE_LOGS,
  type IDockerComposeResult,
  getContainerExitCodeFilePath,
  getStatusFilePath,
} from "../Server_Docker_Constants";
import {
  execSyncWrapper,
  consoleLog,
  processCwd,
  execAsync,
  consoleError,
  spawnWrapper,
} from "../Server_Docker_Dependents";
import { getCwdPure } from "../Server_Docker_Utils";
import { type IR } from "../Server_Docker_Utils_Run";
import path, { join } from "path";
import fs from "fs";

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

    const cmd = `${DOCKER_COMPOSE_LOGS} ${serviceName} 2>/dev/null || true`;
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

export const getTestResults = (runtime?: string, testName?: string): any[] => {
  const testResults: any[] = [];
  const cwd = process.cwd();
  const reportsDir = path.join(cwd, "testeranto", "reports");

  // Helper function to recursively collect all files
  const collectFiles = (dir: string, baseConfigKey: string, relativePath: string = ""): void => {
    if (!fs.existsSync(dir)) {
      return;
    }

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      const currentRelativePath = relativePath ? `${relativePath}/${item}` : item;
      
      if (stat.isDirectory()) {
        // Recursively collect files in subdirectories
        collectFiles(itemPath, baseConfigKey, currentRelativePath);
      } else {
        // It's a file
        try {
          let result = null;
          let fileContent = null;
          
          // For JSON files, try to parse them
          if (item.endsWith('.json')) {
            try {
              const content = fs.readFileSync(itemPath, "utf-8");
              fileContent = content;
              result = JSON.parse(content);
            } catch (parseError) {
              // If we can't parse it as JSON, just include it as a file
              result = null;
            }
          }
          
          // For other files, we might want to read them differently
          // For now, just mark them as non-JSON files
          
          testResults.push({
            file: item,
            filePath: itemPath,
            relativePath: currentRelativePath,
            result: result,
            content: fileContent,
            configKey: baseConfigKey, // Store configKey instead of runtime
            testName: relativePath, // The directory path is the test name
            isJson: item.endsWith('.json'),
            size: stat.size,
            modified: stat.mtime.toISOString()
          });
        } catch (error) {
          console.error(
            `[Server_Docker] Error processing file ${itemPath}:`,
            error,
          );
        }
      }
    }
  };

  // If both runtime and testName are provided, look for specific test results
  // Note: 'runtime' parameter is actually configKey in this context
  if (runtime && testName) {
    // Convert testName to a filesystem path
    const testPath = testName.replace(/\//g, path.sep);
    const outputDir = path.join(reportsDir, runtime, testPath);
    
    if (fs.existsSync(outputDir)) {
      collectFiles(outputDir, runtime, testName);
    } else {
      // Try to find any directory that matches the test name pattern
      const configDir = path.join(reportsDir, runtime);
      if (fs.existsSync(configDir)) {
        // Search for directories that might contain this test
        const searchForTest = (dir: string, currentPath: string = ""): void => {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            const newPath = currentPath ? `${currentPath}/${item}` : item;
            
            if (stat.isDirectory()) {
              // Check if this directory path matches the test name
              if (newPath.includes(testName) || testName.includes(newPath)) {
                collectFiles(itemPath, runtime, newPath);
              }
              // Also search deeper
              searchForTest(itemPath, newPath);
            }
          }
        };
        
        searchForTest(configDir);
      }
    }
  } else {
    // Get all config directories (e.g., nodetests, golangtests, etc.)
    const configDirs = fs.readdirSync(reportsDir).filter((item) => {
      const itemPath = path.join(reportsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const configDir of configDirs) {
      const configPath = path.join(reportsDir, configDir);
      
      // Collect all files in this config directory
      collectFiles(configPath, configDir);
    }
  }

  return testResults;
};

export const makeReportDirectory = (testName: string, configKey: string) => {
  // Create directory for test reports based on the entrypoint
  // Follow the pattern: testeranto/reports/{configKey}/{testName}/
  // where testName is the entrypoint path (e.g., "src/ts/Calculator.test.node.ts")
  // This ensures tests.json can be written to the correct location
  const cwd = getCwdPure();
  const cleanTestName = testName.replace(/^\.\//, "");
  return join(
    cwd,
    "testeranto",
    "reports",
    configKey,
    cleanTestName,
  );
};
