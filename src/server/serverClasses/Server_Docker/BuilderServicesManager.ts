import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { startBuilderServicesPure } from "./utils/startBuilderServicesPure";

export class BuilderServicesManager {
  constructor(
    private configs: ITesterantoConfig,
    private mode: IMode,
    private startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string) => Promise<void>
  ) { }

  async startBuilderServices(): Promise<Set<string>> {
    try {
      const failedConfigs = await startBuilderServicesPure(
        this.configs,
        this.mode,
        this.startServiceLogging
      );
      return failedConfigs;
    } catch (error) {
      console.error('[BuilderServicesManager] Failed to start builder services:', error);
      // Return all configs as failed to be safe
      return new Set(Object.keys(this.configs.runtimes));
    }
  }
}
