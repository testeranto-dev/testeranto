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
          markdownFile: agentConfig.markdownFile,
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
      // Agents are now created as Docker services at startup, not dynamically
      // This endpoint just acknowledges that the agent is already running
      return new Response(JSON.stringify({
        success: true,
        agentName: agentPath,
        message: `Agent ${agentPath} is already running as a Docker service. Agents are now created at startup.`,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
        markdownFile: agentConfig.markdownFile,
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
    const agent = url.searchParams.get('agent');
    const message = url.searchParams.get('message');

    if (!agent || !message) {
      throw new Error("Missing agent or message parameter");
    }

    const timestamp = new Date().toISOString();
    const chatId = `chat_message:${timestamp}:${agent}`;
    const text = `${agent} said: '${message}'`;

    // 1. Write to chat_slice.json
    this.writeChatSlice(agent, message, timestamp, text);

    // 2. Create graph node for chat message
    this.createChatGraphNode(chatId, agent, message, timestamp, text);

    if (typeof (this.server as any).broadcast === 'function') {
      const broadcastMessage = {
        type: 'chat',
        agent,
        message,
        timestamp,
        text
      };
      (this.server as any).broadcast(broadcastMessage);

      // Also broadcast as a resourceChanged for /~/chat to notify subscribers
      (this.server as any).resourceChanged('/~/chat');

      // Send the message to all agent containers (except the sender)
      this.sendMessageToAgents(agent, message);

      return new Response(JSON.stringify({
        success: true,
        timestamp,
        chatId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      throw new Error("WebSocket broadcast not available");
    }
  }

  private writeChatSlice(agent: string, message: string, timestamp: string, text: string): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const chatSliceDir = path.join(process.cwd(), 'testeranto', 'agents');
      const chatSlicePath = path.join(chatSliceDir, 'chat_slice.json');
      
      // Ensure directory exists
      if (!fs.existsSync(chatSliceDir)) {
        fs.mkdirSync(chatSliceDir, { recursive: true });
      }
      
      // Read existing chat slice or create empty array
      let chatSlice: any[] = [];
      if (fs.existsSync(chatSlicePath)) {
        try {
          const content = fs.readFileSync(chatSlicePath, 'utf-8');
          chatSlice = JSON.parse(content);
          if (!Array.isArray(chatSlice)) {
            chatSlice = [];
          }
        } catch (error) {
          console.error('[Server_HTTP_Routes] Error reading chat_slice.json:', error);
          chatSlice = [];
        }
      }
      
      // Add new message
      const chatEntry = {
        agent,
        message,
        timestamp,
        text,
        id: `chat_message:${timestamp}:${agent}`
      };
      chatSlice.push(chatEntry);
      
      // Write back to file
      fs.writeFileSync(chatSlicePath, JSON.stringify(chatSlice, null, 2), 'utf-8');
      
      console.log(`[Server_HTTP_Routes] Chat message written to ${chatSlicePath}`);
    } catch (error) {
      console.error('[Server_HTTP_Routes] Error writing chat slice:', error);
      // Don't throw - allow chat to continue even if file write fails
    }
  }

  private createChatGraphNode(chatId: string, agent: string, message: string, timestamp: string, text: string): void {
    try {
      const graphManager = this.server.graphManager?.getGraphManager();
      if (!graphManager) {
        console.error('[Server_HTTP_Routes] Graph manager not available for creating chat node');
        return;
      }
      
      // Create chat message node
      const nodeData = {
        id: chatId,
        type: 'chat_message' as const,
        label: `Chat: ${agent}`,
        description: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        status: 'done' as const,
        timestamp,
        metadata: {
          agent,
          message,
          text,
          timestamp
        },
        icon: 'message-circle'
      };
      
      // Apply graph update
      const update = {
        operations: [
          {
            type: 'addNode' as const,
            data: nodeData,
            timestamp
          }
        ],
        timestamp
      };
      
      graphManager.applyUpdate(update);
      console.log(`[Server_HTTP_Routes] Chat graph node created: ${chatId}`);
    } catch (error) {
      console.error('[Server_HTTP_Routes] Error creating chat graph node:', error);
      // Don't throw - allow chat to continue even if graph update fails
    }
  }

  private sendMessageToAgents(senderAgent: string, message: string): void {
    try {
      const { execSync } = require('child_process');
      const agents = this.configs.agents || {};
      
      for (const [agentName, _] of Object.entries(agents)) {
        // Skip the sender
        if (agentName === senderAgent) {
          continue;
        }
        
        const containerName = `agent-${agentName}`;
        
        try {
          // Check if container is running
          const isRunning = execSync(`docker ps -q -f name=${containerName}`, { 
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();
          
          if (isRunning) {
            // Write to the container's stdin via /proc/1/fd/0
            const chatMessage = `[Chat from ${senderAgent}] ${message}`;
            execSync(`docker exec ${containerName} bash -c "echo '${chatMessage}' > /proc/1/fd/0"`, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe']
            });
            console.log(`[Server_HTTP_Routes] Sent message to agent ${agentName}`);
          }
        } catch (error) {
          // Container might not be running or command failed
          console.log(`[Server_HTTP_Routes] Could not send to agent ${agentName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('[Server_HTTP_Routes] Error in sendMessageToAgents:', error);
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
