export const updateProcessNodeWithContainerInfoPure = (
  processId: string,
  containerId: string,
  serviceName: string,
  dockerEventStatus: string
) => {
  const updateTimestamp = new Date().toISOString();
  
  // Map Docker event status to graph status
  let graphStatus: 'running' | 'stopped';
  
  // Docker events that indicate container is running
  const runningStatuses = ['start', 'restart', 'exec_start', 'exec_start:', 'running'];
  // Check if the dockerEventStatus starts with any running indicator
  const isRunning = runningStatuses.some(runningStatus => 
    dockerEventStatus.startsWith(runningStatus)
  );
  
  graphStatus = isRunning ? 'running' : 'stopped';
  
  return {
    operations: [{
      type: 'updateNode' as const,
      data: {
        id: processId,
        metadata: {
          containerId: containerId,
          serviceName: serviceName,
          containerStatus: dockerEventStatus,
          updatedAt: updateTimestamp,
          status: graphStatus
        }
      },
      timestamp: updateTimestamp
    }],
    timestamp: updateTimestamp
  };
};
