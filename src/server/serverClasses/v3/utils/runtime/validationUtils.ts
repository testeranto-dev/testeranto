import type { ITesterantoConfig } from "../../../../../Types";

export function validateRuntimeConfiguration(
  configs: ITesterantoConfig,
  runtime: string,
  configKey: string
): void {
  const runtimeConfig = configs.runtimes[configKey];
  if (!runtimeConfig) {
    throw new Error(`No configuration found for ${configKey}`);
  }

  if (runtimeConfig.runtime !== runtime) {
    throw new Error(`Configuration ${configKey} has runtime ${runtimeConfig.runtime}, expected ${runtime}`);
  }
}
