import type { Server_Graph } from "../Server_Graph";
import type { GraphOperation } from "../../../graph";

export async function launchAiderDockerUtil(
  graphManager: Server_Graph,
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  consoleLog(`[launchAiderDockerUtil] Launching aider: ${testName} for config ${configKey}`);

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
          aiderStarted: timestamp
        }
      },
      timestamp
    });
  }

  // Create aider node
  const aiderNodeId = `aider:${configKey}:${testName}`;
  const aiderNodeExists = graphData.nodes.find((n: any) => n.id === aiderNodeId);

  if (!aiderNodeExists) {
    operations.push({
      type: 'addNode',
      data: {
        id: aiderNodeId,
        type: 'aider',
        label: `Aider: ${testName}`,
        description: `Aider instance for ${testName}`,
        status: 'doing',
        icon: 'aider',
        metadata: {
          testName,
          configKey,
          timestamp
        }
      },
      timestamp
    });

    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: aiderNodeId,
        attributes: {
          type: 'hasAider',
          timestamp
        }
      },
      timestamp
    });
  }

  // Create aider_process node
  const aiderProcessId = `aider_process:${configKey}:${testName}`;
  const aiderProcessNodeExists = graphData.nodes.find((n: any) => n.id === aiderProcessId);

  if (!aiderProcessNodeExists) {
    operations.push({
      type: 'addNode',
      data: {
        id: aiderProcessId,
        type: 'aider_process',
        label: `Aider Process: ${testName}`,
        description: `Aider process for ${testName}`,
        status: 'running',
        icon: 'comment-discussion',
        metadata: {
          configKey,
          testName,
          serviceType: 'aider',
          startedAt: timestamp,
          timestamp
        }
      },
      timestamp
    });

    // Connect entrypoint to aider_process
    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: aiderProcessId,
        attributes: {
          type: 'hasAiderProcess',
          timestamp
        }
      },
      timestamp
    });
  }

  // Apply all operations
  if (operations.length > 0) {
    await graphManager.applyUpdate({
      operations,
      timestamp
    });
  }

  // Start the aider service
  const aiderServiceName = getAiderServiceName(configKey, testName);
  consoleLog(`[launchAiderDockerUtil] Starting aider service: ${aiderServiceName}`);
  try {
    await startDockerService(aiderServiceName);
  } catch (error) {
    consoleError(`[launchAiderDockerUtil] Failed to start service ${aiderServiceName}:`, error);

    // Update aider_process node status to failed
    await graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: aiderProcessId,
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            finishedAt: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}
