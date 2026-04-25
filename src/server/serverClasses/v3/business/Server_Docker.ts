import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Runtime } from "./Server_Runtime";
import { EventQueue } from "./utils/EventQueue";
/**
 * Server_Docker - Business Layer (position 11)
 * 
 * Extends: Server_Runtime (10)
 * Extended by: Server_HTTP_Routing (12)
 * Provides: Docker orchestration business logic
 * 
 * This class holds the pure business logic for Docker operations
 * that was previously in Server_DockerCompose (technological layer).
 * Technological Docker command execution remains in Server_DockerCompose.
 */

export abstract class Server_Docker extends Server_Runtime {
  protected dockerEventQueue: EventQueue<any> = new EventQueue();

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);

    // Start draining the Docker event queue periodically
    setInterval(() => {
      this.dockerEventQueue.drain((event) => {
        this.handleDockerEvent(event);
      });
    }, 500);
  }

  // ========== Docker Event Processing (Business Logic) ==========

  /**
   * Process a Docker event and determine the appropriate graph operations.
   * Pure business logic – no I/O.
   */
  protected abstract handleDockerEvent(event: any): void;

  /**
   * Generate Docker Compose service configurations from configs.
   * Pure business logic.
   */
  protected abstract generateServices(): Record<string, any>;

  /**
   * Generate graph updates for aider processes.
   * Pure business logic.
   */
  protected abstract generateAiderUpdates(
    testName: string,
    configKey: string,
  ): { updates: any[]; serviceName: string };

  /**
   * Launch an aider process for the given test.
   * Business orchestration logic.
   */
  protected abstract launchAider(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void>;

  /**
   * Inform aider about changes (e.g., test results).
   * Business orchestration logic.
   */
  protected abstract informAider(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any,
  ): Promise<void>;

  /**
   * Create the aider message file for a given test.
   * Business logic for file content generation.
   */
  protected abstract createAiderMessageFile(testName: string, configKey: string): Promise<string>;

  // Process nodes are no longer added manually. The Docker events watcher
  // handles adding/updating/removing process nodes based on container events.

  // ========== Docker Service Lifecycle (Business Orchestration) ==========

  /**
   * Start all Docker services.
   * Business orchestration logic.
   */
  protected abstract startDockerServices(): Promise<void>;

  /**
   * Stop all Docker services.
   * Business orchestration logic.
   */
  protected abstract stopDockerServices(): Promise<void>;

  /**
   * Setup Docker Compose configuration.
   * Business orchestration logic.
   */
  protected abstract setupDockerCompose(): Promise<void>;

  // ========== Service Name Resolution (Business Logic) ==========

  /**
   * Get the aider service name for a given test.
   */
  protected abstract getAiderServiceName(configKey: string, testName: string): string;

  /**
   * Get the BDD service name for a given test.
   */
  protected abstract getBddServiceName(configKey: string, testName: string): string;

  /**
   * Get the base service name for a given test.
   */
  protected abstract getBaseServiceName(configKey: string, testName: string): string;

  /**
   * Get input files for a test.
   */
  protected abstract getInputFiles(configKey: string, testName: string): string[];
}
