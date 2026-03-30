import { captureContainerExitCode } from ".";
import {
  getLogFilePath,
  getExitCodeFilePath,
  DOCKER_COMPOSE_BASE,
} from "../Server_Docker_Constants";
import {
  execSyncWrapper,
  consoleWarn,
  writeFileSync,
  spawnWrapper,
  consoleLog,
} from "../Server_Docker_Dependents";
import fs from 'fs';
import { spawn } from 'child_process';

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

export const startServiceLoggingPure = async (
  serviceName: string,
  runtime: string,
  cwd: string,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  runtimeConfigKey: string,
  testName?: string,
): Promise<Map<string, { process: any; serviceName: string }>> => {
  // First, properly stop any existing logging processes for this service
  for (const [trackingId, logProcess] of logProcesses.entries()) {
    if (logProcess.serviceName === serviceName) {
      try {
        if (!logProcess.process.killed) {
          // Kill the process and wait for it to exit
          const exitPromise = new Promise<void>((resolve) => {
            logProcess.process.once('close', () => {
              resolve();
            });
          });
          logProcess.process.kill('SIGTERM');
          // Wait up to 1 second for the process to exit
          await Promise.race([
            exitPromise,
            new Promise(resolve => setTimeout(resolve, 1000))
          ]);
          consoleLog(`[startServiceLoggingPure] Stopped existing log process for ${serviceName}`);
        }
      } catch (error) {
        consoleWarn(`[startServiceLoggingPure] Error stopping existing log process for ${serviceName}:`, error);
      }
      // Remove from tracking
      logProcesses.delete(trackingId);
    }
  }

  // Determine the base name for file paths
  let baseName: string;
  if (testName) {
    const cleanedTestName = cleanTestNameForPath(testName);
    const suffixMatch = serviceName.match(/-(bdd|check-\d+|aider|builder)$/);
    if (suffixMatch) {
      const suffix = suffixMatch[1];
      baseName = `${cleanedTestName}_${suffix}`;
    } else {
      baseName = serviceName;
    }
  } else {
    baseName = serviceName;
  }
  
  const logFilePath = `${cwd}/testeranto/reports/${runtimeConfigKey}/${baseName}.log`;
  
  // Always start with a fresh log file
  try {
    const timestamp = new Date().toISOString();
    const startMarker = `=== Log started at ${timestamp} for service ${serviceName} (runtime: ${runtime}) ===\n\n`;
    writeFileSync(logFilePath, startMarker);
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Failed to create log file: ${error}`);
  }

  // Get the Docker container ID and its start time
  let dockerContainerId: string;
  let containerStartTime: string;
  try {
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
    dockerContainerId = execSyncWrapper(containerIdCmd, { cwd: cwd }).trim();
    if (!dockerContainerId) {
      // Container doesn't exist yet, wait for it
      for (let i = 0; i < 10; i++) { // Reduced from 30 to 10 seconds
        await new Promise(resolve => setTimeout(resolve, 1000));
        dockerContainerId = execSyncWrapper(containerIdCmd, { cwd: cwd }).trim();
        if (dockerContainerId) break;
      }
    }
    
    if (dockerContainerId) {
      // Get container start time
      const startTimeCmd = `docker inspect --format='{{.State.StartedAt}}' ${dockerContainerId}`;
      containerStartTime = execSyncWrapper(startTimeCmd, { cwd: cwd }).trim();
    }
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Error getting container info for ${serviceName}:`, error);
    // Still try to capture exit code
    captureContainerExitCode(serviceName, runtime, runtimeConfigKey, testName);
    return new Map(); // Return empty map, no processes to track
  }

  if (!dockerContainerId) {
    consoleWarn(`[startServiceLoggingPure] Container not found for ${serviceName}, skipping logging`);
    // Still try to capture exit code
    captureContainerExitCode(serviceName, runtime, runtimeConfigKey, testName);
    return new Map(); // Return empty map, no processes to track
  }

  // Wait for container to exit (with timeout)
  let status = 'running';
  for (let i = 0; i < 120; i++) { // Wait up to 2 minutes
    try {
      const statusCmd = `docker inspect --format='{{.State.Status}}' ${dockerContainerId}`;
      status = execSyncWrapper(statusCmd, { cwd: cwd }).trim();
      if (status === 'exited' || status === 'dead') {
        break;
      }
    } catch (error) {
      // Container might have been removed
      consoleWarn(`[startServiceLoggingPure] Error checking container status:`, error);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Capture logs from container start time
  try {
    let logs = '';
    if (containerStartTime) {
      // Use --since to get logs only from this container's start time
      const logsCmd = `docker logs --since "${containerStartTime}" ${dockerContainerId}`;
      logs = execSyncWrapper(logsCmd, { cwd: cwd });
    } else {
      // Fallback to all logs if we couldn't get start time
      const logsCmd = `docker logs ${dockerContainerId}`;
      logs = execSyncWrapper(logsCmd, { cwd: cwd });
    }
    
    if (logs && logs.trim().length > 0) {
      fs.appendFileSync(logFilePath, logs);
    } else {
      fs.appendFileSync(logFilePath, '\n=== No logs captured ===\n');
    }
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Error capturing logs for ${serviceName}:`, error);
    fs.appendFileSync(logFilePath, `\n=== Error capturing logs: ${error} ===\n`);
  }

  // Add end marker
  const endTimestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `\n=== Log captured at ${endTimestamp} (container status: ${status}) ===\n`);

  // Capture exit code
  captureContainerExitCode(serviceName, runtime, runtimeConfigKey, testName);
  
  consoleLog(`[startServiceLoggingPure] Captured logs for ${serviceName}, status: ${status}`);

  // No background processes to track
  return new Map();
};
