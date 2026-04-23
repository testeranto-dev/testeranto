export function disconnectClient(
  wsClients: Map<string, WebSocket>,
  subscriptions: Map<string, Set<string>>,
  clientChannels: Map<string, Set<string>>,
  clientId: string
): void {
  const ws = wsClients.get(clientId);
  if (ws) {
    ws.close();
    wsClients.delete(clientId);
    
    const channels = clientChannels.get(clientId);
    if (channels) {
      for (const channel of channels) {
        const channelSubscribers = subscriptions.get(channel);
        if (channelSubscribers) {
          channelSubscribers.delete(clientId);
          if (channelSubscribers.size === 0) {
            subscriptions.delete(channel);
          }
        }
      }
      clientChannels.delete(clientId);
    }
  }
}
