export interface NotifyStoppedResult {
  broadcast: boolean;
  vscode: boolean;
  agents: boolean;
  locks: boolean;
  logs: boolean;
  views: boolean;
  graph: boolean;
}

export function notifyStopped(): NotifyStoppedResult {
  return {
    broadcast: true,
    vscode: true,
    agents: true,
    locks: true,
    logs: true,
    views: true,
    graph: true,
  };
}
