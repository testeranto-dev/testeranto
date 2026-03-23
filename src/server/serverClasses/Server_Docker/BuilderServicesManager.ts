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
    await startBuilderServicesPure(
      this.configs,
      this.mode,
      this.startServiceLogging
    );
  }
}
