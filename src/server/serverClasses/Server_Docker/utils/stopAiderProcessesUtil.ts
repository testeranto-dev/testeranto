import { promisify } from "util";
import { exec } from "child_process";

export async function stopAiderProcessesUtil(
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void
): Promise<void> {
  try {
    const execAsync = promisify(exec);

    // Get all container IDs with names containing 'aider'
    const { stdout } = await execAsync('docker ps --format "{{.ID}} {{.Names}}"');
    const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');

    const aiderContainers = lines.filter(line => {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        const containerName = parts[1];
        return containerName.includes('aider');
      }
      return false;
    }).map(line => line.split(' ')[0]);

    if (aiderContainers.length === 0) {
      consoleLog("[Server_Docker] No aider containers found");
      return;
    }

    consoleLog(`[Server_Docker] Found ${aiderContainers.length} aider containers to stop`);

    // Stop each aider container
    for (const containerId of aiderContainers) {
      try {
        consoleLog(`[Server_Docker] Stopping aider container: ${containerId}`);
        await execAsync(`docker stop ${containerId}`);
        consoleLog(`[Server_Docker] Stopped aider container: ${containerId}`);
      } catch (error: any) {
        consoleError(`[Server_Docker] Error stopping aider container ${containerId}: ${error.message}`);
      }
    }

    // Wait for them to stop
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove stopped aider containers
    for (const containerId of aiderContainers) {
      try {
        await execAsync(`docker rm -f ${containerId}`);
        consoleLog(`[Server_Docker] Removed aider container: ${containerId}`);
      } catch (error: any) {
        // Container might already be removed, ignore
      }
    }

  } catch (error: any) {
    consoleError(`[Server_Docker] Error in stopAiderProcesses: ${error.message}`);
  }
}
