import { API } from "../../api";
import type { AllTestResults, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import type { Server_Graph } from "./Server_Graph";
import { handleAgentRouteUtil } from "./Server_Http/agentRouteUtils";
import { handleAddChatMessageUtil } from "./Server_Http/chatMessageUtils";
import { generateTerminalScript } from "./Server_Http/generateTerminalScript";
import { handleGetViewsUtil } from "./Server_Http/handleGetViewsUtil.ts";
import { handleOpenProcessTerminalUtil } from "./Server_Http/handleOpenProcessTerminalUtil";
import { transformTestResultsUtil } from "./Server_Http/testResultsUtils";
import { handleUserAgentsRouteUtil } from "./Server_Http/userAgentRouteUtils";
import { Server_HTTP_Graph } from "./Server_HTTP_Graph";
import { Server_WS_HTTP } from "./Server_WS_HTTP";
import { handleGetProcessesUtil } from "./Server_Http/handleGetProcessesUtil";
import { getRouteHandlers } from "./Server_Http/utilities/getRouteHandlers";
import { handleProcessRoute } from "./Server_Http/handleProcessRoute.ts";
import { handleFilesRoute } from "./Server_Http/handleFilesRoute.ts";

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
      hostname: "0.0.0.0",
      idleTimeout: 60,
      fetch: async (request: Request, server: any) => {
        const response = await this.handleRequest(request, server);

        if (response instanceof Response) {
          return response;
        } else if (response === undefined || response === null) {
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
      },
      error: (error: Error) => {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      },
    };

    const wsThis = this as unknown as Server_WS_HTTP;
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
      this.bunServer.stop(true);
      this.bunServer = null;
    }
    await super.stop();
  }

  protected async handleRequest(
    request: Request,
    server?: any,
  ): Promise<Response | undefined> {
    const url = new URL(request.url);


    if (request.headers.get("upgrade") === "websocket") {
      if (this instanceof Server_WS_HTTP && server) {
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

    const result = await this.handleRoute(routeName, request, url);
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify({ error: "Invalid response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    const { handleRouteUtil } = await import("./Server_Http/utilities/handleRouteUtil");
    const deps = {
      handleOpenProcessTerminal: this.handleOpenProcessTerminal.bind(this),
      handleGetProcesses: this.handleGetProcesses.bind(this),
      graphManager: this.graphManager,
      handleAgentRoute: this.handleAgentRoute.bind(this),
      handleViewRoute: this.handleViewRoute.bind(this),
      handleFilesRoute: this.handleFilesRoute.bind(this),
      handleUserAgentsRoute: this.handleUserAgentsRoute.bind(this),
      handleChatRoute: this.handleChatRoute.bind(this),
      handleAddChatMessage: this.handleAddChatMessage.bind(this),
      handleProcessLogsRoute: this.handleProcessLogsRoute.bind(this),
      handleGetViews: this.handleGetViews.bind(this),
      handleViewSlice: this.handleViewSlice.bind(this),
    };
    return handleRouteUtil(routeName, request, url, deps);
  }

  // Route handler methods
  protected handleFilesRoute(): Response {
    return handleFilesRoute(this as unknown as Server_Graph);
  }


  protected async handleAgentRoute(routeName: string, request: Request): Promise<Response> {
    const server = this as any;
    return handleAgentRouteUtil(
      routeName,
      request,
      this.configs,
      this.getAgentSlice.bind(this),
      server.startAgent ? server.startAgent.bind(server) : undefined
    );
  }

  protected handleUserAgentsRoute(): Response {

    return handleUserAgentsRouteUtil(this.configs);
  }

  protected handleViewRoute(routeName: string, withGraph: boolean = false): Response {
    // Extract view name based on route prefix
    let prefixLength;
    if (withGraph) {
      // 'views-with-graph/' is 17 characters
      prefixLength = 17;
    } else {
      // 'views/' is 6 characters
      prefixLength = 6;
    }
    const viewName = routeName.slice(prefixLength);
    const viewPath = this.configs.views?.[viewName];

    if (!viewPath) {
      throw new Error(`View ${viewName} not found`);
    }

    const responseData: any = {
      viewName,
      viewPath,
      timestamp: new Date().toISOString()
    };

    if (withGraph) {
      const graphData = this.getGraphData();
      responseData.graphData = graphData;
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  protected handleChatRoute(request: Request, url: URL): Response {
    if (request.method === 'GET') {
      // Get chat history
      try {
        const graphData = this.getGraphData();
        const chatMessages = graphData.nodes.filter((node: any) =>
          node.type?.category === 'chat' && node.type?.type === 'chat_message'
        );
        return new Response(JSON.stringify({
          messages: chatMessages,
          timestamp: new Date().toISOString(),
          message: "Chat history retrieved successfully"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({
          error: "Failed to get chat history",
          message: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else if (request.method === 'POST') {
      return this.handleAddChatMessage(request);
    } else {
      return new Response(JSON.stringify({
        error: "Method not allowed",
        message: `Method ${request.method} not allowed for /~/chat`,
        timestamp: new Date().toISOString()
      }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  protected async handleOpenProcessTerminal(request: Request): Promise<Response> {
    // Check if the current instance has an openProcessTerminal method (from Server_Vscode)
    if (typeof (this as any).openProcessTerminal === 'function') {
      try {
        const body = await request.json();
        const { nodeId, label, containerId, serviceName } = body;

        if (!nodeId) {
          return new Response(JSON.stringify({
            error: "Missing required parameter: nodeId"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const result = await (this as any).openProcessTerminal(
          nodeId,
          label || 'Process',
          containerId || '',
          serviceName || ''
        );

        if (result.success) {
          return new Response(JSON.stringify({
            success: true,
            message: result.message,
            command: result.command || result.script,
            containerId: result.containerId,
            serviceName: result.serviceName
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else {
          return new Response(JSON.stringify({
            error: result.error || "Failed to open terminal",
            message: result.message
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch (error: any) {
        return new Response(JSON.stringify({
          error: "Failed to process request",
          message: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      // Fall back to the original implementation
      return handleOpenProcessTerminalUtil(
        request,
        () => (this as any).getAiderProcesses ? (this as any).getAiderProcesses() : [],
        () => this,
        generateTerminalScript
      );
    }
  }

  protected async handleGetProcesses(): Promise<Response> {
    return await handleGetProcessesUtil.call(this);
  }

  protected async handleProcessLogsRoute(request: Request): Promise<Response> {
    const body = await request.json();
    const { processId } = body;

    if (!processId) {
      return new Response(JSON.stringify({
        error: "Missing required parameter: processId"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (typeof (this as any).getProcessLogs === 'function') {
      const logs = await (this as any).getProcessLogs(processId);

      return new Response(JSON.stringify({
        success: true,
        processId,
        logs
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({
        error: "getProcessLogs method not available"
      }), {
        status: 501,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  protected async handleAddChatMessage(request: Request): Promise<Response> {
    return handleAddChatMessageUtil(request, this);
  }

  protected async handleViewSlice(request: Request, url: URL, viewKey: string): Promise<Response> {
    const sliceData = this.getViewSlice(viewKey);

    return new Response(JSON.stringify({
      viewKey,
      sliceData,
      timestamp: new Date().toISOString(),
      message: `Slice data for view ${viewKey}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  protected async handleGetViews(request: Request, url: URL): Promise<Response> {
    return handleGetViewsUtil(this.configs);
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
