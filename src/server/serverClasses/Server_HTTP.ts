import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { handleOptions } from "./Server_Http/handleOptions";
import { Server_HTTP_Routes } from "./Server_Http/Server_HTTP_Routes";
import {
  serveStaticFile,
} from "./Server_Http/utils/utils";
import { Server_WS } from "./Server_WS";
import { stakeholderWsAPI } from "../../api";

declare const Bun: any;

export abstract class Server_HTTP extends Server_Base {
  protected bunServer: any | null = null;
  private routesHandler: Server_HTTP_Routes;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
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
      const wsThis = this as Server_WS;
      serverOptions.websocket = {
        open: (ws: WebSocket) => {
          (wsThis as any).wsClients?.add?.(ws);
          ws.send(
            JSON.stringify({
              type: stakeholderWsAPI.connected.type,
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
            (wsThis as any).handleWebSocketMessage?.(ws, data);
          }
        },
        close: (ws: WebSocket) => {
          (wsThis as any).wsClients?.delete?.(ws);
        },
        error: (ws: WebSocket, error: Error) => {
          (wsThis as any).wsClients?.delete?.(ws);
        },
      };
    }

    if (typeof Bun !== 'undefined') {
      this.bunServer = Bun.serve(serverOptions);
    } else {
      console.error('Bun is not available');
    }
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
      return handleOptions();
    }

    const result = this.routesHandler.handleRoute(routeName, request, url);
    // Ensure we always return a Response
    if (result instanceof Promise) {
      // Return a Response that will be resolved later
      return new Response(null, { status: 202 });
    }
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify({ error: "Invalid response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }

  // private async generateCollatedFilesTree(): Promise<Record<string, any>> {
  //   return generateCollatedFilesTree(this.configs);
  // }

  // // private addTestResultsFilesToTree(
  // //   treeRoot: Record<string, any>,
  // //   reportsDir: string,
  // // ): void {
  // //   addTestResultsFilesToTree(treeRoot, reportsDir);
  // // }

  // private getFileType(filename: string): string {
  //   return getFileType(filename);
  // }

  // // private async collectAllTestResults(): Promise<Record<string, any>> {
  // //   return collectAllTestResults(this.configs);
  // // }

  router(a: any): any {
    return a;
  }
}
