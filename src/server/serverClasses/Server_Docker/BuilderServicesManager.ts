import type { ITestconfigV2 } from "../../../Types";
import type { IMode } from "../../types";
import { startBuilderServicesPure } from "./utils/startBuilderServicesPure";

export class BuilderServicesManager {
  constructor(
    private configs: ITestconfigV2,
    private mode: IMode,
    private startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string) => Promise<void>
  ) { }

  async startBuilderServices(): Promise<void> {
    try {
      await startBuilderServicesPure(
        this.configs,
        this.mode,
        this.startServiceLogging
      );
    } catch (error) {
      console.error('[BuilderServicesManager] Failed to start builder services:', error);
      // Don't rethrow - allow the application to continue
    }
  }
}
