import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateChecksUpdatesPure(
  testName: string,
  configKey: string,
  getBaseServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void
): { updates: GraphUpdate[]; serviceNames: string[] } {
  consoleLog(`[generateChecksUpdatesPure] Generating checks updates: ${testName} for config ${configKey}`);

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
        checksStarted: timestamp
      }
    },
    timestamp
  });

  const baseServiceName = getBaseServiceName(configKey, testName);
  consoleLog(`[generateChecksUpdatesPure] Looking for check services for: ${baseServiceName}`);

  const serviceNames: string[] = [];
  let checkIndex = 0;

  // For now, we'll assume there's at least one check service
  // In reality, we might need to check if services exist
  const checkServiceName = `${baseServiceName}-check-${checkIndex}`;
  serviceNames.push(checkServiceName);

  // Create check_process node
  const checkProcessId = `check_process:${configKey}:${testName}:${checkIndex}`;
  
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

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceNames
  };
}
import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateChecksUpdatesPure(
  testName: string,
  configKey: string,
  getBaseServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void
): { updates: GraphUpdate[]; serviceNames: string[] } {
  consoleLog(`[generateChecksUpdatesPure] Generating checks updates: ${testName} for config ${configKey}`);

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
        checksStarted: timestamp
      }
    },
    timestamp
  });

  const baseServiceName = getBaseServiceName(configKey, testName);
  consoleLog(`[generateChecksUpdatesPure] Looking for check services for: ${baseServiceName}`);

  const serviceNames: string[] = [];
  let checkIndex = 0;

  // For now, we'll assume there's at least one check service
  // In reality, we might need to check if services exist
  const checkServiceName = `${baseServiceName}-check-${checkIndex}`;
  serviceNames.push(checkServiceName);

  // Create check_process node
  const checkProcessId = `check_process:${configKey}:${testName}:${checkIndex}`;
  
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

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceNames
  };
}
