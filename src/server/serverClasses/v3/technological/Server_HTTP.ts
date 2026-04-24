import { Server_STDIO } from "./Server_STDIO";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

/**
 * Server_HTTP - Technological Layer (+3)
 * 
 * Extends: Server_STDIO (+2.5)
 * Extended by: Server_WS_HTTP (+4)
 * Provides: HTTP server operations using Hono with Bun.serve()
 * To be mocked in: Tests
 */
export class Server_HTTP extends Server_STDIO {
  protected app: Hono = new Hono();
  protected routes: Map<string, Map<string, (request: Request) => Promise<Response>>> = new Map();
  protected middlewares: Array<(request: Request, next: () => Promise<Response>) => Promise<Response>> = [];
  protected httpServer: any = null;
  protected port: number = 3000;
  protected hostname: string = '0.0.0.0';

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
    // Ensure routes is properly initialized as a Map
    if (!this.routes || !(this.routes instanceof Map)) {
      this.routes = new Map();
    }
    // Hono app setup is handled by Server_WS_HTTP which provides the actual HTTP server
  }

  // ========== File Operations for Server_Static ==========
  // These methods are implemented in utility files
  protected async generateViewSliceUtil(viewKey: string, viewConfig: any): Promise<void> {
    const { generateViewSliceUtil } = await import("../utils/static/generateViewSliceUtil");
    await generateViewSliceUtil(viewKey, viewConfig);
  }

  protected async writeViewHtmlFileUtil(viewKey: string, html: string): Promise<void> {
    const { writeViewHtmlFileUtil } = await import("../utils/static/writeViewHtmlFileUtil");
    await writeViewHtmlFileUtil(viewKey, html);
  }

  protected async writeViewsIndexHtmlUtil(html: string): Promise<void> {
    const { writeViewsIndexHtmlUtil } = await import("../utils/static/writeViewsIndexHtmlUtil");
    await writeViewsIndexHtmlUtil(html);
  }

  // Hono app setup is handled by Server_WS_HTTP which provides the actual HTTP server
  // No setupHonoApp method needed here

  // HTTP server lifecycle - implemented by Server_WS_HTTP with WebSocket support
  // These methods are implemented by Server_WS_HTTP which provides the actual implementation
  // No-op stubs removed - Server_WS_HTTP provides the actual implementation

  // Handle requests through Hono
  private async handleHonoRequest(request: Request): Promise<Response> {
    const { handleHonoRequest } = require("../utils/http/handleHonoRequest");
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    this.logBusinessMessage(`Handling ${method} ${path}`);
    
    const result = handleHonoRequest({ method, path, url });
    
    // Handle /~/ routes (unified API for all clients)
    if (result.isApiRoute) {
      return await this.handleRouteRequest(request, url);
    }
    
    // Handle root path - redirect to views index
    if (result.isRootPath) {
      // Check if index.html exists in testeranto/views
      const indexPath = './testeranto/views/index.html';
      const exists = await this.fileExists(indexPath);
      if (exists) {
        // Serve the index file
        const file = Bun.file(indexPath);
        return new Response(file, {
          headers: { "Content-Type": "text/html" }
        });
      }
      // If no index, return a simple message
      return new Response(
        `<html><body><h1>Testeranto Server</h1><p>Server is running. Views are available at <a href="/testeranto/views/">/testeranto/views/</a></p></body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" }
        }
      );
    }
    
    // For other paths, let Hono's static middleware handle them
    // If we reach here, it means static middleware didn't find the file
    // and we need to handle it as a fallback
    return await this.handleFallbackRequest(request, path);
  }

  private async handleRouteRequest(request: Request, url: URL): Promise<Response> {
    const { handleRouteRequest } = require("../utils/http/handleRouteRequest");
    const routeName = url.pathname.slice(3); // Remove '/~/'
    const method = request.method;
    
    this.logBusinessMessage(`Handling API route: ${method} ${routeName}`);
    
    const result = handleRouteRequest({ routeName, method, url });
    
    // Try to find a matching route handler
    const methodRoutes = this.routes.get(method);
    if (methodRoutes) {
      const handler = methodRoutes.get(`/~/` + routeName);
      if (handler) {
        return await handler(request);
      }
    }
    
    // No route matched, return 404
    return new Response(
      JSON.stringify({ 
        error: 'Not found',
        message: `No handler for ${method} ${routeName}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  private async handleFallbackRequest(request: Request, path: string): Promise<Response> {
    const { handleFallbackRequest } = require("../utils/http/handleFallbackRequest");
    const result = handleFallbackRequest({ path, method: request.method });
    
    // All static files should be handled by the static middleware
    // If we reach here, it's a 404
    return new Response(
      JSON.stringify({ 
        error: 'Not found',
        message: `Path ${path} not found`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  private async serveFile(filePath: string): Promise<Response> {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    
    if (!exists) {
      return new Response('File not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'text/plain';
    
    if (ext === 'html') contentType = 'text/html';
    else if (ext === 'css') contentType = 'text/css';
    else if (ext === 'js') contentType = 'application/javascript';
    else if (ext === 'json') contentType = 'application/json';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    
    return new Response(file, {
      headers: { "Content-Type": contentType }
    });
  }

  // Routing - add routes to both Hono app and internal map
  addRoute(method: string, path: string, handler: (request: Request) => Promise<Response>): void {
    // Add to internal map for API route handling
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
    
    // Also add to Hono app
    const methodLower = method.toLowerCase();
    switch (methodLower) {
      case 'get':
        this.app.get(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
      case 'post':
        this.app.post(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
      case 'put':
        this.app.put(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
      case 'delete':
        this.app.delete(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
      case 'patch':
        this.app.patch(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
      default:
        this.app.all(path, async (c) => {
          const response = await handler(c.req);
          return response;
        });
        break;
    }
    
    this.logBusinessMessage(`Added route ${method} ${path}`);
  }

  removeRoute(method: string, path: string): void {
    // Remove from internal map
    const methodRoutes = this.routes.get(method);
    if (methodRoutes) {
      methodRoutes.delete(path);
      this.logBusinessMessage(`Removed route ${method} ${path}`);
    }
    
    // Note: Hono doesn't have a built-in way to remove routes
    // We would need to recreate the app or use a different approach
    // For now, we just remove from the internal map
  }

  // Middleware
  useMiddleware(middleware: (request: Request, next: () => Promise<Response>) => Promise<Response>): void {
    this.middlewares.push(middleware);
    
    // Also add to Hono app
    this.app.use(async (c, next) => {
      const response = await middleware(c.req, async () => {
        await next();
        return c.res;
      });
      return response || c.res;
    });
    
    this.logBusinessMessage('Middleware added');
  }

  // Note: generateViewHtml is inherited from Server_Static
  // Note: generateViewsIndexHtml is inherited from Server_Static
  // Note: generateViewBundle needs to be available - it's in Server_Static
}
