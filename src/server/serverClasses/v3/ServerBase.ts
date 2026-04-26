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
          { timeout: 5000 },
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

  // Abstract method that must be implemented by subclasses that have a graph
  protected abstract getNode(nodeId: string): any;
}
