import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";
import { WsManager } from "./utils/WsManager";
import type { ChatMessage } from "./utils/wsChatUtils";
import { handleGetChatHistoryUtil, handleSendChatMessageUtil } from "./utils/wsChatUtils";
import {
  broadcastToClients, handleSubscribeToChat, handleSubscribeToSlice, handleUnsubscribeFromChat, handleUnsubscribeFromSlice, notifySliceSubscribersUtil
} from "./utils/wsMessageHandlers";

export class Server_WS_HTTP extends Server_HTTP {
  wsClients: Set<WebSocket> = new Set();
  sliceSubscriptions: Map<string, Set<WebSocket>> = new Map();
  chatSubscriptions: Map<string, Set<WebSocket>> = new Map();
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

    broadcastToClients(this.wsClients, message);
  }

  private notifySliceSubscribers(slicePath: string, message: any): void {

    notifySliceSubscribersUtil(
      slicePath,
      message,
      this.sliceSubscriptions,
      (ws, data) => ws.send(JSON.stringify(data))
    );
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
    handleSubscribeToSlice(
      ws,
      message,
      this.sliceSubscriptions,
      (ws, data) => ws.send(JSON.stringify(data))
    );
  }

  private handleUnsubscribeFromSlice(ws: WebSocket, message: any): void {

    handleUnsubscribeFromSlice(
      ws,
      message,
      this.sliceSubscriptions,
      (ws, data) => ws.send(JSON.stringify(data))
    );
  }

  private handleSubscribeToChat(ws: WebSocket, message: any): void {

    handleSubscribeToChat(
      ws,
      message,
      this.chatSubscriptions,
      (ws, data) => ws.send(JSON.stringify(data))
    );
  }

  private handleUnsubscribeFromChat(ws: WebSocket, message: any): void {

    handleUnsubscribeFromChat(
      ws,
      message,
      this.chatSubscriptions,
      (ws, data) => ws.send(JSON.stringify(data))
    );
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

    // Use utility function
    const chatMessage = handleSendChatMessageUtil(
      agentName,
      content,
      this.broadcastChatMessage.bind(this)
    );

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'chatMessageSent',
      messageId: chatMessage.id,
      timestamp: new Date().toISOString()
    }));
  }

  private handleGetChatHistory(ws: WebSocket, message: any): void {
    const { agentName, limit } = message;

    // Use utility function
    const messages = handleGetChatHistoryUtil(agentName, limit);

    ws.send(JSON.stringify({
      type: 'chatHistory',
      agentName,
      messages,
      timestamp: new Date().toISOString()
    }));
  }

  // Clean up client subscriptions when they disconnect
  cleanupClientSubscriptions(ws: WebSocket): void {
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
