import fs from "fs";
import path from "path";
import type { GraphEdgeAttributes, GraphNodeAttributes } from "../../graph/index";
import type { ITesterantoConfig } from "../../Types";
import { handleMarkdownFileChange } from "../graph/handleMarkdownFileChange";
import { GraphManager } from "../graph/index";
import { updateMarkdownFile } from "../graph/updateMarkdownFile";
import type { IMode } from "../types";
import { Server_GraphManagerCore } from "./Server_GraphManagerCore";
import { generateFileTreeGraphPure } from "./utils/generateFileTreeGraphPure";

// import { handleMarkdownFileChange } from "../stakeholder";

export class Server_GraphManager {
  protected graphManager: GraphManager;
  protected projectRoot: string;
  protected core: Server_GraphManagerCore;

  constructor(
    protected configs: ITesterantoConfig,
    protected mode: IMode,
    protected getCurrentTestResults: () => any,
    projectRoot?: string
  ) {
    this.projectRoot = projectRoot || process.cwd();
    this.graphManager = new GraphManager(
      this.projectRoot,
      configs.featureIngestor,
      configs
    );
    this.core = new Server_GraphManagerCore();

    // Add agent nodes to the graph immediately
    this.addAgentNodesFromConfig();

    // Save the graph to ensure nodes are persisted
    this.graphManager.saveGraph();

    // Write slice files
    this.writeViewSliceFiles().catch(error => {
      console.error('[Server_GraphManager] Error writing view slice files:', error);
    });
  }

  async resetGraphData(): Promise<any> {
    // The graph is built from scratch on startup
    // Just write slice files
    await this.writeViewSliceFiles();

    const graphData = this.graphManager.getGraphData();
    return {
      unifiedGraph: graphData,
      timestamp: new Date().toISOString()
    };
  }

  // Write slice files for all views and add view nodes to the graph
  async writeViewSliceFiles(): Promise<void> {
    // Get the full graph data
    const graphData = this.graphManager.getGraphData();
    console.log(`[Server_GraphManager] Graph has ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);

    // Log agent nodes
    const agentNodes = graphData.nodes.filter((node: any) => node.type === 'agent');
    console.log(`[Server_GraphManager] Found ${agentNodes.length} agent nodes:`,
      agentNodes.map((node: any) => ({ id: node.id, label: node.label })));

    // Write view slice files
    // const views = (this.configs as any).views;
    if (this.configs.views) {
      // Import slice definitions from views

      // For each view, generate its slice and write to file
      for (const [viewKey, v] of Object.entries(this.configs.views)) {
        // Get slice function for this view
        const sliceFunction = v.slicer;
        let sliceData: any;

        if (sliceFunction) {
          // Use the slice function from views
          sliceData = sliceFunction(graphData);
        } else {
          // Fallback to full graph data
          sliceData = {
            ...graphData,
            metadata: {
              ...graphData.metadata,
              viewType: 'generic',
              timestamp: new Date().toISOString()
            }
          };
        }

        await this.writeSliceFile(viewKey, sliceData);
        this.addViewNodeToGraph(viewKey, v.filePath, sliceData);
      }
    }
    // Write agent slice files
    const agents = this.configs.agents;
    if (!agents) {
      throw new Error('No agents configured in configs');
    }

    console.log(`[Server_GraphManager] Writing agent slices for ${Object.keys(agents).length} agents`);

    // First, log what's in the graph
    // const graphData = this.graphManager.getGraphData();
    console.log(`[Server_GraphManager] Full graph has ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);

    if (graphData.nodes.length > 0) {
      const nodeTypes: Record<string, number> = {};
      graphData.nodes.forEach((node: any) => {
        nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      });
      console.log(`[Server_GraphManager] Node types in full graph:`, nodeTypes);
    }

    for (const [agentName, agentConfig] of Object.entries(agents)) {
      console.log(`[Server_GraphManager] Processing agent: ${agentName}`);

      // Generate agent slice using its sliceFunction
      const sliceFunction = (agentConfig as any).sliceFunction;
      if (typeof sliceFunction !== 'function') {
        throw new Error(`Agent ${agentName} has no valid sliceFunction`);
      }

      console.log(`[Server_GraphManager] Calling slice function for ${agentName}`);

      // Make sure we're passing the right object
      const graphManagerForSlice = {
        getGraphData: () => this.graphManager.getGraphData()
      };

      const sliceData = sliceFunction(graphManagerForSlice);
      console.log(`[Server_GraphManager] Agent ${agentName} slice has ${sliceData?.nodes?.length || 0} nodes, ${sliceData?.edges?.length || 0} edges`);

      if (sliceData?.nodes?.length > 0) {
        const sliceNodeTypes: Record<string, number> = {};
        sliceData.nodes.forEach((node: any) => {
          sliceNodeTypes[node.type] = (sliceNodeTypes[node.type] || 0) + 1;
        });
        console.log(`[Server_GraphManager] Agent ${agentName} slice node types:`, sliceNodeTypes);
      }

      await this.writeAgentSliceFile(agentName, sliceData);
      console.log(`[Server_GraphManager] Wrote agent slice for ${agentName}`);
      this.addAgentNodeToGraph(agentName, agentConfig as any, sliceData);
    }
  }

  // Write a slice to a file
  private async writeSliceFile(viewKey: string, sliceData: any): Promise<void> {
    // Create the views slices directory if it doesn't exist
    const viewsSlicesDir = path.join(this.projectRoot, 'testeranto', 'slices', 'views');
    if (!fs.existsSync(viewsSlicesDir)) {
      fs.mkdirSync(viewsSlicesDir, { recursive: true });
    }

    // Write the slice file
    const sliceFilePath = path.join(viewsSlicesDir, `${viewKey}.json`);
    const content = JSON.stringify(sliceData, null, 2);

    fs.writeFileSync(sliceFilePath, content, 'utf8');

    console.log(`[Server_GraphManager] Wrote slice for view ${viewKey} to ${sliceFilePath}`);
  }

  // Write an agent slice to a file
  protected async writeAgentSliceFile(agentName: string, sliceData: any): Promise<void> {
    try {
      // Create the agents slices directory if it doesn't exist
      const agentsSlicesDir = path.join(this.projectRoot, 'testeranto', 'slices', 'agents');
      if (!fs.existsSync(agentsSlicesDir)) {
        fs.mkdirSync(agentsSlicesDir, { recursive: true });
      }

      // Write the agent slice file
      const sliceFilePath = path.join(agentsSlicesDir, `${agentName}.json`);
      const content = JSON.stringify(sliceData, null, 2);

      fs.writeFileSync(sliceFilePath, content, 'utf8');

      console.log(`[Server_GraphManager] Wrote slice for agent ${agentName} to ${sliceFilePath}`);
      console.log(`[Server_GraphManager] File size: ${content.length} bytes`);

      // Log the structure of the slice data
      console.log(`[Server_GraphManager] Slice data type: ${sliceData.viewType || 'unknown'}`);
      console.log(`[Server_GraphManager] Agent name in slice: ${sliceData.agentName || 'not specified'}`);

      // Log summary if available
      if (sliceData.data?.summary) {
        console.log(`[Server_GraphManager] Slice summary:`, sliceData.data.summary);
      }

      // Check for chat messages in the new structure
      const chatMessages = sliceData.data?.chatMessages || [];
      console.log(`[Server_GraphManager] Found ${chatMessages.length} chat messages in slice for ${agentName}`);

      if (chatMessages.length > 0) {
        console.log(`[Server_GraphManager] Chat message details:`);
        chatMessages.forEach((msg: any, index: number) => {
          console.log(`[Server_GraphManager]   ${index + 1}. From: ${msg.agentName}`);
          console.log(`[Server_GraphManager]      Preview: ${msg.preview || msg.content?.substring(0, 100)?.replace(/\n/g, '\\n')}...`);
        });
      }

      // Verify file was written
      if (fs.existsSync(sliceFilePath)) {
        const stats = fs.statSync(sliceFilePath);
        console.log(`[Server_GraphManager] File verified: ${stats.size} bytes`);
      } else {
        console.error(`[Server_GraphManager] ERROR: File was not created: ${sliceFilePath}`);
      }
    } catch (error: any) {
      console.error(`[Server_GraphManager] Error writing agent slice file for ${agentName}:`, error);
      console.error(`[Server_GraphManager] Error stack:`, error.stack);
    }
  }

  // Get the slice file path for a view
  public getSliceFilePath(viewKey: string): string {
    const path = require('path');
    return path.join(this.projectRoot, 'testeranto', 'slices', 'views', `${viewKey}.json`);
  }

  // Get the slice file path for an agent
  public getAgentSliceFilePath(agentName: string): string {
    const path = require('path');
    return path.join(this.projectRoot, 'testeranto', 'slices', 'agents', `${agentName}.json`);
  }

  // Add or update a view node in the graph
  private addViewNodeToGraph(viewKey: string, viewPath: string, sliceData: any): void {
    try {
      const graphManager = this.graphManager;
      const viewNodeId = `view:${viewKey}`;
      const timestamp = new Date().toISOString();

      // Create view node attributes
      const viewNodeAttributes: any = {
        id: viewNodeId,
        type: 'view',
        label: `View: ${viewKey}`,
        description: `A view for ${viewKey}`,
        viewKey: viewKey,
        viewPath: viewPath,
        sliceFilePath: this.getSliceFilePath(viewKey),
        sliceNodeCount: sliceData?.nodes?.length || 0,
        sliceEdgeCount: sliceData?.edges?.length || 0,
        timestamp: timestamp,
        metadata: {
          frontmatter: {
            title: `View: ${viewKey}`,
            type: 'view',
            viewType: this.getViewType(viewKey)
          }
        }
      };

      // Check if the view node already exists by getting graph data
      const graphData = graphManager.getGraphData();
      const existingNode = graphData.nodes.find((node: any) => node.id === viewNodeId);

      const operationType = existingNode ? 'updateNode' : 'addNode';

      const operations = [{
        type: operationType,
        data: viewNodeAttributes,
        timestamp: timestamp
      }];

      const update = {
        operations,
        timestamp
      };

      graphManager.applyUpdate(update);

      // Connect view node to relevant nodes in its slice
      this.connectViewToSliceNodes(viewNodeId, sliceData);

    } catch (error) {
      console.error(`[Server_GraphManager] Error adding view node for ${viewKey}:`, error);
    }
  }

  // Add or update an agent node in the graph
  private addAgentNodeToGraph(agentName: string, agentConfig: any, sliceData: any): void {
    try {
      const graphManager = this.graphManager;
      const agentNodeId = `agent:${agentName}`;
      const timestamp = new Date().toISOString();

      // Calculate item counts from the new slice structure
      const chatMessageCount = sliceData.data?.chatMessages?.length || 0;
      const featureCount = sliceData.data?.features?.length || 0;
      const configCount = sliceData.data?.configs?.length || 0;
      const entrypointCount = sliceData.data?.entrypoints?.length || 0;
      const documentationCount = sliceData.data?.documentation?.length || 0;

      const totalItems = chatMessageCount + featureCount + configCount +
        entrypointCount + documentationCount;

      // Create agent node attributes
      const agentNodeAttributes: any = {
        id: agentNodeId,
        type: 'agent',
        label: `Agent: ${agentName}`,
        description: agentConfig.message ? agentConfig.message.substring(0, 100) + '...' : `Agent ${agentName}`,
        agentName: agentName,
        agentConfig: {
          load: agentConfig.load || [],
          hasSliceFunction: typeof agentConfig.sliceFunction === 'function'
        },
        sliceFilePath: this.getAgentSliceFilePath(agentName),
        sliceItemCount: totalItems,
        sliceStructure: sliceData.viewType || 'unknown',
        timestamp: timestamp,
        metadata: {
          frontmatter: {
            title: `Agent: ${agentName}`,
            type: 'agent',
            agentType: 'user-defined'
          },
          sliceSummary: sliceData.data?.summary || {}
        }
      };

      // Create operations to add or update the agent node
      const operations: any[] = [
        {
          type: 'addNode',
          data: agentNodeAttributes,
          timestamp: timestamp
        }
      ];

      // Apply the update
      const update = {
        operations: operations,
        timestamp: timestamp
      };

      graphManager.applyUpdate(update);

      // Note: Since slice data is now minimal and doesn't contain nodes/edges in the same way,
      // we can't connect to slice nodes in the same manner
      // The agent node will still be connected to chat messages when they're added to the graph
      // via addChatMessage

    } catch (error) {
      console.error(`[Server_GraphManager] Error adding agent node for ${agentName}:`, error);
    }
  }

  // Determine view type based on view key
  private getViewType(viewKey: string): string {
    switch (viewKey) {
      case 'featuretree':
        return 'feature-tree';
      case 'debugVisualization':
        return 'debug';
      case 'Kanban':
        return 'kanban';
      case 'Gantt':
        return 'gantt';
      case 'Eisenhower':
        return 'eisenhower';
      default:
        return 'generic';
    }
  }

  // Connect view node to nodes in its slice
  private connectViewToSliceNodes(viewNodeId: string, sliceData: any): void {
    try {
      const graphManager = this.graphManager;
      const timestamp = new Date().toISOString();
      const operations: any[] = [];

      // Note: We can't easily remove existing edges with applyUpdate
      // For now, we'll just add new edges and rely on the graph to handle duplicates

      // Add connections to nodes in the slice
      if (sliceData?.nodes) {
        for (const node of sliceData.nodes) {
          const nodeId = node.id;

          // Add edge from view to node
          operations.push({
            type: 'addEdge',
            data: {
              source: viewNodeId,
              target: nodeId,
              attributes: {
                type: 'hasView',
                timestamp: timestamp,
                directed: true
              }
            },
            timestamp: timestamp
          });

          // Add edge from node to view
          operations.push({
            type: 'addEdge',
            data: {
              source: nodeId,
              target: viewNodeId,
              attributes: {
                type: 'viewOf',
                timestamp: timestamp,
                directed: true
              }
            },
            timestamp: timestamp
          });
        }
      }

      if (operations.length > 0) {
        const update = {
          operations,
          timestamp
        };
        graphManager.applyUpdate(update);
      }
    } catch (error) {
      console.error(`[Server_GraphManager] Error connecting view ${viewNodeId} to slice nodes:`, error);
    }
  }

  // Connect agent node to nodes in its slice
  private connectAgentToSliceNodes(agentNodeId: string, sliceData: any): void {
    try {
      const graphManager = this.graphManager;
      const timestamp = new Date().toISOString();
      const operations: any[] = [];

      // Note: We can't easily remove existing edges with applyUpdate
      // For now, we'll just add new edges

      // Add connections to nodes in the slice
      if (sliceData?.nodes) {
        for (const node of sliceData.nodes) {
          const nodeId = node.id;
          // Check if the node exists in the graph
          // We need to check if the node exists in the graph
          // Since we can't use graphManager.hasNode(), we'll try to add edges anyway
          // applyUpdate will ignore edges if nodes don't exist

          // Add edge from agent to node
          operations.push({
            type: 'addEdge',
            data: {
              source: agentNodeId,
              target: nodeId,
              attributes: {
                type: 'hasAgent',
                timestamp: timestamp,
                directed: true
              }
            },
            timestamp: timestamp
          });

          // Add edge from node to agent
          operations.push({
            type: 'addEdge',
            data: {
              source: nodeId,
              target: agentNodeId,
              attributes: {
                type: 'agentOf',
                timestamp: timestamp,
                directed: true
              }
            },
            timestamp: timestamp
          });
        }
      }

      if (operations.length > 0) {
        const update = {
          operations: operations,
          timestamp: timestamp
        };
        graphManager.applyUpdate(update);
      }
    } catch (error) {
      console.error(`[Server_GraphManager] Error connecting agent ${agentNodeId} to slice nodes:`, error);
    }
  }

  generateFeatureTree(): any {
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
    return this.core.generateFeatureTree(graphData);
  }

  generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  getGraphData(): any {
    if (!this.graphManager) {
      throw new Error('Graph manager not available');
    }
    return this.graphManager.getGraphData();
  }

  generateFileTreeGraph(): any {
    const testResults = this.getCurrentTestResults();
    return generateFileTreeGraphPure(this.projectRoot, this.configs, testResults);
  }

  async handleMarkdownFileChange(filePath: string): Promise<void> {
    const result = await handleMarkdownFileChange(this.projectRoot, filePath, this.graphManager);
    return result;
  }

  async saveCurrentGraph(): Promise<void> {
    // Use the graph manager's saveGraph method to ensure consistency
    this.graphManager.saveGraph();

    // Also write view slice files
    await this.writeViewSliceFiles();

    // Update all agent slice files to ensure they're current
    this.updateAllAgentSliceFiles();
  }

  async writeMarkdownFile(filePath: string, frontmatterData: Record<string, any>, contentBody?: string): Promise<void> {
    await updateMarkdownFile(this.projectRoot, filePath, frontmatterData, contentBody);
  }

  getGraphManager(): GraphManager {
    return this.graphManager;
  }

  // Get only files and folders from the graph
  getFilesAndFolders(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getFilesAndFolders();
  }

  // Get process slice (docker processes)
  getProcessSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getProcessSlice();
  }

  // Get aider slice (aider processes and agents)
  getAiderSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getAiderSlice();
  }

  // Get runtime slice (runtimes)
  getRuntimeSlice(): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    return this.graphManager.getRuntimeSlice();
  }

  // Get slice for a specific agent
  getAgentSlice(agentName: string): any {
    if (!this.configs.agents) {
      throw new Error(`No agents configured`);
    }

    const agentConfig = this.configs.agents[agentName];
    if (!agentConfig) {
      throw new Error(`Agent ${agentName} not found in configuration`);
    }

    if (typeof agentConfig.sliceFunction !== 'function') {
      throw new Error(`Agent ${agentName} has invalid sliceFunction`);
    }

    const sliceData = agentConfig.sliceFunction(this.graphManager);

    // Write the slice to a file for persistence
    this.writeAgentSliceFile(agentName, sliceData).catch(error => {
      console.error(`[Server_GraphManager] Error writing agent slice file for ${agentName}:`, error);
    });

    return sliceData;
  }

  // Add a chat message to the graph
  // TODO FIX ME
  addChatMessage(agentName: string, content: string): void {
    console.log(`[Server_GraphManager] addChatMessage called for ${agentName}`);
    try {
      const graphManager = this.graphManager;
      if (!graphManager) {
        console.error(`[Server_GraphManager] graphManager is undefined!`);
        return;
      }

      console.log(`[Server_GraphManager] graphManager type: ${typeof graphManager}`);
      console.log(`[Server_GraphManager] graphManager.applyUpdate exists: ${typeof graphManager.applyUpdate}`);

      const messageId = `chat_message:${agentName}:${Date.now()}`;
      const timestamp = new Date().toISOString();

      const chatNodeAttributes: any = {
        id: messageId,
        type: 'chat_message',
        label: `Chat from ${agentName}`,
        description: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        agentName: agentName,
        content: content,
        timestamp: timestamp,
        metadata: {
          frontmatter: {
            title: `Chat from ${agentName}`,
            type: 'chat_message',
            agent: agentName
          }
        }
      };

      console.log(`[Server_GraphManager] Creating chat message node: ${messageId}`);

      // Create operations to add the chat message node
      const operations: any[] = [
        {
          type: 'addNode',
          data: chatNodeAttributes,
          timestamp: timestamp
        }
      ];

      // Connect the chat message to the agent node
      const agentNodeId = `agent:${agentName}`;
      console.log(`[Server_GraphManager] Agent node ID: ${agentNodeId}`);

      // Add edge from agent to chat message
      operations.push({
        type: 'addEdge',
        data: {
          source: agentNodeId,
          target: messageId,
          attributes: {
            type: 'hasAgent',
            timestamp: timestamp,
            directed: true
          }
        },
        timestamp: timestamp
      });

      // Add edge from chat message to agent
      operations.push({
        type: 'addEdge',
        data: {
          source: messageId,
          target: agentNodeId,
          attributes: {
            type: 'agentOf',
            timestamp: timestamp,
            directed: true
          }
        },
        timestamp: timestamp
      });

      // Apply the update to the graph
      const update = {
        operations: operations,
        timestamp: timestamp
      };

      console.log(`[Server_GraphManager] Applying update with ${operations.length} operations to graph`);
      const result = graphManager.applyUpdate(update);
      console.log(`[Server_GraphManager] Graph update applied successfully`);

      // Immediately update agent slice files
      console.log(`[Server_GraphManager] Updating agent slice file for ${agentName}`);
      this.updateAgentSliceFile(agentName);

      console.log(`[Server_GraphManager] Successfully added chat message from ${agentName} to graph`);

    } catch (error: any) {
      console.error(`[Server_GraphManager] Error adding chat message for ${agentName}:`, error);
      console.error(`[Server_GraphManager] Error stack:`, error.stack);
    }
  }

  // Update a specific agent's slice file immediately
  private updateAgentSliceFile(agentName: string): void {
    try {
      if (!this.configs.agents) {
        console.error(`[Server_GraphManager] No agents configured`);
        return;
      }

      const agentConfig = this.configs.agents[agentName];
      if (!agentConfig) {
        console.error(`[Server_GraphManager] Agent ${agentName} not found in configs`);
        return;
      }

      if (typeof agentConfig.sliceFunction !== 'function') {
        console.error(`[Server_GraphManager] Agent ${agentName} has no valid sliceFunction`);
        return;
      }

      console.log(`[Server_GraphManager] Updating slice file for agent: ${agentName}`);

      // Generate the updated slice
      console.log(`[Server_GraphManager] Calling sliceFunction for ${agentName}`);
      const sliceData = agentConfig.sliceFunction(this.graphManager);

      // Log what's in the slice with the new structure
      const chatMessages = sliceData.data?.chatMessages || [];
      console.log(`[Server_GraphManager] Found ${chatMessages.length} chat messages in slice for ${agentName}`);

      if (chatMessages.length > 0) {
        console.log(`[Server_GraphManager] Chat messages in ${agentName} slice:`,
          chatMessages.map((msg: any) => ({
            from: msg.agentName,
            preview: msg.preview || msg.content?.substring(0, 50)
          })));
      }

      // Write the slice file
      this.writeAgentSliceFile(agentName, sliceData).catch(error => {
        console.error(`[Server_GraphManager] Error writing agent slice file for ${agentName}:`, error);
      });

      console.log(`[Server_GraphManager] Updated agent slice for ${agentName} with viewType: ${sliceData.viewType || 'unknown'}`);
      if (sliceData.data?.summary) {
        console.log(`[Server_GraphManager] Summary:`, sliceData.data.summary);
      }
    } catch (error: any) {
      console.error(`[Server_GraphManager] Error updating agent slice file for ${agentName}:`, error);
      console.error(`[Server_GraphManager] Error stack:`, error.stack);
    }
  }

  // Update ALL agent slice files immediately
  public updateAllAgentSliceFiles(): void {
    try {
      if (!this.configs.agents) {
        console.error(`[Server_GraphManager] No agents configured`);
        return;
      }

      console.log(`[Server_GraphManager] Updating all agent slice files. Number of agents: ${Object.keys(this.configs.agents).length}`);

      for (const [agentName, agentConfig] of Object.entries(this.configs.agents)) {
        console.log(`[Server_GraphManager] Processing agent: ${agentName}`);

        if (typeof agentConfig.sliceFunction !== 'function') {
          console.error(`[Server_GraphManager] Agent ${agentName} has no valid sliceFunction`);
          continue;
        }

        // Generate the updated slice
        console.log(`[Server_GraphManager] Calling sliceFunction for ${agentName}`);
        const sliceData = agentConfig.sliceFunction(this.graphManager);

        // Log what's in the slice with the new structure
        const chatMessages = sliceData.data?.chatMessages || [];
        console.log(`[Server_GraphManager] Agent ${agentName} slice has viewType: ${sliceData.viewType || 'unknown'}, ${chatMessages.length} chat messages`);

        if (chatMessages.length > 0) {
          console.log(`[Server_GraphManager] Chat messages in ${agentName} slice:`,
            chatMessages.map((msg: any) => ({ from: msg.agentName, preview: msg.preview || msg.content?.substring(0, 30) })));
        }

        // Write the slice file
        this.writeAgentSliceFile(agentName, sliceData).catch(error => {
          console.error(`[Server_GraphManager] Error writing agent slice file for ${agentName}:`, error);
        });

        console.log(`[Server_GraphManager] Updated agent slice for ${agentName}`);
      }
    } catch (error) {
      console.error(`[Server_GraphManager] Error updating all agent slice files:`, error);
    }
  }

  // Add agent nodes from configuration to the graph
  private addAgentNodesFromConfig(): void {
    const agents = this.configs.agents;
    if (!agents) {
      return;
    }

    const timestamp = new Date().toISOString();

    for (const [agentName, agentConfig] of Object.entries(agents)) {
      const agentNodeId = `agent:${agentName}`;

      // Create agent node attributes
      const agentNodeAttributes: any = {
        id: agentNodeId,
        type: 'agent',
        label: `Agent: ${agentName}`,
        description: agentConfig.message ? agentConfig.message.substring(0, 100) + '...' : `Agent ${agentName}`,
        agentName: agentName,
        agentConfig: {
          load: agentConfig.load || [],
          hasSliceFunction: typeof agentConfig.sliceFunction === 'function'
        },
        timestamp: timestamp,
        metadata: {
          frontmatter: {
            title: `Agent: ${agentName}`,
            type: 'agent',
            agentType: 'user-defined'
          }
        }
      };

      // Add the agent node to the graph
      const operations: any[] = [
        {
          type: 'addNode',
          data: agentNodeAttributes,
          timestamp: timestamp
        }
      ];

      const update = {
        operations: operations,
        timestamp: timestamp
      };

      this.graphManager.applyUpdate(update);
    }
  }

  // Get all view nodes from the graph
  getViewNodes(): GraphNodeAttributes[] {
    const graphData = this.graphManager.getGraphData();
    return graphData.nodes.filter(node => node.type === 'view');
  }

  // Get a specific view node by viewKey
  getViewNode(viewKey: string): GraphNodeAttributes | undefined {
    const viewNodes = this.getViewNodes();
    return viewNodes.find(node => node.viewKey === viewKey);
  }

  // Get nodes connected to a view
  getViewSlice(viewKey: string): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
  } {
    const viewNode = this.getViewNode(viewKey);
    if (!viewNode) {
      throw new Error(`View ${viewKey} not found in graph`);
    }

    const graphData = this.graphManager.getGraphData();
    const viewNodeId = viewNode.id;

    // Find edges where the view is connected
    const viewEdges = graphData.edges.filter(edge =>
      edge.source === viewNodeId || edge.target === viewNodeId
    );

    // Find connected node IDs
    const connectedNodeIds = new Set<string>();
    viewEdges.forEach(edge => {
      if (edge.source === viewNodeId) connectedNodeIds.add(edge.target);
      if (edge.target === viewNodeId) connectedNodeIds.add(edge.source);
    });

    // Get connected nodes
    const connectedNodes = graphData.nodes.filter(node =>
      connectedNodeIds.has(node.id)
    );

    return {
      nodes: [viewNode, ...connectedNodes],
      edges: viewEdges
    };
  }

}
