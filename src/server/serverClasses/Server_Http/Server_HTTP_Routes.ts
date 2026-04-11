import { handleRoutePure } from "./handleRoutePure";
import { stakeholderWsAPI, vscodeHttpAPI, type FilesAndFoldersResponse } from "../../../api/api";
import type { Server } from "../Server";
import type { ITesterantoConfig } from "../../../Types";
import * as gitHandlers from "./utils/gitHandlers";
import * as serviceHandlers from "./utils/serviceHandlers";
import * as lockHandlers from "./utils/lockHandlers";
import { execSync } from "child_process";

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
    // Chat is now handled via aider output streaming
    return new Response(JSON.stringify({
      error: 'Chat endpoint is deprecated',
      message: 'Chat is now handled via aider output streaming and added to the graph as message nodes',
      timestamp: new Date().toISOString()
    }), {
      status: 410, // Gone
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleOpenProcessTerminal(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { nodeId, label, containerId, serviceName } = body;

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
      const parts = nodeId.split(':');
      const type = parts[0];

      // Get the server instance to access process information
      const server = this.server as any;
      
      // Try to determine the container name
      let containerName = containerId;
      let processInfo: any = null;
      
      // If containerId is provided, use it
      if (containerName) {
        // Check if container exists
        try {
          const checkCmd = `docker ps -q -f name=${containerName}`;
          execSync(checkCmd, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();
        } catch (error) {
          // Container not found, but we'll still generate a script
          console.warn(`[Server_HTTP_Routes] Container ${containerName} may not be running`);
        }
      } else {
        // Try to determine container name from nodeId
        if (type === 'agent') {
          const agentName = parts[1];
          containerName = `agent-${agentName}`;
        } else if (type === 'aider_process') {
          if (parts[1] === 'agent') {
            const agentName = parts[2];
            containerName = `agent-${agentName}`;
          } else {
            // Try to get aider process info from server
            const aiderProcesses = server.getAiderProcesses ? server.getAiderProcesses() : [];
            const identifier = parts.length > 1 ? parts.slice(1).join(':') : '';
            const aiderProcess = aiderProcesses.find((p: any) => 
              p.id === nodeId || 
              p.containerName?.includes(identifier) ||
              p.testName?.includes(identifier)
            );
            if (aiderProcess) {
              containerName = aiderProcess.containerName;
              processInfo = aiderProcess;
            }
          }
        } else if (type === 'container') {
          containerName = parts[1] || nodeId.replace('container:', '');
        } else if (type === 'process') {
          // Try to get process info from graph
          const graphManager = server.graphManager?.getGraphManager ? server.graphManager.getGraphManager() : null;
          if (graphManager) {
            try {
              const graphData = graphManager.getGraphData();
              const processNode = graphData.nodes.find((n: any) => n.id === nodeId);
              if (processNode) {
                const metadata = processNode.metadata || {};
                containerName = metadata.containerId || metadata.containerName;
                processInfo = metadata;
              }
            } catch (error) {
              console.warn(`[Server_HTTP_Routes] Error getting process info from graph:`, error);
            }
          }
        } else if (type === 'aider') {
          // Try to get aider process info
          const aiderProcesses = server.getAiderProcesses ? server.getAiderProcesses() : [];
          const identifier = parts.length > 1 ? parts.slice(1).join(':') : '';
          const aiderProcess = aiderProcesses.find((p: any) => 
            p.id === nodeId || 
            p.containerName?.includes(identifier) ||
            p.testName?.includes(identifier)
          );
          if (aiderProcess) {
            containerName = aiderProcess.containerName;
            processInfo = aiderProcess;
          }
        }
        
        // If still no container name, try serviceName
        if (!containerName && serviceName) {
          containerName = serviceName;
        }
      }

      // If we have a container name, generate a script
      if (containerName) {
        // First, try to get container info from the graph
        let graphContainerName = containerName;
        let graphContainerId = '';
        let graphContainerStatus = 'unknown';
        
        // Get graph manager from server
        const graphManager = server.graphManager?.getGraphManager ? server.graphManager.getGraphManager() : null;
        if (graphManager) {
          try {
            const graphData = graphManager.getGraphData();
            
            // Find the node in the graph
            let processNode = graphData.nodes.find((n: any) => n.id === nodeId);
            
            // If node not found, try to find related agent node for aider_process:agent:xxx
            if (!processNode && type === 'aider_process' && parts[1] === 'agent') {
              const agentName = parts[2];
              const agentNodeId = `agent:${agentName}`;
              processNode = graphData.nodes.find((n: any) => n.id === agentNodeId);
              
              if (processNode) {
                console.log(`[Server_HTTP_Routes] Found agent node ${agentNodeId} for aider_process ${nodeId}`);
              }
            }
            
            if (processNode) {
              const metadata = processNode.metadata || {};
              // Get container info from metadata
              const graphContainer = metadata.containerId || metadata.containerName;
              if (graphContainer) {
                graphContainerName = graphContainer;
                console.log(`[Server_HTTP_Routes] Graph has container: ${graphContainerName} for node ${nodeId}`);
              }
              graphContainerId = metadata.containerId || '';
              // Check both node status and metadata status
              graphContainerStatus = processNode.status || metadata.status || 'unknown';
              console.log(`[Server_HTTP_Routes] Node ${nodeId} status: node.status=${processNode.status}, metadata.status=${metadata.status}, final=${graphContainerStatus}`);
            } else {
              console.warn(`[Server_HTTP_Routes] Node ${nodeId} not found in graph`);
            }
          } catch (error) {
            console.warn(`[Server_HTTP_Routes] Error getting container info from graph:`, error);
          }
        }
        
        // Use the container name from graph if available, otherwise use derived name
        const finalContainerName = graphContainerName || containerName;
        
        // Use graph status, not Docker directly
        // The graph should have been updated with actual container status
        const isRunning = graphContainerStatus === 'running';
        const containerStatus = graphContainerStatus;
        const actualContainerId = graphContainerId;
        
        // Generate appropriate script based on container type
        let script: string;
        const isAgentOrAider = finalContainerName.includes('agent-') || finalContainerName.includes('aider');
        
        if (isRunning) {
          // Check if this is an aider or agent container
          const isAiderOrAgent = finalContainerName.includes('agent-') || finalContainerName.includes('aider');
          
          if (isAiderOrAgent) {
            // For aider/agent containers, we need to ensure Ctrl+C reaches the aider process
            script = `#!/bin/sh
echo "Opening terminal to ${type} process: ${label || nodeId}"
echo "Container: ${finalContainerName}"
echo "Status: ${containerStatus}"
echo ""
# Check if container exists (running or stopped)
if docker ps -a --format "{{.Names}}" | grep -q "^${finalContainerName}\$"; then
    # Check if it's running
    if docker ps --format "{{.Names}}" | grep -q "^${finalContainerName}\$"; then
        echo "Container is running. Attaching to aider process..."
        echo "Note: Ctrl+C will send SIGINT to the aider process inside the container"
        echo "      Use Ctrl+P, Ctrl+Q to detach without stopping the container"
        echo ""
        # Don't trap signals - let them pass through to docker
        trap '' INT
        # Reset terminal settings
        stty sane
        # Use docker attach to connect to the running aider process
        # This allows Ctrl+C to reach the process inside
        exec docker attach ${finalContainerName}
    else
        echo "Container exists but is stopped."
        echo "You can start it with:"
        echo "  docker compose -f testeranto/docker-compose.yml up -d ${finalContainerName}"
        echo ""
        echo "Starting interactive shell..."
        stty sane
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
    exec "/bin/sh" -i
fi`;
          } else {
            // For other containers, use docker exec -it with proper signal handling
            script = `#!/bin/sh
echo "Opening terminal to ${type} process: ${label || nodeId}"
echo "Container: ${finalContainerName}"
echo "Status: ${containerStatus}"
echo ""
# Check if container exists (running or stopped)
if docker ps -a --format "{{.Names}}" | grep -q "^${finalContainerName}\$"; then
    # Check if it's running
    if docker ps --format "{{.Names}}" | grep -q "^${finalContainerName}\$"; then
        echo "Container is running. Opening interactive shell..."
        echo "Note: Ctrl+C will send SIGINT to the process inside the container"
        echo "      Use exit or Ctrl+D to exit the shell"
        echo ""
        # Don't trap signals - let them pass through to docker
        trap '' INT
        # Reset terminal settings
        stty sane
        # Use exec to replace the shell with docker exec
        exec docker exec -it ${finalContainerName} /bin/sh
    else
        echo "Container exists but is stopped."
        echo "You can start it with:"
        echo "  docker compose -f testeranto/docker-compose.yml up -d ${finalContainerName}"
        echo ""
        echo "Starting interactive shell..."
        stty sane
        exec "/bin/sh" -i
    fi
else
    echo "Container does not exist."
    echo "Available containers:"
    docker ps -a --format "{{.Names}}"
    echo ""
    echo "Starting interactive shell..."
    stty sane
    exec "/bin/sh" -i
fi`;
          }
        } else {
          script = `#!/bin/sh
echo "Container ${finalContainerName} is not running."
echo "Node ID: ${nodeId}"
echo "Type: ${type}"
echo ""
echo "Available containers:"
docker ps --format "{{.Names}}"
echo ""
echo "You can try to start the container with:"
echo "  docker compose -f testeranto/docker-compose.yml up -d ${finalContainerName}"
echo ""
echo "Starting interactive shell..."
# Reset terminal settings
stty sane
# Don't trap signals
trap '' INT
exec "/bin/sh" -i`;
        }

        return new Response(JSON.stringify({
          success: true,
          script,
          nodeId,
          containerName,
          containerId: actualContainerId || containerName,
          containerStatus: isRunning ? containerStatus : 'not_running',
          nodeType: type,
          message: isRunning ? 
            `${type} container ${containerName} is running` : 
            `${type} container ${containerName} is not running`,
          terminalNotes: isRunning ? {
            aiderOrAgent: isAgentOrAider,
            detachSequence: isAgentOrAider ? 'Ctrl+P, Ctrl+Q' : 'exit or Ctrl+D',
            sigint: 'Ctrl+C sends SIGINT to the process inside container'
          } : null,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // No container name could be determined
        return new Response(JSON.stringify({
          error: `Cannot determine container for process type ${type}`,
          nodeId,
          message: `Unable to find container information for ${nodeId}. Please provide containerId parameter.`,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
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

  private async handleAddChatMessage(request: Request): Promise<Response> {
    try {
      console.log(`[Server_HTTP_Routes] handleAddChatMessage called`);
      const body = await request.json();
      console.log(`[Server_HTTP_Routes] Request body:`, body);
      const { agentName, content } = body;

      if (!agentName || !content) {
        console.log(`[Server_HTTP_Routes] Missing agentName or content`);
        return new Response(JSON.stringify({
          error: 'Missing agentName or content parameter',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`[Server_HTTP_Routes] Manually adding chat message for ${agentName}: ${content.substring(0, 50)}...`);

      // Add the chat message
      console.log(`[Server_HTTP_Routes] Calling graphManager.addChatMessage`);
      this.server.graphManager.addChatMessage(agentName, content);
      console.log(`[Server_HTTP_Routes] addChatMessage called successfully`);

      return new Response(JSON.stringify({
        success: true,
        agentName,
        message: 'Chat message added',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error('[Server_HTTP_Routes] Error in handleAddChatMessage:', error);
      console.error('[Server_HTTP_Routes] Error stack:', error.stack);
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

  private async handleViewSlice(request: Request, url: URL, viewKey: string): Promise<Response> {
    try {
      console.log(`[Server_HTTP_Routes] Getting slice for view: ${viewKey}`);
      
      // Get the slice data from the graph manager
      const sliceData = this.server.graphManager.getViewSlice(viewKey);
      
      return new Response(JSON.stringify({
        viewKey,
        sliceData,
        timestamp: new Date().toISOString(),
        message: `Slice data for view ${viewKey}`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      console.error(`[Server_HTTP_Routes] Error getting slice for view ${viewKey}:`, error);
      return new Response(JSON.stringify({
        error: "Failed to get view slice",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
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
      agents: () => this.handleAgentRoute('', request),
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
      'add-chat-message': () => this.handleAddChatMessage(request),
    };

    // Handle view requests
    if (routeName === 'views' && request.method === 'GET') {
      return this.handleGetViews(request, url);
    }
    
    // Handle view slice requests
    if (routeName.startsWith('views/')) {
      const parts = routeName.split('/');
      if (parts.length >= 3 && parts[1] && parts[2] === 'slice') {
        const viewKey = parts[1];
        return this.handleViewSlice(request, url, viewKey);
      }
    }

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
  private getViewName(key: string): string {
    // Convert key to display name
    switch (key) {
      case 'featuretree':
        return 'Feature Tree';
      case 'debugVisualization':
        return 'Debug Visualization';
      case 'Kanban':
        return 'Kanban Board';
      case 'Gantt':
        return 'Gantt Chart';
      case 'Eisenhower':
        return 'Eisenhower Matrix';
      default:
        // Convert camelCase or snake_case to Title Case
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^./, str => str.toUpperCase())
          .trim();
    }
  }

  private async handleGetViews(request: Request, url: URL): Promise<Response> {
    try {
      console.log('[Server_HTTP_Routes] Getting views from configs:', this.configs);
      console.log('[Server_HTTP_Routes] Configs type:', typeof this.configs);
      console.log('[Server_HTTP_Routes] Configs keys:', Object.keys(this.configs || {}));
      
      const views = this.configs.views || {};
      console.log('[Server_HTTP_Routes] Raw views object:', views);
      console.log('[Server_HTTP_Routes] Views type:', typeof views);
      console.log('[Server_HTTP_Routes] Views keys:', Object.keys(views));
      
      // Convert views object to array
      const viewArray = Object.entries(views).map(([key, path]) => {
        // Ensure path starts with a slash for web URLs
        const normalizedPath = (path as string).startsWith('/') ? path : `/${path}`;
        const viewItem = {
          key,
          path: normalizedPath,
          name: this.getViewName(key),
          htmlUrl: `/testeranto/views/${key}.html`,
          bundleUrl: `/testeranto/views/${key}.bundle.js`
        };
        console.log(`[Server_HTTP_Routes] View item ${key}:`, viewItem);
        return viewItem;
      });

      console.log('[Server_HTTP_Routes] Processed view array:', viewArray);
      console.log('[Server_HTTP_Routes] Number of views:', viewArray.length);

      return new Response(JSON.stringify({
        views: viewArray,
        message: `Found ${viewArray.length} views`,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      console.error('[Server_HTTP_Routes] Error in handleGetViews:', error);
      console.error('[Server_HTTP_Routes] Error stack:', error.stack);
      return new Response(JSON.stringify({
        error: "Failed to get views",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}
