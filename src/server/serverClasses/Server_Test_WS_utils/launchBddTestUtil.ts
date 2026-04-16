import type { IRunTime } from "../../../Types";
import { generateBddTestUpdatesPure } from "../Server_Docker_Test_utils/generateBddTestUpdatesPure";

export async function launchBddTestUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  writeConfigForExtension: () => void,
  resourceChanged: (path: string) => void,
  addProcessNodeToGraph: (
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ) => Promise<void>,
  applyUpdate: (update: any) => void,
  getBddServiceName: (configKey: string, testName: string) => string,
  startDockerService: (serviceName: string) => Promise<void>,
  getContainerInfo: (serviceName: string) => Promise<any>,
  consoleLog: (...args: any[]) => void,
  consoleError: (...args: any[]) => void,
  graphManager?: any,
  createAiderMessageFile?: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>
): Promise<void> {
  consoleLog(`[launchBddTestUtil] Launching BDD test ${testName} for config ${configKey}`);

  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    consoleLog(`[launchBddTestUtil] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
    return;
  }

  // Add process node to graph first
  await addProcessNodeToGraph(
    'bdd',
    runtime,
    testName,
    configKey,
    configValue,
    undefined,
    'running'
  );

  // Generate updates and service name using pure function
  const { updates, serviceName } = generateBddTestUpdatesPure(
    testName,
    configKey,
    getBddServiceName,
    consoleLog,
    consoleError
  );

  // Apply updates to graph
  for (const update of updates) {
    applyUpdate(update);
  }

  // Start the Docker service (side effect)
  try {
    await startDockerService(serviceName);
    
    // Get container info from the graph
    const containerInfo = await getContainerInfo(serviceName);
    const containerId = containerInfo?.Id;
    
    // Update the process node with container information if available
    const bddProcessId = `bdd_process:${configKey}:${testName}`;
    const updateTimestamp = new Date().toISOString();
    
    const metadataUpdate: any = {
      serviceName: serviceName,
      updatedAt: updateTimestamp
    };
    
    if (containerId) {
      metadataUpdate.containerId = containerId;
      metadataUpdate.containerInfo = containerInfo;
      consoleLog(`[launchBddTestUtil] Updated BDD process ${bddProcessId} with container ${containerId}`);
    } else {
      consoleLog(`[launchBddTestUtil] Container info not yet available for ${serviceName}, updating process node without container info`);
    }
    
    const containerUpdate = {
      operations: [{
        type: 'updateNode' as const,
        data: {
          id: bddProcessId,
          metadata: metadataUpdate
        },
        timestamp: updateTimestamp
      }],
      timestamp: updateTimestamp
    };
    applyUpdate(containerUpdate);
  } catch (error: any) {
    consoleError(`[launchBddTestUtil] Failed to start service ${serviceName}:`, error);
    
    // Update process node status to failed
    const bddProcessId = `bdd_process:${configKey}:${testName}`;
    const failureTimestamp = new Date().toISOString();
    const failureUpdate = {
      operations: [{
        type: 'updateNode' as const,
        data: {
          id: bddProcessId,
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            finishedAt: failureTimestamp
          }
        },
        timestamp: failureTimestamp
      }],
      timestamp: failureTimestamp
    };
    applyUpdate(failureUpdate);
    throw error;
  }

  // Start service logging with the actual service name
  await startServiceLogging(serviceName, runtime as string, configKey, testName);

  // Write config for extension
  writeConfigForExtension();

  // Notify resource changed
  resourceChanged(`/~/tests/${configKey}/${testName}`);

  // Create aider message file if needed
  if (createAiderMessageFile) {
    await createAiderMessageFile(runtime, testName, configKey, configValue);
  }

  // Update graph if graphManager is available
  if (graphManager && typeof (graphManager as any).updateGraphWithTest === 'function') {
    await (graphManager as any).updateGraphWithTest({
      runtime,
      testName,
      configKey,
      configValue,
      type: 'bdd'
    });
  }
}
