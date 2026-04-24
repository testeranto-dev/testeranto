import { execSync } from "child_process";
import { consoleWarn, processCwd } from "../Server_Docker/Server_Docker_Dependents";

export function getAiderProcessesPure({
  aiderProcesses,
}: {
  aiderProcesses: Map<string, any>;
}): any[] {
  // Ensure aiderProcesses is initialized
  if (!aiderProcesses) {
    consoleWarn('[Server_Docker] aiderProcesses not initialized, returning empty array');
    return [];
  }

  // Update status of aider processes
  for (const [processId, process] of aiderProcesses.entries()) {
    try {
      const cmd = `docker inspect ${process.containerId || process.containerName} --format='{{.State.Status}}'`;
      const status = execSync(cmd, { cwd: processCwd() }).toString().trim();

      process.status = status;
      process.isActive = status === 'running';

      if (!process.isActive) {
        try {
          const exitCodeCmd = `docker inspect ${process.containerId || process.containerName} --format='{{.State.ExitCode}}'`;
          const exitCode = execSync(exitCodeCmd, { cwd: processCwd() }).toString().trim();
          process.exitCode = parseInt(exitCode) || 0;
        } catch (error) {
          process.exitCode = undefined;
        }
      }

      process.lastActivity = new Date().toISOString();
    } catch (error) {
      // Container might not exist anymore
      process.status = 'exited';
      process.isActive = false;
    }
  }

  // Remove processes that have been exited for a while
  const now = new Date();
  for (const [processId, process] of aiderProcesses.entries()) {
    if (process.status === 'exited' || process.status === 'stopped') {
      const lastActivity = new Date(process.lastActivity);
      const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) { // Remove processes that have been inactive for 24 hours
        aiderProcesses.delete(processId);
      }
    }
  }

  return Array.from(aiderProcesses.values());
}
