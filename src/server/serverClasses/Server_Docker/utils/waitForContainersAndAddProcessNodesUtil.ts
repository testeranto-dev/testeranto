import { promisify } from "util";
import { exec } from "child_process";

export async function waitForContainersAndAddProcessNodesUtil(
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void,
  parseContainerNameToProcessInfo: (containerName: string) => {
    processType: 'bdd' | 'check' | 'aider' | 'builder';
    configKey: string;
    testName: string;
  } | null,
  getProcessNode: (processId: string) => any,
  applyUpdate: (update: any) => void
): Promise<void> {
  // We no longer wait for containers to create process nodes
  // Process nodes are created from configuration in addProcessNodesForDockerServices
  // This method can be used to update existing process nodes with container information
  consoleLog(`[Server_Docker] Process nodes already created from configuration, skipping container wait`);

  // Optionally, we can still try to get container info for existing process nodes
  // but we shouldn't create new process nodes here
  try {
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('docker ps --format "{{.Names}} {{.ID}}"');
    const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      const [containerName, containerId] = line.split(' ');
      const processInfo = parseContainerNameToProcessInfo(containerName);
      if (processInfo) {
        const { processType, configKey, testName } = processInfo;
        const processId = `${processType}_process:${configKey}:${testName}`;

        // Update existing process node with container info
        const processNode = getProcessNode(processId);
        if (processNode) {
          const updateTimestamp = new Date().toISOString();
          const update = {
            operations: [{
              type: 'updateNode' as const,
              data: {
                id: processId,
                metadata: {
                  ...processNode.metadata,
                  containerId: containerId,
                  containerName: containerName,
                  updatedAt: updateTimestamp,
                  status: 'running'
                }
              },
              timestamp: updateTimestamp
            }],
            timestamp: updateTimestamp
          };
          applyUpdate(update);
          consoleLog(`[Server_Docker] Updated process node ${processId} with container ${containerId}`);
        }
      }
    }
  } catch (error: any) {
    consoleError(`[Server_Docker] Error getting container info: ${error.message}`);
    // Don't throw - this is non-critical
  }
}
