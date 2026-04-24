export interface NotifyStartedResult {
  graph: boolean;
  views: boolean;
  logs: boolean;
  locks: boolean;
  agents: boolean;
  vscode: boolean;
  broadcast: boolean;
}

export function notifyStarted(): NotifyStartedResult {
  return {
    graph: true,
    views: true,
    logs: true,
    locks: true,
    agents: true,
    vscode: true,
    broadcast: true,
  };
}
