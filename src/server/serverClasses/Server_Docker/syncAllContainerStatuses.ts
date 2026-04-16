import { exec } from "child_process";
import { promisify } from "util";
import { computeContainerSyncUpdatesPure } from "./utils/computeContainerSyncUpdatesPure";

export async function syncAllContainerStatuses(
  parseContainerNameToProcessInfo: (containerName: string) => any,
  updateProcessNodeWithContainerInfo: (processId: string, containerId: string, containerName: string, status: string) => Promise<void>,
  updateProcessNodeByContainerName: (containerName: string, containerId: string, status: string) => Promise<void>,
  getGraphData: () => any,
  applyUpdate: (update: any) => void,
  resourceChanged: (path: string) => void,
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void
): Promise<void> {
  try {
    const execAsync = promisify(exec);

    // Get all running containers
    const { stdout: runningStdout } = await execAsync('docker ps --format "{{.Names}} {{.ID}} {{.Status}}"');
    const runningLines = runningStdout.trim().split('\n').filter(line => line.trim() !== '');

    const runningContainers = new Map<string, { id: string; status: string }>();
    for (const line of runningLines) {
      const parts = line.split(' ');
      if (parts.length >= 3) {
        const containerName = parts[0];
        const containerId = parts[1];
        const status = parts.slice(2).join(' ');
        runningContainers.set(containerName, { id: containerId, status });

        // Update status for running containers
        const processInfo = parseContainerNameToProcessInfo(containerName);
        if (processInfo) {
          const { processType, configKey, testName } = processInfo;
          const processId = `${processType}_process:${configKey}:${testName}`;

          await updateProcessNodeWithContainerInfo(
            processId,
            containerId,
            containerName,
            'running'
          );
        } else if (containerName.startsWith('agent-')) {
          const agentName = containerName.replace('agent-', '');
          const processId = `aider_process:agent:${agentName}`;

          await updateProcessNodeWithContainerInfo(
            processId,
            containerId,
            containerName,
            'running'
          );
        } else {
          // Try to update by container name
          await updateProcessNodeByContainerName(containerName, containerId, 'running');
        }
      }
    }

    // Get all containers (including stopped ones) to check for stopped containers
    const { stdout: allStdout } = await execAsync('docker ps -a --format "{{.Names}} {{.ID}} {{.Status}}"');
    const allLines = allStdout.trim().split('\n').filter(line => line.trim() !== '');

    const allContainers = new Map<string, { id: string; status: string }>();
    for (const line of allLines) {
      const parts = line.split(' ');
      if (parts.length >= 3) {
        const containerName = parts[0];
        const containerId = parts[1];
        const status = parts.slice(2).join(' ');
        allContainers.set(containerName, { id: containerId, status });
      }
    }

    // Get all process nodes from graph and compute updates
    const graphData = getGraphData();
    const updates = computeContainerSyncUpdatesPure(
      graphData,
      runningContainers,
      allContainers
    );

    // Apply all updates
    for (const { nodeId, update } of updates) {
      applyUpdate(update);
      consoleLog(`[ContainerSync] Updated process ${nodeId} to ${update.operations[0].data.metadata.status} (container ${update.operations[0].data.metadata.containerName || 'unknown'} is ${update.operations[0].data.metadata.containerStatus})`);
    }

    // Notify that process data has been updated
    resourceChanged('/~/process');

  } catch (error) {
    consoleError(`[ContainerSync] Error syncing container statuses:`, error);
  }
}
