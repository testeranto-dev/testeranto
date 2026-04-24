import type { Server_Graph } from "../Server_Graph";
import type { GraphOperation } from "../../../graph";

export async function launchChecksDockerUtil(
  graphManager: Server_Graph,
  testName: string,
  configKey: string,
  getBaseServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  consoleLog(`[launchChecksDockerUtil] Launching checks: ${testName} for config ${configKey}`);

  const timestamp = new Date().toISOString();
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  const operations: GraphOperation[] = [];

  // Update entrypoint node
  if (existingNode) {
    operations.push({
      type: 'updateNode',
      data: {
        id: entrypointId,
        status: 'doing',
        metadata: {
          ...existingNode.metadata,
          checksStarted: timestamp
        }
      },
      timestamp
    });
  }

  // Start check services (there may be multiple: check-0, check-1, etc.)
  const baseServiceName = getBaseServiceName(configKey, testName);
  consoleLog(`[launchChecksDockerUtil] Looking for check services for: ${baseServiceName}`);

  // Try to start check services (check-0, check-1, etc.)
  let checkIndex = 0;
  while (true) {
    const checkServiceName = `${baseServiceName}-check-${checkIndex}`;
    try {
      consoleLog(`[launchChecksDockerUtil] Attempting to start check service: ${checkServiceName}`);

      // Create check_process node for each check
      const checkProcessId = `check_process:${configKey}:${testName}:${checkIndex}`;
      const checkProcessNodeExists = graphData.nodes.find((n: any) => n.id === checkProcessId);

      if (!checkProcessNodeExists) {
        operations.push({
          type: 'addNode',
          data: {
            id: checkProcessId,
            type: 'check_process',
            label: `Check Process: ${testName} #${checkIndex}`,
            description: `Check process ${checkIndex} for ${testName}`,
            status: 'running',
            icon: 'check',
            metadata: {
              configKey,
              testName,
              checkIndex,
              serviceType: 'check',
              startedAt: timestamp,
              timestamp
            }
          },
          timestamp
        });

        // Connect entrypoint to check_process
        operations.push({
          type: 'addEdge',
          data: {
            source: entrypointId,
            target: checkProcessId,
            attributes: {
              type: 'hasCheckProcess',
              timestamp
            }
          },
          timestamp
        });
      }

      await startDockerService(checkServiceName);
      checkIndex++;
    } catch (error) {
      // If service doesn't exist, break the loop
      consoleLog(`[launchChecksDockerUtil] No more check services found after ${checkIndex} services`);
      break;
    }
  }

  // Apply all operations
  if (operations.length > 0) {
    await graphManager.applyUpdate({
      operations,
      timestamp
    });
  }
}
