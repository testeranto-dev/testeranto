export function sendToClient(
  wsClients: Map<string, WebSocket>,
  clientId: string, 
  message: any
): boolean {
  const ws = wsClients.get(clientId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}
