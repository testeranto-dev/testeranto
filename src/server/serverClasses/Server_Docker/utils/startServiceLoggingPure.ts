import fs from 'fs';
import { captureContainerExitCode } from ".";
import {
  consoleLog,
  consoleWarn,
  execSyncWrapper,
  writeFileSync,
} from "../Server_Docker_Dependents";
import { cleanTestNameForPath } from "./cleanTestNameForPath";

export const startServiceLoggingPure = async (
  serviceName: string,
  runtime: string,
  cwd: string,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  runtimeConfigKey: string,
  testName?: string,
  onLogFileCreated?: (logFilePath: string, serviceName: string, runtime: string, runtimeConfigKey: string, testName?: string) => void,
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
      } catch (error: any) {
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

  // Ensure the directory exists
  const logDir = `${cwd}/testeranto/reports/${runtimeConfigKey}`;
  try {
    const fs = await import('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      consoleLog(`[startServiceLoggingPure] Created log directory: ${logDir}`);
    }
  } catch (error) {
    consoleWarn(`[startServiceLoggingPure] Error creating log directory:`, error);
  }
  
  const logFilePath = `${logDir}/${baseName}.log`;
  consoleLog(`[startServiceLoggingPure] Log file path: ${logFilePath}`);

  // Call the callback if provided to notify about log file creation
  if (onLogFileCreated) {
    onLogFileCreated(logFilePath, serviceName, runtime, runtimeConfigKey, testName);
  }

  // Get the Docker container ID and its start time
  let dockerContainerId: string;
  let containerStartTime: string = '';
  try {
    const containerIdCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
    dockerContainerId = execSyncWrapper(containerIdCmd, { cwd: cwd }).trim();
    if (!dockerContainerId) {
      // Container doesn't exist yet, wait for it
      consoleLog(`[startServiceLoggingPure] Waiting for container to appear...`);
      for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
        await new Promise(resolve => setTimeout(resolve, 1000));
        dockerContainerId = execSyncWrapper(containerIdCmd, { cwd: cwd }).trim();
        if (dockerContainerId) {
          consoleLog(`[startServiceLoggingPure] Container found after ${i + 1} seconds: ${dockerContainerId}`);
          break;
        }
      }
      
      // If still not found, check if container exists but is exited
      if (!dockerContainerId) {
        consoleLog(`[startServiceLoggingPure] Checking for exited containers with name ${serviceName}...`);
        try {
          const allContainersCmd = `docker ps -a --filter "name=${serviceName}" --format "{{.ID}}"`;
          const allContainerIds = execSyncWrapper(allContainersCmd, { cwd: cwd }).trim();
          if (allContainerIds) {
            const containerIds = allContainerIds.split('\n').filter(id => id.trim());
            if (containerIds.length > 0) {
              dockerContainerId = containerIds[0];
              consoleLog(`[startServiceLoggingPure] Found exited container: ${dockerContainerId}`);
            }
          }
        } catch (error) {
          consoleWarn(`[startServiceLoggingPure] Error checking for exited containers:`, error);
        }
      }
    }

    if (dockerContainerId) {
      // Get container start time
      const startTimeCmd = `docker inspect --format='{{.State.StartedAt}}' ${dockerContainerId}`;
      containerStartTime = execSyncWrapper(startTimeCmd, { cwd: cwd }).trim();
    }
  } catch (error: any) {
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

  // Check container status immediately
  let status = 'unknown';
  let exitCode = null;
  
  try {
    const statusCmd = `docker inspect --format='{{.State.Status}}' ${dockerContainerId}`;
    status = execSyncWrapper(statusCmd, { cwd: cwd }).trim();
    
    if (status === 'exited' || status === 'dead') {
      try {
        const exitCodeCmd = `docker inspect --format='{{.State.ExitCode}}' ${dockerContainerId}`;
        exitCode = parseInt(execSyncWrapper(exitCodeCmd, { cwd: cwd }).trim());
      } catch (exitError) {
        // Ignore exit code error
      }
    }
  } catch (error: any) {
    consoleWarn(`[startServiceLoggingPure] Error checking container status:`, error);
  }
  
  // If container is running, wait a bit for it to potentially exit
  if (status === 'running') {
    consoleLog(`[startServiceLoggingPure] Container ${dockerContainerId} is running, waiting up to 30 seconds for it to exit...`);
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const currentStatusCmd = `docker inspect --format='{{.State.Status}}' ${dockerContainerId}`;
        const currentStatus = execSyncWrapper(currentStatusCmd, { cwd: cwd }).trim();
        if (currentStatus === 'exited' || currentStatus === 'dead') {
          status = currentStatus;
          try {
            const exitCodeCmd = `docker inspect --format='{{.State.ExitCode}}' ${dockerContainerId}`;
            exitCode = parseInt(execSyncWrapper(exitCodeCmd, { cwd: cwd }).trim());
          } catch (exitError) {
            // Ignore
          }
          break;
        }
      } catch (error) {
        // Container might have been removed
        break;
      }
    }
  }
  
  // Always capture logs, even if container has exited
  consoleLog(`[startServiceLoggingPure] Capturing logs for container ${dockerContainerId} (status: ${status})`);

  // Additional wait for builder services which might have buffered output
  if (serviceName.includes('builder') || serviceName.includes('build')) {
    consoleLog(`[startServiceLoggingPure] Builder service detected, waiting extra for log flush...`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500
  }

  // Add a small delay to ensure Docker has flushed logs to its daemon
  // This is especially important for quickly exiting containers
  if (status === 'exited' || status === 'dead') {
    consoleLog(`[startServiceLoggingPure] Container has exited, waiting 500ms for log flush...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Capture logs - always capture both stdout and stderr
  try {
    // First, try to get all logs (both stdout and stderr) without time filtering
    // This ensures we capture everything, especially for quickly exiting containers
    let allLogs = '';
    try {
      const allLogsCmd = `docker logs ${dockerContainerId} 2>&1`;
      allLogs = execSyncWrapper(allLogsCmd, { cwd: cwd });
      consoleLog(`[startServiceLoggingPure] Captured ${allLogs.length} bytes of logs`);
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
  } catch (error: any) {
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
