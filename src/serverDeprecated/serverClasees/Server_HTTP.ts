// Gives the server HTTP capabilities using Bun's built-in server
// 1) serve static files from the project directory
// 2) handle HTTP requests which are defined by child classes.
////  for instance, Server_Process_Manager will define the react component.
////  So we want the Server_Process_Manager class to handle the react component and logic defined by that child class
////  These extra pages are routed under the ~ (tilde) to separate the file server from the extra commands

import fs from "fs";
import path from "path";
import { IMode } from "../types";
import { CONTENT_TYPES, getContentType } from "../serverManagers/tcp";
import { HttpManager } from "../serverManagers/HttpManager";
import { Server_Base } from "./Server_Base";
import { ITestconfigV2 } from "../../Types";
import { Server_WS } from "./Server_WS";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  routes: any;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();
  }

  async start(): Promise<void> {
    console.log(`[Server_HTTP] start()`);
    await super.start();
    
    // Start Bun server on port 3000
    const port = 3000;
    
    const serverOptions: any = {
      port,
      fetch: (request: Request) => {
        return this.handleRequest(request);
      },
      error: (error: Error) => {
        console.error(`[HTTP] error:`, error);
        return new Response(`Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      },
    };
    
    // If this is a WebSocket server, add websocket configuration
    if (this instanceof Server_WS) {
      serverOptions.websocket = {
        open: (ws) => {
          console.log(`[WebSocket] New connection`);
          (this as Server_WS).wsClients.add(ws);
          
          // Send initial connection message
          ws.send(JSON.stringify({
            type: "connected",
            message: "Connected to Process Manager WebSocket",
            timestamp: new Date().toISOString()
          }));

          // Immediately send current processes
          ws.send(JSON.stringify({
            type: "processes",
            data: (this as Server_WS).getProcessSummary ? 
                  (this as Server_WS).getProcessSummary() : 
                  { processes: [] },
            timestamp: new Date().toISOString()
          }));
        },
        message: (ws, message) => {
          try {
            const data = typeof message === "string" ? 
                         JSON.parse(message) : 
                         JSON.parse(message.toString());
            (this as Server_WS).handleWebSocketMessage(ws, data);
          } catch (error) {
            console.error("[WebSocket] Error parsing message:", error);
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid JSON message",
              timestamp: new Date().toISOString()
            }));
          }
        },
        close: (ws) => {
          console.log("[WebSocket] Client disconnected");
          (this as Server_WS).wsClients.delete(ws);
        },
        error: (ws, error) => {
          console.error("[WebSocket] Error:", error);
          (this as Server_WS).wsClients.delete(ws);
        },
      };
    }
    
    this.bunServer = Bun.serve(serverOptions);
    
    console.log(`[HTTP] Bun HTTP server is now listening on http://localhost:${port}`);
  }

  async stop() {
    console.log(`[Server_HTTP] stop()`);
    if (this.bunServer) {
      this.bunServer.stop();
      console.log("[HTTP] Bun HTTP server closed");
    }
    await super.stop();
  }

  protected handleRequest(request: Request): Response | Promise<Response> {
    const url = new URL(request.url);
    console.log(`[Server_HTTP] handleRequest(${url.pathname})`);

    // Check if this is a route request (starts with /~/)
    if (url.pathname.startsWith("/~/")) {
      return this.handleRouteRequest(request, url);
    } else {
      // Otherwise serve static files
      return this.serveStaticFile(request, url);
    }
  }

  private handleRouteRequest(request: Request, url: URL): Response {
    console.log(`[Server_HTTP] handleRouteRequest(${url.pathname})`);

    const routeName = url.pathname.slice(3); // Remove "/~/"
    console.log(`[HTTP] Handling route: /~/${routeName}`);

    // Use HttpManager to match the route
    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      try {
        // Convert Bun Request to Node-like request object for compatibility
        const nodeReq = {
          url: url.pathname,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body,
          params: match.params
        };
        
        // Create a response object that can be used by handlers
        const response = {
          writeHead: (status: number, headers: Record<string, string>) => {
            return new Response(null, { status, headers });
          },
          end: (body: string) => {
            return new Response(body, { 
              status: 200,
              headers: { "Content-Type": "text/plain" }
            });
          }
        };
        
        // Call the handler
        const result = match.handler(nodeReq, response);
        if (result instanceof Response) {
          return result;
        }
        // If handler returns a Response directly
        return result as Response;
      } catch (error) {
        console.error(`[HTTP] Error in route handler for /~/${routeName}:`, error);
        return new Response(`Internal Server Error: ${error}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }

    // No route found
    return new Response(`Route not found: /~/${routeName}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    console.log(`[Server_HTTP] serveStaticFile(${url.pathname})`);

    const normalizedPath = decodeURIComponent(url.pathname);

    // Check for any remaining '..' components
    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Start from the project root (current working directory)
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, normalizedPath);

    // Ensure the file is within the project root
    if (!filePath.startsWith(path.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    try {
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        // List directory contents
        const files = await fs.promises.readdir(filePath);
        
        const items = await Promise.all(
          files.map(async (file) => {
            try {
              const stat = await fs.promises.stat(path.join(filePath, file));
              const isDir = stat.isDirectory();
              const slash = isDir ? "/" : "";
              return `<li><a href="${path.join(
                normalizedPath,
                file
              )}${slash}">${file}${slash}</a></li>`;
            } catch {
              return `<li><a href="${path.join(
                normalizedPath,
                file
              )}">${file}</a></li>`;
            }
          })
        );

        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Directory listing for ${normalizedPath}</title></head>
          <body>
            <h1>Directory listing for ${normalizedPath}</h1>
            <ul>
              ${items.join("")}
            </ul>
          </body>
          </html>
        `;
        
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      } else {
        return this.serveFile(filePath);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${normalizedPath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }

  private async serveFile(filePath: string): Promise<Response> {
    console.log(`[Server_HTTP] serveFile(${filePath})`);

    const contentType = getContentType(filePath) || CONTENT_TYPES.OCTET_STREAM;

    try {
      const file = await Bun.file(filePath).arrayBuffer();
      return new Response(file, {
        status: 200,
        headers: { "Content-Type": contentType },
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${filePath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }

  // The route method is no longer abstract since we're using the routes() method
  // This is kept for backward compatibility
  router(a: any): any {
    // Default implementation does nothing
    // Inheriting classes can override if needed
    return a;
  }
}
