import fs from "fs";
import path from "path";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { HttpManager } from "./HttpManager";
import { Server_Base } from "./Server_Base";
import { Server_WS } from "./Server_WS";
import { CONTENT_TYPES, getContentType } from "./tcp";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  routes: any;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();
    this.routes = {
      'processes': {
        method: 'GET',
        handler: () => this.handleHttpGetProcesses()
      }
    };
  }

  private handleHttpGetProcesses(): Response {
    const getProcessSummary = (this as any).getProcessSummary;
    if (typeof getProcessSummary !== 'function') {
      return this.jsonResponse({
        error: 'getProcessSummary method not available',
        processes: [],
        total: 0,
        message: 'Server does not support process listing'
      }, 503);
    }

    const processSummary = getProcessSummary();
    
    if (processSummary?.error) {
      return this.jsonResponse({
        error: processSummary.error,
        processes: [],
        total: 0,
        message: processSummary.message || 'Error retrieving docker processes'
      }, 503);
    }

    const formattedProcesses = (processSummary?.processes || []).map((process: any) => ({
      name: process.processId || process.containerId,
      status: process.status || process.state,
      state: process.state,
      image: process.image,
      ports: process.ports,
      exitCode: process.exitCode,
      isActive: process.isActive,
      runtime: process.runtime,
      startedAt: process.startedAt,
      finishedAt: process.finishedAt
    }));

    return this.jsonResponse({
      processes: formattedProcesses,
      total: processSummary?.total || formattedProcesses.length,
      message: processSummary?.message || 'Success'
    });
  }

  private handleHttpGetOutputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    if (!runtime || !testName) {
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getOutputFiles = (this as any).getOutputFiles;
    if (typeof getOutputFiles === 'function') {
      const outputFiles = getOutputFiles(runtime, testName); 
      return this.jsonResponse({
        runtime,
        testName,
        outputFiles: outputFiles || [],
        message: 'Success'
      });
    }

    const outputDir = path.join(process.cwd(), 'testeranto', 'reports', runtime);
    
    if (!fs.existsSync(outputDir)) {
      return this.jsonResponse({
        error: 'getOutputFiles method not available and directory not found',
        runtime,
        testName,
        outputFiles: [],
        message: 'No output files found'
      }, 404);
    }

    const files = fs.readdirSync(outputDir);
    const testFiles = files.filter((file: string) =>
      file.includes(testName.replace('/', '_').replace('.', '-'))
    );
    
    const projectRoot = process.cwd();
    const relativePaths = testFiles.map((file: string) => {
      const absolutePath = path.join(outputDir, file);
      let relativePath = path.relative(projectRoot, absolutePath);
      relativePath = relativePath.split(path.sep).join('/');
      return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    });

    return this.jsonResponse({
      runtime,
      testName,
      outputFiles: relativePaths || [],
      message: 'Success (from directory)'
    });
  }

  private handleHttpGetInputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    if (!runtime || !testName) {
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getInputFiles = (this as any).getInputFiles;
    if (typeof getInputFiles !== 'function') {
      throw new Error('getInputFiles does not exist on this instance');
    }

    const inputFiles = getInputFiles(runtime, testName);
    return this.jsonResponse({
      runtime,
      testName,
      inputFiles: inputFiles || [],
      message: 'Success'
    });
  }

  private handleHttpGetAiderProcesses(): Response {
    const handleAiderProcesses = (this as any).handleAiderProcesses;
    const getAiderProcesses = (this as any).getAiderProcesses;
    
    if (typeof handleAiderProcesses === 'function') {
      const result = handleAiderProcesses();
      return this.jsonResponse({
        aiderProcesses: result.aiderProcesses || [],
        message: result.message || 'Success'
      });
    } else if (typeof getAiderProcesses === 'function') {
      const aiderProcesses = getAiderProcesses();
      return this.jsonResponse({
        aiderProcesses: aiderProcesses || [],
        message: 'Success'
      });
    } else {
      return this.jsonResponse({
        aiderProcesses: [],
        message: 'Aider processes not available'
      });
    }
  }

  private handleHttpGetConfigs(): Response {
    if (!this.configs) {
      return this.jsonResponse({
        error: 'configs property not available',
        message: 'Server does not have configs'
      }, 503);
    }

    return this.jsonResponse({
      configs: this.configs,
      message: 'Success'
    });
  }

  private jsonResponse(data: any, status = 200): Response {
    const responseData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(responseData, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  private handleOptions(): Response {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    const serverOptions: any = {
      port,
      fetch: async (request: Request, server: any) => {
        const response = this.handleRequest(request, server);
        
        if (response instanceof Response) {
          return response;
        } else if (response && typeof response.then === 'function') {
          return await response;
        } else if (response === undefined || response === null) {
          return undefined;
        } else {
          return new Response(`Server Error: handleRequest did not return a Response`, {
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

    if (this instanceof Server_WS) {
      serverOptions.websocket = {
        open: (ws: WebSocket) => {
          (this as Server_WS).wsClients.add(ws);
          ws.send(JSON.stringify({
            type: "connected",
            message: "Connected to Process Manager WebSocket",
            timestamp: new Date().toISOString()
          }));
        },
        message: (ws: WebSocket, message: object) => {
          const data = typeof message === "string" ?
            JSON.parse(message) :
            JSON.parse(message.toString());
          if (ws && typeof ws.send === 'function') {
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

  protected handleRequest(request: Request, server?: any): Response | Promise<Response> | undefined {
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
    
    if (request.method === 'OPTIONS') {
      return this.handleOptions();
    }

    const routeHandlers: Record<string, () => Response> = {
      'processes': () => this.handleHttpGetProcesses(),
      'configs': () => this.handleHttpGetConfigs(),
      'aider-processes': () => this.handleHttpGetAiderProcesses(),
      'outputfiles': () => this.handleHttpGetOutputFiles(request, url),
      'inputfiles': () => this.handleHttpGetInputFiles(request, url),
    };

    const handler = routeHandlers[routeName];
    if (handler) {
      if (request.method !== 'GET') {
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
      return handler();
    }

    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      const nodeReq = {
        url: url.pathname,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body,
        params: match.params
      };

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

      const result = match.handler(nodeReq, response);
      if (result instanceof Response) {
        return result;
      }
      return result as Response;
    }

    return new Response(`Route not found: /~/${routeName}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    const normalizedPath = decodeURIComponent(url.pathname);

    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, normalizedPath);

    if (!filePath.startsWith(path.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
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

  router(a: any): any {
    return a;
  }
}
