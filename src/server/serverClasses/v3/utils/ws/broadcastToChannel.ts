export function broadcastToChannel(
  wsClients: Map<string, WebSocket>,
  subscriptions: Map<string, Set<string>>,
  channel: string,
  message: any
): void {
  const channelSubscribers = subscriptions.get(channel);
  if (!channelSubscribers) return;

  const data = JSON.stringify(message);
  
  for (const clientId of channelSubscribers) {
    const ws = wsClients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}
