import type { GraphOperation } from "../../../../../graph";

/**
 * Pure function to generate graph operations for adding a process node
 * representing a Docker container.
 *
 * This is a v3‑only implementation, no v2 utilities are imported.
 */
export function addProcessNodeToGraphV3Pure(
  containerId: string,
  serviceName: string,
  processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' | 'unknown',
  configKey: string,
  testName: string,
  status: 'running' | 'stopped' | 'destroyed' = 'running',
): GraphOperation[] {
  const timestamp = new Date().toISOString();
  const nodeId = `docker-${containerId}`;

  const operations: GraphOperation[] = [];

  // Add the process node
  operations.push({
    type: 'addNode',
    data: {
      id: nodeId,
      type: { category: 'process', type: processType },
      label: serviceName,
      description: `Docker container ${containerId} (${serviceName})`,
      status: status === 'running' ? 'doing' : status === 'stopped' ? 'done' : 'blocked',
      priority: 'medium',
      timestamp,
      metadata: {
        containerId,
        serviceName,
        processType,
        configKey,
        testName,
        status,
        isActive: status === 'running',
        startTime: status === 'running' ? timestamp : undefined,
      },
      icon: processType === 'aider' ? 'comment-discussion' :
        processType === 'bdd' ? 'beaker' :
          processType === 'check' ? 'checklist' :
            processType === 'builder' ? 'gear' : 'terminal',
    },
    timestamp,
  });

  // Optionally add an edge from the config node (if configKey is known)
  if (configKey && configKey !== 'agent') {
    const configNodeId = `config:${configKey}`;
    operations.push({
      type: 'addEdge',
      data: {
        source: configNodeId,
        target: nodeId,
        attributes: {
          type: {
            category: 'ownership',
            type: 'has',
            directed: true,
          },
          timestamp,
          metadata: {
            relationship: 'config_has_process',
          },
        },
      },
      timestamp,
    });
  }

  return operations;
}
