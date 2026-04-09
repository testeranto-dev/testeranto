import { handleRoutePure } from "./handleRoutePure";
import { stakeholderWsAPI, vscodeHttpAPI, type FilesAndFoldersResponse } from "../../../api/api";
import type { Server } from "../Server";
import type { ITesterantoConfig } from "../../../Types";
import * as gitHandlers from "./utils/gitHandlers";
import * as serviceHandlers from "./utils/serviceHandlers";
import * as lockHandlers from "./utils/lockHandlers";

export class Server_HTTP_Routes {
  constructor(
    private server: Server,
    private configs: ITesterantoConfig
  ) { }

  private handleFilesRoute(): Response {
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

  private handleProcessRoute(): Response {
    const processData = this.server.graphManager.getProcessSlice();
    return new Response(JSON.stringify(processData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleAiderRoute(): Response {
    const aiderData = this.server.graphManager.getAiderSlice();
    return new Response(JSON.stringify(aiderData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleRuntimeRoute(): Response {
    const runtimeData = this.server.graphManager.getRuntimeSlice();
    return new Response(JSON.stringify(runtimeData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleAgentRoute(routeName: string, request: Request): Promise<Response> {
    const agentPath = routeName.slice(7);

    // Handle GET /~/agents (list all agents)
    if (agentPath === '' && request.method === 'GET') {
      const agents = this.configs.agents || {};
      const agentList = Object.keys(agents).map(agentName => {
        const agentConfig = agents[agentName];
        return {
          name: agentName,
          // markdownFile: agentConfig.markdownFile,
          load: agentConfig.load,
          message: agentConfig.message,
          hasSliceFunction: typeof agentConfig.sliceFunction === 'function'
        };
      });

      return new Response(JSON.stringify({
        agents: agentList,
        count: agentList.length,
        timestamp: new Date().toISOString(),
        message: `Found ${agentList.length} agents`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle GET /~/agents/{agentName} (get specific agent slice)
    if (request.method === 'GET') {
      try {
        const sliceData = this.server.graphManager.getAgentSlice(agentPath);
        return new Response(JSON.stringify({
          nodes: sliceData.nodes || [],
          edges: sliceData.edges || [],
          timestamp: new Date().toISOString(),
          message: `Agent slice for ${agentPath}`
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error: any) {
        console.error(`[Server_HTTP_Routes] Error getting agent slice for ${agentPath}:`, error);
        return new Response(JSON.stringify({
          nodes: [],
          edges: [],
          error: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (request.method === 'POST') {
      // Start agent on-demand
      try {
        const server = this.server as any;
        if (typeof server.startAgent === 'function') {
          const result = await server.startAgent(agentPath);

          if (result.success) {
            return new Response(JSON.stringify({
              success: true,
              agentName: agentPath,
              message: result.message,
              containerId: result.containerId,
              timestamp: new Date().toISOString()
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              agentName: agentPath,
              message: result.message,
              timestamp: new Date().toISOString()
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        } else {
          return new Response(JSON.stringify({
            success: false,
            agentName: agentPath,
            message: 'Server does not support starting agents on-demand',
            timestamp: new Date().toISOString()
          }), {
            status: 501,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (error: any) {
        return new Response(JSON.stringify({
          success: false,
          agentName: agentPath,
          message: `Error starting agent: ${error.message}`,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleUserAgentsRoute(): Response {
    const agents = this.configs.agents || {};
    const agentList = Object.keys(agents).map(agentName => {
      const agentConfig = agents[agentName];
      return {
        name: agentName,
        // markdownFile: agentConfig.markdownFile,
        load: agentConfig.load,
        message: agentConfig.message,
        hasSliceFunction: typeof agentConfig.sliceFunction === 'function',
        description: `User-defined agent: ${agentName}`,
        type: 'user-defined'
      };
    });

    return new Response(JSON.stringify({
      userAgents: agentList,
      count: agentList.length,
      timestamp: new Date().toISOString(),
      message: `Found ${agentList.length} user-defined agents`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleVscodeViewRoute(routeName: string): Response {
    const viewName = routeName.slice(13);
    const viewPath = this.configs.vscodeViews?.[viewName];
    if (!viewPath) {
      throw new Error(`View ${viewName} not found`);
    }

    return new Response(JSON.stringify({
      viewName,
      viewPath,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleStakeholderViewRoute(routeName: string): Response {
    const viewName = routeName.slice(18);
    const viewPath = this.configs.stakeholderViews?.[viewName];
    if (!viewPath) {
      throw new Error(`Stakeholder view ${viewName} not found`);
    }

    const graphData = this.server.graphManager.getGraphManager().getGraphData();
    return new Response(JSON.stringify({
      viewName,
      viewPath,
      graphData,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  private handleChatRoute(url: URL): Response {
    // According to tickets/chat.md, we no longer need the POST endpoint for chat
    return new Response(JSON.stringify({
      error: 'Chat endpoint is deprecated',
      message: 'Chat is now handled via aider output streaming',
      timestamp: new Date().toISOString()
    }), {
      status: 410, // Gone
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleOpenProcessTerminal(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { nodeId } = body;

      if (!nodeId) {
        return new Response(JSON.stringify({
          error: 'Missing nodeId parameter',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse nodeId to determine what type of process it is
      // Format examples:
      // - agent:prodirek
      // - aider_process:agent:prodirek
      // - bdd_process:configKey:testName
      // - check_process:configKey:testName:index
      // - aider_process:configKey:testName
      // - builder_process:configKey

      const parts = nodeId.split(':');
      const type = parts[0];

      if (type === 'agent') {
        // Handle agent terminal request
        const agentName = parts[1];
        const containerName = `agent-${agentName}`;

        // Check if container exists and is running
        const { execSync } = require('child_process');
        let containerId = '';
        let isRunning = false;
        let containerStatus = 'unknown';

        try {
          const checkCmd = `docker ps -q -f name=${containerName}`;
          containerId = execSync(checkCmd, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();
          isRunning = !!containerId;

          if (isRunning) {
            const inspectCmd = `docker inspect --format='{{.State.Status}}' ${containerName}`;
            containerStatus = execSync(inspectCmd, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
          }
        } catch (error) {
          // Container not found or error
          console.error(`[Server_HTTP_Routes] Error checking container ${containerName}:`, error);
        }

        if (isRunning) {
          return new Response(JSON.stringify({
            success: true,
            nodeId,
            containerIdentifier: containerName,
            containerName,
            containerId: containerId || containerName,
            containerStatus,
            nodeType: 'agent',
            message: `Agent ${agentName} container is running`,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            error: `Agent container ${containerName} is not running`,
            nodeId,
            message: `Agent ${agentName} is not running. Agents are started at server startup via docker-compose.`,
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else if (type === 'aider_process' && parts[1] === 'agent') {
        // Handle aider process for agent
        const agentName = parts[2];
        const containerName = `agent-${agentName}`;

        // Check if container exists and is running
        const { execSync } = require('child_process');
        let containerId = '';
        let isRunning = false;
        let containerStatus = 'unknown';

        try {
          const checkCmd = `docker ps -q -f name=${containerName}`;
          containerId = execSync(checkCmd, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();
          isRunning = !!containerId;

          if (isRunning) {
            const inspectCmd = `docker inspect --format='{{.State.Status}}' ${containerName}`;
            containerStatus = execSync(inspectCmd, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
          }
        } catch (error) {
          console.error(`[Server_HTTP_Routes] Error checking container ${containerName}:`, error);
        }

        if (isRunning) {
          return new Response(JSON.stringify({
            success: true,
            nodeId,
            containerIdentifier: containerName,
            containerName,
            containerId: containerId || containerName,
            containerStatus,
            nodeType: 'aider_process',
            message: `Aider process for agent ${agentName} is running`,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            error: `Agent container ${containerName} is not running`,
            nodeId,
            message: `Agent ${agentName} is not running. Agents are started at server startup.`,
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        // For other process types (bdd, check, builder, etc.), return not implemented
        // since we're simplifying and these are handled differently now
        return new Response(JSON.stringify({
          error: `Process type ${type} not supported in simplified mode`,
          nodeId,
          message: 'Only agent processes are supported for terminal access in simplified mode',
          timestamp: new Date().toISOString()
        }), {
          status: 501,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error: any) {
      console.error('[Server_HTTP_Routes] Error in handleOpenProcessTerminal:', error);
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

  async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {

    const routeHandlers: Record<string, () => Promise<Response> | Response> = {
      files: () => this.handleFilesRoute(),
      process: () => this.handleProcessRoute(),
      aider: () => this.handleAiderRoute(),
      runtime: () => this.handleRuntimeRoute(),
      'user-agents': () => this.handleUserAgentsRoute(),
      chat: () => this.handleChatRoute(url),
      'lock-status': () => lockHandlers.handleLockStatusRoute(this.server),
      down: () => serviceHandlers.handleDown(this.server),
      up: () => serviceHandlers.handleUp(this.server),
      'git/status': () => gitHandlers.handleGitStatus(),
      'git/switch-branch': () => gitHandlers.handleGitSwitchBranch(request),
      'git/commit': () => gitHandlers.handleGitCommit(request),
      'git/merge': () => gitHandlers.handleGitMerge(request),
      'git/conflicts': () => gitHandlers.handleGitConflicts(),
      'git/resolve-conflict': () => gitHandlers.handleGitResolveConflict(request),
      'open-process-terminal': () => this.handleOpenProcessTerminal(request),
    };

    for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
      const apiDef = definition as any;
      if (apiDef.check && apiDef.check(routeName, { method: request.method })) {
        if (key === 'getAgentSlice' || key === 'launchAgent') {
          return this.handleAgentRoute(routeName, request);
        } else if (key === 'getVscodeView') {
          return this.handleVscodeViewRoute(routeName);
        } else if (key === 'getStakeholderView') {
          return this.handleStakeholderViewRoute(routeName);
        } else {
          const baseRouteName = apiDef.path.slice(3);
          const handler = routeHandlers[baseRouteName];
          if (handler) {
            return await handler();
          }
        }
      }
    }

    return handleRoutePure(routeName, request, url, this.server);
  }
}
