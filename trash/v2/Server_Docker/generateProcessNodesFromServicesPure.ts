import type { ITesterantoConfig } from "../../../src/server/Types";
import type { GraphOperation } from "../../../graph";

export interface ServiceInfo {
  serviceName: string;
  serviceConfig: any;
}

export function generateProcessNodesFromServicesPure(
  services: Record<string, any>,
  configs: ITesterantoConfig
): { operations: GraphOperation[]; processInfos: Array<{ processId: string; processType: string; configKey: string; testName: string; runtime: string }> } {
  const operations: GraphOperation[] = [];
  const processInfos: Array<{ processId: string; processType: string; configKey: string; testName: string; runtime: string }> = [];

  for (const [serviceName, serviceConfig] of Object.entries(services)) {
    // Determine the process type based on service name
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

    const processId = `${processType}_process:${configKey}:${testName}`;
    const timestamp = new Date().toISOString();

    // Create operation for adding process node
    operations.push({
      type: 'addNode',
      data: {
        id: processId,
        type: processType === 'bdd' ? 'bdd_process' :
          processType === 'check' ? 'check_process' :
            processType === 'aider' ? 'aider_process' :
              processType === 'builder' ? 'builder_process' : 'docker_process',
        label: `${processType} Process: ${testName}`,
        description: `${processType} process for ${testName} (${configKey})`,
        status: 'running',
        icon: processType === 'bdd' ? 'play' :
          processType === 'check' ? 'check' :
            processType === 'aider' ? 'comment-discussion' :
              processType === 'builder' ? 'gear' : 'server',
        metadata: {
          runtime,
          testName,
          configKey,
          processType,
          serviceName,
          timestamp
        }
      },
      timestamp
    });

    processInfos.push({ processId, processType, configKey, testName, runtime });
  }

  return { operations, processInfos };
}
