export interface CleanupComponentsResult {
  vscode: boolean;
  aiderProcesses: boolean;
  agents: boolean;
  locks: boolean;
  logs: boolean;
  views: boolean;
  graph: boolean;
  dockerProcesses: boolean;
  apiSpec: boolean;
}

export function cleanupComponents(): CleanupComponentsResult {
  return {
    vscode: true,
    aiderProcesses: true,
    agents: true,
    locks: true,
    logs: true,
    views: true,
    graph: true,
    dockerProcesses: true,
    apiSpec: true,
  };
}
