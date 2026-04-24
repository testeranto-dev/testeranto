import type { GraphOperation } from "../../../../../graph";

export interface AddProcessNodeToGraphParams {
  processType: 'bdd' | 'check' | 'aider' | 'builder';
  runtime: string;
  testName: string;
  configKey: string;
  configValue: any;
  checkIndex?: number;
  status?: 'running' | 'stopped' | 'failed';
}

export function addProcessNodeToGraph(params: AddProcessNodeToGraphParams): {
  operations: GraphOperation[];
  timestamp: string;
} {
  const timestamp = new Date().toISOString();
  const processNodeId = `${params.processType}_process:${params.configKey}:${params.testName}`;

  const operations: GraphOperation[] = [
    {
      type: 'addNode',
      data: {
        id: processNodeId,
        type: params.processType,
        label: `${params.processType.charAt(0).toUpperCase() + params.processType.slice(1)}: ${params.testName}`,
        description: `${params.processType} process for ${params.testName}`,
        status: params.status || 'running',
        metadata: {
          configKey: params.configKey,
          testName: params.testName,
          runtime: params.runtime,
          processType: params.processType,
          checkIndex: params.checkIndex,
          startedAt: timestamp,
          timestamp,
        },
      },
      timestamp,
    },
  ];

  return {
    operations,
    timestamp,
  };
}
