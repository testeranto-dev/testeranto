export const computeContainerSyncUpdatesPure = (
  graphData: any,
  runningContainers: Map<string, { id: string; status: string }>,
  allContainers: Map<string, { id: string; status: string }>
) => {
  const updates: Array<{
    nodeId: string;
    update: {
      operations: Array<{
        type: 'updateNode';
        data: {
          id: string;
          metadata: any;
        };
        timestamp: string;
      }>;
      timestamp: string;
    };
  }> = [];

  // Get all process nodes from graph
  const processNodes = graphData.nodes.filter((node: any) => {
    if (node.type && typeof node.type === 'object') {
      return node.type.category === 'process';
    }
    return node.type === 'docker_process' ||
      node.type === 'bdd_process' ||
      node.type === 'check_process' ||
      node.type === 'builder_process' ||
      node.type === 'aider_process';
  });

  for (const node of processNodes) {
    const metadata = node.metadata || {};
    const containerName = metadata.containerName || metadata.serviceName;

    if (containerName) {
      const containerInfo = allContainers.get(containerName);
      if (containerInfo) {
        // Container exists in Docker
        const isRunning = runningContainers.has(containerName);
        const currentStatus = metadata.status;
        const shouldBeStatus = isRunning ? 'running' : 'stopped';

        if (currentStatus !== shouldBeStatus) {
          const updateTimestamp = new Date().toISOString();
          updates.push({
            nodeId: node.id,
            update: {
              operations: [{
                type: 'updateNode' as const,
                data: {
                  id: node.id,
                  metadata: {
                    ...metadata,
                    status: shouldBeStatus,
                    updatedAt: updateTimestamp,
                    containerStatus: containerInfo.status
                  }
                },
                timestamp: updateTimestamp
              }],
              timestamp: updateTimestamp
            }
          });
        }
      } else if (metadata.status === 'running') {
        // Container doesn't exist in Docker but graph says it's running
        const updateTimestamp = new Date().toISOString();
        updates.push({
          nodeId: node.id,
          update: {
            operations: [{
              type: 'updateNode' as const,
              data: {
                id: node.id,
                metadata: {
                  ...metadata,
                  status: 'stopped',
                  updatedAt: updateTimestamp,
                  containerStatus: 'not found'
                }
              },
              timestamp: updateTimestamp
            }],
            timestamp: updateTimestamp
          }
        });
      }
    }
  }

  return updates;
};
