import type { IRunTime } from "../../../Types";

import type { IRunTime } from "../../../Types";
import type { GraphUpdate, GraphOperation } from "../../../graph";

export async function addProcessNodeToGraphPure(
  processType: 'bdd' | 'check' | 'aider' | 'builder',
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  checkIndex: number | undefined,
  status?: 'running' | 'stopped' | 'failed'
): Promise<GraphUpdate> {
  // Generate process ID
  let processId: string;
  let label: string;

  switch (processType) {
    case 'bdd':
      processId = `bdd_process:${configKey}:${testName}`;
      label = `BDD Process: ${testName}`;
      break;
    case 'check':
      processId = `check_process:${configKey}:${testName}:${checkIndex}`;
      label = `Check Process ${checkIndex}: ${testName}`;
      break;
    case 'aider':
      processId = `aider_process:${configKey}:${testName}`;
      label = `Aider Process: ${testName}`;
      break;
    case 'builder':
      processId = `builder_process:${configKey}`;
      label = `Builder Process: ${configKey}`;
      break;
    default:
      throw new Error(`Invalid process type: ${processType}`);
  }

  const timestamp = new Date().toISOString();
  const operations: GraphOperation[] = [];

  // Determine the actual status
  const actualStatus = status || 'running';

  // Create process node operation
  const nodeAttributes = {
    id: processId,
    type: processType === 'bdd' ? 'bdd_process' :
      processType === 'check' ? 'check_process' :
        processType === 'aider' ? 'aider_process' : 'builder_process',
    label: label,
    description: `${processType} process for ${testName} (${configKey})`,
    status: actualStatus,
    priority: 'medium',
    metadata: {
      runtime,
      testName,
      configKey,
      processType,
      checkIndex,
      timestamp,
      actualStatus
    }
  };

  operations.push({
    type: 'addNode',
    data: nodeAttributes,
    timestamp
  });

  // Create edge from entrypoint to process (for non-builder processes)
  if (processType !== 'builder') {
    const entrypointId = `entrypoint:${testName}`;
    const edgeType = processType === 'bdd' ? 'hasBddProcess' :
      processType === 'check' ? 'hasCheckProcess' :
        processType === 'aider' ? 'hasAiderProcess' : 'hasBuilderProcess';

    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: processId,
        attributes: {
          type: edgeType,
          timestamp
        }
      },
      timestamp
    });
  } else {
    // For builder processes, create config node
    const configNodeId = `config:${configKey}`;
    
    const configNodeAttributes = {
      id: configNodeId,
      type: 'config' as const,
      label: `Config: ${configKey}`,
      description: `Configuration for ${configKey}`,
      status: 'todo',
      priority: 'medium',
      metadata: {
        configKey,
        runtime: configValue.runtime,
        timestamp
      }
    };
    
    operations.push({
      type: 'addNode',
      data: configNodeAttributes,
      timestamp
    });

    // Link builder process to config node
    operations.push({
      type: 'addEdge',
      data: {
        source: configNodeId,
        target: processId,
        attributes: {
          type: 'hasBuilderProcess',
          timestamp
        }
      },
      timestamp
    });
  }

  return {
    operations,
    timestamp
  };
}
