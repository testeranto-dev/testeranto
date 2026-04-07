import { stakeholderWsAPI } from "../../api/api";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";
import { WsManager } from "./WsManager";

export class Server_WS extends Server_HTTP {
  protected wsClients: Set<WebSocket> = new Set();
  protected sliceSubscriptions: Map<string, Set<WebSocket>> = new Map();
  wsManager: WsManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    this.wsManager = new WsManager();
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop() {
    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();
    this.sliceSubscriptions.clear();
    await super.stop();
  }

  escapeXml(unsafe: string): string {
    return this.wsManager.escapeXml(unsafe);
  }

  resourceChanged(url: string) {
    console.log(`[Server_WS] Resource changed: ${url}`);
    
    const message = {
      type: 'resourceChanged',
      url: url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    
    // Broadcast to all clients
    this.broadcast(message);
    
    // Also notify slice subscribers
    this.notifySliceSubscribers(url, message);
    
    // Also broadcast graphUpdated for compatibility with existing code
    if (url.startsWith('/~/')) {
      const graphMessage = {
        type: 'graphUpdated',
        timestamp: new Date().toISOString(),
        message: `Graph updated due to change at ${url}`
      };
      this.broadcast(graphMessage);
    }
  }

  public broadcast(message: any): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private notifySliceSubscribers(slicePath: string, message: any): void {
    // First, try to notify exact match
    const subscribers = this.sliceSubscriptions.get(slicePath);
    if (subscribers) {
      const data = JSON.stringify(message);
      subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
    
    // Also notify without the /~ prefix
    if (slicePath.startsWith('/~/')) {
      const withoutTilde = slicePath.slice(2); // Remove /~
      const tildeSubscribers = this.sliceSubscriptions.get(withoutTilde);
      if (tildeSubscribers) {
        const data = JSON.stringify(message);
        tildeSubscribers.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      }
    }
    
    // Also notify subscribers of parent paths
    const parts = slicePath.split('/').filter(p => p.length > 0);
    for (let i = 1; i <= parts.length; i++) {
      const parentPath = '/' + parts.slice(0, i).join('/');
      const parentSubscribers = this.sliceSubscriptions.get(parentPath);
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

  public handleWebSocketMessage(ws: WebSocket, message: any): void {
    if (!message || typeof message !== 'object') {
      return;
    }

    const { type } = message;
    
    switch (type) {
      case 'subscribeToSlice':
        this.handleSubscribeToSlice(ws, message);
        break;
      case 'unsubscribeFromSlice':
        this.handleUnsubscribeFromSlice(ws, message);
        break;
      default:
        // Handle other message types if needed
        break;
    }
  }

  private handleSubscribeToSlice(ws: WebSocket, message: any): void {
    const { slicePath } = message;
    if (!slicePath || typeof slicePath !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid slicePath for subscription',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Initialize subscription set if it doesn't exist
    if (!this.sliceSubscriptions.has(slicePath)) {
      this.sliceSubscriptions.set(slicePath, new Set());
    }

    // Add client to subscription
    this.sliceSubscriptions.get(slicePath)!.add(ws);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribedToSlice',
      slicePath,
      message: `Subscribed to slice ${slicePath}`,
      timestamp: new Date().toISOString()
    }));
  }

  private handleUnsubscribeFromSlice(ws: WebSocket, message: any): void {
    const { slicePath } = message;
    if (!slicePath || typeof slicePath !== 'string') {
      return;
    }

    const subscribers = this.sliceSubscriptions.get(slicePath);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.sliceSubscriptions.delete(slicePath);
      }
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'unsubscribedFromSlice',
      slicePath,
      message: `Unsubscribed from slice ${slicePath}`,
      timestamp: new Date().toISOString()
    }));
  }

  // Clean up client subscriptions when they disconnect
  private cleanupClientSubscriptions(ws: WebSocket): void {
    for (const [slicePath, subscribers] of this.sliceSubscriptions.entries()) {
      if (subscribers.has(ws)) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.sliceSubscriptions.delete(slicePath);
        }
      }
    }
  }

  protected getProcessSummary?(): any;
}
