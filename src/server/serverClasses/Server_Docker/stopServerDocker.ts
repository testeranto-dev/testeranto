import { exec } from "child_process";
import { promisify } from "util";
import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { buildOutputImages } from "./dockerBuildOutputUtils";
import { stopBuilderServices } from "./stopBuilderServices";
import { forceStopAllContainersUtil } from "./utils/forceStopAllContainersUtil";
import { stopAgentProcessesUtil } from "./utils/stopAgentProcessesUtil";
import { stopAiderProcessesUtil } from "./utils/stopAiderProcessesUtil";

export async function stopServerDocker(
  configs: ITesterantoConfig,
  mode: IMode,
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void,
  consoleWarn: (message: string) => void,
  spawnPromise: (command: string) => Promise<any>,
  DC_down: () => Promise<{ exitCode: number; err?: string }>,
  DC_ps: () => Promise<{ exitCode: number; out?: string }>,
  stopAllFileWatchers: () => Promise<void>,
  stopAgentProcesses: () => Promise<void>,
  stopAiderProcesses: () => Promise<void>,
  stopBuilderServicesAndWait: () => Promise<void>,
  forceStopAllContainers: () => Promise<void>,
  resourceChanged: (path: string) => void,
  parentStop: () => Promise<void>
): Promise<void> {
  consoleLog("[Server_Docker] Stopping Docker services...");

  // First, stop all file watchers to prevent new operations
  consoleLog("[Server_Docker] Stopping file watchers...");
  await stopAllFileWatchers();

  // First, stop all agent processes
  try {
    consoleLog("[Server_Docker] Stopping agent processes...");
    await stopAgentProcesses();
  } catch (error: any) {
    consoleError(`[Server_Docker] Error stopping agent processes: ${error.message}`);
  }

  // Then, explicitly stop all aider processes
  try {
    consoleLog("[Server_Docker] Stopping aider processes...");
    await stopAiderProcesses();
  } catch (error: any) {
    consoleError(`[Server_Docker] Error stopping aider processes: ${error.message}`);
  }

  // Stop builder services and wait for them to complete
  try {
    consoleLog("[Server_Docker] Stopping builder services...");
    await stopBuilderServicesAndWait();
  } catch (error: any) {
    consoleError(`[Server_Docker] Error stopping builder services: ${error.message}`);
  }

  // Then, stop all Docker Compose services and wait for them to be fully stopped
  try {
    consoleLog("[Server_Docker] Stopping Docker Compose services...");
    const downResult = await DC_down();
    if (downResult.exitCode !== 0) {
      consoleError(`[Server_Docker] Docker Compose down had issues: ${downResult.err}`);
    } else {
      consoleLog("[Server_Docker] Docker Compose services stopped");
    }

    // Check if any containers are still running
    const psResult = await DC_ps();
    if (psResult.exitCode === 0 && psResult.out && psResult.out.trim() !== '') {
      consoleLog("[Server_Docker] Some containers may still be running, forcing stop...");
      // Force stop any remaining containers
      await forceStopAllContainers();
    } else {
      consoleLog("[Server_Docker] All containers are stopped");
    }
  } catch (error: any) {
    consoleError(`[Server_Docker] Error stopping Docker Compose: ${error.message}`);
  }

  // Build output images
  try {
    consoleLog("[Server_Docker] Building output images...");
    await buildOutputImages(
      configs,
      spawnPromise,
      console.log,
      console.error
    );
  } catch (error: any) {
    consoleError(`[Server_Docker] Error building output images: ${error.message}`);
  }

  // Notify about graph changes
  resourceChanged("/~/graph");

  // Stop the Docker events watcher
  // This should be handled by the caller

  // Stop the periodic container sync
  // This should be handled by the caller

  // Call parent stop
  consoleLog("[Server_Docker] Calling parent stop...");
  await parentStop();
}
