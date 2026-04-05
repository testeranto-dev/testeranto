import { resetGraphDataPure } from "./utils/resetGraphDataPure";
import fs from 'fs';
import path from 'path';
import type { AllTestResults, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { handleOptions } from "./Server_Http/handleOptions";
import { Server_HTTP_Routes } from "./Server_Http/Server_HTTP_Routes";
import { serveStaticFile } from "./Server_Http/utils/utils";
import { Server_WS } from "./Server_WS";
import { stakeholderWsAPI, stakeholderHttpAPI } from "../../api";
import { GraphManager } from "../graph/index";
import { Palette } from "../../colors";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";

declare const Bun: any;

export abstract class Server_HTTP extends Server_Base {
  protected bunServer: any | null = null;
  private routesHandler: Server_HTTP_Routes;
  protected graphManager: GraphManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    console.log('[Server_HTTP] Constructor called with configs:',
      configs ? `has runtimes: ${Object.keys(configs.runtimes || {}).length}` : 'configs is null/undefined');
    this.routesHandler = new Server_HTTP_Routes(this);
    this.graphManager = new GraphManager(
      process.cwd(),
      configs.featureIngestor,
      configs
    );
  }

  async start(): Promise<void> {
    await super.start();

    // Generate and save graph data immediately on startup
    console.log('[Server_HTTP] Generating initial graph data...');
    try {
      const graphData = await this.resetGraphData();
      console.log('[Server_HTTP] Initial graph data generated successfully');
    } catch (error) {
      console.error('[Server_HTTP] Error generating initial graph data:', error);
    }

    const port = 3000;

    const serverOptions: any = {
      port,
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
          console.error('[Server_HTTP] Error in fetch handler:', error);
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
    // Save graph before stopping
    if (this.graphManager) {
      this.graphManager.saveGraph();
    }

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

    console.log(`[Server_HTTP] Handling request: ${request.method} ${url.pathname}`);

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

    // Handle /~/ routes (vscode API) - for VS Code extension
    if (url.pathname.startsWith("/~/")) {
      return await this.handleRouteRequest(request, url);
    }
    // Handle /api/ routes for stakeholder app in development mode
    else if (url.pathname.startsWith("/api/")) {
      return await this.handleStakeholderApiRequest(request, url);
    }
    else {
      // Serve static files for everything else - for stakeholder app
      return await this.serveStaticFile(request, url);
    }
  }

  private async handleRouteRequest(request: Request, url: URL): Promise<Response> {
    const routeName = url.pathname.slice(3);

    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      const result = await this.routesHandler.handleRoute(routeName, request, url);
      // Ensure we always return a Response
      if (result instanceof Response) {
        return result;
      }
      return new Response(JSON.stringify({ error: "Invalid response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
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

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }


  public async resetGraphData(): Promise<any> {
    console.log('[Server_HTTP] resetGraphData() called');

    // Use the pure stateless function
    const fullGraphData = await resetGraphDataPure(
      this.graphManager,
      this.configs,
      this.getCurrentTestResults.bind(this)
    );

    console.log(`[Server_HTTP] Saving full graph data structure in unified format...`);
    // Also save a standalone graph-data.json file for static mode
    this.saveGraphDataForStaticMode(fullGraphData);

    return fullGraphData;
  }

  // Save graph data for static mode access
  private saveGraphDataForStaticMode(fullGraphData: any): void {
    try {
      const projectRoot = process.cwd();
      const filePath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
      const dir = path.dirname(filePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[Server_HTTP] Created directory: ${dir}`);
      }

      // Create a standalone graph data object for static mode in unified format
      const staticGraphData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          unifiedGraph: fullGraphData.unifiedGraph || { nodes: [], edges: [] },
          vizConfig: fullGraphData.vizConfig || {
            projection: {
              xAttribute: 'status',
              yAttribute: 'priority',
              xType: 'categorical',
              yType: 'continuous',
              layout: 'grid'
            },
            style: {
              nodeSize: 10,
              nodeColor: Palette.rust,
              nodeShape: 'circle'
            }
          },
          configs: fullGraphData.configs || {}
        }
      };

      // Always write the file on startup (as intended)
      console.log(`[Server_HTTP] Writing graph-data.json to ${filePath}`);
      console.log(`[Server_HTTP] Graph data structure keys:`, Object.keys(staticGraphData.data));
      if (staticGraphData.data.unifiedGraph) {
        console.log(`[Server_HTTP] unifiedGraph has ${staticGraphData.data.unifiedGraph.nodes?.length || 0} nodes, ${staticGraphData.data.unifiedGraph.edges?.length || 0} edges`);
      }

      fs.writeFileSync(filePath, JSON.stringify(staticGraphData, null, 2), 'utf-8');
      console.log(`[Server_HTTP] Successfully saved graph-data.json (${fs.statSync(filePath).size} bytes)`);

      // Verify the file was written correctly
      try {
        const writtenContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(writtenContent);
        console.log(`[Server_HTTP] Verification: file contains ${parsed.data?.unifiedGraph?.nodes?.length || 0} nodes`);
      } catch (verifyError) {
        console.error(`[Server_HTTP] Failed to verify written file:`, verifyError);
      }
    } catch (error) {
      console.error('[Server_HTTP] Error saving static graph data:', error);
    }
  }

  protected getCurrentTestResults(): AllTestResults {
    // Try to get test results from the server
    // This should be implemented by subclasses
    if ((this as any).getTestResults) {
      const rawResults = (this as any).getTestResults();

      // According to SOUL.md: no guessing, no fallbacks
      // We need to validate the data structure and transform it correctly

      // If rawResults is already in the expected format, return it
      if (rawResults && typeof rawResults === 'object' && !Array.isArray(rawResults)) {
        // Filter to only include configKeys that exist in config runtimes
        const filtered: AllTestResults = {};
        for (const [configKey, runtimeResults] of Object.entries(rawResults)) {
          // Only include if configKey exists in config runtimes
          if (this.configs?.runtimes?.[configKey]) {
            filtered[configKey] = runtimeResults as any;
          } else {
            console.warn(`[Server_HTTP] Skipping configKey '${configKey}' not present in config runtimes`);
          }
        }
        return filtered;
      }

      // If rawResults is an array, transform it to the expected format
      if (Array.isArray(rawResults)) {
        console.log('[Server_HTTP] Transforming array test results to expected format');
        console.log(`[Server_HTTP] Array length: ${rawResults.length}`);
        const transformed: AllTestResults = {};
        for (const item of rawResults) {
          if (item && typeof item === 'object') {
            // Try to extract testName from various possible fields
            let testName = item.testName || item.name || item.file || item.filePath;
            // If testName is still undefined, skip this item
            if (!testName) {
              console.warn('[Server_HTTP] Item missing testName, skipping:', item);
              continue;
            }
            // Extract configKey - DO NOT use runtime field (deprecated)
            let configKey = item.configKey;
            // If configKey is missing, skip this item (no guessing)
            if (!configKey) {
              console.warn(`[Server_HTTP] Item missing configKey, skipping:`, item);
              continue;
            }
            // Only include configKey that exists in config runtimes
            if (!this.configs?.runtimes?.[configKey]) {
              console.warn(`[Server_HTTP] Skipping item with configKey '${configKey}' not present in config runtimes`);
              continue;
            }
            if (!transformed[configKey]) {
              transformed[configKey] = {};
            }
            // Use testName as key
            transformed[configKey][testName] = {
              ...item,
              configKey,
              testName
            };
          }
        }
        // Check if we have any results after transformation
        if (Object.keys(transformed).length > 0) {
          console.log(`[Server_HTTP] Transformed array into ${Object.keys(transformed).length} configs`);
          return transformed;
        } else {
          console.warn('[Server_HTTP] Transformation resulted in empty object');
        }
      }

      // Otherwise, we need to transform from getTestResultsPure format
      // But according to SOUL.md, we shouldn't guess
      // For now, return empty object to avoid processing invalid data
      console.error('[Server_HTTP] getCurrentTestResults: raw results are not in expected format');
      console.error('[Server_HTTP] Expected: object with configKey keys matching config');
      console.error('[Server_HTTP] Got:', typeof rawResults, Array.isArray(rawResults) ? 'array' : 'object');
      return {};
    }
    return {};
  }

  protected generateFeatureTree(): any {
    // Generate a tree structure from features
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };

    const featureNodes = graphData.nodes.filter((node: any) => node.type === 'feature');
    const featureEdges = graphData.edges.filter((edge: any) =>
      edge.attributes.type === 'dependsUpon' || edge.attributes.type === 'blocks'
    );

    const tree: any = {};

    featureNodes.forEach((node: any) => {
      tree[node.id] = {
        ...node,
        children: [],
        parents: []
      };
    });

    featureEdges.forEach((edge: any) => {
      if (edge.attributes.type === 'dependsUpon') {
        // source depends on target
        if (tree[edge.source]) {
          tree[edge.source].parents.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].children.push(edge.source);
        }
      } else if (edge.attributes.type === 'blocks') {
        // source blocks target
        if (tree[edge.source]) {
          tree[edge.source].children.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].parents.push(edge.source);
        }
      }
    });

    return tree;
  }

  protected generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  protected generateFileTreeGraph(): any {
    // Generate a file tree graph based on the project structure
    // Only include: entry files, input files used by entry files, and feature references (URLs or files)
    const projectRoot = process.cwd();
    const testResults = this.getCurrentTestResults();

    // Use the pure stateless function
    return generateFileTreeGraphPure(projectRoot, this.configs, testResults);
  }

  // Handle markdown file changes by updating the specific file in the graph
  public async handleMarkdownFileChange(filePath: string): Promise<void> {
    const { handleMarkdownFileChange } = await import('../stakeholder/markdown');
    const result = await handleMarkdownFileChange(filePath, this.graphManager);

    // Broadcast update to WebSocket clients if we're a WS server
    if (this instanceof Server_WS && result) {
      const wsThis = this as Server_WS;
      wsThis.broadcast({
        type: 'graphUpdated',
        message: `Graph updated due to markdown file change: ${filePath}`,
        timestamp: new Date().toISOString(),
        data: {
          unifiedGraph: result
        }
      });
    }
  }

  // Write markdown file with updated frontmatter using stakeholder utilities
  public async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    const { updateMarkdownFile } = await import('../stakeholder/markdown');
    await updateMarkdownFile(filePath, frontmatterData, contentBody);
    console.log(`[Server_HTTP] Updated markdown file: ${filePath}`);
  }

  private async handleStakeholderApiRequest(request: Request, url: URL): Promise<Response> {
    const routeName = url.pathname.slice(5); // Remove '/api/'

    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      // Check if the route matches any defined API endpoint
      const endpoint = Object.values(stakeholderHttpAPI).find(
        ep => ep.path === `/api/${routeName}`
      );

      if (!endpoint) {
        return new Response(JSON.stringify({
          error: "Not found",
          message: `API endpoint ${routeName} not found`
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if the HTTP method matches
      if (request.method !== endpoint.method) {
        return new Response(JSON.stringify({
          error: "Method not allowed",
          message: `Method ${request.method} not allowed for ${routeName}. Expected ${endpoint.method}`
        }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle the specific endpoint
      switch (routeName) {
        case 'graph-update':
          return await this.handlePostGraphUpdate(request, url);
        default:
          return new Response(JSON.stringify({
            error: "Not implemented",
            message: `API endpoint ${routeName} is defined but not implemented`
          }), {
            status: 501,
            headers: { "Content-Type": "application/json" },
          });
      }
    } catch (error) {
      console.error('[Server_HTTP] Error handling stakeholder API request:', error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async handlePostGraphUpdate(request: Request, url: URL): Promise<Response> {
    const { handlePostGraphUpdate } = await import('../stakeholder/handlers');
    const broadcast = this instanceof Server_WS ? (this as Server_WS).broadcast.bind(this) : undefined;
    return handlePostGraphUpdate(request, this.graphManager, broadcast);
  }

  router(a: any): any {
    return a;
  }
}
