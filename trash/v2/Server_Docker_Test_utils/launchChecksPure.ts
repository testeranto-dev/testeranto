import type { IRunTime } from "../../../src/server/Types";

export async function launchChecksPure(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  addProcessNodeToGraph: (
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ) => Promise<void>,
  getBaseServiceName: (configKey: string, testName: string) => string,
  generateChecksUpdatesPure: (
    testName: string,
    configKey: string,
    getBaseServiceName: (configKey: string, testName: string) => string,
    consoleLog: (message: string) => void
  ) => { updates: any[]; serviceNames: string[] },
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  applyUpdate: (update: any) => void,
  startDockerService: (serviceName: string) => Promise<void>,
  getContainerInfo: (serviceName: string) => Promise<any>,
  getProcessNode: (processId: string) => any | null,
  startServiceLogging?: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>
): Promise<void> {
  // Add process node to graph first
  await addProcessNodeToGraph(
    'check',
    runtime,
    testName,
    configKey,
    configValue,
    undefined,
    'running'
  );

  // Generate updates and service names using pure function
  const { updates, serviceNames } = generateChecksUpdatesPure(
    testName,
    configKey,
    getBaseServiceName,
    consoleLog
  );

  // Apply updates to graph
  for (const update of updates) {
    applyUpdate(update);
  }

  // Start the Docker services (side effects)
  for (const serviceName of serviceNames) {
    try {
      await startDockerService(serviceName);

      // Start service logging for check services if provided
      if (startServiceLogging) {
        await startServiceLogging(serviceName, runtime as string, configKey, testName);
      }

      // Get container info after starting
      const containerInfo = await getContainerInfo(serviceName);
      const containerId = containerInfo?.Id;

      if (containerId) {
        // Update the process node with container information
        // For checks, we need to find the right process node
        // Since there could be multiple checks, we'll update based on serviceName
        const checkProcessId = `check_process:${configKey}:${testName}`;
        const updateTimestamp = new Date().toISOString();
        const containerUpdate = {
          operations: [{
            type: 'updateNode' as const,
            data: {
              id: checkProcessId,
              metadata: {
                containerId: containerId,
                serviceName: serviceName,
                containerInfo: containerInfo,
                updatedAt: updateTimestamp
              }
            },
            timestamp: updateTimestamp
          }],
          timestamp: updateTimestamp
        };
        applyUpdate(containerUpdate);
        consoleLog(`[launchChecks] Updated check process ${checkProcessId} with container ${containerId}`);
      }
    } catch (error) {
      consoleError(`[launchChecks] Failed to start service ${serviceName}:`, error);
      // Update process node status to failed
      // For simplicity, we'll just log the error
    }
  }
}
