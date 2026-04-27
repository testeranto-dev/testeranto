import { Server_HTTP } from "./Server_HTTP";
import { WebSocketServer, WebSocket } from 'ws';
import { createHttpServer, startHttpServer, stopHttpServer } from "../utils/http/httpUtils";
import { broadcastToClients, disconnectClient } from "../utils/websocket/wsUtils";
import type { WebSocketClient } from "../utils/websocket/wsUtils";
import type { Route, Middleware } from "../utils/http/httpUtils";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { serveStatic } from 'hono/bun';

export class Server_WS_HTTP extends Server_HTTP {
  protected wsServer: WebSocketServer | null = null;
  // httpServer is inherited from Server_HTTP
  protected wsClients: Map<string, WebSocketClient> = new Map();
  protected channels: Map<string, Set<string>> = new Map();
  // Note: routes moved to Server_ApiSpec (business layer)
  // Note: middlewares are a technological concern for HTTP handling
  protected middlewares: Array<(request: Request, next: () => Promise<Response>) => Promise<Response>> = [];

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  async startHttpServer(port: number = 3000, hostname?: string): Promise<void> {
    this.logBusinessMessage(`Starting HTTP server with WebSocket support using Hono with Bun.serve()...`);

    this.port = port;
    this.hostname = hostname || '0.0.0.0';

    // Setup Hono app with static file serving before starting the server
    this.setupHonoApp();

    // Create the Bun HTTP server with WebSocket support
    this.httpServer = Bun.serve({
      port: this.port,
      hostname: this.hostname,
      fetch: async (request: Request, server: any) => {
        // Check if this is a WebSocket upgrade request
        if (request.headers.get("upgrade") === "websocket") {
          const success = server.upgrade(request);
          if (success) {
            // The upgrade was successful, Bun will handle the WebSocket connection
            return new Response(null, { status: 101 });
          }
          return new Response("WebSocket upgrade failed", { status: 400 });
        }

        // Handle regular HTTP requests through Hono
        return await this.app.fetch(request);
      },
      websocket: {
        message: (ws, message) => {
          this.handleWebSocketMessageV2Bun(ws, message);
        },
        open: (ws) => {
          this.handleWebSocketConnectionV2(ws);
        },
        close: (ws, code, reason) => {
          this.handleWebSocketDisconnectV2(ws);
        },
        drain: (ws) => {
          // Handle backpressure if needed
        },
      },
    });

    this.logBusinessMessage(`HTTP server with WebSocket support started at ${this.httpServer.url}`);
  }

  private setupHonoApp(): void {
    // Handle /~/ API routes first (before static file serving)
    this.app.all('/~/', (c) => {
      return this.handleHonoRequest(c.req);
    });
    this.app.all('/~/*', (c) => {
      return this.handleHonoRequest(c.req);
    });

    // Serve static files from testeranto/views directory
    this.app.use('/testeranto/views/*', serveStatic({ 
      root: './',
      onNotFound: (path, c) => {
        this.logBusinessMessage(`Static file not found: ${path}`);
        return c.text('File not found', 404);
      }
    }));

    // Serve other static files from root (excluding /~/ routes)
    this.app.use('/*', serveStatic({ 
      root: './',
      onNotFound: (path, c) => {
        this.logBusinessMessage(`Static file not found: ${path}`);
        return c.text('File not found', 404);
      }
    }));

    // Handle all other requests through Hono
    this.app.all('*', (c) => {
      return this.handleHonoRequest(c.req);
    });
  }

  private upgradeWebSocket(request: Request): boolean {
    // Bun handles WebSocket upgrades automatically when websocket config is provided
    // This method is called by Bun when a WebSocket upgrade is requested
    return true;
  }

  private handleWebSocketConnectionV2(ws: any): void {
    const { handleWebSocketConnectionV2 } = require("../utils/websocket/handleWebSocketConnectionV2");
    const result = handleWebSocketConnectionV2();
    
    const clientId = result.clientId;
    // Create client without using createWebSocketClient since Bun doesn't provide request object
    const client = {
      id: clientId,
      ws: ws,
      ip: 'unknown',
      connectedAt: result.connectedAt
    };

    this.wsClients.set(clientId, client);

    this.logBusinessMessage(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      message: "Connected to Testeranto WebSocket",
      timestamp: new Date().toISOString(),
    });
  }

  private handleWebSocketMessageV2Bun(ws: any, message: string | Buffer | object): void {
    const { handleWebSocketMessageV2Bun } = require("../utils/websocket/handleWebSocketMessageV2Bun");
    
    // Find client by WebSocket object
    let clientId: string | null = null;
    for (const [id, client] of this.wsClients.entries()) {
      if (client.ws === ws) {
        clientId = id;
        break;
      }
    }

    if (!clientId) {
      return;
    }

    const client = this.wsClients.get(clientId);
    if (!client) {
      return;
    }

    const parsed = handleWebSocketMessageV2Bun({ message, clientId });
    
    if (!parsed) {
      this.sendToClient(clientId, {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: 'Invalid JSON message'
      });
      return;
    }

    const { type } = parsed;

    // Handle different message types from V2
    switch (type) {
      case 'subscribeToSlice':
        this.handleSubscribeToSliceV2(client, parsed);
        break;
      case 'unsubscribeFromSlice':
        this.handleUnsubscribeFromSliceV2(client, parsed);
        break;
      case 'subscribeToChat':
        this.handleSubscribeToChatV2(client, parsed);
        break;
      case 'unsubscribeFromChat':
        this.handleUnsubscribeFromChatV2(client, parsed);
        break;
      case 'sendChatMessage':
        this.handleSendChatMessageV2(client, parsed);
        break;
      case 'getChatHistory':
        this.handleGetChatHistoryV2(client, parsed);
        break;
      default:
        // Handle other message types
        this.emit('websocketMessage', { client, message: parsed });
    }
  }

  // private handleWebSocketDisconnectV2(ws: any): void {
  //   // Find client by WebSocket object
  //   let clientId: string | null = null;
  //   for (const [id, client] of this.wsClients.entries()) {
  //     if (client.ws === ws) {
  //       clientId = id;
  //       break;
  //     }
  //   }

  //   if (clientId) {
  //     this.handleWebSocketDisconnectV2(clientId);
  //   }
  // }



  private handleWebSocketDisconnectV2(clientId: string): void {
    const client = this.wsClients.get(clientId);
    if (client) {
      this.logBusinessMessage(`WebSocket client disconnected: ${clientId}`);

      // V2 business logic: cleanup client subscriptions
      this.cleanupClientSubscriptionsV2(clientId);

      // Remove from all channels
      for (const [channel, clients] of this.channels.entries()) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.channels.delete(channel);
        }
      }

      this.wsClients.delete(clientId);

      // Notify other clients
      this.broadcastToChannel('system', {
        type: 'clientDisconnected',
        clientId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private cleanupClientSubscriptionsV2(clientId: string): void {
    const { cleanupClientSubscriptionsV2 } = require("../utils/websocket/cleanupClientSubscriptionsV2");
    const result = cleanupClientSubscriptionsV2(clientId);
    this.logBusinessMessage(`Cleaned up subscriptions for client ${clientId} at ${result.timestamp}`);
  }

  // V2 message handler stubs
  private handleSubscribeToSliceV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} subscribing to slice: ${message.slicePath}`);
    // Implementation
  }

  private handleUnsubscribeFromSliceV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} unsubscribing from slice: ${message.slicePath}`);
    // Implementation
  }

  private handleSubscribeToChatV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} subscribing to chat: ${message.agentName}`);
    // Implementation
  }

  private handleUnsubscribeFromChatV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} unsubscribing from chat: ${message.agentName}`);
    // Implementation
  }

  private handleSendChatMessageV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} sending chat message to ${message.agentName}: ${message.content}`);
    // Implementation
  }

  private handleGetChatHistoryV2(client: WebSocketClient, message: any): void {
    this.logBusinessMessage(`Client ${client.id} getting chat history for ${message.agentName}`);
    // Implementation
  }

  async stopHttpServer(): Promise<void> {
    if (this.wsServer) {
      // Close all WebSocket connections
      for (const client of this.wsClients.values()) {
        client.ws.close();
      }
      this.wsClients.clear();
      this.channels.clear();

      this.wsServer.close();
      this.wsServer = null;
    }

    if (this.httpServer) {
      await stopHttpServer(this.httpServer);
      this.httpServer = null;
    }
  }

  async handleRequest(request: Request): Promise<Response> {
    // Call parent implementation which returns a proper Response
    return await super.handleRequest(request);
  }

  async serveStaticFile(request: Request, filePath: string): Promise<Response> {
    try {
      const content = await this.readFile(filePath);
      const ext = filePath.split('.').pop()?.toLowerCase();

      let contentType = 'text/plain';
      if (ext === 'html') contentType = 'text/html';
      else if (ext === 'css') contentType = 'text/css';
      else if (ext === 'js') contentType = 'application/javascript';
      else if (ext === 'json') contentType = 'application/json';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';

      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': contentType }
      });
    } catch (error) {
      return new Response('File not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // Override the addRoute method to ensure proper conversion
  addRoute(method: string, path: string, handler: (request: any) => Promise<any>): void {
    // Convert handler to Bun-compatible handler
    const bunHandler = async (request: Request): Promise<Response> => {
      const result = await handler(request);
      // Convert to Response object
      if (result instanceof Response) {
        return result;
      }
      return new Response(
        typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
        {
          status: result.status || 200,
          headers: result.headers || { "Content-Type": "application/json" }
        }
      );
    };

    // Add to the Map for actual routing (inherited from Server_HTTP)
    super.addRoute(method, path, bunHandler);
  }

  removeRoute(method: string, path: string): void {
    // Remove from the Map for actual routing (inherited from Server_HTTP)
    super.removeRoute(method, path);

    // Note: Route configuration tracking is handled by Server_ApiSpec
    // Server_Api will handle array tracking if needed
  }

  useMiddleware(middleware: Middleware): void {
    // Add to middlewares array
    this.middlewares.push(middleware);
  }

  private handleWebSocketConnection(ws: WebSocket, request: any): void {
    const client = createWebSocketClient(ws, request);
    this.wsClients.set(client.id, client);

    console.log(`[Server_WS_HTTP] Client connected: ${client.id} from ${client.ip}`);

    // Setup message handler
    ws.on('message', (data) => {
      this.handleWebSocketMessage(client, data);
    });

    // Setup close handler
    ws.on('close', () => {
      this.handleWebSocketDisconnect(client.id);
    });

    // Setup error handler
    ws.on('error', (error) => {
      console.error(`[Server_WS_HTTP] WebSocket error for client ${client.id}:`, error);
      this.handleWebSocketDisconnect(client.id);
    });

    // Send welcome message
    sendToClient(client, {
      type: 'welcome',
      clientId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to WebSocket server'
    });
  }

  private handleWebSocketMessage(client: WebSocketClient, data: WebSocket.RawData): void {
    try {
      const message = JSON.parse(data.toString());

      if (!message.type) {
        sendToClient(client, {
          type: 'error',
          timestamp: new Date().toISOString(),
          message: 'Message must have a type field'
        });
        return;
      }

      // Handle different message types
      switch (message.type) {
        case 'ping':
          sendToClient(client, {
            type: 'pong',
            timestamp: new Date().toISOString()
          });
          break;
        case 'subscribe':
          if (message.channel && typeof message.channel === 'string') {
            this.subscribeClientToChannel(client.id, message.channel);
            sendToClient(client, {
              type: 'subscribed',
              channel: message.channel,
              timestamp: new Date().toISOString()
            });
          }
          break;
        case 'unsubscribe':
          if (message.channel && typeof message.channel === 'string') {
            this.unsubscribeClientFromChannel(client.id, message.channel);
            sendToClient(client, {
              type: 'unsubscribed',
              channel: message.channel,
              timestamp: new Date().toISOString()
            });
          }
          break;
        default:
          // For custom message types, emit an event
          this.emit('websocketMessage', { client, message });
      }
    } catch (error) {
      console.error(`[Server_WS_HTTP] Error parsing message from client ${client.id}:`, error);
      sendToClient(client, {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: 'Invalid JSON message'
      });
    }
  }

  private handleWebSocketDisconnect(clientId: string): void {
    const client = this.wsClients.get(clientId);
    if (client) {
      console.log(`[Server_WS_HTTP] Client disconnected: ${clientId}`);

      // Remove from all channels
      for (const [channel, clients] of this.channels.entries()) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.channels.delete(channel);
        }
      }

      this.wsClients.delete(clientId);

      // Notify other clients
      this.broadcastToChannel('system', {
        type: 'clientDisconnected',
        clientId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private subscribeClientToChannel(clientId: string, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)?.add(clientId);
    console.log(`[Server_WS_HTTP] Client ${clientId} subscribed to channel ${channel}`);
  }

  private unsubscribeClientFromChannel(clientId: string, channel: string): void {
    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
      }
    }
    console.log(`[Server_WS_HTTP] Client ${clientId} unsubscribed from channel ${channel}`);
  }

  broadcast(message: any, filter?: (client: WebSocketClient) => boolean): void {
    broadcastToClients(this.wsClients, message, filter);
  }

  sendToClient(clientId: string, message: any): boolean {
    const client = this.wsClients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        this.logBusinessError(`Error sending message to client ${clientId}:`, error);
        return false;
      }
    }
    return false;
  }

  getConnectedClients(): WebSocketClient[] {
    return Array.from(this.wsClients.values());
  }

  broadcastToChannel(channel: string, message: any): void {
    const channelClients = this.channels.get(channel);
    if (!channelClients) return;

    const data = JSON.stringify(message);
    for (const clientId of channelClients) {
      const client = this.wsClients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  disconnectClient(clientId: string): boolean {
    return disconnectClient(clientId, this.wsClients);
  }

  // Simple event emitter
  private listeners: Map<string, Function[]> = new Map();

  protected on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  protected off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  protected emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`[Server_WS_HTTP] Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  // WebSocket broadcasting methods called by Server.ts
  async startWebSocketBroadcasting(): Promise<void> {
    this.logBusinessMessage("Starting WebSocket broadcasting...");
    // Implementation would start periodic broadcasts
    this.logBusinessMessage("WebSocket broadcasting started");
  }

  async stopWebSocketBroadcasting(): Promise<void> {
    this.logBusinessMessage("Stopping WebSocket broadcasting...");
    // Implementation would stop broadcasts
    this.logBusinessMessage("WebSocket broadcasting stopped");
  }

  async broadcastServerStarted(): Promise<void> {
    this.logBusinessMessage("Broadcasting server start event...");
    this.broadcast({
      type: 'serverStarted',
      timestamp: new Date().toISOString(),
      message: 'Server has started'
    });
    this.logBusinessMessage("Server start event broadcasted");
  }

  async broadcastServerStopped(): Promise<void> {
    this.logBusinessMessage("Broadcasting server stop event...");
    this.broadcast({
      type: 'serverStopped',
      timestamp: new Date().toISOString(),
      message: 'Server has stopped'
    });
    this.logBusinessMessage("Server stop event broadcasted");
  }

  // Broadcast process status changes to WebSocket clients
  async broadcastProcessStatusChanged(processId: string, status: string, metadata?: Record<string, any>): Promise<void> {
    this.logBusinessMessage(`Broadcasting process status change: ${processId} -> ${status}`);
    this.broadcast({
      type: 'processUpdated',
      processId,
      status,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  async broadcastContainerStatusChanged(containerId: string, status: string, serviceName?: string): Promise<void> {
    this.logBusinessMessage(`Broadcasting container status change: ${containerId} -> ${status}`);
    this.broadcast({
      type: 'containerStatusChanged',
      containerId,
      status,
      serviceName,
      timestamp: new Date().toISOString()
    });
  }

  async broadcastGraphUpdated(): Promise<void> {
    this.logBusinessMessage("Broadcasting graph update");

    // Include the full graph data so the debug view can update immediately
    const graphData = {
      nodes: this.graph?.nodes || [],
      edges: this.graph?.edges || [],
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'Server_WS_HTTP'
      }
    };

    this.broadcast({
      type: 'graphUpdated',
      graphData,
      timestamp: new Date().toISOString()
    });
  }

  // State synchronization methods
  async startStateSync(): Promise<void> {
    this.logBusinessMessage("Starting state synchronization...");
    // Implementation would start periodic state sync
    this.logBusinessMessage("State synchronization started");
  }

  async stopStateSync(): Promise<void> {
    this.logBusinessMessage("Stopping state synchronization...");
    // Implementation would stop state sync
    this.logBusinessMessage("State synchronization stopped");
  }
}
