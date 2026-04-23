export function unsubscribe(
  subscriptions: Map<string, Set<string>>,
  clientChannels: Map<string, Set<string>>,
  clientId: string,
  channel: string
): void {
  if (!clientId) return;

  const channelSubscribers = subscriptions.get(channel);
  if (channelSubscribers) {
    channelSubscribers.delete(clientId);
    if (channelSubscribers.size === 0) {
      subscriptions.delete(channel);
    }
  }

  const clientSubscriptions = clientChannels.get(clientId);
  if (clientSubscriptions) {
    clientSubscriptions.delete(channel);
    if (clientSubscriptions.size === 0) {
      clientChannels.delete(clientId);
    }
  }
}
