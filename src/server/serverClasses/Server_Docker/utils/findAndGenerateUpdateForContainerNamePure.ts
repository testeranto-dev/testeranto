export const findAndGenerateUpdateForContainerNamePure = (
  graphData: any,
  containerName: string,
  containerId: string,
  dockerEventStatus: string
) => {
  // Search through all process nodes to find one with matching container name
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
    if (metadata.containerName === containerName ||
      metadata.serviceName === containerName ||
      (metadata.containerId && metadata.containerId.startsWith(containerId))) {

      // Map Docker event status to graph status
      let graphStatus: 'running' | 'stopped';

      // Docker events that indicate container is running
      const runningStatuses = ['start', 'restart', 'exec_start', 'exec_start:', 'running'];
      // Check if the dockerEventStatus starts with any running indicator
      const isRunning = runningStatuses.some(runningStatus =>
        dockerEventStatus.startsWith(runningStatus)
      );

      graphStatus = isRunning ? 'running' : 'stopped';

      const updateTimestamp = new Date().toISOString();
      return {
        nodeId: node.id,
        update: {
          operations: [{
            type: 'updateNode' as const,
            data: {
              id: node.id,
              metadata: {
                ...metadata,
                containerId: containerId,
                containerName: containerName,
                containerStatus: dockerEventStatus,
                updatedAt: updateTimestamp,
                status: graphStatus
              }
            },
            timestamp: updateTimestamp
          }],
          timestamp: updateTimestamp
        }
      };
    }
  }

  return null;
};
