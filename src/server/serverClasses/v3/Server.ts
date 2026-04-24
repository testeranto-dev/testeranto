import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { Server_Polyglot } from "./business/Server_Polyglot";
import { Server_Files } from "./business/Server_Files";
import { buildFileTreeFromGraph } from "./utils/buildFileTreeFromGraph";

/**
 * Server V3 - Abstract Logical Core (Position 0)
 * 
 * Contains pure business logic with no external dependencies.
 * All external operations are defined as abstract methods to be implemented
 * by technological layers (FS, HTTP, CLI, etc.) or business layers (Graph, Aider, etc.).
 * 
 * This class orchestrates the business workflows and maintains the core state.
 */
export abstract class Server extends Server_Files {
  protected isRunning: boolean = false;
  protected startedAt: Date | null = null;
  protected businessState: Map<string, any> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    // Call parent constructor with required parameters for Server_Graph
    super(
      configs,
      mode,
      () => this.getCurrentTestResults(), // getCurrentTestResults function
      process.cwd(), // projectRoot
      (path: string) => this.resourceChanged(path) // resourceChangedCallback
    );
  }

  // Method to get current test results (required by Server_Graph constructor)
  protected getCurrentTestResults(): any {
    return {}; // Default implementation
  }

  // Resource changed callback (required by Server_Graph constructor)
  protected resourceChanged(path: string): void {
    this.logBusinessMessage(`Resource changed: ${path}`);
    // Implementation would notify WebSocket clients, etc.
  }

  // protected initializeDockerCompose(): void {
  //   this.logBusinessMessage("Docker Compose initialized (this instance)");
  // }


  /**
   * Main business logic entrypoint.
   * Orchestrates the startup sequence following the V3 plan.
   */
  async start(): Promise<void> {
    this.logBusinessMessage("Starting server...");

    await this.validateConfigs();
    await this.initializeState();
    await this.setupPolyglotRuntimes();
    await this.setupComponents();
    await this.generateViewSlices();
    await this.generateViewHtmlFiles();

    // Setup API routes before starting HTTP server
    await this.setupApi();

    // Setup API routes before starting HTTP server
    await this.setupApi();

    // Start HTTP server before workflows
    await this.startHttpServer(3000);

    await this.startPolyglotWorkflows();
    await this.startWorkflows();

    this.isRunning = true;
    this.startedAt = new Date();
    await this.notifyStarted();
    this.writeViewSliceFiles();
    await this.saveGraph();
  }

  /**
   * Stop all business operations and clean up resources.
   */
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


  // ========== Server abstract methods ==========
  protected async validateConfigs(): Promise<void> {
    // Check that runtimes exist (from Server_Base.validateConfigs())
    if (!this.configs.runtimes || Object.keys(this.configs.runtimes).length === 0) {
      throw new Error("No runtimes configured");
    }

  }

  protected async initializeState(): Promise<void> {
    this.setBusinessState("initialized", true);
  }

  protected async setupComponents(): Promise<void> {
    await this.setupGraph();
    // Start file watching after graph is initialized
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

  /**
   * Store a value in the business state.
   * Used for sharing data between business components.
   */
  protected setBusinessState(key: string, value: any): void {
    this.businessState.set(key, value);
  }

  /**
   * Retrieve a value from the business state.
   */
  protected getBusinessState<T = any>(key: string): T | undefined {
    return this.businessState.get(key);
  }

  /**
   * Remove a value from the business state.
   */
  protected deleteBusinessState(key: string): boolean {
    return this.businessState.delete(key);
  }

  /**
   * Clear all business state.
   */
  protected clearBusinessState(): void {
    this.businessState.clear();
  }

  /**
   * Get all business state keys.
   */
  protected getBusinessStateKeys(): string[] {
    return Array.from(this.businessState.keys());
  }

  // ========== HTTP Server Methods ==========
  // These are implemented by Server_HTTP

  protected async startHttpServer(port: number = 3000, hostname?: string): Promise<void> {
    // This will be implemented by Server_HTTP
    this.logBusinessMessage(`Starting HTTP server on port ${port}...`);
  }

  protected async stopHttpServer(): Promise<void> {
    // This will be implemented by Server_HTTP
    this.logBusinessMessage("Stopping HTTP server...");
  }

  // ========== API Setup Methods ==========
  // These are implemented by Server_Api

  protected abstract setupApi(): Promise<void>;

  // ========== Docker Service Methods ==========
  // These can be overridden by subclasses

  protected async startDockerServices(): Promise<void> {
    throw new Error("startDockerServices must be implemented by subclass");
  }

  protected async stopDockerServices(): Promise<void> {
    throw new Error("stopDockerServices must be implemented by subclass");
  }

  // ========== Test Monitoring Methods ==========
  // These can be overridden by subclasses

  protected async startTestMonitoring(): Promise<void> {
    await this.checkExistingTestResults();
    if (this.mode === "dev") {
      await this.initializeFileWatching();
    }
    await this.startLoggingForAllServices();

    this.logBusinessMessage("Test monitoring started");
  }

  protected async stopTestMonitoring(): Promise<void> {
    this.logBusinessMessage("Stopping test monitoring (V2 Server_Docker_Test business logic)...");

    // V2 Server_Docker_Test.stop() business logic:

    // 1. Stop all file watchers
    this.logBusinessMessage("Stopping all file watchers...");
    await this.stopAllFileWatchers();

    // 2. Clear process tracking
    this.logBusinessMessage("Clearing process tracking...");
    // Implementation would clear process tracking maps

    this.logBusinessMessage("Test monitoring stopped");
  }

  private async checkExistingTestResults(): Promise<void> {
    throw new Error("checkExistingTestResults must be implemented");
  }

  private async initializeFileWatching(): Promise<void> {
    throw new Error("initializeFileWatching must be implemented");
  }

  private async startLoggingForAllServices(): Promise<void> {
    throw new Error("startLoggingForAllServices must be implemented");
  }

  private async stopAllFileWatchers(): Promise<void> {
    throw new Error("stopAllFileWatchers must be implemented");
  }

  protected async cleanupDockerProcesses(): Promise<void> {
    throw new Error("cleanupDockerProcesses must be implemented by subclass");
  }

  // ========== Graph Methods (delegate to Server_Graph) ==========

  protected queryNodes(filter: (node: any) => boolean): any[] {
    // Delegate to the graph's queryNodes method
    return super.queryNodes(filter);
  }

  protected addNode(node: any): string {
    // Delegate to the graph's addNode method
    return super.addNode(node);
  }

  protected updateAllAgentSliceFiles(): void {
    // Delegate to the graph's updateAllAgentSliceFiles method
    super.updateAllAgentSliceFiles();
  }



  // ========== Server_Static Abstract Method Implementations ==========

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

  // ========== API Route Handlers (for Server_Api) ==========

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
      // Accept nodes whose type is an object with category === 'process'
      // OR a string that includes 'process'
      // OR nodes that have a metadata.processType field
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
      node.type?.category === 'process' && node.type?.type === 'aider'
    );

    const aiderEdges = this.queryEdges((edge: any) =>
      aiderNodes.some(n => n.id === edge.source || n.id === edge.target)
    );

    return new Response(
      JSON.stringify({
        nodes: aiderNodes,
        edges: aiderEdges,
        timestamp: new Date().toISOString()
      }),
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

    const runtimeEdges = this.queryEdges((edge: any) =>
      runtimeNodes.some(n => n.id === edge.source || n.id === edge.target)
    );

    return new Response(
      JSON.stringify({
        nodes: runtimeNodes,
        edges: runtimeEdges,
        timestamp: new Date().toISOString()
      }),
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

    // Get chat messages for the agent slice
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

  protected async handlePostChatMessage(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { agentName, content } = body;

      if (!agentName || !content) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields: agentName and content',
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
        label: `Chat message from ${agentName}`,
        description: content,
        metadata: {
          agentName,
          content,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      this.addNode(chatNode);
      this.updateAllAgentSliceFiles();

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
    } catch (error: any) {
      this.logBusinessError('Error handling chat message:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to process chat message',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  protected async handleGetChatHistory(request: Request): Promise<Response> {
    try {
      const chatNodes = this.queryNodes((node: any) =>
        node.type?.category === 'chat' && node.type?.type === 'chat_message'
      );

      const chatHistory = chatNodes.map((node: any) => ({
        id: node.id,
        agentName: node.metadata?.agentName || node.agentName,
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
    } catch (error: any) {
      this.logBusinessError('Error getting chat history:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to get chat history',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  // ========== Abstract method implementations ==========

  protected async launchBddTest(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    this.logBusinessMessage(`launchBddTest called: ${runtime}/${testName}/${configKey}`);
    // TODO: implement actual BDD test launch (e.g., start Docker service)
  }

  protected async launchChecks(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    this.logBusinessMessage(`launchChecks called: ${runtime}/${testName}/${configKey}`);
    // TODO: implement actual checks launch (e.g., start Docker service)
  }

  // ========== Utility Methods ==========
  // These can be overridden by subclasses if needed

  /**
   * Log a business-level message.
   * Default implementation uses console.log.
   */
  protected logBusinessMessage(message: string): void {
    console.log(`[Business] ${message}`);
  }

  /**
   * Log a business-level error.
   * Default implementation uses console.error.
   */
  protected logBusinessError(message: string, error?: any): void {
    console.error(`[Business] ${message}`, error);
  }

  /**
   * Log a business-level warning.
   * Default implementation uses console.warn.
   */
  protected logBusinessWarning(message: string): void {
    console.warn(`[Business] ${message}`);
  }
}
