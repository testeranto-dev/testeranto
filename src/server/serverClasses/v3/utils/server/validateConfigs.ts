import type { ITesterantoConfig } from "../../../../../Types";

export function validateConfigs(configs: ITesterantoConfig): void {
  if (!configs.runtimes || Object.keys(configs.runtimes).length === 0) {
    throw new Error("No runtimes configured");
  }
}
