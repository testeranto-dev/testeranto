
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";
import { WsManager } from "./WsManager";

export class Server_WS extends Server_HTTP {
  protected wsClients: Set<WebSocket> = new Set();
  protected sliceSubscriptions: Map<string, Set<WebSocket>> = new Map();
  protected chatSubscriptions: Map<string, Set<WebSocket>> = new Map();
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
    this.chatSubscriptions.clear();
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

  /**
   * Process aider output and broadcast as chat messages
   */
  processAiderOutput(agentName: string, output: string): void {
    const messages = this.chatManager.processAiderOutput(agentName, output);

    if (messages.length > 0) {
      // Broadcast each message to chat subscribers
      messages.forEach(message => {
        this.broadcastChatMessage(message);
      });

      // Send to other agents via stdin (placeholder - needs implementation)
      this.sendToOtherAgents(agentName, messages);
    }
  }

  /**
   * Broadcast a chat message to subscribed clients
   */
  broadcastChatMessage(message: ChatMessage): void {
    const data = JSON.stringify({
      type: 'chatMessage',
      data: message,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all chat subscribers
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });

    // Also send to specific agent subscribers
    const agentSubscribers = this.chatSubscriptions.get(message.agent);
    if (agentSubscribers) {
      agentSubscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  /**
   * Send messages to other agents via stdin
   * This is a placeholder - actual implementation depends on how agents receive input
   */
  private sendToOtherAgents(sourceAgent: string, messages: ChatMessage[]): void {
    // TODO: Implement actual stdin sending to other agents
    console.log(`[Server_WS] Would send ${messages.length} messages from ${sourceAgent} to other agents`);
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

    // Check if it's a chat-related message
    if (type === 'subscribeToChat' || type === 'unsubscribeFromChat' ||
      type === 'sendChatMessage' || type === 'getChatHistory') {
      // Delegate to ServerChat if available
      if ((this as any).handleChatWebSocketMessage) {
        (this as any).handleChatWebSocketMessage(ws, message);
      } else {
        // Fall back to original implementation
        switch (type) {
          case 'subscribeToChat':
            this.handleSubscribeToChat(ws, message);
            break;
          case 'unsubscribeFromChat':
            this.handleUnsubscribeFromChat(ws, message);
            break;
          case 'sendChatMessage':
            this.handleSendChatMessage(ws, message);
            break;
          case 'getChatHistory':
            this.handleGetChatHistory(ws, message);
            break;
        }
      }
    } else {
      // Handle non-chat messages
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

  private handleSubscribeToChat(ws: WebSocket, message: any): void {
    const { agentName } = message;
    if (!agentName || typeof agentName !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid agentName for chat subscription',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Initialize subscription set if it doesn't exist
    if (!this.chatSubscriptions.has(agentName)) {
      this.chatSubscriptions.set(agentName, new Set());
    }

    // Add client to subscription
    this.chatSubscriptions.get(agentName)!.add(ws);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribedToChat',
      agentName,
      message: `Subscribed to chat for agent ${agentName}`,
      timestamp: new Date().toISOString()
    }));
  }

  private handleUnsubscribeFromChat(ws: WebSocket, message: any): void {
    const { agentName } = message;
    if (!agentName || typeof agentName !== 'string') {
      return;
    }

    const subscribers = this.chatSubscriptions.get(agentName);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.chatSubscriptions.delete(agentName);
      }
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'unsubscribedFromChat',
      agentName,
      message: `Unsubscribed from chat for agent ${agentName}`,
      timestamp: new Date().toISOString()
    }));
  }

  private handleSendChatMessage(ws: WebSocket, message: any): void {
    const { agentName, content } = message;
    if (!agentName || typeof agentName !== 'string' || !content || typeof content !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid agentName or content for chat message',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Broadcast to all subscribers
    this.broadcastChatMessage(chatMessage);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'chatMessageSent',
      messageId: chatMessage.id,
      timestamp: new Date().toISOString()
    }));
  }

  private handleGetChatHistory(ws: WebSocket, message: any): void {
    const { agentName, limit } = message;
    ws.send(JSON.stringify({
      type: 'chatHistory',
      agentName,
      messages,
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

    for (const [agentName, subscribers] of this.chatSubscriptions.entries()) {
      if (subscribers.has(ws)) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.chatSubscriptions.delete(agentName);
        }
      }
    }
  }

  protected getProcessSummary?(): any;
}
