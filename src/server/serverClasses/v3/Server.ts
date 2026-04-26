import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { Server_DockerCompose } from "./technological/Server_DockerCompose";
import { buildFileTreeFromGraph } from "./utils/buildFileTreeFromGraph";

export abstract class Server extends Server_DockerCompose {
  protected isRunning: boolean = false;
  protected startedAt: Date | null = null;
  protected businessState: Map<string, any> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(
      configs,
      mode,
      () => this.getCurrentTestResults(),
      process.cwd(),
      (path: string) => this.resourceChanged(path)
    );
  }

  protected getCurrentTestResults(): any {
    return {};
  }

  protected resourceChanged(path: string): void {
    this.logBusinessMessage(`Resource changed: ${path}`);
  }

  async start(): Promise<void> {
    this.logBusinessMessage("Starting server...");

    await this.validateConfigs();
    await this.initializeState();
    await this.setupPolyglotRuntimes();
    await this.setupComponents();
    await this.generateViewSlices();
    await this.generateViewHtmlFiles();
    await this.setupApi();
    await this.startHttpServer(3000);
    await this.startPolyglotWorkflows();
    await this.startWorkflows();

    this.isRunning = true;
    this.startedAt = new Date();
    await this.notifyStarted();
    this.writeViewSliceFiles();
    await this.saveGraph();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logBusinessMessage("Server is not running, nothing to stop");
      return;
    }

    this.logBusinessMessage("Stopping server...");

    await this.stopPolyglotWorkflows();
    await this.stopWorkflows();
    await this.cleanupComponents();

    this.isRunning = false;
    this.startedAt = null;

    await this.notifyStopped();
  }

  protected async validateConfigs(): Promise<void> {
    if (!this.configs.runtimes || Object.keys(this.configs.runtimes).length === 0) {
      throw new Error("No runtimes configured");
    }
  }

  protected async initializeState(): Promise<void> {
    this.setBusinessState("initialized", true);
  }

  protected async setupComponents(): Promise<void> {
    await this.setupGraph();
    await this.startFileWatching();
    await this.setupViews();
    await this.setupLogs();
    await this.setupLocks();
    await this.setupAgents();
    await this.setupVSCode();
    await this.setupApiSpec();
  }

  protected async startWorkflows(): Promise<void> {
    await this.startDockerServices();
    await this.startTestMonitoring();
    await this.startDockerMonitoring();
    await this.startViewUpdates();
    await this.startLogProcessing();
    await this.startAgentWorkflows();
    await this.startWebSocketBroadcasting();
    await this.startStateSync();
  }

  protected async stopWorkflows(): Promise<void> {
    await this.stopStateSync();
    await this.stopWebSocketBroadcasting();
    await this.stopAgentWorkflows();
    await this.stopLogProcessing();
    await this.stopViewUpdates();
    await this.stopDockerMonitoring();
    await this.stopTestMonitoring();
    await this.stopDockerServices();
  }

  protected async cleanupComponents(): Promise<void> {
    await this.cleanupVSCode();
    await this.cleanupAiderProcesses();
    await this.cleanupAgents();
    await this.cleanupLocks();
    await this.cleanupLogs();
    await this.cleanupViews();
    await this.cleanupGraph();
    await this.cleanupDockerProcesses();
    await this.cleanupApiSpec();
  }

  protected async notifyStarted(): Promise<void> {
    await this.notifyGraphStarted();
    await this.notifyViewsStarted();
    await this.notifyLogsStarted();
    await this.notifyLocksStarted();
    await this.notifyAgentsStarted();
    await this.notifyVSCodeStarted();
    await this.broadcastServerStarted();
  }

  protected async notifyStopped(): Promise<void> {
    await this.broadcastServerStopped();
    await this.notifyVSCodeStopped();
    await this.notifyAgentsStopped();
    await this.notifyLocksStopped();
    await this.notifyLogsStopped();
    await this.notifyViewsStopped();
    await this.notifyGraphStopped();
    this.logBusinessMessage("All components notified of server stop");
  }

  protected setBusinessState(key: string, value: any): void {
    this.businessState.set(key, value);
  }

  protected getBusinessState<T = any>(key: string): T | undefined {
    return this.businessState.get(key);
  }

  protected deleteBusinessState(key: string): boolean {
    return this.businessState.delete(key);
  }

  protected clearBusinessState(): void {
    this.businessState.clear();
  }

  protected getBusinessStateKeys(): string[] {
    return Array.from(this.businessState.keys());
  }

  abstract startHttpServer(port: number, hostname?: string): Promise<void>
  abstract stopHttpServer(): Promise<void>

  protected abstract setupApi(): Promise<void>;

  protected async startTestMonitoring(): Promise<void> {
    await this.checkExistingTestResults();
    if (this.mode === "dev") {
      await this.initializeFileWatching();
    }
    await this.startLoggingForAllServices();
    this.logBusinessMessage("Test monitoring started");
  }

  protected async stopTestMonitoring(): Promise<void> {
    this.logBusinessMessage("Stopping test monitoring...");
    await this.stopAllFileWatchers();
    this.logBusinessMessage("Test monitoring stopped");
  }

  protected queryNodes(filter: (node: any) => boolean): any[] {
    return super.queryNodes(filter);
  }

  protected addNode(node: any): string {
    return super.addNode(node);
  }

  protected updateAllAgentSliceFiles(): void {
    super.updateAllAgentSliceFiles();
  }

  protected async generateViewSliceUtil(viewKey: string, viewConfig: any): Promise<void> {
    const { generateViewSliceUtil } = await import("./utils/static/generateViewSliceUtil");
    await generateViewSliceUtil(viewKey, viewConfig);
  }

  protected async writeViewHtmlFileUtil(viewKey: string, html: string): Promise<void> {
    const { writeViewHtmlFileUtil } = await import("./utils/static/writeViewHtmlFileUtil");
    await writeViewHtmlFileUtil(viewKey, html);
  }

  protected async writeViewsIndexHtmlUtil(html: string): Promise<void> {
    const { writeViewsIndexHtmlUtil } = await import("./utils/static/writeViewsIndexHtmlUtil");
    await writeViewsIndexHtmlUtil(html);
  }

  protected async handleFilesRoute(request: Request): Promise<Response> {
    const tree = buildFileTreeFromGraph(this.graph.nodes, this.graph.edges);
    return new Response(
      JSON.stringify({
        tree,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleProcessRoute(request: Request): Promise<Response> {
    const processNodes = this.queryNodes((node: any) => {
      if (node.type?.category === 'process') return true;
      if (typeof node.type === 'string' && node.type.toLowerCase().includes('process')) return true;
      if (node.metadata?.processType) return true;
      return false;
    });

    const processes = processNodes.map((node: any) => ({
      id: node.id,
      type: typeof node.type === 'string' ? node.type : (node.type?.type || 'process'),
      label: node.label || node.id,
      metadata: {
        ...(node.metadata || {}),
        status: node.status || node.metadata?.status || 'unknown',
        containerId: node.metadata?.containerId || node.containerId,
        serviceName: node.metadata?.serviceName || node.serviceName,
        processType: node.metadata?.processType || node.type?.type || 'unknown',
        isActive: node.metadata?.isActive ?? node.isActive ?? false,
        exitCode: node.metadata?.exitCode ?? node.exitCode,
        isAider: node.metadata?.isAider ?? node.isAider ?? false,
        agentName: node.metadata?.agentName || node.agentName,
        isAgentAider: node.metadata?.isAgentAider ?? node.isAgentAider ?? false,
        image: node.metadata?.image || node.image,
        command: node.metadata?.command || node.command,
        startedAt: node.metadata?.startedAt || node.startedAt,
        finishedAt: node.metadata?.finishedAt || node.finishedAt,
        updatedAt: node.metadata?.updatedAt || node.updatedAt,
      },
    }));

    return new Response(
      JSON.stringify({
        processes,
        message: `Found ${processes.length} process(es)`,
        timestamp: new Date().toISOString(),
        count: processes.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleAiderRoute(request: Request): Promise<Response> {
    const aiderNodes = this.queryNodes((node: any) =>
      (node.type?.category === 'process' && node.type?.type === 'aider') ||
      node.metadata?.isAgentAider === true
    );

    const aiderEdges = this.queryEdges((edge: any) =>
      aiderNodes.some(n => n.id === edge.source || n.id === edge.target)
    );

    const response: import("../../../../api").GetAiderResponse = {
      nodes: aiderNodes,
      edges: aiderEdges,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleRuntimeRoute(request: Request): Promise<Response> {
    const runtimeNodes = this.queryNodes((node: any) =>
      node.type?.category === 'resource' && node.type?.type === 'runtime'
    );

    const runtimes: Record<string, {
      tests: string[];
      checks?: string[];
      outputs?: string[];
      dockerfile?: string;
      buildOptions?: string;
      runtime: string;
    }> = {};

    for (const node of runtimeNodes) {
      const runtimeName = node.metadata?.runtimeName;
      if (!runtimeName) continue;

      const config = this.configs.runtimes?.[runtimeName];
      if (!config) continue;

      runtimes[runtimeName] = {
        tests: config.tests || [],
        checks: config.checks?.map((check: any) => check.toString()) || [],
        outputs: config.outputs || [],
        dockerfile: config.dockerfile,
        buildOptions: config.buildOptions,
        runtime: config.runtime
      };
    }

    const response: import("../../../../api").GetRuntimeResponse = {
      runtimes,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleAgentsRoute(request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({
        agents: Object.keys(this.configs.agents || {}).map(name => ({
          name,
          config: this.configs.agents?.[name]
        })),
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleAgentSliceRoute(request: Request, agentName: string): Promise<Response> {
    const agentConfig = this.configs.agents?.[agentName];
    if (!agentConfig) {
      return new Response(
        JSON.stringify({
          error: `Agent '${agentName}' not found`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Find the agent node in the graph to retrieve parsed markdown metadata
    const agentNode = this.graph.nodes.find(
      (n: any) => n.id === `agent:${agentName}` || n.label === agentName
    );
    const metadata = agentNode?.metadata || {};

    const chatNodes = this.queryNodes?.((node: any) =>
      node.type?.category === 'chat' && node.type?.type === 'chat_message'
    ) || [];

    const chatMessages = chatNodes.map((node: any) => ({
      id: node.id,
      agentName: node.metadata?.agentName || node.agentName,
      content: node.metadata?.content || node.content || node.description,
      timestamp: node.metadata?.timestamp || node.timestamp,
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return new Response(
      JSON.stringify({
        agentName,
        config: agentConfig,
        metadata,
        chatMessages,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleViewRoute(request: Request, viewName: string): Promise<Response> {
    const html = this.generateViewHtml(viewName, this.configs.views?.[viewName] || {});
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  }

  protected async registerDefaultHttpRoutes(): Promise<void> {
    // Register all HTTP API routes from the API specification
    // These routes are used by VSCode extension, views, and agents
    
    // GET routes
    this.addRoute('GET', '/~/files', (request) => this.handleFilesRoute(request));
    this.addRoute('GET', '/~/process', (request) => this.handleProcessRoute(request));
    this.addRoute('GET', '/~/aider', (request) => this.handleAiderRoute(request));
    this.addRoute('GET', '/~/runtime', (request) => this.handleRuntimeRoute(request));
    this.addRoute('GET', '/~/agents', (request) => this.handleAgentsRoute(request));
    this.addRoute('GET', '/~/views', (request) => this.handleAllViewsRoute(request));
    this.addRoute('GET', '/~/chat', (request) => this.handleGetChatHistory(request));
    this.addRoute('GET', '/~/configs', async (request) => {
      return new Response(
        JSON.stringify({
          configs: this.configs,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('GET', '/~/app-state', async (request) => {
      return new Response(
        JSON.stringify({
          isRunning: this.isRunning,
          startedAt: this.startedAt,
          mode: this.mode,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('GET', '/~/health', async (request) => {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Testeranto API server is running'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // POST routes
    this.addRoute('POST', '/~/agents/spawn', (request) => this.handleSpawnAgent(request));
    this.addRoute('POST', '/~/open-process-terminal', async (request) => {
      const body = await request.json();
      const { nodeId, label, containerId, serviceName } = body;
      
      try {
        const result = await this.openProcessTerminal(nodeId, label, containerId, serviceName);
        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    });
    this.addRoute('POST', '/~/chat', (request) => this.handlePostChatMessage(request));
    this.addRoute('POST', '/~/down', async (request) => {
      await this.dockerComposeDown();
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Services stopped',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/up', async (request) => {
      await this.dockerComposeUp();
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Services started',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/start-process', async (request) => {
      const body = await request.json();
      const { runtime, testName, configKey } = body;
      await this.startDockerProcess(runtime, testName, configKey, this.configs.runtimes[configKey]);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Process started for ${testName}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register view routes from config
    if (this.configs.views) {
      for (const viewKey of Object.keys(this.configs.views)) {
        this.addRoute('GET', `/~/views/${viewKey}`, async (request) => {
          return await this.handleViewRoute(request, viewKey);
        });
      }
    }
    
    // Register agent slice routes
    if (this.configs.agents) {
      for (const agentName of Object.keys(this.configs.agents)) {
        this.addRoute('GET', `/~/agents/${agentName}`, async (request) => {
          return await this.handleAgentSliceRoute(request, agentName);
        });
      }
    }
    
    // Register git routes
    this.addRoute('GET', '/~/git/status', async (request) => {
      return new Response(
        JSON.stringify({
          status: 'unknown',
          message: 'Git status not implemented',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/git/switch-branch', async (request) => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Git operations not implemented',
          timestamp: new Date().toISOString()
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/git/commit', async (request) => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Git operations not implemented',
          timestamp: new Date().toISOString()
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/git/merge', async (request) => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Git operations not implemented',
          timestamp: new Date().toISOString()
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('GET', '/~/git/conflicts', async (request) => {
      return new Response(
        JSON.stringify({
          conflicts: [],
          message: 'No conflicts',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    this.addRoute('POST', '/~/git/resolve-conflict', async (request) => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Git operations not implemented',
          timestamp: new Date().toISOString()
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register lock status route
    this.addRoute('GET', '/~/lock-status', async (request) => {
      return new Response(
        JSON.stringify({
          hasLockedFiles: false,
          lockedFiles: [],
          lockedCount: 0,
          message: 'No files locked',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register user-agents route
    this.addRoute('GET', '/~/user-agents', async (request) => {
      return new Response(
        JSON.stringify({
          agents: Object.keys(this.configs.agents || {}).map(name => ({
            name,
            config: this.configs.agents?.[name]
          })),
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register aider-processes route
    this.addRoute('GET', '/~/aider-processes', async (request) => {
      return await this.handleAiderRoute(request);
    });
    
    // Register html-report route
    this.addRoute('GET', '/~/html-report', async (request) => {
      return new Response(
        JSON.stringify({
          html: '<html><body><h1>Report</h1></body></html>',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register unified-test-tree route
    this.addRoute('GET', '/~/unified-test-tree', async (request) => {
      return new Response(
        JSON.stringify({
          tree: [],
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
    
    // Register process logs route
    this.addRoute('GET', '/~/processes/:processId/logs', async (request) => {
      const url = new URL(request.url);
      const processId = url.pathname.split('/').pop();
      return new Response(
        JSON.stringify({
          logs: [],
          processId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    });
  }

  /**
   * DEPRECATED – The VSCode extension now composes the Docker command locally.
   * This endpoint should be removed once the new architecture is fully validated.
   * The extension no longer calls this endpoint.
   */
  protected async handleSpawnAgent(request: Request): Promise<Response> {
    const body = await request.json();
    const { profile, message, loadFiles, model, requestUid, testName, configKey } = body;

    if (!profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: profile',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Do NOT spawn the container here.  The server only returns the
    // Docker command that the user will run in their own terminal.
    // The Docker events watcher will detect the container when it
    // starts and create the graph node asynchronously.
    const agentConfig = this.configs.agents?.[profile];
    if (!agentConfig) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Agent profile '${profile}' not found in configuration`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Build the docker‑compose command that the user will execute.
    // The service name follows the pattern used by generateAgentService.
    const serviceName = `agent-${profile}`;
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" up -d ${serviceName}`;

    return new Response(
      JSON.stringify({
        success: true,
        agentName: profile,
        containerId: '',          // unknown until the user runs the command
        command,
        message: `Agent command ready for ${profile}. Press Enter in the terminal to start the container.`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handlePostChatMessage(request: Request): Promise<Response> {
    const body = await request.json();
    const { sender, content } = body;

    if (!sender || !content) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: sender and content',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const messageId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chatNode = {
      id: messageId,
      type: { category: 'chat', type: 'chat_message' },
      label: `Chat message from ${sender}`,
      description: content,
      content: content,
      sender: sender,
      timestamp: new Date().toISOString(),
      metadata: {
        sender,
        content,
        timestamp: new Date().toISOString()
      }
    };

    this.addNode(chatNode);
    this.updateAllAgentSliceFiles();
    this.writeViewSliceFiles();

    this.broadcastApiMessage('resourceChanged', {
      url: '/~/chat',
      message: 'New chat message added',
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chat message added to graph',
        messageId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async handleGetChatHistory(request: Request): Promise<Response> {
    const chatNodes = this.queryNodes((node: any) =>
      node.type?.category === 'chat' && node.type?.type === 'chat_message'
    );

    const chatHistory = chatNodes.map((node: any) => ({
      id: node.id,
      sender: node.metadata?.sender || node.sender,
      content: node.metadata?.content || node.content || node.description,
      timestamp: node.metadata?.timestamp || node.timestamp,
      label: node.label
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return new Response(
      JSON.stringify({
        success: true,
        messages: chatHistory,
        count: chatHistory.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  protected async launchBddTest(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    this.logBusinessMessage(`launchBddTest called: ${runtime}/${testName}/${configKey}`);
  }

  protected async launchChecks(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    this.logBusinessMessage(`launchChecks called: ${runtime}/${testName}/${configKey}`);
  }

  protected logBusinessMessage(message: string): void {
    console.log(`[Business] ${message}`);
  }

  protected logBusinessError(message: string, error?: any): void {
    console.error(`[Business] ${message}`, error);
  }

  protected logBusinessWarning(message: string): void {
    console.warn(`[Business] ${message}`);
  }
}
