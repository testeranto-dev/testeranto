import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateAiderUpdatesPure(
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void
): { updates: GraphUpdate[]; serviceName: string } {
  consoleLog(`[generateAiderUpdatesPure] Generating aider updates: ${testName} for config ${configKey}`);

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
        aiderStarted: timestamp
      }
    },
    timestamp
  });

  // Create aider node
  const aiderNodeId = `aider:${configKey}:${testName}`;
  
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

  // Create aider_process node
  const aiderProcessId = `aider_process:${configKey}:${testName}`;
  
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

  // Get service name
  const serviceName = getAiderServiceName(configKey, testName);
  consoleLog(`[generateAiderUpdatesPure] Aider service: ${serviceName}`);

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceName
  };
}
import type { GraphUpdate, GraphOperation } from "../../../graph";

export function generateAiderUpdatesPure(
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  consoleLog: (message: string) => void
): { updates: GraphUpdate[]; serviceName: string } {
  consoleLog(`[generateAiderUpdatesPure] Generating aider updates: ${testName} for config ${configKey}`);

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
        aiderStarted: timestamp
      }
    },
    timestamp
  });

  // Create aider node
  const aiderNodeId = `aider:${configKey}:${testName}`;
  
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

  // Create aider_process node
  const aiderProcessId = `aider_process:${configKey}:${testName}`;
  
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

  // Get service name
  const serviceName = getAiderServiceName(configKey, testName);
  consoleLog(`[generateAiderUpdatesPure] Aider service: ${serviceName}`);

  return {
    updates: [{
      operations,
      timestamp
    }],
    serviceName
  };
}
