export interface SetupComponentsResult {
  graph: boolean;
  fileWatching: boolean;
  views: boolean;
  logs: boolean;
  locks: boolean;
  agents: boolean;
  vscode: boolean;
  apiSpec: boolean;
}

export function setupComponents(): SetupComponentsResult {
  return {
    graph: true,
    fileWatching: true,
    views: true,
    logs: true,
    locks: true,
    agents: true,
    vscode: true,
    apiSpec: true,
  };
}
