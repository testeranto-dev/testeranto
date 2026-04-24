import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

export async function startDockerEventsWatcherUtil(
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void,
  parseContainerNameToProcessInfo: (containerName: string) => {
    processType: 'bdd' | 'check' | 'aider' | 'builder';
    configKey: string;
    testName: string;
  } | null,
  updateProcessNodeWithContainerInfo: (
    processId: string,
    containerId: string,
    serviceName: string,
    dockerEventStatus: string
  ) => Promise<void>,
  updateProcessNodeByContainerName: (
    containerName: string,
    containerId: string,
    dockerEventStatus: string
  ) => Promise<void>,
  resourceChanged: (path: string) => void,
  startPeriodicContainerSync: () => void,
  syncAllContainerStatuses: () => Promise<void>
): Promise<{ process: any }> {
  try {
    // Start a background process to watch for Docker events
    const dockerEvents = spawn('docker', ['events', '--filter', 'type=container', '--format', '{{json .}}']);

    let buffer = '';

    dockerEvents.stdout.on('data', async (data) => {
      try {
        buffer += data.toString();

        // Split by newlines to handle multiple events
        const lines = buffer.split('\n');

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const event = JSON.parse(trimmedLine);
            const containerId = event.id;
            const status = event.status;
            const containerName = event.Actor?.Attributes?.name;

            if (containerName) {
              consoleLog(`[DockerEventsWatcher] Container ${containerName} ${status}`);

              // Find the process node for this container
              const processInfo = parseContainerNameToProcessInfo(containerName);
              if (processInfo) {
                const { processType, configKey, testName } = processInfo;
                const processId = `${processType}_process:${configKey}:${testName}`;

                // Update the graph with the new status
                await updateProcessNodeWithContainerInfo(
                  processId,
                  containerId,
                  containerName,
                  status
                );
              } else if (containerName.startsWith('agent-')) {
                // Handle agent containers
                const agentName = containerName.replace('agent-', '');
                const processId = `aider_process:agent:${agentName}`;

                await updateProcessNodeWithContainerInfo(
                  processId,
                  containerId,
                  containerName,
                  status
                );
              } else {
                // Try to find process node by container name in metadata
                await updateProcessNodeByContainerName(containerName, containerId, status);
              }

              // Immediately refresh the process data for API endpoints
              resourceChanged('/~/process');
            }
          } catch (parseError) {
            consoleError(`[DockerEventsWatcher] Error parsing JSON line: "${trimmedLine}"`, parseError);
            // Continue processing other lines
          }
        }
      } catch (error) {
        consoleError(`[DockerEventsWatcher] Error processing Docker event data:`, error);
      }
    });

    dockerEvents.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      if (errorMsg) {
        consoleError(`[DockerEventsWatcher] Docker events error: ${errorMsg}`);
      }
    });

    dockerEvents.on('close', (code) => {
      consoleLog(`[DockerEventsWatcher] Docker events process exited with code ${code}`);
      // Try to restart the watcher after a delay
      setTimeout(() => {
        consoleLog(`[DockerEventsWatcher] Restarting Docker events watcher...`);
        // Note: We can't restart from here directly, need to handle this at a higher level
      }, 5000);
    });

    dockerEvents.on('error', (error) => {
      consoleError(`[DockerEventsWatcher] Docker events process error:`, error);
    });

    // Also start a periodic sync to ensure all container statuses are up-to-date
    startPeriodicContainerSync();

    // Do an initial sync immediately
    setTimeout(() => {
      syncAllContainerStatuses().catch(error => {
        consoleError(`[DockerEventsWatcher] Error in initial container sync:`, error);
      });
    }, 2000);

    return { process: dockerEvents };
  } catch (error: any) {
    consoleError(`[Server_Docker] Error starting Docker events watcher:`, error);
    throw error;
  }
}
