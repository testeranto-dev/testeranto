import { parseDockerEvent } from "./parseDockerEvent";

export interface DockerEventResult {
  operations: Array<{
    type: 'addNode' | 'updateNode' | 'removeNode';
    data: any;
    timestamp: string;
  }>;
  timestamp: string;
}

export function handleDockerEventUtil(
  event: any,
  containerId: string,
  action: string,
  serviceName: string,
  processType: string,
  configKey: string,
  testName: string,
  requestUid?: string,
): DockerEventResult {
  const timestamp = new Date().toISOString();
  const operations: DockerEventResult['operations'] = [];

  // Determine the node ID based on the process type
  // For agent containers, use the full service name as the unique identifier
  const nodeId = serviceName.startsWith('agent-')
    ? `aider_process:agent:${serviceName}`
    : `${processType}_process:${configKey}:${testName}`;

  // Determine the label based on process type
  let label: string;
  if (serviceName.startsWith('agent-')) {
    // Agent container: agent-{profile}-{counter}
    const parts = serviceName.split('-');
    const profile = parts[1] || 'unknown';
    const counter = parts[2] || '0';
    label = `Agent ${profile}-${counter}`;
  } else {
    label = `${processType} process for ${testName}`;
  }

  switch (action) {
    case 'start':
    case 'create':
      // Add a new process node to the graph
      operations.push({
        type: 'addNode',
        data: {
          id: nodeId,
          type: { category: 'process', type: processType },
          label,
          description: `Container ${containerId} running ${processType} for ${testName}`,
          status: 'running',
          metadata: {
            containerId,
            serviceName,
            processType,
            configKey,
            testName,
            isActive: true,
            startedAt: timestamp,
            updatedAt: timestamp,
            isAgentAider: serviceName.startsWith('agent-'),
            agentName: serviceName.startsWith('agent-') ? serviceName.replace('agent-', '') : undefined,
            requestUid,
          },
          timestamp,
        },
        timestamp,
      });
      break;

    case 'die':
    case 'stop':
      // Update the process node to stopped status
      operations.push({
        type: 'updateNode',
        data: {
          id: nodeId,
          status: 'stopped',
          metadata: {
            isActive: false,
            finishedAt: timestamp,
            updatedAt: timestamp,
            requestUid,
          },
        },
        timestamp,
      });
      break;

    case 'destroy':
      // Remove the process node from the graph
      operations.push({
        type: 'removeNode',
        data: {
          id: nodeId,
        },
        timestamp,
      });
      break;

    default:
      // For other actions, just update the timestamp
      operations.push({
        type: 'updateNode',
        data: {
          id: nodeId,
          metadata: {
            updatedAt: timestamp,
            requestUid,
          },
        },
        timestamp,
      });
      break;
  }

  return {
    operations,
    timestamp,
  };
}
