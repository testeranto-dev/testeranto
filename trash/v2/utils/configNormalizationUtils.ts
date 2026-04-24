import type { ITesterantoConfig } from "../../../src/server/Types";

function normalizePath(path: string): string {
  return path.replace(/^\.\//, '');
}

export function normalizeConfigsUtil(configs: ITesterantoConfig): ITesterantoConfig {
  if (!configs.runtimes) {
    return configs;
  }

  const result = { ...configs };
  result.runtimes = { ...configs.runtimes };

  for (const [runtimeName, runtimeConfig] of Object.entries(configs.runtimes)) {
    const newRuntimeConfig = { ...runtimeConfig };

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
