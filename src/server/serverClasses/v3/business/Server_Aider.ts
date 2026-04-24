import { exec } from 'child_process';
import { promisify } from 'util';
import { launchAider, informAider } from "../utils";
import { createAiderMessageFile } from "../utils/aider/createMessageFile";
import { Server_VSCode } from "./Server_VSCode";

const execAsync = promisify(exec);

/**
 * Server_Aider - Business Layer (-3)
 * 
 * Extends: Server_VSCode (-4)
 * Extended by: Server_Lock (-2)
 * Provides: Aider-specific business logic
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

  // Counter file path for agent instance counters
  private getAgentCounterFilePath(): string {
    return `${process.cwd()}/testeranto/agent-counters.json`;
  }

  // Read the current counter for a given agent profile
  private async getAgentCounter(profile: string): Promise<number> {
    const filePath = this.getAgentCounterFilePath();
    try {
      const content = await this.readFile(filePath);
      const counters = JSON.parse(content);
      return counters[profile] || 0;
    } catch {
      return 0;
    }
  }

  // Save the counter for a given agent profile
  private async saveAgentCounter(profile: string, counter: number): Promise<void> {
    const filePath = this.getAgentCounterFilePath();
    let counters: Record<string, number> = {};
    try {
      const content = await this.readFile(filePath);
      counters = JSON.parse(content);
    } catch {
      // File doesn't exist yet, start fresh
    }
    counters[profile] = counter;
    await this.writeFile(filePath, JSON.stringify(counters, null, 2));
  }

  /**
   * Spawn a new agent container with the given profile and parameters.
   * The agent will be named {profile}-{nextCounter} (e.g., arko-1, prodirek-3).
   * The container runs aider with the provided message and load files.
   */
  async spawnAgent(
    profile: string,
    loadFiles?: string[],
    message?: string,
    model?: string
  ): Promise<{ agentName: string; containerId: string }> {
    this.logBusinessMessage(`Spawning agent: profile=${profile}`);

    // Get default config for this profile if available
    const agentConfig = this.configs.agents?.[profile];

    // Use provided values or fall back to config defaults
    const resolvedLoadFiles = loadFiles || agentConfig?.load || [];
    const resolvedMessage = message || agentConfig?.message || `Your name is "${profile}".`;

    // Get the next counter for this profile
    const currentCounter = await this.getAgentCounter(profile);
    const nextCounter = currentCounter + 1;
    const agentName = `${profile}-${nextCounter}`;

    this.logBusinessMessage(`Spawning agent container: ${agentName}`);

    // Build the docker run command
    const imageName = 'testeranto-aider:latest';
    const containerName = `agent-${agentName}`;

    // Create load file content
    const loadContent = resolvedLoadFiles.map(f => `/read ${f}`).join('\n');

    // Build environment variables
    const envVars = [
      // `-e AGENT_NAME=${profile}`,
      // `-e AGENT_INSTANCE=${nextCounter}`,
      // `-e AGENT_LOAD_FILES=${loadContent}`,
      // `-e AGENT_MESSAGE=${resolvedMessage}`,
    ];

    if (model) {
      envVars.push(`-e AGENT_MODEL=${model}`);
    }

    // Build volume mounts (same as other agent containers)
    const volumes = [
      `-v "${process.cwd()}/src:/workspace/src"`,
      `-v "${process.cwd()}/test:/workspace/test"`,
      `-v "${process.cwd()}/SOUL.md:/workspace/SOUL.md"`,
      `-v "${process.cwd()}:/workspace"`,
      `-v "${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml"`,
    ];

    // Run aider with the message file and load files
    // The container will execute aider with the provided message
    // Use single quotes around the message to avoid shell quoting issues
    const escapedMessage = resolvedMessage.replace(/'/g, "'\\''");
    const aiderCommand = `aider --message '${escapedMessage}' ${resolvedLoadFiles.map(f => `--file ${f}`).join(' ')}`;
    // Do not specify --network; the default bridge network will be used.
    // The allTests_network may not exist when spawning agents on demand.
    const command = `docker run -d --name ${containerName} ${envVars.join(' ')} ${volumes.join(' ')} --add-host host.docker.internal:host-gateway ${imageName} sh -c "${aiderCommand}"`;

    this.logBusinessMessage(`Running: ${command}`);

    try {
      const { stdout } = await execAsync(command);
      const containerId = stdout.trim();
      this.logBusinessMessage(`Spawned agent container ${containerName} with ID ${containerId}`);

      // Save the updated counter
      await this.saveAgentCounter(profile, nextCounter);

      // Broadcast a WebSocket message to notify VSCode extension to open a terminal
      this.broadcastApiMessage('resourceChanged', {
        url: '/~/agents/spawn',
        message: `Agent ${agentName} spawned`,
        agentName,
        containerId,
        containerName,
        timestamp: new Date().toISOString()
      });

      return { agentName, containerId };
    } catch (error: any) {
      this.logBusinessError(`Failed to spawn agent container ${containerName}:`, error);
      throw new Error(`Failed to spawn agent container: ${error.message}`);
    }
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
