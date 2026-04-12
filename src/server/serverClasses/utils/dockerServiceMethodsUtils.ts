import type { IRunTime } from "../../../Types";
import type { GraphManager } from "../../graph";

export async function launchBddTestDockerUtil(
  graphManager: GraphManager,
  testName: string,
  configKey: string,
  getBddServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  consoleLog(`[launchBddTestDockerUtil] Launching BDD test: ${testName} for config ${configKey}`);

  // Update graph
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  if (existingNode) {
    await graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: entrypointId,
          status: 'doing',
          metadata: {
            ...existingNode.metadata,
            bddStarted: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  }

  // Start the actual Docker service
  const serviceName = getBddServiceName(configKey, testName);
  consoleLog(`[launchBddTestDockerUtil] Starting BDD service: ${serviceName}`);
  try {
    await startDockerService(serviceName);
  } catch (error) {
    consoleError(`[launchBddTestDockerUtil] Failed to start service ${serviceName}:`, error);
    throw error;
  }
}

export async function launchChecksDockerUtil(
  graphManager: GraphManager,
  testName: string,
  configKey: string,
  getBaseServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  consoleLog(`[launchChecksDockerUtil] Launching checks: ${testName} for config ${configKey}`);

  // Update graph
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  if (existingNode) {
    await graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: entrypointId,
          status: 'doing',
          metadata: {
            ...existingNode.metadata,
            checksStarted: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
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
      await startDockerService(checkServiceName);
      checkIndex++;
    } catch (error) {
      // If service doesn't exist, break the loop
      consoleLog(`[launchChecksDockerUtil] No more check services found after ${checkIndex} services`);
      break;
    }
  }
}

export async function launchAiderDockerUtil(
  graphManager: GraphManager,
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  consoleLog(`[launchAiderDockerUtil] Launching aider: ${testName} for config ${configKey}`);

  // Update graph
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  if (existingNode) {
    const aiderNodeId = `aider:${configKey}:${testName}`;
    const aiderNodeExists = graphData.nodes.find((n: any) => n.id === aiderNodeId);

    const operations = [];

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
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });

      operations.push({
        type: 'addEdge',
        data: {
          source: entrypointId,
          target: aiderNodeId,
          attributes: {
            type: 'hasAider',
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    if (operations.length > 0) {
      await graphManager.applyUpdate({
        operations,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Start the aider service
  const aiderServiceName = getAiderServiceName(configKey, testName);
  consoleLog(`[launchAiderDockerUtil] Starting aider service: ${aiderServiceName}`);
  try {
    await startDockerService(aiderServiceName);
  } catch (error) {
    consoleError(`[launchAiderDockerUtil] Failed to start service ${aiderServiceName}:`, error);
    throw error;
  }
}

export async function informAiderDockerUtil(
  graphManager: GraphManager,
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  restartDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  files?: any
): Promise<void> {
  consoleLog(`[informAiderDockerUtil] Input files changed for ${testName}, updating aider in graph and restarting service`);

  // Update the graph
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  if (existingNode) {
    await graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: entrypointId,
          status: 'doing',
          metadata: {
            ...existingNode.metadata,
            filesUpdated: new Date().toISOString(),
            files: files
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  }

  // Restart the aider service to pick up changes
  const aiderServiceName = getAiderServiceName(configKey, testName);
  consoleLog(`[informAiderDockerUtil] Restarting aider service: ${aiderServiceName}`);
  try {
    await restartDockerService(aiderServiceName);
  } catch (error) {
    consoleError(`[informAiderDockerUtil] Failed to restart service ${aiderServiceName}:`, error);
    throw error;
  }
}
