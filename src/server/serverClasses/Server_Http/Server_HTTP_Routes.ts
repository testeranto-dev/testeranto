import fs from 'fs';
import path from 'path';
import { stakeholderHttpAPI } from "../../../api/stakeholderHttp";
import { handleRoutePure } from "./handleRoutePure";


// Helper to extract route name from API path
const extractRouteNameFromPath = (path: string): string => {
  // Remove leading slash if present
  return path.startsWith('/') ? path.substring(1) : path;
};

export class Server_HTTP_Routes {
  constructor(private server: any) { }

  async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    try {
      // Handle API endpoints for graph data using API definitions
      const stakeholderApi = stakeholderHttpAPI;

      // Check for graph-data API endpoint
      const graphDataApiRoute = extractRouteNameFromPath(stakeholderApi.getGraphData.path);
      if (routeName === graphDataApiRoute) {
        return await this.handleGraphDataApi(request);
      }

      // Check for graph-data.json static file
      const graphDataJsonRoute = extractRouteNameFromPath(stakeholderApi.getGraphDataJson.path);
      if (routeName === graphDataJsonRoute) {
        return await this.handleGraphDataJson(request);
      }

      // Fall back to the pure route handler
      return handleRoutePure(routeName, request, url, this.server);
    } catch (error) {
      console.error('[Server_HTTP_Routes] Error handling route:', error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async handleGraphDataApi(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();

    // Validate against stakeholderHttpAPI.getGraphData
    if (method !== stakeholderHttpAPI.getGraphData.method) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const graphData = await this.loadGraphData();
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data: graphData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGraphDataJson(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();

    // Validate against stakeholderHttpAPI.getGraphDataJson
    if (method !== stakeholderHttpAPI.getGraphDataJson.method) {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const graphData = await this.loadGraphData();
      return new Response(JSON.stringify(graphData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to load graph data',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async loadGraphData(): Promise<any> {
    try {
      const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');
      const graphDataPath = path.join(reportsDir, 'graph-data.json');

      if (fs.existsSync(graphDataPath)) {
        const data = await fs.promises.readFile(graphDataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      // If any error occurs, return empty structure
    }

    // Return empty structure if no data found or any error occurred
    return this.getEmptyGraphData();
  }

  private getEmptyGraphData(): any {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        featureGraph: { nodes: [], edges: [] },
        fileTreeGraph: { nodes: [], edges: [] },
        vizConfig: {}
      }
    };
  }
}
