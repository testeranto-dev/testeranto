// This forms  the base of the server stack
// in this fail we should define many mehtods as abstractthat will be implemented by highersclases
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";

const execAsync = promisify(exec);

export abstract class Server_Base {
  protected configs: ITesterantoConfig;
  protected mode: IMode;

  // Map from container name to requestUid for async graph operations
  protected pendingRequestUids: Map<string, string> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    this.configs = configs;
    this.mode = mode;
    
    // Normalize configs (from V2 Server_Base)
    this.normalizeConfigs();
  }

  // Normalize configuration
  private normalizeConfigs(): void {
    // This is a placeholder for actual normalization logic
    // In V2, it calls normalizeConfigsUtil
    // No logging in constructors per SOUL principles
  }

  // ========== Abstract Technological Methods ==========
  // These will be implemented by higher technological layers
  
  /**
   * Read a file from the filesystem
   */
  protected abstract readFile(path: string): Promise<string>;

  /**
   * Write a file to the filesystem
   */
  protected abstract writeFile(path: string, content: string): Promise<void>;

  /**
   * Check if a file exists
   */
  protected abstract fileExists(path: string): Promise<boolean>;

  /**
   * Execute a command
   */
  protected abstract execCommand(command: string, options?: any): Promise<{ stdout: string; stderr: string; exitCode: number }>;

  /**
   * Write to stdout
   */
  protected abstract writeStdout(data: string | Buffer): boolean;

  /**
   * Write to stderr
   */
  protected abstract writeStderr(data: string | Buffer): boolean;

  /**
   * Read from stdin
   */
  protected abstract readStdin(encoding?: BufferEncoding): Promise<string>;

  // ========== Logging Methods ==========
  // These are available to all classes in the inheritance chain

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

  /**
   * Broadcast a message to all WebSocket clients.
   * Implemented by technological layers (Server_WS_HTTP).
   */
  protected abstract broadcastApiMessage(
    messageType: string,
    data: any,
    filter?: (client: any) => boolean
  ): void;

  // ========== Agent Spawning (moved from Server_Aider) ==========

  // Counter file path for agent instance counters
  private getAgentCounterFilePath(): string {
    return `${process.cwd()}/testeranto/agent-counters.json`;
  }

  // Read the current counter for a given agent profile
  protected async getAgentCounter(profile: string): Promise<number> {
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
  protected async saveAgentCounter(profile: string, counter: number): Promise<void> {
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
  protected async waitForContainerRunning(
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
    model?: string,
    requestUid?: string,
  ): Promise<{ agentName: string; containerId: string }> {
    this.logBusinessMessage(`Spawning agent: profile=${profile}`);

    // Get default config for this profile if available
    const agentConfig = this.configs.agents?.[profile];

    // Use provided values or fall back to config defaults
    const resolvedLoadFiles = loadFiles || agentConfig?.load || [];

    // The WHO_AM_I.md content will be written inside the container via the heredoc
    const whoAmIContent = agentConfig?.message || `You are ${profile}.`;

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

    // Create load file content with only operations
    // The agent's personality/instructions come from the JSON slice file
    // which is populated from the graph data
    const loadContent = `/read /tmp/WHO_AM_I.md\n${resolvedLoadFiles.join('\n')}`;

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

    // Use sh -c to create load file, then run aider with --load
    // Do NOT use --message flag - that makes aider non-interactive
    // The agent's personality/instructions are in the JSON slice file
    const whoAmIEscaped = whoAmIContent.replace(/'/g, "'\\''");
    const loadContentEscaped = loadContent.replace(/'/g, "'\\''");

    const command = `docker run -d -t -i --name ${containerName} ${envVars.join(' ')} ${volumes.join(' ')} --add-host host.docker.internal:host-gateway ${imageName} sh -c 'cat > /tmp/WHO_AM_I.md << EOF\n${whoAmIEscaped}\nEOF\ncat > /tmp/agent_load.txt << EOF\n${loadContentEscaped}\nEOF\naider --load /tmp/agent_load.txt --no-analytics --no-show-model-warnings --no-show-release-notes --no-check-update 2>&1'`;

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

  // Abstract method that must be implemented by subclasses that have a graph
  protected abstract getNode(nodeId: string): any;
}
