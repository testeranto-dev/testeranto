import { API, wsApi, matchApiRoute } from "../../../../api";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_WS_HTTP } from "./Server_WS_HTTP";
import { matchWsMessageToApi } from "../utils/api/matchWsMessageToApi";
import { handleHttpApiRequest as handleHttpApiRequestUtil } from "../utils/api/handleHttpApiRequest";
import { handleDefaultApiRequest as handleDefaultApiRequestUtil } from "../utils/api/handleDefaultApiRequest";
import { handleWebSocketApiMessage as handleWebSocketApiMessageUtil } from "./utils/handleWebSocketApiMessage";
import { handleWebSocketChatMessage as handleWebSocketChatMessageUtil } from "./utils/api/handleWebSocketChatMessage";
import { broadcastApiMessage as broadcastApiMessageUtil } from "./utils/api/broadcastApiMessage";
import { broadcastToApiChannel as broadcastToApiChannelUtil } from "./utils/api/broadcastToApiChannel";
import { validateHttpApiRequest as validateHttpApiRequestUtil } from "./utils/api/validateHttpApiRequest";
import { createStandardRequest as createStandardRequestUtil } from "./utils/api/createStandardRequest";
import { registerDefaultHttpRoutes as registerDefaultHttpRoutesUtil } from "../utils/api/registerDefaultHttpRoutes";
import { setupApi as setupApiUtil } from "./utils/api/setupApi";
import { cleanupApi as cleanupApiUtil } from "./utils/api/cleanupApi";

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
  protected abstract handleLaunchAiderForTest(request: Request): Promise<Response>;

  // ========== HTTP API Request Handling ==========

  private async handleHttpApiRequest(request: Request, endpointKey: string): Promise<Response> {
    return handleHttpApiRequestUtil(
      request,
      endpointKey,
      this.middlewares,
      this.registeredRoutes,
      (req, key) => this.handleDefaultApiRequest(req, key),
      (msg, err) => this.logBusinessError(msg, err),
    );
  }

  private async handleDefaultApiRequest(request: Request, endpointKey: string): Promise<Response> {
    return handleDefaultApiRequestUtil(
      request,
      endpointKey,
      this.configs,
      this.mode,
      this.isRunning,
      this.startedAt,
      (req) => this.handleFilesRoute(req),
      (req) => this.handleProcessRoute(req),
      (req) => this.handleAiderRoute(req),
      (req) => this.handleRuntimeRoute(req),
      (req) => this.handleAgentsRoute(req),
      (req, agentName) => this.handleAgentSliceRoute(req, agentName),
      (req) => this.handleAllViewsRoute(req),
      (req, viewName) => this.handleViewRoute(req, viewName),
      (req) => this.handlePostChatMessage(req),
      (req) => this.handleGetChatHistory(req),
      (req) => this.handleLaunchAiderForTest(req),
      (nodeId, label, containerId, serviceName) => this.openProcessTerminal(nodeId, label, containerId, serviceName),
    );
  }

  // ========== WebSocket API Message Handling ==========

  protected async handleWebSocketApiMessage(client: any, message: any): Promise<void> {
    return handleWebSocketApiMessageUtil(
      client,
      message,
      this.registeredWsHandlers,
      (clientId, data) => this.sendToClient(clientId, data),
      (msg, err) => this.logBusinessError(msg, err),
    );
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
    return validateHttpApiRequestUtil(request);
  }

  // ========== Utility Methods ==========

  private createStandardRequest(internalRequest: any): Request {
    return createStandardRequestUtil(internalRequest);
  }

  private matchWsMessageToApi(type: string): string | null {
    return matchWsMessageToApi(type);
  }

  private async handleWebSocketChatMessage(client: any, message: any): Promise<void> {
    return handleWebSocketChatMessageUtil(
      client,
      message,
      (node) => this.addNode(node),
      () => this.updateAllAgentSliceFiles(),
      (messageType, data) => this.broadcastApiMessage(messageType, data),
      (clientId, data) => this.sendToClient(clientId, data),
      (channel, data) => this.broadcastToChannel(channel, data),
      (msg, err) => this.logBusinessError(msg, err),
    );
  }

  // ========== API Broadcast Methods ==========

  broadcastApiMessage(messageType: string, data: any, filter?: (client: any) => boolean): void {
    broadcastApiMessageUtil(
      messageType,
      data,
      (message, filterArg) => this.broadcast(message, filterArg),
      (msg, err) => this.logBusinessError(msg, err),
    );
  }

  broadcastToApiChannel(channel: string, messageType: string, data: any): void {
    broadcastToApiChannelUtil(
      channel,
      messageType,
      data,
      (ch, msg) => this.broadcastToChannel(ch, msg),
      (msg, err) => this.logBusinessError(msg, err),
    );
  }

  // ========== API Route Registration ==========

  /**
   * Register custom API routes. Override in subclasses to add routes.
   * Default implementation registers the spawn‑agent endpoint.
   */
  protected registerApiRoutes(): void {
    // The spawn‑agent endpoint is now defined in api.ts and registered
    // via registerDefaultHttpRoutes(). No custom route needed.
    this.logBusinessMessage('Spawn‑agent route is defined in api.ts');
  }

  async setupApi(): Promise<void> {
    await setupApiUtil(
      (event, handler) => this.on(event, handler),
      (type) => this.matchWsMessageToApi(type),
      (client, message) => this.handleWebSocketApiMessage(client, message),
      (method, path, handler) => this.addRoute(method, path, handler),
      (request, endpointKey) => this.handleHttpApiRequest(request, endpointKey),
      (request, viewName) => this.handleViewRoute(request, viewName),
      this.configs,
      (msg) => this.logBusinessMessage(msg),
    );
  }

  async cleanupApi(): Promise<void> {
    cleanupApiUtil(
      this.registeredRoutes,
      this.registeredWsHandlers,
      this.apiMiddleware,
      (msg) => this.logBusinessMessage(msg),
    );
  }
}