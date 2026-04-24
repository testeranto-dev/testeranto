import type { GraphUpdate, GraphOperation } from "../../../graph";

export async function launchBddTestDockerUtil(
  testName: string,
  configKey: string,
  getBddServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<GraphUpdate[]> {
  consoleLog(`[launchBddTestDockerUtil] Launching BDD test: ${testName} for config ${configKey}`);

  const timestamp = new Date().toISOString();
  const entrypointId = `entrypoint:${testName}`;
  
  const operations: GraphOperation[] = [];

  // Update entrypoint node
  operations.push({
    type: 'updateNode',
    data: {
      id: entrypointId,
      status: 'doing',
      metadata: {
        bddStarted: timestamp
      }
    },
    timestamp
  });

  // Create bdd_process node
  const bddProcessId = `bdd_process:${configKey}:${testName}`;
  
  operations.push({
    type: 'addNode',
    data: {
      id: bddProcessId,
      type: 'bdd_process',
      label: `BDD Process: ${testName}`,
      description: `BDD test process for ${testName}`,
      status: 'running',
      icon: 'play',
      metadata: {
        configKey,
        testName,
        serviceType: 'bdd',
        startedAt: timestamp,
        timestamp
      }
    },
    timestamp
  });

  // Connect entrypoint to bdd_process
  operations.push({
    type: 'addEdge',
    data: {
      source: entrypointId,
      target: bddProcessId,
      attributes: {
        type: 'hasBddProcess',
        timestamp
      }
    },
    timestamp
  });

  // Start the actual Docker service
  const serviceName = getBddServiceName(configKey, testName);
  consoleLog(`[launchBddTestDockerUtil] Starting BDD service: ${serviceName}`);
  
  try {
    await startDockerService(serviceName);
    return [{
      operations,
      timestamp
    }];
  } catch (error) {
    consoleError(`[launchBddTestDockerUtil] Failed to start service ${serviceName}:`, error);

    // Create failure update
    const failureTimestamp = new Date().toISOString();
    const failureUpdate: GraphUpdate = {
      operations: [{
        type: 'updateNode',
        data: {
          id: bddProcessId,
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            finishedAt: failureTimestamp
          }
        },
        timestamp: failureTimestamp
      }],
      timestamp: failureTimestamp
    };

    throw error;
  }
}
