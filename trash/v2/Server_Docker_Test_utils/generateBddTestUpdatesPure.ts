import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateBddTestUpdatesPure(
  testName: string,
  configKey: string,
  getBddServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): { updates: GraphUpdate[]; serviceName: string } {
  consoleLog(`[generateBddTestUpdatesPure] Generating BDD test updates: ${testName} for config ${configKey}`);

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

  // Get service name
  const serviceName = getBddServiceName(configKey, testName);
  consoleLog(`[generateBddTestUpdatesPure] BDD service: ${serviceName}`);

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceName
  };
}
import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateBddTestUpdatesPure(
  testName: string,
  configKey: string,
  getBddServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): { updates: GraphUpdate[]; serviceName: string } {
  consoleLog(`[generateBddTestUpdatesPure] Generating BDD test updates: ${testName} for config ${configKey}`);

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

  // Get service name
  const serviceName = getBddServiceName(configKey, testName);
  consoleLog(`[generateBddTestUpdatesPure] BDD service: ${serviceName}`);

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceName
  };
}
