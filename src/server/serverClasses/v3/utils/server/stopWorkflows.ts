export interface StopWorkflowsResult {
  stateSync: boolean;
  webSocketBroadcasting: boolean;
  agentWorkflows: boolean;
  logProcessing: boolean;
  viewUpdates: boolean;
  dockerMonitoring: boolean;
  testMonitoring: boolean;
  dockerServices: boolean;
}

export function stopWorkflows(): StopWorkflowsResult {
  return {
    stateSync: true,
    webSocketBroadcasting: true,
    agentWorkflows: true,
    logProcessing: true,
    viewUpdates: true,
    dockerMonitoring: true,
    testMonitoring: true,
    dockerServices: true,
  };
}
