import { handleRoutePure } from "./handleRoutePure";
import { stakeholderWsAPI, type FilesAndFoldersResponse } from "../../../api/api";
import type { Server } from "../Server";
import type { ITesterantoConfig } from "../../../Types";

export class Server_HTTP_Routes {
  constructor(
    private server: Server,
    private configs: ITesterantoConfig
  ) { }

  async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    try {
      // Handle /files endpoint
      if (routeName === 'files' && request.method === 'GET') {
        const filesData = this.server.graphManager.getFilesAndFolders();

        const response: FilesAndFoldersResponse = {
          nodes: filesData.nodes.map(node => ({
            id: node.id,
            type: node.type as 'file' | 'folder',
            label: node.label || '',
            description: node.description,
            status: node.status,
            priority: node.priority,
            timestamp: node.timestamp,
            metadata: node.metadata,
            icon: node.icon
          })),
          edges: filesData.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            attributes: {
              type: edge.attributes.type || '',
              timestamp: edge.attributes.timestamp,
              metadata: edge.attributes.metadata,
              directed: edge.attributes.directed
            }
          }))
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle /process endpoint
      if (routeName === 'process' && request.method === 'GET') {
        const processData = this.server.graphManager.getProcessSlice();
        return new Response(JSON.stringify(processData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle /aider endpoint
      if (routeName === 'aider' && request.method === 'GET') {
        const aiderData = this.server.graphManager.getAiderSlice();
        return new Response(JSON.stringify(aiderData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle /runtime endpoint
      if (routeName === 'runtime' && request.method === 'GET') {
        const runtimeData = this.server.graphManager.getRuntimeSlice();
        return new Response(JSON.stringify(runtimeData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle dynamic agent endpoints under /agents/ prefix
      if (routeName.startsWith('agents/')) {
        const agentPath = routeName.slice(7); // Remove 'agents/'
        
        if (request.method === 'GET') {
          const sliceData = this.server.graphManager.getAgentSlice(agentPath);
          return new Response(JSON.stringify(sliceData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else if (request.method === 'POST') {
          const suffix = `${agentPath}-${Date.now()}`;
          
          if (typeof (this.server as any).createAgent !== 'function') {
            throw new Error(`createAgent method not available on server`);
          }
          
          await (this.server as any).createAgent(agentPath, suffix);
          return new Response(JSON.stringify({
            message: `${agentPath} agent created with suffix ${suffix}`,
            suffix,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Handle other routes
      return handleRoutePure(routeName, request, url, this.server);
    } catch (error: any) {
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
}
