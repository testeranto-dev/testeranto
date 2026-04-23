import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { normalizeConfigsUtil } from "./utils/configNormalizationUtils";
import { Server } from "./v3/Server";

export abstract class Server_Base extends Server {
  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    // Normalize configs after calling parent constructor
    this.configs = normalizeConfigsUtil(this.configs);
  }

  async start() {
    // Call parent start which contains the business logic
    await super.start();
  }

  async stop() {
    // Call parent stop which contains the business logic
    await super.stop();
  }

  // Implement abstract methods from Server
  protected async validateConfigs(): Promise<void> {
    // Default implementation: check that runtimes exist
    if (!this.configs.runtimes || Object.keys(this.configs.runtimes).length === 0) {
      throw new Error("No runtimes configured");
    }
  }

  protected async initializeState(): Promise<void> {
    // Default implementation: initialize business state
    this.setBusinessState("initialized", true);
  }

  protected async setupComponents(): Promise<void> {
    // Default implementation: no components to set up
  }

  protected async startWorkflows(): Promise<void> {
    // Default implementation: no workflows to start
  }

  protected async stopWorkflows(): Promise<void> {
    // Default implementation: no workflows to stop
  }

  protected async cleanupComponents(): Promise<void> {
    // Default implementation: no components to clean up
  }

  protected async notifyStarted(): Promise<void> {
    // Default implementation: log that server has started
    this.logBusinessMessage(`Server started in ${this.mode} mode`);
  }

  protected async notifyStopped(): Promise<void> {
    // Default implementation: log that server has stopped
    this.logBusinessMessage("Server stopped");
  }
}
