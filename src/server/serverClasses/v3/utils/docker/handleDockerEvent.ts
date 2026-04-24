import type { GraphOperation } from "../../../../../graph";

export interface DockerEvent {
  Type: string;
  Action?: string;
  status?: string;
  id?: string;
  Actor?: {
    ID?: string;
    Attributes?: Record<string, string>;
  };
}

export interface HandleDockerEventResult {
  operations: GraphOperation[];
  timestamp: string;
}

export function handleDockerEvent(
  event: DockerEvent,
  containerId: string,
  action: string,
  serviceName: string,
  processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' | 'unknown',
  configKey: string,
  testName: string,
): HandleDockerEventResult {
  const timestamp = new Date().toISOString();
  const nodeId = `docker-${containerId}`;

  // Detect agent containers (names starting with "agent-")
  const isAgentContainer = serviceName.startsWith('agent-');

  // Extract agent name from container name: "agent-{profile}-{counter}" -> "{profile}-{counter}"
  const agentName = isAgentContainer ? serviceName.replace(/^agent-/, '') : undefined;

  // For agent containers, use aider_process type and store agent metadata
  const effectiveProcessType = isAgentContainer ? 'aider_process' : processType;
  const effectiveNodeId = isAgentContainer ? `aider_process:${agentName}` : nodeId;

  switch (action) {
    case 'start':
    case 'create':
      return {
        operations: [
          {
            type: 'addNode',
            data: {
              id: effectiveNodeId,
              type: effectiveProcessType,
              label: agentName || `${processType}: ${serviceName}`,
              description: agentName
                ? `Aider process for agent ${agentName}`
                : `${processType} process for ${testName}`,
              status: 'running',
              metadata: {
                containerId,
                serviceName,
                processType: effectiveProcessType,
                configKey,
                testName,
                startedAt: timestamp,
                timestamp,
                ...(agentName ? {
                  agentName,
                  isAgentAider: true,
                  containerName: serviceName,
                } : {}),
              },
            },
            timestamp,
          },
        ],
        timestamp,
      };

    case 'die':
    case 'stop':
    case 'kill':
      return {
        operations: [
          {
            type: 'updateNode',
            data: {
              id: effectiveNodeId,
              status: 'stopped',
              metadata: {
                status: 'stopped',
                isActive: false,
                finishedAt: timestamp,
              },
            },
            timestamp,
          },
        ],
        timestamp,
      };

    case 'destroy':
      return {
        operations: [
          {
            type: 'removeNode',
            data: { id: effectiveNodeId },
            timestamp,
          },
        ],
        timestamp,
      };

    default:
      return {
        operations: [],
        timestamp,
      };
  }
}
