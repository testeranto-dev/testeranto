// Gives the server HTTP capabilities using Bun's built-in server
// 1) serve static files from the project directory
// 2) handle HTTP requests which are defined by child classes.
////  for instance, Server_Process_Manager will define the react component.
////  So we want the Server_Process_Manager class to handle the react component and logic defined by that child class
////  These extra pages are routed under the ~ (tilde) to separate the file server from the extra commands

import fs from "fs";
import path from "path";
import { CONTENT_TYPES, getContentType } from "../tcp";
import { HttpManager } from "../HttpManager";
import { Server_Base } from "./Server_Base";
import { Server_WS } from "./Server_WS";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  routes: any;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();

    // Initialize routes
    this.routes = {
      'processes': {
        method: 'GET',
        handler: () => this.handleHttpGetProcesses()
      }
    };
  }

  private handleHttpGetProcesses(): Response {
    console.log(`[HTTP] Checking if getProcessSummary exists...`);
    // Check if getProcessSummary method exists (available in Server_Docker)
    if (typeof (this as any).getProcessSummary === 'function') {
      console.log(`[HTTP] getProcessSummary exists, calling it...`);
      const processSummary = (this as any).getProcessSummary();
      console.log(`[HTTP] getProcessSummary returned:`, processSummary ? 'has data' : 'null/undefined');

      // Check if there's an error in the process summary
      if (processSummary && processSummary.error) {
        console.log(`[HTTP] Process summary has error:`, processSummary.error);
        return new Response(JSON.stringify({
          error: processSummary.error,
          processes: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: processSummary.message || 'Error retrieving docker processes'
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Format the response to include names and statuses
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

      const responseData = {
        processes: formattedProcesses,
        total: processSummary?.total || formattedProcesses.length,
        timestamp: processSummary?.timestamp || new Date().toISOString(),
        message: processSummary?.message || 'Success'
      };

      console.log(`[HTTP] Returning response with ${formattedProcesses.length} processes`);
      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      console.log(`[HTTP] getProcessSummary does not exist on this instance`);
      console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
      console.log(`[HTTP] this keys:`, Object.keys(this));
      return new Response(JSON.stringify({
        error: 'getProcessSummary method not available',
        processes: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'Server does not support process listing'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  private handleHttpGetOutputFiles(request: Request, url: URL): Response {
    // Extract runtime and testName from query parameters
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: 'Missing runtime or testName query parameters',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log(`[HTTP] Getting output files for runtime: ${runtime}, testName: ${testName}`);

    // Check if getOutputFiles method exists (available in Server_Docker)
    if (typeof (this as any).getOutputFiles === 'function') {
      console.log(`[HTTP] getOutputFiles exists, calling it...`);
      const outputFiles = (this as any).getOutputFiles(runtime, testName);
      console.log(`[HTTP] getOutputFiles returned:`, outputFiles ? `${outputFiles.length} files` : 'null/undefined');

      const responseData = {
        runtime,
        testName,
        outputFiles: outputFiles || [],
        timestamp: new Date().toISOString(),
        message: 'Success'
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      console.log(`[HTTP] getOutputFiles does not exist on this instance`);
      // Try to read from file system as fallback
      const fs = require('fs');
      const path = require('path');
      const outputDir = path.join(
        process.cwd(),
        'testeranto',
        'reports',
        'allTests',
        'example',
        runtime
      );

      if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        // Filter files that belong to this test
        const testFiles = files.filter(file => 
          file.includes(testName.replace('/', '_').replace('.', '-'))
        );
        // Make paths relative to project root
        const projectRoot = process.cwd();
        const relativePaths = testFiles.map(file => {
          const absolutePath = path.join(outputDir, file);
          let relativePath = path.relative(projectRoot, absolutePath);
          // Normalize to forward slashes for consistency
          relativePath = relativePath.split(path.sep).join('/');
          return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        });

        const responseData = {
          runtime,
          testName,
          outputFiles: relativePaths || [],
          timestamp: new Date().toISOString(),
          message: 'Success (from directory)'
        };

        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'getOutputFiles method not available and directory not found',
          runtime,
          testName,
          outputFiles: [],
          timestamp: new Date().toISOString(),
          message: 'No output files found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  }

  private handleHttpGetInputFiles(request: Request, url: URL): Response {
    // Extract runtime and testName from query parameters
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    if (!runtime || !testName) {
      return new Response(JSON.stringify({
        error: 'Missing runtime or testName query parameters',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log(`[HTTP] Getting input files for runtime: ${runtime}, testName: ${testName}`);

    // Check if getInputFiles method exists (available in Server_Docker)
    if (typeof (this as any).getInputFiles === 'function') {
      console.log(`[HTTP] getInputFiles exists, calling it...`);
      const inputFiles = (this as any).getInputFiles(runtime, testName);
      console.log(`[HTTP] getInputFiles returned:`, inputFiles ? `${inputFiles.length} files` : 'null/undefined');

      const responseData = {
        runtime,
        testName,
        inputFiles: inputFiles || [],
        timestamp: new Date().toISOString(),
        message: 'Success'
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      console.log(`[HTTP] getInputFiles does not exist on this instance`);
      // Try to read from file system as fallback
      const fs = require('fs');
      const path = require('path');
      const inputFilePath = path.join(
        process.cwd(),
        'testeranto',
        'bundles',
        'allTests',
        runtime,
        `${testName}-inputFiles.json`
      );

      if (fs.existsSync(inputFilePath)) {
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        const inputFiles = JSON.parse(fileContent);

        const responseData = {
          runtime,
          testName,
          inputFiles: inputFiles || [],
          timestamp: new Date().toISOString(),
          message: 'Success (from file)'
        };

        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'getInputFiles method not available and file not found',
          runtime,
          testName,
          inputFiles: [],
          timestamp: new Date().toISOString(),
          message: 'No input files found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  }

  private handleHttpGetAiderProcesses(): Response {
    console.log(`[HTTP] handleHttpGetAiderProcesses() called`);

    try {
      // Check if handleAiderProcesses method exists (available in Server_Docker)
      if (typeof (this as any).handleAiderProcesses === 'function') {
        console.log(`[HTTP] handleAiderProcesses exists, calling it...`);
        const result = (this as any).handleAiderProcesses();
        console.log(`[HTTP] handleAiderProcesses returned:`, result ? `has data` : 'null/undefined');

        const responseData = {
          aiderProcesses: result.aiderProcesses || [],
          timestamp: result.timestamp || new Date().toISOString(),
          message: result.message || 'Success'
        };

        console.log(`[HTTP] Returning aider processes response with ${responseData.aiderProcesses.length} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else if (typeof (this as any).getAiderProcesses === 'function') {
        // Fallback to getAiderProcesses for backward compatibility
        console.log(`[HTTP] getAiderProcesses exists (fallback), calling it...`);
        const aiderProcesses = (this as any).getAiderProcesses();
        console.log(`[HTTP] getAiderProcesses returned:`, aiderProcesses ? `${aiderProcesses.length} processes` : 'null/undefined');

        const responseData = {
          aiderProcesses: aiderProcesses || [],
          timestamp: new Date().toISOString(),
          message: 'Success'
        };

        console.log(`[HTTP] Returning aider processes response with ${aiderProcesses?.length || 0} processes`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        console.log(`[HTTP] Neither handleAiderProcesses nor getAiderProcesses exists on this instance`);
        // Return empty array if method not available
        const responseData = {
          aiderProcesses: [],
          timestamp: new Date().toISOString(),
          message: 'Aider processes not available'
        };
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (error: any) {
      console.error(`[HTTP] Error in GET /~/aider-processes:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        aiderProcesses: [],
        timestamp: new Date().toISOString(),
        message: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  private handleHttpGetConfigs(): Response {
    console.log(`[HTTP] handleHttpGetConfigs() called`);

    try {
      console.log(`[HTTP] Checking if configs exists...`);
      // Check if configs property exists (available in Server_Base and inherited)
      if (this.configs) {
        console.log(`[HTTP] configs exists, returning it...`);
        console.log(`[HTTP] configs type:`, typeof this.configs);
        console.log(`[HTTP] configs keys:`, Object.keys(this.configs));

        const responseData = {
          configs: this.configs,
          timestamp: new Date().toISOString(),
          message: 'Success'
        };

        console.log(`[HTTP] Returning configs response`);
        return new Response(JSON.stringify(responseData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        console.log(`[HTTP] configs does not exist on this instance`);
        console.log(`[HTTP] this.constructor.name:`, this.constructor.name);
        console.log(`[HTTP] this keys:`, Object.keys(this));
        return new Response(JSON.stringify({
          error: 'configs property not available',
          timestamp: new Date().toISOString(),
          message: 'Server does not have configs'
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (error: any) {
      console.error(`[HTTP] Error in GET /~/configs:`, error);
      console.error(`[HTTP] Error stack:`, error.stack);
      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    try {
      const serverOptions: any = {
        port,
        fetch: async (request: Request, server: any) => {
          console.log(`[HTTP] Received request: ${request.method} ${request.url}`);
          try {
            console.log(`[HTTP] Calling handleRequest...`);
            // Pass the server instance to handleRequest
            const response = this.handleRequest(request, server);

            // Handle both Response and Promise<Response>
            if (response instanceof Response) {
              console.log(`[HTTP] handleRequest returned Response with status:`, response.status);
              return response;
            } else if (response && typeof response.then === 'function') {
              console.log(`[HTTP] handleRequest returned a Promise, awaiting...`);
              const awaitedResponse = await response;
              console.log(`[HTTP] Promise resolved to Response with status:`, awaitedResponse.status);
              return awaitedResponse;
            } else if (response === undefined || response === null) {
              // This might be for WebSocket upgrades that were handled by server.upgrade()
              console.log(`[HTTP] handleRequest returned undefined/null, assuming WebSocket upgrade was handled`);
              return undefined;
            } else {
              console.error(`[HTTP] handleRequest returned non-Response:`, response);
              return new Response(`Server Error: handleRequest did not return a Response`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
              });
            }
          } catch (error: any) {
            console.error(`[HTTP] Error handling request ${request.url}:`, error);
            console.error(`[HTTP] Error stack:`, error.stack);
            return new Response(`Internal Server Error: ${error.message}`, {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            });
          }
        },
        error: (error: Error) => {
          console.error(`[HTTP] Server error:`, error);
          return new Response(`Server Error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        },
      };

      // If this is a WebSocket server, add websocket configuration
      if (this instanceof Server_WS) {
        console.log(`[Server_HTTP] Adding WebSocket configuration`);
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

            // Don't send processes directly via WebSocket
            // The client will make an HTTP request when needed
            console.log("[WebSocket] Connection established, waiting for resource change notifications");
          },
          message: (ws, message) => {
            try {
              const data = typeof message === "string" ?
                JSON.parse(message) :
                JSON.parse(message.toString());
              if (ws && typeof ws.send === 'function') {
                (this as Server_WS).handleWebSocketMessage(ws, data);
              } else {
                console.error("[WebSocket] Invalid WebSocket instance in message handler");
              }
            } catch (error) {
              console.error("[WebSocket] Error parsing message:", error);
              if (ws && typeof ws.send === 'function') {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Invalid JSON message",
                  timestamp: new Date().toISOString()
                }));
              }
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
      console.log(`[HTTP] Server URL: http://localhost:${port}/~/processes`);
    } catch (error: any) {
      console.error(`[HTTP] Failed to start server:`, error);
      throw error;
    }
  }

  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }

  protected handleRequest(request: Request, server?: any): Response | Promise<Response> | undefined {
    const url = new URL(request.url);
    console.log(`[Server_HTTP] handleRequest(${url.pathname}) from ${request.url}`);

    // Log all headers for debugging
    console.log(`[Server_HTTP] Request method: ${request.method}`);

    // Check if this is a WebSocket upgrade request
    // Note: When websocket configuration is provided to Bun.serve(),
    // we need to handle WebSocket upgrades explicitly
    if (request.headers.get("upgrade") === "websocket") {
      console.log(`[Server_HTTP] WebSocket upgrade request detected for path: ${url.pathname}`);

      // Check if this is a Server_WS instance (has websocket configuration)
      if (this instanceof Server_WS && server) {
        console.log(`[Server_HTTP] Upgrading to WebSocket`);
        // Upgrade the request to a WebSocket connection
        // This returns true if the upgrade was successful
        const success = server.upgrade(request);
        if (success) {
          console.log(`[Server_HTTP] WebSocket upgrade successful`);
          // Return undefined to indicate we've handled the upgrade
          return undefined;
        } else {
          console.error(`[Server_HTTP] WebSocket upgrade failed`);
          return new Response("WebSocket upgrade failed", { status: 500 });
        }
      } else {
        console.log(`[Server_HTTP] WebSocket not supported`);
        return new Response("WebSocket not supported", { status: 426 });
      }
    }

    // Check if this is a route request (starts with /~/)
    if (url.pathname.startsWith("/~/")) {
      console.log(`[Server_HTTP] Matched route pattern: ${url.pathname}`);
      return this.handleRouteRequest(request, url);
    } else {
      console.log(`[Server_HTTP] Serving static file: ${url.pathname}`);
      // Otherwise serve static files
      return this.serveStaticFile(request, url);
    }
  }

  private handleRouteRequest(request: Request, url: URL): Response {
    const routeName = url.pathname.slice(3); // Remove "/~/"
    console.log(`[HTTP] Handling route: /~/${routeName}, method: ${request.method}, full pathname: ${url.pathname}`);

    // Special handling for /processes route
    if (routeName === 'processes') {
      console.log(`[HTTP] Matched /processes route`);
      if (request.method === 'GET') {
        console.log(`[HTTP] Handling GET /~/processes`);
        console.log(`[HTTP] Checking if handleHttpGetProcesses exists:`, typeof this.handleHttpGetProcesses);
        if (typeof this.handleHttpGetProcesses === 'function') {
          console.log(`[HTTP] Calling handleHttpGetProcesses`);
          return this.handleHttpGetProcesses();
        } else {
          console.error(`[HTTP] handleHttpGetProcesses is not a function`);
          return new Response(`Server Error: handleHttpGetProcesses not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      } else if (request.method === 'OPTIONS') {
        // Handle CORS preflight request
        console.log(`[HTTP] Handling OPTIONS /~/processes`);
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      } else {
        // Return 405 Method Not Allowed for other methods
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
    }

    // Special handling for /configs route
    if (routeName === 'configs') {
      console.log(`[HTTP] Matched /configs route`);
      if (request.method === 'GET') {
        console.log(`[HTTP] Handling GET /~/configs`);
        console.log(`[HTTP] Checking if handleHttpGetConfigs exists:`, typeof this.handleHttpGetConfigs);
        if (typeof this.handleHttpGetConfigs === 'function') {
          console.log(`[HTTP] Calling handleHttpGetConfigs`);
          return this.handleHttpGetConfigs();
        } else {
          console.error(`[HTTP] handleHttpGetConfigs is not a function`);
          return new Response(`Server Error: handleHttpGetConfigs not found`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      } else if (request.method === 'OPTIONS') {
        // Handle CORS preflight request
        console.log(`[HTTP] Handling OPTIONS /~/configs`);
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      } else {
        // Return 405 Method Not Allowed for other methods
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/configs`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
    }

    // Special handling for /outputfiles route
    if (routeName === 'outputfiles') {
      console.log(`[HTTP] Matched /outputfiles route`);
      if (request.method === 'GET') {
        console.log(`[HTTP] Handling GET /~/outputfiles`);
        return this.handleHttpGetOutputFiles(request, url);
      } else if (request.method === 'OPTIONS') {
        // Handle CORS preflight request
        console.log(`[HTTP] Handling OPTIONS /~/outputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      } else {
        // Return 405 Method Not Allowed for other methods
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/outputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
    }

    // Special handling for /aider-processes route
    if (routeName === 'aider-processes') {
      console.log(`[HTTP] Matched /aider-processes route`);
      if (request.method === 'GET') {
        console.log(`[HTTP] Handling GET /~/aider-processes`);
        return this.handleHttpGetAiderProcesses();
      } else if (request.method === 'OPTIONS') {
        // Handle CORS preflight request
        console.log(`[HTTP] Handling OPTIONS /~/aider-processes`);
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      } else {
        // Return 405 Method Not Allowed for other methods
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/aider-processes`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
    }

    // Special handling for /inputfiles route
    if (routeName === 'inputfiles') {
      console.log(`[HTTP] Matched /inputfiles route`);
      if (request.method === 'GET') {
        console.log(`[HTTP] Handling GET /~/inputfiles`);
        return this.handleHttpGetInputFiles(request, url);
      } else if (request.method === 'OPTIONS') {
        // Handle CORS preflight request
        console.log(`[HTTP] Handling OPTIONS /~/inputfiles`);
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      } else {
        // Return 405 Method Not Allowed for other methods
        console.log(`[HTTP] Method not allowed: ${request.method} for /~/inputfiles`);
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
    }

    // Use HttpManager to match the route
    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      console.log(`[HTTP] Found route match for ${routeName}`);
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
    console.log(`[HTTP] No route found for: /~/${routeName}`);
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
