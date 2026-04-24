import type { ITesterantoConfig } from "../../../src/server/Types";

export function normalizePath(path: string): string {
  // Remove leading ./ from paths
  return path.replace(/^\.\//, '');
}

export function normalizeConfigs(configs: ITesterantoConfig): ITesterantoConfig {
  if (!configs.runtimes) {
    return configs;
  }

  // Create a shallow copy of the config to avoid mutating the original
  // We only need to copy the runtimes object and modify its tests/outputs arrays
  const result = { ...configs };

  // Create a new runtimes object
  result.runtimes = { ...configs.runtimes };

  for (const [runtimeName, runtimeConfig] of Object.entries(configs.runtimes)) {
    // Create a copy of this runtime config
    const newRuntimeConfig = { ...runtimeConfig };

    // Only modify tests and outputs if they exist
    if (newRuntimeConfig.tests) {
      newRuntimeConfig.tests = [...newRuntimeConfig.tests.map(normalizePath)];
    }
    if (newRuntimeConfig.outputs) {
      newRuntimeConfig.outputs = [...newRuntimeConfig.outputs.map(normalizePath)];
    }

    result.runtimes[runtimeName] = newRuntimeConfig;
  }

  return result;
}
