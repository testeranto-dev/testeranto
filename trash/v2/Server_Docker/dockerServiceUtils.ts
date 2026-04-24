

export function getBddServiceName(configKey: string, testName: string): string {
  const testPath = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .toLowerCase();
  return `${configKey}-${testPath}-bdd`;
}

export function getAiderServiceName(configKey: string, testName: string): string {
  const testPath = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .toLowerCase();
  return `${configKey}-${testPath}-aider`;
}

export function getBaseServiceName(configKey: string, testName: string): string {
  const testPath = testName
    .replace(/\//g, '_')
    .replace(/\./g, '-')
    .toLowerCase();
  return `${configKey}-${testPath}`;
}

import type { GraphUpdate } from "../../../graph";

export async function updateEntrypointForServiceStartPure(
  testName: string,
  configKey: string,
  serviceType: 'bdd' | 'checks' | 'aider'
): Promise<GraphUpdate> {
  const entrypointId = `entrypoint:${testName}`;
  const timestamp = new Date().toISOString();
  
  return {
    operations: [{
      type: 'updateNode',
      data: {
        id: entrypointId,
        metadata: {
          needsServiceStart: [serviceType],
          serviceStartTime: timestamp,
          lastUpdated: timestamp
        }
      },
      timestamp
    }],
    timestamp
  };
}

export async function updateAiderInGraph(
  graphManager: any,
  testName: string,
  configKey: string,
  files?: any
): Promise<void> {
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
            files,
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
    } else {
      operations.push({
        type: 'updateNode',
        data: {
          id: aiderNodeId,
          status: 'doing',
          metadata: {
            ...aiderNodeExists.metadata,
            files,
            lastUpdated: new Date().toISOString()
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
}
