import { informAider } from "../utils";
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

  async informAider(testName: string, configKey: string, files?: any): Promise<void> {
    await informAider(testName, configKey, files);
  }

  async sendToAider(processId: string, message: string): Promise<void> {
    this.logBusinessMessage(`sendToAider ${processId}: ${message}`);
    // In a real implementation, this would send the message to the aider process
    // via Docker exec or similar mechanism
    // For now, we log it and broadcast a graph update
    // TODO this is defined in API. import that file and use it here
    this.broadcastApiMessage('resourceChanged', {
      url: '/~/aider',
      message: `Message sent to aider process ${processId}`,
      timestamp: new Date().toISOString()
    });
  }

  async receiveFromAider(processId: string): Promise<string> {
    return `response from aider ${processId}`;
  }

  isAiderRunning(testName: string, configKey: string): boolean {
    return false;
  }

  getAiderProcessId(testName: string, configKey: string): string | null {
    return `aider-${testName}-${configKey}`;
  }

  async setupAgents(): Promise<void> {
    // Implementation would setup aider agents
  }

  async cleanupAgents(): Promise<void> {
  }

  async notifyAgentsStarted(): Promise<void> {
  }

  async notifyAgentsStopped(): Promise<void> {
  }

  async startAgentWorkflows(): Promise<void> {
  }

  async stopAgentWorkflows(): Promise<void> {
  }

  async cleanupAiderProcesses(): Promise<void> {
  }
}
