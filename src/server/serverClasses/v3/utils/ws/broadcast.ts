export function broadcast(
  wsClients: Map<string, WebSocket>,
  message: any, 
  filter?: (client: { id: string; ws: WebSocket }) => boolean
): void {
  const data = JSON.stringify(message);
  
  for (const [clientId, ws] of wsClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filter || filter({ id: clientId, ws })) {
        ws.send(data);
      }
    }
  }
}
