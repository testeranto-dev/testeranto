export function subscribe(
  subscriptions: Map<string, Set<string>>,
  clientChannels: Map<string, Set<string>>,
  clientId: string,
  channel: string
): void {
  if (!clientId) return;

  let channelSubscribers = subscriptions.get(channel);
  if (!channelSubscribers) {
    channelSubscribers = new Set();
    subscriptions.set(channel, channelSubscribers);
  }
  channelSubscribers.add(clientId);

  let clientSubscriptions = clientChannels.get(clientId);
  if (!clientSubscriptions) {
    clientSubscriptions = new Set();
    clientChannels.set(clientId, clientSubscriptions);
  }
  clientSubscriptions.add(channel);
}
