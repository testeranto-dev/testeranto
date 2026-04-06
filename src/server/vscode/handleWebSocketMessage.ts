import { vscodeWsAPI } from "../../api/vscodeExtensionWs";

export function handleWebSocketMessage(
  ws: WebSocket,
  message: any,
  wsManager: any,
  getProcessSummary: () => any,
  getProcessLogs: (processId: string) => any[],
  sourceFilesUpdated?: (testName: string, hash: string, files: string[], runtime: string) => void,
  getBuildListenerState?: () => any,
  getBuildEvents?: () => any[],
  broadcast?: (message: any) => void
): void {
  // Note: getProcesses WebSocket message has been removed as part of the unified graph-based approach

  if (message.type === vscodeWsAPI.getUnifiedTestTree.type) {
    // Handle getUnifiedTestTree
    if (!ws || typeof ws.send !== 'function') {
      return;
    }
    const tree = getProcessSummary ? getProcessSummary() : {};
    ws.send(JSON.stringify({
      type: vscodeWsAPI.getUnifiedTestTree.response.type,
      tree: tree,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Process other messages through wsManager
  const response = wsManager.processMessage(
    message.type,
    message.data,
    getProcessSummary,
    getProcessLogs
  );

  ws.send(JSON.stringify(response));

  // Handle side effects for specific message types
  switch (message.type) {
    case vscodeWsAPI.sourceFilesUpdated.type:
      const { testName, hash, files, runtime } = message.data || {};
      if (testName && hash && files && runtime && sourceFilesUpdated) {
        sourceFilesUpdated(testName, hash, files, runtime);
        if (broadcast) {
          broadcast({
            type: vscodeWsAPI.sourceFilesUpdated.type,
            testName,
            hash,
            files,
            runtime,
            status: "processed",
            timestamp: new Date().toISOString(),
            message: "Source files update processed successfully"
          });
        }
      }
      break;
    case vscodeWsAPI.getBuildListenerState.type:
      if (getBuildListenerState) {
        const state = getBuildListenerState();
        ws.send(JSON.stringify({
          type: vscodeWsAPI.getBuildListenerState.response.type,
          data: state,
          timestamp: new Date().toISOString()
        }));
      }
      break;
    case vscodeWsAPI.getBuildEvents.type:
      if (getBuildEvents) {
        const events = getBuildEvents();
        ws.send(JSON.stringify({
          type: vscodeWsAPI.getBuildEvents.response.type,
          events: events,
          timestamp: new Date().toISOString()
        }));
      }
      break;
  }
}
