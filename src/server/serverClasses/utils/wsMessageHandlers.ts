import type { WebSocket } from 'ws';

export function handleSubscribeToSlice(
  ws: WebSocket,
  message: any,
  sliceSubscriptions: Map<string, Set<WebSocket>>,
  sendToClient: (ws: WebSocket, data: any) => void
): void {
  const { slicePath } = message;
  if (!slicePath || typeof slicePath !== 'string') {
    sendToClient(ws, {
      type: 'error',
      message: 'Invalid slicePath for subscription',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!sliceSubscriptions.has(slicePath)) {
    sliceSubscriptions.set(slicePath, new Set());
  }

  sliceSubscriptions.get(slicePath)!.add(ws);

  sendToClient(ws, {
    type: 'subscribedToSlice',
    slicePath,
    message: `Subscribed to slice ${slicePath}`,
    timestamp: new Date().toISOString()
  });
}

export function handleUnsubscribeFromSlice(
  ws: WebSocket,
  message: any,
  sliceSubscriptions: Map<string, Set<WebSocket>>,
  sendToClient: (ws: WebSocket, data: any) => void
): void {
  const { slicePath } = message;
  if (!slicePath || typeof slicePath !== 'string') {
    return;
  }

  const subscribers = sliceSubscriptions.get(slicePath);
  if (subscribers) {
    subscribers.delete(ws);
    if (subscribers.size === 0) {
      sliceSubscriptions.delete(slicePath);
    }
  }

  sendToClient(ws, {
    type: 'unsubscribedFromSlice',
    slicePath,
    message: `Unsubscribed from slice ${slicePath}`,
    timestamp: new Date().toISOString()
  });
}

export function handleSubscribeToChat(
  ws: WebSocket,
  message: any,
  chatSubscriptions: Map<string, Set<WebSocket>>,
  sendToClient: (ws: WebSocket, data: any) => void
): void {
  const { agentName } = message;
  if (!agentName || typeof agentName !== 'string') {
    sendToClient(ws, {
      type: 'error',
      message: 'Invalid agentName for chat subscription',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!chatSubscriptions.has(agentName)) {
    chatSubscriptions.set(agentName, new Set());
  }

  chatSubscriptions.get(agentName)!.add(ws);

  sendToClient(ws, {
    type: 'subscribedToChat',
    agentName,
    message: `Subscribed to chat for agent ${agentName}`,
    timestamp: new Date().toISOString()
  });
}

export function handleUnsubscribeFromChat(
  ws: WebSocket,
  message: any,
  chatSubscriptions: Map<string, Set<WebSocket>>,
  sendToClient: (ws: WebSocket, data: any) => void
): void {
  const { agentName } = message;
  if (!agentName || typeof agentName !== 'string') {
    return;
  }

  const subscribers = chatSubscriptions.get(agentName);
  if (subscribers) {
    subscribers.delete(ws);
    if (subscribers.size === 0) {
      chatSubscriptions.delete(agentName);
    }
  }

  sendToClient(ws, {
    type: 'unsubscribedFromChat',
    agentName,
    message: `Unsubscribed from chat for agent ${agentName}`,
    timestamp: new Date().toISOString()
  });
}

export function broadcastToClients(
  clients: Set<WebSocket>,
  message: any
): void {
  const data = typeof message === "string" ? message : JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function notifySliceSubscribersUtil(
  slicePath: string,
  message: any,
  sliceSubscriptions: Map<string, Set<WebSocket>>,
  sendToClient: (ws: WebSocket, data: any) => void
): void {
  const subscribers = sliceSubscriptions.get(slicePath);
  if (subscribers) {
    const data = JSON.stringify(message);
    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  if (slicePath.startsWith('/~/')) {
    const withoutTilde = slicePath.slice(2);
    const tildeSubscribers = sliceSubscriptions.get(withoutTilde);
    if (tildeSubscribers) {
      const data = JSON.stringify(message);
      tildeSubscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  const parts = slicePath.split('/').filter(p => p.length > 0);
  for (let i = 1; i <= parts.length; i++) {
    const parentPath = '/' + parts.slice(0, i).join('/');
    const parentSubscribers = sliceSubscriptions.get(parentPath);
    if (parentSubscribers) {
      const data = JSON.stringify(message);
      parentSubscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }
}
