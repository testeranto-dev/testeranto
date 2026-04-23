import { WebSocket } from 'ws';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  ip: string;
  connectedAt: Date;
}

export function createWebSocketClient(ws: WebSocket, request: any): WebSocketClient {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // Handle Bun's WebSocket upgrade where request might not have socket property
  let ip = 'unknown';
  if (request) {
    if (request.socket && request.socket.remoteAddress) {
      ip = request.socket.remoteAddress;
    } else if (request.headers) {
      // Try to get IP from headers
      let forwardedFor;
      if (request.headers.get) {
        forwardedFor = request.headers.get('x-forwarded-for');
      } else if (request.headers['x-forwarded-for']) {
        forwardedFor = request.headers['x-forwarded-for'];
      }
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
      }
    }
  }
  
  return {
    id: clientId,
    ws,
    ip,
    connectedAt: new Date()
  };
}

export function sendToClient(client: WebSocketClient, message: any): boolean {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export function broadcastToClients(clients: Map<string, WebSocketClient>, message: any, filter?: (client: WebSocketClient) => boolean): void {
  const data = JSON.stringify(message);
  
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) {
        client.ws.send(data);
      }
    }
  }
}

export function disconnectClient(clientId: string, clients: Map<string, WebSocketClient>): boolean {
  const client = clients.get(clientId);
  if (client) {
    client.ws.close();
    clients.delete(clientId);
    return true;
  }
  return false;
}
