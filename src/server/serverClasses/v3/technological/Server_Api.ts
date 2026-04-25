import { API, wsApi, matchApiRoute } from "../../../../api";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_WS_HTTP } from "./Server_WS_HTTP";

/**
 * Server_Api - Technological Layer (+4.5)
 * 
 * Extends: Server_WS_HTTP (+4)
 * Extended by: Server_DockerCompose
 * Provides: Unified API handling for both HTTP and WebSocket
 * 
 * This class handles the technological aspects of API routing (Bun HTTP server).
 * Business logic is delegated to abstract methods implemented by business layers.
 */
export abstract class Server_Api extends Server_WS_HTTP {
  protected registeredRoutes: Map<string, (request: Request) => Promise<Response>> = new Map();
  protected registeredWsHandlers: Map<string, (message: any, client: any) => Promise<any>> = new Map();
  protected apiMiddleware: Array<(request: Request, next: () => Promise<Response>) => Promise<Response>> = [];
  protected isRunning: boolean = false;
  protected startedAt: Date | null = null;
  // Note: middlewares is inherited from Server_WS_HTTP
  // Track routes for configuration (business concern)
  protected apiRoutes: Array<{ method: string; path: string; handler: any }> = [];

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  // ========== HTTP API Registration ==========

  registerHttpRoute(endpointKey: string, handler: (request: Request) => Promise<Response>): void {
    const endpoint = API[endpointKey as keyof typeof API];
    if (!endpoint) {
      throw new Error(`Cannot register HTTP route: endpoint '${endpointKey}' not found in API`);
    }

    const routeName = endpoint.path.replace('/~/', '');
    this.registeredRoutes.set(routeName, handler);

    // Also add to HTTP server routes
    this.addRoute(endpoint.method, endpoint.path, async (request: any) => {
      return await this.handleHttpApiRequest(request, endpointKey);
    });

    this.logBusinessMessage(`Registered HTTP route: ${endpoint.method} ${endpoint.path} (${endpointKey})`);
  }

  registerHttpRouteFromSpec(routeName: string, method: string, handler: (request: Request) => Promise<Response>): void {
    // Find the endpoint in API that matches this route and method
    let endpointKey: string | null = null;
    for (const [key, endpoint] of Object.entries(API)) {
      const endpointPath = endpoint.path.replace('/~/', '');
      if (endpointPath === routeName && endpoint.method === method) {
        endpointKey = key;
        break;
      }
    }

    if (!endpointKey) {
      throw new Error(`Cannot register HTTP route: no API endpoint found for '${routeName}' with method '${method}'`);
    }

    this.registerHttpRoute(endpointKey, handler);
  }

  // ========== WebSocket API Registration ==========

  registerWsMessageHandler(messageType: string, handler: (message: any, client: any) => Promise<any>): void {
    const messageSpec = wsApi[messageType as keyof typeof wsApi];
    if (!messageSpec) {
      throw new Error(`Cannot register WebSocket handler: message type '${messageType}' not found in wsApi`);
    }

    this.registeredWsHandlers.set(messageType, handler);
    this.logBusinessMessage(`Registered WebSocket message handler: ${messageType}`);
  }

  registerWsMessageHandlerFromSpec(type: string, handler: (message: any, client: any) => Promise<any>): void {
    // Find the message in wsApi that matches this type
    let messageKey: string | null = null;
    for (const [key, message] of Object.entries(wsApi)) {
      if (message.type === type) {
        messageKey = key;
        break;
      }
    }

    if (!messageKey) {
      throw new Error(`Cannot register WebSocket handler: no wsApi message found with type '${type}'`);
    }

    this.registerWsMessageHandler(messageKey, handler);
  }

  // ========== Abstract Business Methods ==========
  // These must be implemented by business layers

  protected abstract handleFilesRoute(request: Request): Promise<Response>;
  protected abstract handleProcessRoute(request: Request): Promise<Response>;
  protected abstract handleAiderRoute(request: Request): Promise<Response>;
  protected abstract handleRuntimeRoute(request: Request): Promise<Response>;
  protected abstract handleAgentsRoute(request: Request): Promise<Response>;
  protected abstract handleAgentSliceRoute(request: Request, agentName: string): Promise<Response>;
  protected abstract handleAllViewsRoute(request: Request): Promise<Response>;
  protected abstract handleViewRoute(request: Request, viewName: string): Promise<Response>;
  protected abstract handlePostChatMessage(request: Request): Promise<Response>;
  protected abstract handleGetChatHistory(request: Request): Promise<Response>;

  // ========== HTTP API Request Handling ==========

  private async handleHttpApiRequest(request: Request, endpointKey: string): Promise<Response> {
    try {
      // Apply API middleware
      let index = 0;
      const next = async (): Promise<Response> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index];
          index++;
          return await middleware(request, next);
        } else {
          // Check if there's a registered handler for this endpoint
          const routeName = API[endpointKey as keyof typeof API].path.replace('/~/', '');
          const handler = this.registeredRoutes.get(routeName);

          if (handler) {
            // Use the registered handler if available
            return await handler(request);
          } else {
            // No specific handler, delegate to business layer
            return await this.handleDefaultApiRequest(request, endpointKey);
          }
        }
      };

      return await next();
    } catch (error: any) {
      this.logBusinessError(`Error handling HTTP API request for ${endpointKey}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          message: 'Internal server error',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  private async handleDefaultApiRequest(request: Request, endpointKey: string): Promise<Response> {
    const endpoint = API[endpointKey as keyof typeof API];
    const url = new URL(request.url);

    // Delegate to business layer implementations
    switch (endpointKey) {
      case 'getFiles':
        return await this.handleFilesRoute(request);
      case 'getProcess':
        return await this.handleProcessRoute(request);
      case 'getAider':
        return await this.handleAiderRoute(request);
      case 'getRuntime':
        return await this.handleRuntimeRoute(request);
      case 'getAgents':
      case 'getAllAgents':
        return await this.handleAgentsRoute(request);
      case 'getAgentSlice':
        const agentName = url.pathname.split('/').pop();
        return await this.handleAgentSliceRoute(request, agentName || '');
      case 'getAllViews':
        return await this.handleAllViewsRoute(request);
      case 'getView':
        const viewName = url.pathname.split('/').pop();
        return await this.handleViewRoute(request, viewName || '');
      case 'getConfigs':
        return new Response(
          JSON.stringify({
            configs: this.configs,
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      case 'getAppState':
        return new Response(
          JSON.stringify({
            isRunning: this.isRunning,
            startedAt: this.startedAt,
            mode: this.mode,
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      case 'postChatMessage':
        return await this.handlePostChatMessage(request);
      case 'getChatHistory':
        return await this.handleGetChatHistory(request);
      case 'launchAgent':
        {
          // Extract agent name from URL path: /~/agents/:agentName
          const pathParts = url.pathname.split('/').filter(Boolean);
          const agentName = pathParts[pathParts.length - 1];
          if (!agentName) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Missing agent name in URL',
                timestamp: new Date().toISOString()
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
          // Delegate to spawnAgent with the agent profile name
          const result = await this.spawnAgent(agentName);
          return new Response(
            JSON.stringify({
              success: true,
              agentName: result.agentName,
              containerId: result.containerId,
              timestamp: new Date().toISOString()
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      case 'openProcessTerminal':
        {
          const body = await request.json().catch(() => ({}));
          const { nodeId, label, containerId, serviceName } = body;

          if (!nodeId) {
            return new Response('Missing required field: nodeId', {
              status: 400,
              headers: { "Content-Type": "text/plain" }
            });
          }

          try {
            const result = await this.openProcessTerminal(
              nodeId,
              label || nodeId,
              containerId || '',
              serviceName || ''
            );

            // Return just the shell command as plain text
            return new Response(result.command, {
              status: 200,
              headers: { "Content-Type": "text/plain" }
            });
          } catch (error: any) {
            return new Response(error.message, {
              status: 500,
              headers: { "Content-Type": "text/plain" }
            });
          }
        }
      default:
        // For other endpoints, return a placeholder response
        return new Response(
          JSON.stringify({
            endpoint: endpointKey,
            method: request.method,
            path: url.pathname,
            message: `Endpoint '${endpointKey}' is registered but handler not implemented`,
            timestamp: new Date().toISOString()
          }),
          {
            status: 501,
            headers: { "Content-Type": "application/json" }
          }
        );
    }
  }


  // ========== WebSocket API Message Handling ==========

  protected async handleWebSocketApiMessage(client: any, message: any): Promise<void> {
    try {
      const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;

      if (!parsedMessage.type) {
        this.sendToClient(client.id, {
          type: 'error',
          timestamp: new Date().toISOString(),
          message: 'WebSocket message must have a type field'
        });
        return;
      }

      // Find the handler for this message type
      const messageKey = this.matchWsMessageToApi(parsedMessage.type);
      if (!messageKey) {
        this.sendToClient(client.id, {
          type: 'error',
          timestamp: new Date().toISOString(),
          message: `Unknown WebSocket message type: ${parsedMessage.type}`
        });
        return;
      }

      const handler = this.registeredWsHandlers.get(messageKey);
      if (!handler) {
        this.sendToClient(client.id, {
          type: 'error',
          timestamp: new Date().toISOString(),
          message: `No handler registered for message type: ${parsedMessage.type}`
        });
        return;
      }

      // Execute the handler
      const result = await handler(parsedMessage, client);

      // Send response if handler returned one
      if (result) {
        const response = {
          type: `${parsedMessage.type}_response`,
          timestamp: new Date().toISOString(),
          ...result
        };
        this.sendToClient(client.id, response);
      }
    } catch (error: any) {
      this.logBusinessError(`Error handling WebSocket API message:`, error);
      this.sendToClient(client.id, {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error processing message',
        error: error.message
      });
    }
  }

  // ========== API Middleware ==========

  useApiMiddleware(middleware: (request: Request, next: () => Promise<Response>) => Promise<Response>): void {
    this.middlewares.push(middleware);
    this.logBusinessMessage('API middleware added');
  }

  // ========== Route Management ==========

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

    // Call parent to add route to Bun server
    super.addRoute(method, path, bunHandler);

    // Also track in apiRoutes array for configuration
    this.apiRoutes.push({ method, path, handler });
  }

  removeRoute(method: string, path: string): void {
    // Call parent to remove route from Bun server
    super.removeRoute(method, path);

    // Also remove from apiRoutes array
    this.apiRoutes = this.apiRoutes.filter(route =>
      !(route.method.toUpperCase() === method.toUpperCase() && route.path === path)
    );
  }

  // ========== Route Registration ==========

  /**
   * Register a custom HTTP route with a handler.
   */
  protected registerRoute(method: string, path: string, handler: (request: Request) => Promise<Response>): void {
    this.addRoute(method, path, async (request: Request) => {
      return await handler(request);
    });
    this.logBusinessMessage(`Registered custom route: ${method} ${path}`);
  }

  // ========== API Route Discovery ==========

  getRegisteredHttpRoutes(): Array<{ method: string; path: string; endpointKey: string }> {
    const routes: Array<{ method: string; path: string; endpointKey: string }> = [];

    for (const [endpointKey, endpoint] of Object.entries(API)) {
      routes.push({
        method: endpoint.method,
        path: endpoint.path,
        endpointKey
      });
    }

    return routes;
  }

  getRegisteredWsMessages(): Array<{ type: string; messageKey: string }> {
    const messages: Array<{ type: string; messageKey: string }> = [];

    for (const [messageKey, message] of Object.entries(wsApi)) {
      // Skip slices as it's not a message type
      if (messageKey === 'slices') continue;

      messages.push({
        type: message.type,
        messageKey
      });
    }

    return messages;
  }

  // ========== API Validation ==========

  validateHttpApiRequest(request: Request): {
    isValid: boolean;
    endpointKey?: string;
    errors?: string[];
  } {
    const url = new URL(request.url);
    const routeName = url.pathname.replace('/~/', '');
    const method = request.method;

    // Use matchApiRoute from api.ts if available
    const endpointKey = matchApiRoute(routeName, method);
    if (endpointKey) {
      return { isValid: true, endpointKey };
    }

    // Fallback to checking registered routes
    for (const [key, endpoint] of Object.entries(API)) {
      const endpointPath = endpoint.path.replace('/~/', '');
      if (endpointPath === routeName && endpoint.method === method) {
        return { isValid: true, endpointKey: key };
      }
    }

    return {
      isValid: false,
      errors: [`No API endpoint found for ${method} ${routeName}`]
    };
  }

  // ========== Utility Methods ==========

  private createStandardRequest(internalRequest: any): Request {
    // Convert internal request format to standard Request object
    // This is a simplified implementation
    // Since Bun passes a standard Request object, we might not need to convert
    // But for safety, handle both cases
    if (internalRequest instanceof Request) {
      return internalRequest;
    }

    // Extract properties from internal request object
    const url = internalRequest.url || 'http://localhost';
    const method = internalRequest.method || 'GET';
    const headers = new Headers(internalRequest.headers || {});
    const body = internalRequest.body || null;

    return new Request(url, {
      method,
      headers,
      body
    });
  }

  private matchWsMessageToApi(type: string): string | null {
    const { matchWsMessageToApi } = require("../utils/api/matchWsMessageToApi");
    return matchWsMessageToApi(type);
  }

  // ========== Override WebSocket Handling ==========

  // protected override handleWebSocketMessageV2(client: any, data: any): void {
  //   try {
  //     const message = JSON.parse(data.toString());

  //     // First, try API message handling
  //     if (message.type && this.matchWsMessageToApi(message.type)) {
  //       this.handleWebSocketApiMessage(client, message);
  //       return;
  //     }

  //     // Handle chat messages via WebSocket
  //     if (message.type === 'sendChatMessage') {
  //       this.handleWebSocketChatMessage(client, message);
  //       return;
  //     }

  //     // Fall back to parent implementation for non-API messages
  //     super.handleWebSocketMessageV2(client, data);
  //   } catch (error) {
  //     // If parsing fails, fall back to parent
  //     super.handleWebSocketMessageV2(client, data);
  //   }
  // }

  private async handleWebSocketChatMessage(client: any, message: any): Promise<void> {
    try {
      const { agentName, content } = message;

      if (!agentName || !content) {
        this.sendToClient(client.id, {
          type: 'error',
          timestamp: new Date().toISOString(),
          message: 'Missing required fields: agentName and content'
        });
        return;
      }

      // Create a chat message node in the graph
      const messageId = `chat-ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const chatNode = {
        id: messageId,
        type: { category: 'chat', type: 'chat_message' },
        label: `Chat message from ${agentName}`,
        description: content,
        metadata: {
          agentName,
          content,
          timestamp: new Date().toISOString(),
          via: 'websocket'
        },
        timestamp: new Date().toISOString()
      };

      // Add to graph
      this.addNode(chatNode);

      // Update all agent slice files
      this.updateAllAgentSliceFiles();

      // Broadcast to all clients
      this.broadcastApiMessage('resourceChanged', {
        url: '/~/chat',
        message: 'New chat message added via WebSocket',
        timestamp: new Date().toISOString()
      });

      // Send confirmation to the sender
      this.sendToClient(client.id, {
        type: 'chatMessageSent',
        messageId,
        timestamp: new Date().toISOString(),
        message: 'Chat message sent successfully'
      });

      // Broadcast the new message to all subscribed clients
      this.broadcastToChannel('chat', {
        type: 'newChatMessage',
        messageId,
        agentName,
        content,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      this.logBusinessError('Error handling WebSocket chat message:', error);
      this.sendToClient(client.id, {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: 'Failed to send chat message',
        error: error.message
      });
    }
  }

  // ========== API Broadcast Methods ==========

  broadcastApiMessage(messageType: string, data: any, filter?: (client: any) => boolean): void {
    const messageSpec = wsApi[messageType as keyof typeof wsApi];
    if (!messageSpec) {
      throw new Error(`Cannot broadcast: message type '${messageType}' not found in wsApi`);
    }

    const message = {
      type: messageSpec.type,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.broadcast(message, filter);
  }

  broadcastToApiChannel(channel: string, messageType: string, data: any): void {
    const messageSpec = wsApi[messageType as keyof typeof wsApi];
    if (!messageSpec) {
      throw new Error(`Cannot broadcast to channel: message type '${messageType}' not found in wsApi`);
    }

    const message = {
      type: messageSpec.type,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.broadcastToChannel(channel, message);
  }

  // ========== API Route Registration ==========

  /**
   * Register custom API routes. Override in subclasses to add routes.
   * Default implementation registers the spawn‑agent endpoint.
   */
  protected registerApiRoutes(): void {
    // Register the spawn‑agent endpoint
    this.registerRoute('POST', '/~/agents/spawn', async (request: Request) => {
      return await this.handleSpawnAgent(request);
    });
    this.logBusinessMessage('Registered spawn‑agent route: POST /~/agents/spawn');
  }

  /**
   * Handle a POST /~/agents/spawn request.
   * Parses the JSON body and delegates to spawnAgent().
   * Supports requestUid for async graph operation correlation.
   */
  private async handleSpawnAgent(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { profile, loadFiles, message, model, requestUid } = body;

      if (!profile) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required field: profile',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const result = await this.spawnAgent(profile, loadFiles, message, model, requestUid);

      return new Response(
        JSON.stringify({
          success: true,
          agentName: result.agentName,
          containerId: result.containerId,
          requestUid,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error: any) {
      this.logBusinessError('Error spawning agent:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  // ========== API Server Lifecycle ==========

  async setupApi(): Promise<void> {
    this.logBusinessMessage("Setting up API server...");

    // Register default WebSocket message handler for API messages
    this.on('websocketMessage', ({ client, message }) => {
      if (message.type && this.matchWsMessageToApi(message.type)) {
        this.handleWebSocketApiMessage(client, message);
      }
    });

    // Register default HTTP API routes
    await this.registerDefaultHttpRoutes();

    // Register custom API routes (e.g., spawn agent)
    this.registerApiRoutes();

    this.logBusinessMessage("API server setup complete");
  }

  private async registerDefaultHttpRoutes(): Promise<void> {
    const { registerDefaultHttpRoutes } = require("../utils/api/registerDefaultHttpRoutes");
    const routes = registerDefaultHttpRoutes(this.configs);
    
    this.logBusinessMessage("Registering all HTTP API routes from api.ts...");

    // First, add a health check route
    this.addRoute('GET', '/~/health', async (request: Request) => {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Testeranto API server is running'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.logBusinessMessage("Registered health check route: GET /~/health");

    // Register all routes from the API object
    for (const [endpointKey, endpoint] of Object.entries(API)) {
      const method = endpoint.method;
      const path = endpoint.path;

      // Register the route with a handler that will be processed by handleHttpApiRequest
      this.addRoute(method, path, async (request: Request) => {
        return await this.handleHttpApiRequest(request, endpointKey);
      });

      this.logBusinessMessage(`Registered API route: ${method} ${path} (${endpointKey})`);
    }

    // Also register view routes from config
    if (this.configs.views) {
      for (const viewKey of Object.keys(this.configs.views)) {
        this.addRoute('GET', `/~/views/${viewKey}`, async (request: Request) => {
          return await this.handleViewRoute(request, viewKey);
        });
        this.logBusinessMessage(`Registered view route: GET /~/views/${viewKey}`);
      }
    }

    this.logBusinessMessage(`Registered ${Object.keys(API).length} API routes and ${this.configs.views ? Object.keys(this.configs.views).length : 0} view routes`);
  }



  async cleanupApi(): Promise<void> {
    this.logBusinessMessage("Cleaning up API server...");
    this.registeredRoutes.clear();
    this.registeredWsHandlers.clear();
    this.apiMiddleware = [];
    this.logBusinessMessage("API server cleaned up");
  }
}
