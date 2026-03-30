import { handleRoutePure } from "./handleRoutePure";
import fs from 'fs';
import path from 'path';

export class Server_HTTP_Routes {
  constructor(private server: any) { }

  async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    // Handle API endpoints for graph data
    if (routeName === '/api/graph-data') {
      return this.handleGraphDataApi(request);
    }
    
    // Handle static graph-data.json file
    if (routeName === '/graph-data.json') {
      return this.handleGraphDataJson();
    }

    // Fall back to the pure route handler
    return handleRoutePure(routeName, request, url, this.server);
  }

  private async handleGraphDataApi(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    
    if (method === 'GET') {
      const graphData = await this.loadGraphData();
      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        data: graphData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGraphDataJson(): Promise<Response> {
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
