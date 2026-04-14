import type { Request } from 'bun';
import type { ITesterantoConfig } from '../../../Types';

export async function handleAgentRouteUtil(
  routeName: string,
  request: Request,
  configs: ITesterantoConfig,
  getAgentSlice: (agentName: string) => any,
  startAgent?: (agentName: string) => Promise<{ success: boolean; message: string; containerId?: string }>
): Promise<Response> {
  try {
    // Parse the route to get agent name
    const parts = routeName.split('/');
    const agentName = parts[1];

    if (!agentName) {
      return new Response(JSON.stringify({
        error: 'Missing agent name in route',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if agent exists in config
    if (!configs.agents || !configs.agents[agentName]) {
      return new Response(JSON.stringify({
        error: `Agent ${agentName} not found in configuration`,
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle different HTTP methods
    if (request.method === 'GET') {
      // Get agent slice
      const sliceData = getAgentSlice(agentName);
      return new Response(JSON.stringify({
        agentName,
        sliceData,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (request.method === 'POST') {
      // Start agent
      if (!startAgent) {
        return new Response(JSON.stringify({
          error: 'Agent starting not supported',
          timestamp: new Date().toISOString()
        }), {
          status: 501,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await startAgent(agentName);
      return new Response(JSON.stringify({
        agentName,
        ...result,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({
        error: `Method ${request.method} not supported for agent routes`,
        timestamp: new Date().toISOString()
      }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error('[Server_HTTP] Error in handleAgentRoute:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
