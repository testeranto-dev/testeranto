import type { GraphOperation } from "../../../../../graph";

export interface LaunchAiderParams {
  runtime: string;
  testName: string;
  configKey: string;
  configValue: any;
  serviceName: string;
  containerId?: string;
  containerInfo?: any;
}

export interface LaunchAiderResult {
  operations: GraphOperation[];
  timestamp: string;
}

export function launchAider(params: LaunchAiderParams): LaunchAiderResult {
  const timestamp = new Date().toISOString();
  const aiderProcessId = `aider_process:${params.configKey}:${params.testName}`;

  const operations: GraphOperation[] = [];

  // Add process node
  operations.push({
    type: 'addNode',
    data: {
      id: aiderProcessId,
      type: 'aider',
      label: `Aider: ${params.testName}`,
      description: `Aider process for ${params.testName}`,
      status: 'running',
      metadata: {
        configKey: params.configKey,
        testName: params.testName,
        runtime: params.runtime,
        processType: 'aider',
        startedAt: timestamp,
        timestamp,
      },
    },
    timestamp,
  });

  // If container info is available, update with container details
  if (params.containerId) {
    operations.push({
      type: 'updateNode',
      data: {
        id: aiderProcessId,
        metadata: {
          containerId: params.containerId,
          serviceName: params.serviceName,
          containerInfo: params.containerInfo,
          updatedAt: timestamp,
        },
      },
      timestamp,
    });
  }

  return {
    operations,
    timestamp,
  };
}

export function launchAiderFailure(
  configKey: string,
  testName: string,
  errorMessage: string,
): LaunchAiderResult {
  const timestamp = new Date().toISOString();
  const aiderProcessId = `aider_process:${configKey}:${testName}`;

  return {
    operations: [
      {
        type: 'updateNode',
        data: {
          id: aiderProcessId,
          status: 'failed',
          metadata: {
            error: errorMessage,
            finishedAt: timestamp,
          },
        },
        timestamp,
      },
    ],
    timestamp,
  };
}
