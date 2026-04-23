export function getConnectedClients(wsClients: Map<string, WebSocket>): any[] {
  return Array.from(wsClients.entries()).map(([id, ws]) => ({
    id,
    readyState: ws.readyState
  }));
}
