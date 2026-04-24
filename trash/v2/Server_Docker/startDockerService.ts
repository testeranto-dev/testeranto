import type { ITesterantoConfig } from "../../../src/server/Types";
import { startDockerServiceUtil } from "./startDockerServiceUtil";
import { parseServiceInfoPure } from "./parseServiceInfoPure";

export async function startDockerService(
  serviceName: string,
  configs: ITesterantoConfig,
  spawnPromise: (command: string) => Promise<any>,
  consoleLog: (message: string) => void,
  consoleError: (message: string) => void,
  addProcessNodeToGraph: (
    processType: string,
    runtime: any,
    testName: string,
    configKey: string,
    runtimeConfig: any,
    files?: any,
    status?: string
  ) => Promise<void>,
  updateContainerInfoFromDocker: (serviceName: string) => Promise<void>,
  saveGraph: () => void
): Promise<void> {
  await startDockerServiceUtil(
    serviceName,
    spawnPromise,
    consoleLog,
    consoleError
  );

  // Parse service info using pure function
  const { processType, runtime, testName, configKey } = parseServiceInfoPure(serviceName, configs);

  // Only add process node for known service types
  if (processType !== 'docker_process' && configKey !== 'unknown') {
    const runtimeConfig = configs.runtimes[configKey];
    if (runtimeConfig) {
      await addProcessNodeToGraph(
        processType,
        runtime as any,
        testName,
        configKey,
        runtimeConfig
      );

      // Update container info from Docker (update from below)
      // This will query Docker and update the graph
      await updateContainerInfoFromDocker(serviceName);

      // Ensure graph is saved
      saveGraph();
    }
  }
}
