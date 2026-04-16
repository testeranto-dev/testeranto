import { promisify } from "util";
import { exec } from "child_process";

export async function forceStopAllContainersUtil(
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void
): Promise<void> {
  try {
    const execAsync = promisify(exec);

    // Get all container IDs
    const { stdout } = await execAsync('docker ps -q');
    const containerIds = stdout.trim().split('\n').filter(id => id.trim() !== '');

    if (containerIds.length === 0) {
      consoleLog("[Server_Docker] No containers running");
      return;
    }

    consoleLog(`[Server_Docker] Force stopping ${containerIds.length} containers...`);

    // Stop each container
    for (const containerId of containerIds) {
      try {
        await execAsync(`docker stop ${containerId}`);
        consoleLog(`[Server_Docker] Stopped container: ${containerId}`);
      } catch (error: any) {
        consoleError(`[Server_Docker] Error stopping container ${containerId}: ${error.message}`);
      }
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove any stopped containers
    const { stdout: stoppedStdout } = await execAsync('docker ps -a -q');
    const allContainerIds = stoppedStdout.trim().split('\n').filter(id => id.trim() !== '');

    for (const containerId of allContainerIds) {
      try {
        await execAsync(`docker rm -f ${containerId}`);
        consoleLog(`[Server_Docker] Removed container: ${containerId}`);
      } catch (error: any) {
        // Container might already be removed, ignore
      }
    }

  } catch (error: any) {
    consoleError(`[Server_Docker] Error in forceStopAllContainers: ${error.message}`);
  }
}
