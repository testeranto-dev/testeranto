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
  // Map from container name to requestUid for async graph operations
  protected pendingRequestUids: Map<string, string> = new Map();

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
   * Wait for a Docker container to be in the "running" state.
   * Polls `docker inspect` every 500ms until the container is running
   * or the timeout (default 15 seconds) is reached.
   */
  private async waitForContainerRunning(
    containerName: string,
    timeoutMs: number = 15000,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      try {
        const { stdout } = await execAsync(
          `docker inspect --format='{{.State.Status}}' ${containerName}`,
        );
        const status = stdout.trim();
        if (status === 'running') {
          this.logBusinessMessage(
            `Container ${containerName} is now running (waited ${Date.now() - startTime}ms)`,
          );
          return;
        }
      } catch {
        // Container may not exist yet; continue polling
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(
      `Timeout waiting for container ${containerName} to become running after ${timeoutMs}ms`,
    );
  }

  /**
   * Spawn a new agent container with the given profile and parameters.
   * The agent will be named {profile}-{nextCounter} (e.g., arko-1, prodirek-3).
   * The container runs aider with the provided message and load files.
   *
   * After spawning, this method waits for the container to be running and
   * then flushes the Docker event stream by waiting a short additional period,
   * ensuring the Docker events watcher has processed the container start event.
   *
   * @param requestUid Optional UID to correlate async graph updates with this request.
   */
  async spawnAgent(
    profile: string,
    loadFiles?: string[],
    message?: string,
    model?: string,
    requestUid?: string,
  ): Promise<{ agentName: string; containerId: string }> {
    this.logBusinessMessage(`Spawning agent: profile=${profile}`);

    // Get default config for this profile if available
    const agentConfig = this.configs.agents?.[profile];

    // Use provided values or fall back to config defaults
    const resolvedLoadFiles = loadFiles || agentConfig?.load || [];
    const resolvedMessage =
      message || agentConfig?.message || `Your name is "${profile}".`;

    // Get the next counter for this profile
    const currentCounter = await this.getAgentCounter(profile);
    const nextCounter = currentCounter + 1;
    const agentName = `${profile}-${nextCounter}`;

    this.logBusinessMessage(`Spawning agent container: ${agentName}`);

    // Build the docker run command
    const imageName = 'testeranto-aider:latest';
    const containerName = `agent-${agentName}`;

    // Store the requestUid for this container so the Docker event handler can include it
    if (requestUid) {
      this.pendingRequestUids.set(containerName, requestUid);
      this.logBusinessMessage(`Stored requestUid ${requestUid} for container ${containerName}`);
    }

    // Create load file content (same pattern as generateAgentService.ts)
    const loadContent = resolvedLoadFiles.map((f) => `/read ${f}`).join('\n');

    // Build environment variables
    const envVars: string[] = [];

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

    // Use sh -c to create load file and message file, then run aider with --load
    // This matches the pattern in generateAgentService.ts
    const escapedMessage = resolvedMessage.replace(/'/g, "'\\''");
    const loadContentEscaped = loadContent.replace(/'/g, "'\\''");

    const command = `docker run -d -t -i --name ${containerName} ${envVars.join(' ')} ${volumes.join(' ')} --add-host host.docker.internal:host-gateway ${imageName} sh -c 'cat > /tmp/agent_load.txt << EOF\n${loadContentEscaped}\nEOF\ncat > /tmp/agent_message.txt << EOF\n${escapedMessage}\nEOF\naider --load /tmp/agent_load.txt --message "$(cat /tmp/agent_message.txt)" --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update 2>&1'`;

    this.logBusinessMessage(`Running: ${command}`);

    try {
      const { stdout } = await execAsync(command);
      const containerId = stdout.trim();
      this.logBusinessMessage(
        `Spawned agent container ${containerName} with ID ${containerId}`,
      );

      // Wait for the container to be running (flushes the Docker event stream)
      await this.waitForContainerRunning(containerName);

      // Wait for the node to appear in the graph (ensures Docker events watcher processed the start event)
      const nodeId = `aider_process:agent:${containerName}`;
      const startTime = Date.now();
      const timeoutMs = 10000;
      while (Date.now() - startTime < timeoutMs) {
        const node = this.getNode(nodeId);
        if (node) {
          this.logBusinessMessage(`Node ${nodeId} found in graph after ${Date.now() - startTime}ms`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Save the updated counter
      await this.saveAgentCounter(profile, nextCounter);

      // Broadcast a WebSocket message to notify VSCode extension to open a terminal
      this.broadcastApiMessage('resourceChanged', {
        url: '/~/agents/spawn',
        message: `Agent ${agentName} spawned`,
        agentName,
        containerId,
        containerName,
        requestUid,
        timestamp: new Date().toISOString(),
      });

      return { agentName, containerId };
    } catch (error: any) {
      // Clean up stored UID on failure
      if (requestUid) {
        this.pendingRequestUids.delete(containerName);
      }
      this.logBusinessError(
        `Failed to spawn agent container ${containerName}:`,
        error,
      );
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
