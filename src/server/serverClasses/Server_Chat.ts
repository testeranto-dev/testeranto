import fs, { existsSync } from "fs";
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import {
  getDockerComposeDownPure,
  logMessage,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processExit,
  execSyncWrapper,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { spawnPromise } from "./Server_Docker/utils";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
import type { Server_TestManager } from "./Server_TestManager";
import { ChatManager } from "../chat/ChatManager";
import { AiderOutputCapturer } from "../chat/AiderOutputCapturer";
import { Server_Docker } from "./Server_Docker";

export abstract class ServerChat extends Server_Docker {
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();
  protected chatManager: ChatManager;
  protected aiderOutputCapturer: AiderOutputCapturer;
  protected agentAiderProcesses: Map<string, { containerId: string; capturerStarted: boolean }> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    this.chatManager = new ChatManager();
    this.aiderOutputCapturer = new AiderOutputCapturer(
      (agentName: string, output: string) => {
        this.processAiderOutput(agentName, output);
      }
    );
  }

  /**
   * Process aider output and broadcast as chat messages
   */
  protected processAiderOutput(agentName: string, output: string): void {
    const messages = this.chatManager.processAiderOutput(agentName, output);

    if (messages.length > 0) {
      // Broadcast each message to WebSocket clients
      messages.forEach(message => {
        this.broadcastChatMessage(message);
      });

      // Send to other agents via stdin
      this.sendToOtherAgents(agentName, messages);
    }
  }

  /**
   * Broadcast a chat message to WebSocket clients
   */
  protected broadcastChatMessage(message: any): void {
    const data = JSON.stringify({
      type: 'chatMessage',
      data: message,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all WebSocket clients
    if (this.wsClients) {
      this.wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  /**
   * Send messages to other agents via stdin
   */
  private sendToOtherAgents(sourceAgent: string, messages: any[]): void {
    const agents = this.configs.agents;
    if (!agents) return;

    // Send each message to all other agents
    for (const [agentName, agentConfig] of Object.entries(agents)) {
      if (agentName === sourceAgent) continue;

      // Get container info for the agent
      const containerInfo = this.agentAiderProcesses.get(agentName);
      if (!containerInfo || !containerInfo.containerId) continue;

      // Send each message via stdin to the agent's container
      messages.forEach(message => {
        this.sendToAgentStdin(containerInfo.containerId, message.content);
      });
    }
  }

  /**
   * Send a message to an agent's container via stdin
   */
  private sendToAgentStdin(containerId: string, content: string): void {
    try {
      // Use docker exec to send input to the container
      const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const command = `docker exec -i ${containerId} sh -c "echo \\"${escapedContent}\\" | cat"`;

      // Execute the command
      execSyncWrapper(command, { cwd: processCwd() });

      consoleLog(`[ServerChat] Sent message to container ${containerId.substring(0, 12)}`);
    } catch (error) {
      consoleError(`[ServerChat] Error sending to agent stdin:`, error);
    }
  }

  /**
   * Start capturing output from an agent's aider process
   */
  protected startCapturingAgentOutput(agentName: string, containerId: string): void {
    // Check if we're already capturing for this agent
    if (this.agentAiderProcesses.has(agentName)) {
      const existing = this.agentAiderProcesses.get(agentName);
      if (existing && existing.containerId === containerId && existing.capturerStarted) {
        return; // Already capturing
      }
    }

    // Store agent info
    this.agentAiderProcesses.set(agentName, {
      containerId,
      capturerStarted: true
    });

    // Start capturing output
    this.aiderOutputCapturer.startCapturing(agentName, containerId);

    consoleLog(`[ServerChat] Started capturing output for agent ${agentName} (container: ${containerId.substring(0, 12)})`);
  }

  /**
   * Stop capturing output from an agent's aider process
   */
  protected stopCapturingAgentOutput(agentName: string): void {
    this.aiderOutputCapturer.stopCapturing(agentName);
    this.agentAiderProcesses.delete(agentName);
    consoleLog(`[ServerChat] Stopped capturing output for agent ${agentName}`);
  }

  /**
   * Start capturing output for an agent when it's started
   */
  public async startCapturingForAgent(agentName: string, containerId: string): Promise<void> {
    this.startCapturingAgentOutput(agentName, containerId);
  }

  /**
   * Handle WebSocket chat messages
   */
  public handleChatWebSocketMessage(ws: WebSocket, message: any): void {
    if (!message || typeof message !== 'object') {
      return;
    }

    const { type } = message;

    switch (type) {
      case 'subscribeToChat':
        this.handleSubscribeToChat(ws, message);
        break;
      case 'unsubscribeFromChat':
        this.handleUnsubscribeFromChat(ws, message);
        break;
      case 'sendChatMessage':
        this.handleSendChatMessage(ws, message);
        break;
      case 'getChatHistory':
        this.handleGetChatHistory(ws, message);
        break;
      default:
        // Handle other message types in parent class
        super.handleWebSocketMessage(ws, message);
        break;
    }
  }

  private handleSubscribeToChat(ws: WebSocket, message: any): void {
    const { agentName } = message;
    if (!agentName || typeof agentName !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid agentName for chat subscription',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribedToChat',
      agentName,
      message: `Subscribed to chat for agent ${agentName}`,
      timestamp: new Date().toISOString()
    }));
  }

  private handleUnsubscribeFromChat(ws: WebSocket, message: any): void {
    const { agentName } = message;
    if (!agentName || typeof agentName !== 'string') {
      return;
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'unsubscribedFromChat',
      agentName,
      message: `Unsubscribed from chat for agent ${agentName}`,
      timestamp: new Date().toISOString()
    }));
  }

  private handleSendChatMessage(ws: WebSocket, message: any): void {
    const { agentName, content } = message;
    if (!agentName || typeof agentName !== 'string' || !content || typeof content !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid agentName or content for chat message',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Add user message
    const chatMessage = this.chatManager.addUserMessage(agentName, content);

    // Broadcast to all clients
    this.broadcastChatMessage(chatMessage);

    // Send to the specific agent via stdin
    const containerInfo = this.agentAiderProcesses.get(agentName);
    if (containerInfo && containerInfo.containerId) {
      this.sendToAgentStdin(containerInfo.containerId, content);
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'chatMessageSent',
      messageId: chatMessage.id,
      timestamp: new Date().toISOString()
    }));
  }

  private handleGetChatHistory(ws: WebSocket, message: any): void {
    const { agentName, limit } = message;
    const messages = this.chatManager.getRecentMessages(agentName, limit || 50);

    ws.send(JSON.stringify({
      type: 'chatHistory',
      agentName,
      messages,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Override stop to clean up capturers
   */
  public async stop(): Promise<void> {
    // Stop all output capturers
    this.aiderOutputCapturer.stopAll();
    this.agentAiderProcesses.clear();

    await super.stop();
  }
}
