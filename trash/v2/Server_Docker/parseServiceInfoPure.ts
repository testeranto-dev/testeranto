import type { ITesterantoConfig } from "../../../src/server/Types";

export interface ServiceInfo {
  processType: 'builder' | 'bdd' | 'check' | 'aider' | 'docker_process';
  runtime: string;
  testName: string;
  configKey: string;
}

export function parseServiceInfoPure(
  serviceName: string,
  configs: ITesterantoConfig
): ServiceInfo {
  let processType: 'builder' | 'bdd' | 'check' | 'aider' | 'docker_process' = 'docker_process';
  let runtime: string = 'node';
  let testName: string = serviceName;
  let configKey: string = 'unknown';

  // Parse service name to extract information
  if (serviceName.includes('builder')) {
    processType = 'builder';
    // Extract configKey from builder service name (e.g., "nodetests-builder" -> "nodetests")
    configKey = serviceName.replace('-builder', '');
    testName = 'builder';
  } else if (serviceName.includes('bdd-')) {
    processType = 'bdd';
    // Parse bdd service name (e.g., "bdd-nodetests-testname")
    const parts = serviceName.split('-');
    if (parts.length >= 3) {
      configKey = parts[1];
      testName = parts.slice(2).join('-');
    }
  } else if (serviceName.includes('check-')) {
    processType = 'check';
    // Parse check service name
    const parts = serviceName.split('-');
    if (parts.length >= 3) {
      configKey = parts[1];
      testName = parts.slice(2).join('-');
    }
  } else if (serviceName.includes('aider-')) {
    processType = 'aider';
    // Parse aider service name
    const parts = serviceName.split('-');
    if (parts.length >= 3) {
      configKey = parts[1];
      testName = parts.slice(2).join('-');
    }
  } else if (serviceName.includes('agent-')) {
    processType = 'aider';
    // For agent services, they're aider processes
    const parts = serviceName.split('-');
    if (parts.length >= 2) {
      configKey = 'agent';
      testName = parts[1] || 'unknown';
    }
  }

  // Get runtime from config if available
  if (configKey !== 'unknown' && configs.runtimes[configKey]) {
    const runtimeConfig = configs.runtimes[configKey];
    runtime = runtimeConfig.runtime;
  }

  return { processType, runtime, testName, configKey };
}
