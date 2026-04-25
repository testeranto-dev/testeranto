import { launchAider, informAider } from "../utils";
import { createAiderMessageFile } from "../utils/aider/createMessageFile";
import { Server_VSCode } from "./Server_VSCode";

/**
 * Server_Aider - Business Layer (-3)
 * 
 * Extends: Server_VSCode (-4)
 * Extended by: Server_Lock (-2)
 * Provides: Aider-specific business logic
 * 
 * Note: spawnAgent, pendingRequestUids, getAgentCounter, saveAgentCounter,
 * and waitForContainerRunning are now inherited from Server_Base.
 */
export abstract class Server_Aider extends Server_VSCode {
  async createAiderMessageFile(testName: string, configKey: string): Promise<string> {
    return await createAiderMessageFile(testName, configKey);
  }

  async launchAider(testName: string, configKey: string): Promise<void> {
    await launchAider(testName, configKey);
  }

  async informAider(testName: string, configKey: string, files?: any): Promise<void> {
    await informAider(testName, configKey, files);
  }

  async sendToAider(processId: string, message: string): Promise<void> {
    this.logBusinessMessage(`sendToAider ${processId}: ${message}`);
  }

  async receiveFromAider(processId: string): Promise<string> {
    this.logBusinessMessage(`receiveFromAider ${processId}`);
    return `response from aider ${processId}`;
  }

  isAiderRunning(testName: string, configKey: string): boolean {
    this.logBusinessMessage(`isAiderRunning ${testName}, ${configKey}`);
    return false;
  }

  getAiderProcessId(testName: string, configKey: string): string | null {
    this.logBusinessMessage(`getAiderProcessId ${testName}, ${configKey}`);
    return `aider-${testName}-${configKey}`;
  }

  // Setup method called by Server.ts
  async setupAgents(): Promise<void> {
    this.logBusinessMessage("Setting up agent system...");
    // Implementation would setup aider agents
    this.logBusinessMessage("Agent system setup complete");
  }

  async cleanupAgents(): Promise<void> {
    this.logBusinessMessage("Cleaning up agent system...");
    // Implementation would clean up agent resources
    this.logBusinessMessage("Agent system cleaned up");
  }

  async notifyAgentsStarted(): Promise<void> {
    this.logBusinessMessage("Agents notified of server start");
  }

  async notifyAgentsStopped(): Promise<void> {
    this.logBusinessMessage("Agents notified of server stop");
  }

  // Workflow methods
  async startAgentWorkflows(): Promise<void> {
    this.logBusinessMessage("Starting agent workflows...");
    // Implementation would start agent processes
    this.logBusinessMessage("Agent workflows started");
  }

  async stopAgentWorkflows(): Promise<void> {
    this.logBusinessMessage("Stopping agent workflows...");
    // Implementation would stop agent processes
    this.logBusinessMessage("Agent workflows stopped");
  }

  async cleanupAiderProcesses(): Promise<void> {
    this.logBusinessMessage("Cleaning up aider processes...");
    // Implementation would clean up aider processes
    this.logBusinessMessage("Aider processes cleaned up");
  }
}
