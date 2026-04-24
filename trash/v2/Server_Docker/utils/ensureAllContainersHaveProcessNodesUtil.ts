import { promisify } from "util";
import { exec } from "child_process";

export async function ensureAllContainersHaveProcessNodesUtil(
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
  // Process nodes are now created from configuration, not from running containers
  // This method can update container info for existing process nodes
  try {
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('docker ps --format "{{.Names}} {{.ID}}"');
    const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');

    consoleLog(`[Server_Docker] Found ${lines.length} running containers`);

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
          consoleLog(`[Server_Docker] Updated process node ${processId} with container info`);
        } else {
          consoleLog(`[Server_Docker] No process node found for container: ${containerName}`);
        }
      }
    }
  } catch (error: any) {
    consoleError(`[Server_Docker] Error updating container info: ${error.message}`);
  }
}
