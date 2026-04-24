import { exec } from "child_process";
import { promisify } from "util";
import type { ITesterantoConfig } from "../../../src/server/Types";
import { stopBuilderServices } from "./stopBuilderServices";

export async function stopBuilderServicesAndWait(
  configs: ITesterantoConfig,
  spawnPromise: (command: string) => Promise<any>,
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void
): Promise<void> {
  try {
    consoleLog("[Server_Docker] Signaling builder services to produce output artifacts...");

    // First, send SIGTERM to all builder containers to trigger artifact production
    const execAsync = promisify(exec);

    // Get all builder container IDs
    const { stdout } = await execAsync('docker ps --filter "name=builder" --format "{{.ID}}"');
    const builderContainerIds = stdout.trim().split('\n').filter(id => id.trim() !== '');

    if (builderContainerIds.length === 0) {
      consoleLog("[Server_Docker] No builder containers found");
    } else {
      consoleLog(`[Server_Docker] Found ${builderContainerIds.length} builder containers to signal`);

      // Send SIGTERM to each builder container
      for (const containerId of builderContainerIds) {
        try {
          consoleLog(`[Server_Docker] Sending SIGTERM to builder container: ${containerId}`);
          await execAsync(`docker kill --signal=SIGTERM ${containerId}`);
          consoleLog(`[Server_Docker] Sent SIGTERM to builder container: ${containerId}`);
        } catch (error: any) {
          consoleError(`[Server_Docker] Error sending SIGTERM to builder container ${containerId}: ${error.message}`);
        }
      }

      // Wait for builders to process SIGTERM and produce artifacts
      consoleLog("[Server_Docker] Waiting for builders to produce output artifacts...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Now stop the builder services
    consoleLog("[Server_Docker] Stopping builder services...");
    await stopBuilderServices(
      configs,
      spawnPromise,
      console.log,
      console.error
    );

    // Wait for builder containers to stop
    consoleLog("[Server_Docker] Waiting for builder containers to stop...");

    // Check for builder containers and wait for them to exit
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { stdout: psStdout } = await execAsync('docker ps --format "{{.Names}}"');
      const containerNames = psStdout.trim().split('\n').filter(name => name.trim() !== '');

      const builderContainers = containerNames.filter(name => name.includes('builder'));

      if (builderContainers.length === 0) {
        consoleLog("[Server_Docker] All builder containers have stopped");
        break;
      }

      consoleLog(`[Server_Docker] Still waiting for ${builderContainers.length} builder containers: ${builderContainers.join(', ')}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      consoleLog("[Server_Docker] Some builder containers may still be running after waiting");
    }

  } catch (error: any) {
    consoleError(`[Server_Docker] Error in stopBuilderServicesAndWait: ${error.message}`);
  }
}
