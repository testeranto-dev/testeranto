import { execSync } from "child_process";
import type { IRunTime } from "../../../../Types";
import { generateUid, getAiderServiceName } from "../Server_Docker_Constants";
import { consoleError, consoleLog, consoleWarn, processCwd } from "../Server_Docker_Dependents";
import type { GraphOperation } from "../../../../graph/index";

export async function launchAiderPure({
  runtime,
  testName,
  configKey,
  configValue,
  failedBuilderConfigs,
  createAiderMessageFile,
  startServiceLogging,
  resourceChanged,
  writeConfigForExtension,
  getContainerInfo,
  aiderProcesses,
  updateGraphWithAiderNode,
}: {
  runtime: IRunTime;
  testName: string;
  configKey: string;
  configValue: any;
  failedBuilderConfigs: Set<string>;
  createAiderMessageFile: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>;
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName?: string) => Promise<void>;
  resourceChanged: (path: string) => void;
  writeConfigForExtension: () => void;
  getContainerInfo: (serviceName: string) => Promise<any>;
  aiderProcesses: Map<string, any>;
  updateGraphWithAiderNode: (params: {
    runtime: IRunTime;
    testName: string;
    configKey: string;
    aiderServiceName: string;
    containerId?: string;
  }) => Promise<void>;
  // This callback should update the graph with aider nodes and edges.
  // Use createAiderNodeGraphOperationsPure to generate the operations.
  // Example implementation using GraphManager:
  //   updateGraphWithAiderNode: async (params) => {
  //     const graphManager = getGraphManager(); // Get your GraphManager instance
  //     await graphManager.updateGraphWithAiderNode(params);
  //   }
}): Promise<void> {
  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    consoleLog(`[Server_Docker] Skipping aider for ${testName} because builder failed for config ${configKey}`);
    return;
  }

  // Create aider message file and launch aider in parallel
  const uid = generateUid(configKey, testName);
  const aiderServiceName = getAiderServiceName(uid);

  try {
    // Run both operations in parallel
    await Promise.all([
      createAiderMessageFile(runtime, testName, configKey, configValue),
      (async () => {
        // Start the aider service
        execSync(`docker compose -f "${processCwd()}/testeranto/docker-compose.yml" up -d ${aiderServiceName}`, {
          stdio: "inherit",
          cwd: processCwd(),
        });

        // Get container info
        const containerInfo = await getContainerInfo(aiderServiceName);

        // Track the aider process
        const processId = containerInfo?.Id || aiderServiceName;
        if (!aiderProcesses) {
          consoleWarn('[Server_Docker] aiderProcesses not initialized, initializing now');
          aiderProcesses = new Map();
        }
        aiderProcesses.set(processId, {
          id: processId,
          containerId: containerInfo?.Id || 'unknown',
          containerName: aiderServiceName,
          runtime: runtime,
          testName: testName,
          configKey: configKey,
          isActive: true,
          status: 'running',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });

        // Update graph with aider node
        if (updateGraphWithAiderNode) {
          await updateGraphWithAiderNode({
            runtime,
            testName,
            configKey,
            aiderServiceName,
            containerId: containerInfo?.Id
          });
        }

        // Start logging for the aider service
        await startServiceLogging(aiderServiceName, runtime, configKey, testName);
      })()
    ]);

    // Broadcast graph update via WebSocket
    if (resourceChanged) {
      // In unified approach, we broadcast graphUpdated events
      // The actual graph update happens via updateGraphWithAiderNode
      // We'll trigger a refresh for clients
      // TODO This should be defined in API 
      resourceChanged("/~/graph");
    }
    writeConfigForExtension();

    consoleLog(`[Server_Docker] Started aider service: ${aiderServiceName}`);
  } catch (error: any) {
    consoleError(`[Server_Docker] Failed to start aider service ${aiderServiceName}:`, error);
  }
}

// Pure function to create graph operations for aider nodes
export function createAiderNodeGraphOperationsPure(params: {
  runtime: IRunTime;
  testName: string;
  configKey: string;
  aiderServiceName: string;
  containerId?: string;
  timestamp?: string;
}): GraphOperation[] {
  const operations: GraphOperation[] = [];
  const timestamp = params.timestamp || new Date().toISOString();

  // Create aider node ID
  const aiderNodeId = `aider:${params.aiderServiceName}`;

  // Create aider node
  operations.push({
    type: 'addNode',
    data: {
      id: aiderNodeId,
      type: 'aider',
      label: `Aider: ${params.aiderServiceName}`,
      description: `Aider instance for ${params.testName}`,
      status: 'done',
      icon: 'aider',
      metadata: {
        runtime: params.runtime,
        testName: params.testName,
        configKey: params.configKey,
        aiderServiceName: params.aiderServiceName,
        containerId: params.containerId,
        timestamp
      }
    },
    timestamp
  });

  // Create entrypoint node ID (derived from testName) - must match createEntrypointNodeOperationsPure logic
  let entrypointId: string;
  if (params.testName.includes('.') || params.testName.includes('/') || params.testName.includes('\\')) {
    entrypointId = `entrypoint:${params.testName}`;
  } else {
    entrypointId = `entrypoint:${params.configKey}:${params.testName}`;
  }

  // Create edge from entrypoint to aider node
  operations.push({
    type: 'addEdge',
    data: {
      source: entrypointId,
      target: aiderNodeId,
      attributes: {
        type: 'hasAider',
        timestamp
      }
    },
    timestamp
  });

  // If we have a containerId, create edge from aider node to docker process
  if (params.containerId) {
    const dockerProcessId = `docker_process:${params.containerId}`;

    operations.push({
      type: 'addEdge',
      data: {
        source: aiderNodeId,
        target: dockerProcessId,
        attributes: {
          type: 'hasProcess',
          timestamp
        }
      },
      timestamp
    });
  }

  return operations;
}
