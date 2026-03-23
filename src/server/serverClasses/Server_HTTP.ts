import glob from "glob";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { HttpManager } from "./Server_Http/HttpManager";
import { Server_HTTP_Routes } from "./Server_Http/utils/Server_HTTP_Routes";
import { Server_HTTP_utils } from "./Server_Http/utils/Server_HTTP_utils";
import { Server_WS } from "./Server_WS";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  private routesHandler: Server_HTTP_Routes;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();
    this.routesHandler = new Server_HTTP_Routes(this);
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    const serverOptions: any = {
      port,
      idleTimeout: 60,
      fetch: async (request: Request, server: any) => {
        const response = this.handleRequest(request, server);

        if (response instanceof Response) {
          return response;
        } else if (response && typeof response.then === "function") {
          return await response;
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

    if (this instanceof Server_WS) {
      serverOptions.websocket = {
        open: (ws: WebSocket) => {
          (this as Server_WS).wsClients.add(ws);
          ws.send(
            JSON.stringify({
              type: "connected",
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
            (this as Server_WS).handleWebSocketMessage(ws, data);
          }
        },
        close: (ws: WebSocket) => {
          (this as Server_WS).wsClients.delete(ws);
        },
        error: (ws: WebSocket, error: Error) => {
          (this as Server_WS).wsClients.delete(ws);
        },
      };
    }

    this.bunServer = Bun.serve(serverOptions);
  }

  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }

  protected handleRequest(
    request: Request,
    server?: any,
  ): Response | Promise<Response> | undefined {
    const url = new URL(request.url);

    if (request.headers.get("upgrade") === "websocket") {
      if (this instanceof Server_WS && server) {
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

    if (url.pathname.startsWith("/~/")) {
      return this.handleRouteRequest(request, url);
    } else {
      return this.serveStaticFile(request, url);
    }
  }

  private handleRouteRequest(request: Request, url: URL): Response {
    const routeName = url.pathname.slice(3);

    if (request.method === "OPTIONS") {
      return Server_HTTP_utils.handleOptions();
    }

    return this.routesHandler.handleRoute(routeName, request, url);
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return Server_HTTP_utils.serveStaticFile(request, url, this.configs);
  }

  private async generateCollatedFilesTree(): Promise<Record<string, any>> {
    return Server_HTTP_utils.generateCollatedFilesTree(this.configs);
  }

  private addTestResultsFilesToTree(
    treeRoot: Record<string, any>,
    reportsDir: string,
  ): void {
    Server_HTTP_utils.addTestResultsFilesToTree(treeRoot, reportsDir);
  }

  private getFileType(filename: string): string {
    return HttpManager.getFileType(filename);
  }

  private async collectAllTestResults(): Promise<Record<string, any>> {
    return Server_HTTP_utils.collectAllTestResults(this.configs);
  }

  router(a: any): any {
    return a;
  }
}
