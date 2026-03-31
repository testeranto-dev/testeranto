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
          // consoleLog(`[startServiceLoggingPure] Stopped existing log process for ${serviceName}`);
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

  // Always start with a fresh log file with more context
  try {
    const timestamp = new Date().toISOString();
    const startMarker = `=== Log started at ${timestamp} for service ${serviceName} (runtime: ${runtime}) ===\n` +
      `=== Container ID: ${dockerContainerId || 'unknown'} ===\n` +
      `=== Test: ${testName || 'N/A'} ===\n` +
      `=== Config Key: ${runtimeConfigKey} ===\n\n`;
    writeFileSync(logFilePath, startMarker);
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Failed to create log file: ${error}`);
  }

  // Wait for container to exit (with timeout) and ensure all output is flushed
  let status = 'running';
  let exitCode = null;

  for (let i = 0; i < 180; i++) { // Wait up to 3 minutes (increased from 2)
    try {
      const statusCmd = `docker inspect --format='{{.State.Status}}' ${dockerContainerId}`;
      status = execSyncWrapper(statusCmd, { cwd: cwd }).trim();

      // Also get exit code if container has exited
      if (status === 'exited' || status === 'dead') {
        try {
          const exitCodeCmd = `docker inspect --format='{{.State.ExitCode}}' ${dockerContainerId}`;
          exitCode = parseInt(execSyncWrapper(exitCodeCmd, { cwd: cwd }).trim());
          // Wait a bit more to ensure all logs are flushed to Docker daemon
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        } catch (exitError) {
          // Continue with status check
        }
      }
    } catch (error) {
      // Container might have been removed
      consoleWarn(`[startServiceLoggingPure] Error checking container status:`, error);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Additional wait for builder services which might have buffered output
  if (serviceName.includes('builder') || serviceName.includes('build')) {
    consoleLog(`[startServiceLoggingPure] Builder service detected, waiting extra for log flush...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Capture logs - always capture both stdout and stderr
  try {
    // First, try to get all logs (both stdout and stderr) without time filtering
    // This ensures we capture everything, especially for quickly exiting containers
    let allLogs = '';
    try {
      const allLogsCmd = `docker logs ${dockerContainerId} 2>&1`;
      allLogs = execSyncWrapper(allLogsCmd, { cwd: cwd });
    } catch (allLogsError: any) {
      consoleWarn(`[startServiceLoggingPure] Error capturing all logs for ${serviceName}:`, allLogsError);
    }

    // Also try to get logs with --since if we have a start time (for completeness)
    let sinceLogs = '';
    if (containerStartTime) {
      try {
        const sinceLogsCmd = `docker logs --since "${containerStartTime}" ${dockerContainerId} 2>&1`;
        sinceLogs = execSyncWrapper(sinceLogsCmd, { cwd: cwd });
      } catch (sinceLogsError: any) {
        // Ignore this error, we already have allLogs
      }
    }

    // Write captured logs to file
    let hasLogs = false;

    // Use allLogs if available, otherwise use sinceLogs
    const logsToWrite = allLogs || sinceLogs;

    if (logsToWrite && logsToWrite.trim().length > 0) {
      fs.appendFileSync(logFilePath, "=== ALL LOGS (stdout + stderr) ===\n");
      fs.appendFileSync(logFilePath, logsToWrite);
      if (!logsToWrite.endsWith('\n')) {
        fs.appendFileSync(logFilePath, '\n');
      }
      hasLogs = true;
    }

    // Also try to capture stdout and stderr separately for better visibility
    if (!hasLogs) {
      // Try separate capture as fallback
      let stdoutLogs = '';
      let stderrLogs = '';

      try {
        const stdoutCmd = `docker logs ${dockerContainerId}`;
        stdoutLogs = execSyncWrapper(stdoutCmd, { cwd: cwd });
      } catch (stdoutError: any) {
        // Ignore
      }

      try {
        const stderrCmd = `docker logs ${dockerContainerId} 2>&1 1>/dev/null`;
        stderrLogs = execSyncWrapper(stderrCmd, { cwd: cwd });
      } catch (stderrError: any) {
        // Ignore
      }

      if (stdoutLogs && stdoutLogs.trim().length > 0) {
        fs.appendFileSync(logFilePath, "=== STDOUT ===\n");
        fs.appendFileSync(logFilePath, stdoutLogs);
        if (!stdoutLogs.endsWith('\n')) {
          fs.appendFileSync(logFilePath, '\n');
        }
        hasLogs = true;
      }

      if (stderrLogs && stderrLogs.trim().length > 0) {
        fs.appendFileSync(logFilePath, "=== STDERR ===\n");
        fs.appendFileSync(logFilePath, stderrLogs);
        if (!stderrLogs.endsWith('\n')) {
          fs.appendFileSync(logFilePath, '\n');
        }
        hasLogs = true;
      }
    }

    if (!hasLogs) {
      fs.appendFileSync(logFilePath, '\n=== No logs captured (container may have exited without output) ===\n');

      // Try one more time with different options
      try {
        const finalTryCmd = `docker logs --timestamps ${dockerContainerId} 2>&1 || true`;
        const finalLogs = execSyncWrapper(finalTryCmd, { cwd: cwd });
        if (finalLogs && finalLogs.trim().length > 0) {
          fs.appendFileSync(logFilePath, "=== FINAL ATTEMPT (with --timestamps) ===\n");
          fs.appendFileSync(logFilePath, finalLogs);
          if (!finalLogs.endsWith('\n')) {
            fs.appendFileSync(logFilePath, '\n');
          }
        }
      } catch (finalError: any) {
        // Ignore final attempt errors
      }
    }
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Error capturing logs for ${serviceName}:`, error);
    fs.appendFileSync(logFilePath, `\n=== Error capturing logs: ${error} ===\n`);

    // Try to get any available logs even if there was an error
    try {
      const emergencyCmd = `docker logs ${dockerContainerId} 2>&1 || echo "Failed to get emergency logs"`;
      const emergencyLogs = execSyncWrapper(emergencyCmd, { cwd: cwd });
      fs.appendFileSync(logFilePath, "=== EMERGENCY LOG ATTEMPT ===\n");
      fs.appendFileSync(logFilePath, emergencyLogs);
      if (!emergencyLogs.endsWith('\n')) {
        fs.appendFileSync(logFilePath, '\n');
      }
    } catch (emergencyError: any) {
      fs.appendFileSync(logFilePath, `\n=== Emergency log attempt failed: ${emergencyError} ===\n`);
    }
  }

  // Add end marker with exit code information
  const endTimestamp = new Date().toISOString();
  let statusMessage = `container status: ${status}`;
  if (exitCode !== null) {
    statusMessage += `, exit code: ${exitCode}`;
  }
  fs.appendFileSync(logFilePath, `\n=== Log captured at ${endTimestamp} (${statusMessage}) ===\n`);

  // Capture exit code
  captureContainerExitCode(serviceName, runtime, runtimeConfigKey, testName);

  consoleLog(`[startServiceLoggingPure] Captured logs for ${serviceName}, status: ${status}`);

  // No background processes to track
  return new Map();
};
