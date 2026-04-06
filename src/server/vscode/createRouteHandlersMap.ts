
import { vscodeHttpAPI } from "../../api/vscodeExtensionHttp";
import { extractRouteNameFromPath } from "../serverClasses/Server_Http/extractRouteNameFromPath";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";

// Create route handlers map from API definitions
export const createRouteHandlersMap = (): Record<string, (server: any, url?: URL, request?: Request) => Response> => {
  const handlers: Record<string, (server: any, url?: URL, request?: Request) => Response> = {};

  // Handle both GET and POST for the graph endpoint
  for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
    const apiDef = definition as any;
    const routeName = extractRouteNameFromPath(apiDef.path);

    // Skip parameterized routes
    if (routeName.includes(':')) {
      continue;
    }

    handlers[routeName] = async (server: any, url, request) => {
      if (!request) {
        return jsonResponse({ error: 'Request required' }, 400);
      }

      const method = request.method;
      const graphManager = (server as any).graphManager;

      if (!graphManager) {
        return jsonResponse({
          error: "Graph manager not available",
        }, 500);
      }

      const graphManagerInstance = graphManager.getGraphManager();
      if (!graphManagerInstance) {
        return jsonResponse({
          error: 'Graph manager instance not available',
        }, 500);
      }

      if (key === 'getGraph' && method === 'GET') {
        // Handle GET request for graph data
        try {
          const graphData = graphManagerInstance.getGraphData();
          return jsonResponse({
            graphData,
            message: "Graph data retrieved successfully",
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          return jsonResponse({
            error: 'Failed to retrieve graph',
            message: error.message,
          }, 500);
        }
      } else if (key === 'updateGraph' && method === 'POST') {
        // Handle POST request for graph updates
        try {
          const body = await request.json();
          
          if (!graphManagerInstance.applyUpdate) {
            return jsonResponse({
              error: 'Graph manager does not support updates',
            }, 500);
          }

          const updatedGraph = graphManagerInstance.applyUpdate(body);

          // Save the updated graph
          if (graphManager.saveCurrentGraph) {
            graphManager.saveCurrentGraph();
          }

          // Broadcast graph update to WebSocket clients
          if (server.broadcast) {
            server.broadcast({
              type: 'graphUpdated',
              data: {
                unifiedGraph: updatedGraph
              },
              timestamp: new Date().toISOString(),
              message: 'Graph has been updated via HTTP POST'
            });
          }

          return jsonResponse({
            graphData: updatedGraph,
            message: "Graph updated successfully",
          });
        } catch (error: any) {
          return jsonResponse({
            error: 'Failed to update graph',
            message: error.message,
          }, 400);
        }
      } else {
        // Method not allowed for this endpoint
        const expectedMethod = key === 'getGraph' ? 'GET' : 'POST';
        return jsonResponse(
          {
            error: `Method ${method} not allowed for ${routeName}. Expected ${expectedMethod}.`,
          },
          405,
        );
      }
    };
  }

  return handlers;
};
