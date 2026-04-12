import { vscodeHttpAPI } from "../../api/api";
import type { AllTestResults, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { handleRoutePure } from "./Server_Http/handleRoutePure";
import * as gitHandlers from "./Server_Http/utils/gitHandlers";
import * as lockHandlers from "./Server_Http/utils/lockHandlers";
import { generateTerminalScript } from "./Server_Http/utils/routeUtils";
import * as serviceHandlers from "./Server_Http/utils/serviceHandlers";
import { Server_HTTP_Graph } from "./Server_HTTP_Graph";
import { Server_WS_HTTP } from "./Server_WS_HTTP";
import { transformTestResultsUtil } from "./utils/testResultsUtils";
import { handleAiderRoute, handleFilesRoute, handleGetViewsUtil, handleProcessRoute, handleRuntimeRoute } from "./utils/routeHandlerUtils";
import { handleAddChatMessageUtil } from "./utils/chatMessageUtils";
import { handleChatRouteUtil } from "./utils/chatRouteUtils";
import { handleOpenProcessTerminalUtil } from "./utils/httpRouteUtils";
import { handleUserAgentsRouteUtil } from "./utils/userAgentRouteUtils";
import { handleAgentRouteUtil } from "./utils/agentRouteUtils";

declare const Bun: any;

export abstract class Server_HTTP extends Server_HTTP_Graph {
  protected bunServer: any | null = null;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    const serverOptions: any = {
      port,
      hostname: "0.0.0.0", // Bind to all interfaces, not just localhost
      idleTimeout: 60,
      fetch: async (request: Request, server: any) => {
        try {
          const response = await this.handleRequest(request, server);

          if (response instanceof Response) {
            return response;
          } else if (response === undefined || response === null) {
            // This happens for successful WebSocket upgrades
            return undefined;
          } else {
            return new Response(
              `Server Error: handleRequest did not return a Response`,
              {
                status: 500,
                headers: { "Content-Type": "text/plain" },
              },
            );
          }
        } catch (error: any) {
          return new Response(`Server Error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
      error: (error: Error) => {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      },
    };

    const wsThis = this as Server_WebSocket_Http;
    serverOptions.websocket = {
      open: (ws: WebSocket) => {
        wsThis.wsClients.add(ws);
        ws.send(
          JSON.stringify({
            type: 'connected',
            message: "Connected to Process Manager WebSocket",
            timestamp: new Date().toISOString(),
          }),
        );
      },
      message: (ws: WebSocket, message: object) => {
        const data =
          typeof message === "string"
            ? JSON.parse(message)
            : JSON.parse(message.toString());
        if (ws && typeof ws.send === "function") {
          wsThis.handleWebSocketMessage(ws, data);
        }
      },
      close: (ws: WebSocket) => {
        wsThis.wsClients.delete(ws);
        wsThis.cleanupClientSubscriptions(ws);
      },
      error: (ws: WebSocket, error: Error) => {
        wsThis.wsClients.delete(ws);
        wsThis.cleanupClientSubscriptions(ws);
      },
    };

    if (typeof Bun !== 'undefined') {
      this.bunServer = Bun.serve(serverOptions);
    }
  }

  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }

  protected async handleRequest(
    request: Request,
    server?: any,
  ): Promise<Response | undefined> {
    const url = new URL(request.url);


    if (request.headers.get("upgrade") === "websocket") {
      if (this instanceof Server_WebSocket_Http && server) {
        const success = server.upgrade(request);
        if (success) {
          return undefined;
        } else {
          return new Response("WebSocket upgrade failed", { status: 500 });
        }
      } else {
        return new Response("WebSocket not supported", { status: 426 });
      }
    }

    // Handle /~/ routes (unified API for all clients)
    if (url.pathname.startsWith("/~/")) {
      return await this.handleRouteRequest(request, url);
    }
    else {
      // Serve static files for everything else - for stakeholder app
      return await this.serveStaticFile(request, url);
    }
  }

  private async handleRouteRequest(request: Request, url: URL): Promise<Response> {
    const routeName = url.pathname.slice(3);

    if (request.method === "OPTIONS") {
      return this.handleOptions();
    }

    try {
      const result = await this.handleRoute(routeName, request, url);
      // Ensure we always return a Response
      if (result instanceof Response) {
        return result;
      }
      return new Response(JSON.stringify({ error: "Invalid response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error('[Server_HTTP] Error handling route:', error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    // Route handlers
    const routeHandlers: Record<string, () => Promise<Response> | Response> = {
      files: () => this.handleFilesRoute(),
      process: () => handleProcessRoute(this.graphManager),
      aider: () => handleAiderRoute(this.graphManager),
      runtime: () => handleRuntimeRoute(this.graphManager),
      agents: () => this.handleAgentRoute('', request),
      'user-agents': () => this.handleUserAgentsRoute(),
      chat: () => this.handleChatRoute(url),
      'lock-status': () => lockHandlers.handleLockStatusRoute(this),
      down: () => serviceHandlers.handleDown(this),
      up: () => serviceHandlers.handleUp(this),
      'git/status': () => gitHandlers.handleGitStatus(),
      'git/switch-branch': () => gitHandlers.handleGitSwitchBranch(request),
      'git/commit': () => gitHandlers.handleGitCommit(request),
      'git/merge': () => gitHandlers.handleGitMerge(request),
      'git/conflicts': () => gitHandlers.handleGitConflicts(),
      'git/resolve-conflict': () => gitHandlers.handleGitResolveConflict(request),
      'open-process-terminal': () => this.handleOpenProcessTerminal(request),
      'add-chat-message': () => this.handleAddChatMessage(request),
    };

    // Handle view requests
    if (routeName === 'views' && request.method === 'GET') {
      return this.handleGetViews(request, url);
    }

    // Handle view slice requests
    if (routeName.startsWith('views/')) {
      const parts = routeName.split('/');
      if (parts.length >= 3 && parts[1] && parts[2] === 'slice') {
        const viewKey = parts[1];
        return this.handleViewSlice(request, url, viewKey);
      }
    }

    for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
      const apiDef = definition as any;
      if (apiDef.check && apiDef.check(routeName, { method: request.method })) {
        if (key === 'getAgentSlice' || key === 'launchAgent') {
          return this.handleAgentRoute(routeName, request);
        } else if (key === 'getVscodeView') {
          return this.handleVscodeViewRoute(routeName);
        } else if (key === 'getStakeholderView') {
          return this.handleStakeholderViewRoute(routeName);
        } else {
          const baseRouteName = apiDef.path.slice(3);
          const handler = routeHandlers[baseRouteName];
          if (handler) {
            return await handler();
          }
        }
      }
    }

    return handleRoutePure(routeName, request, url, this);
  }

  // Route handler methods
  private handleFilesRoute(): Response {
    return handleFilesRoute(this.graphManager);
  }


  private async handleAgentRoute(routeName: string, request: Request): Promise<Response> {
    const server = this as any;
    return handleAgentRouteUtil(
      routeName,
      request,
      this.configs,
      this.graphManager.getAgentSlice.bind(this.graphManager),
      server.startAgent ? server.startAgent.bind(server) : undefined
    );
  }

  private handleUserAgentsRoute(): Response {

    return handleUserAgentsRouteUtil(this.configs);
  }

  private handleVscodeViewRoute(routeName: string): Response {
    const viewName = routeName.slice(13);
    const viewPath = this.configs.vscodeViews?.[viewName];
    if (!viewPath) {
      throw new Error(`View ${viewName} not found`);
    }

    return new Response(JSON.stringify({
      viewName,
      viewPath,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleStakeholderViewRoute(routeName: string): Response {
    const viewName = routeName.slice(18);
    const viewPath = this.configs.stakeholderViews?.[viewName];
    if (!viewPath) {
      throw new Error(`Stakeholder view ${viewName} not found`);
    }

    const graphData = this.graphManager.getGraphManager().getGraphData();
    return new Response(JSON.stringify({
      viewName,
      viewPath,
      graphData,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleChatRoute(url: URL): Response {

    return handleChatRouteUtil();
  }

  private async handleOpenProcessTerminal(request: Request): Promise<Response> {


    return handleOpenProcessTerminalUtil(
      request,
      () => (this as any).getAiderProcesses ? (this as any).getAiderProcesses() : [],
      () => this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null,
      generateTerminalScript
    );
  }

  private async handleAddChatMessage(request: Request): Promise<Response> {

    return handleAddChatMessageUtil(request, this.graphManager);
  }

  private async handleViewSlice(request: Request, url: URL, viewKey: string): Promise<Response> {
    try {
      // Get the slice data from the graph manager
      const sliceData = this.graphManager.getViewSlice(viewKey);

      return new Response(JSON.stringify({
        viewKey,
        sliceData,
        timestamp: new Date().toISOString(),
        message: `Slice data for view ${viewKey}`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: "Failed to get view slice",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  private async handleGetViews(request: Request, url: URL): Promise<Response> {
    try {

      return handleGetViewsUtil(this.configs);
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: "Failed to get views",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  protected getCurrentTestResults(): AllTestResults {
    // Try to get test results from the server
    // This should be implemented by subclasses
    if ((this as any).getTestResults) {
      const rawResults = (this as any).getTestResults();
      return transformTestResultsUtil(rawResults, this.configs);
    }
    return {};
  }

  router(a: any): any {
    return a;
  }
}
