import type { ITesterantoConfig, IBaseTestConfig } from "../../Types";
import type { IMode } from "../types";

function normalizePath(path: string): string {
  // Remove leading ./ from paths
  return path.replace(/^\.\//, '');
}

function normalizeConfigs(configs: ITesterantoConfig): ITesterantoConfig {
  if (!configs.runtimes) {
    return configs;
  }
  
  // Create a deep copy to avoid mutating the original
  const normalized = JSON.parse(JSON.stringify(configs));
  
  for (const [runtimeName, runtimeConfig] of Object.entries(normalized.runtimes)) {
    if (runtimeConfig.tests) {
      runtimeConfig.tests = runtimeConfig.tests.map(normalizePath);
    }
    if (runtimeConfig.outputs) {
      runtimeConfig.outputs = runtimeConfig.outputs.map(normalizePath);
    }
  }
  
  return normalized;
}

export abstract class Server_Base {
  mode: IMode;
  configs: ITesterantoConfig;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    console.log('[Server_Base] Constructor called with configs:', 
      configs ? `has runtimes: ${Object.keys(configs.runtimes || {}).length}` : 'configs is null/undefined');
    
    // Normalize all paths in the configs
    this.configs = normalizeConfigs(configs);
    this.mode = mode;
  }

  async start() {
    // no-op
  }

  async stop() {
    console.log(`goodbye testeranto`)
    process.exit()
  }

}
