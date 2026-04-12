import type { ITesterantoConfig } from "../../../Types";
import type { IRunTime } from "../../../Types";
import type { IMode } from "../../types";

export async function handleBuilderServices(
  configs: ITesterantoConfig,
  mode: IMode,
  dockerComposeManager: any,
  failedBuilderConfigs: Set<string>,
  addProcessNodeToGraph: (
    processType: 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<Set<string>> {
  const localFailedConfigs = new Set<string>(failedBuilderConfigs);

  // Build builder services with error handling
  try {
    const failedConfigs = await dockerComposeManager.buildWithBuildKit();
    // Store which configs failed
    for (const configKey of failedConfigs) {
      localFailedConfigs.add(configKey);
      consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
    }
  } catch (error) {
    consoleError('[Server_Docker] Builder image build failed:', error as string);
    // Mark all configs as failed to be safe
    for (const configKey of Object.keys(configs.runtimes)) {
      localFailedConfigs.add(configKey);
    }
  }

  // Start builder services with error handling
  try {
    const failedBuilderConfigsFromStart = await dockerComposeManager.startBuilderServices();
    // Store which configs failed
    for (const configKey of failedBuilderConfigsFromStart) {
      localFailedConfigs.add(configKey);
      consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
    }

    // Add builder process nodes to graph for all configs with correct status
    for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
      try {
        const isFailed = localFailedConfigs.has(configKey);
        await addProcessNodeToGraph(
          'builder',
          configValue.runtime as IRunTime,
          'builder',
          configKey,
          configValue,
          undefined,
          isFailed ? 'failed' : 'running'
        );
      } catch (error) {
        consoleError(`[Server_Docker] Error adding builder process node for ${configKey}:`, error as string);
      }
    }
  } catch (error) {
    consoleError('[Server_Docker] Failed to start builder services:', error as string);
    // Mark all configs as failed to be safe
    for (const configKey of Object.keys(configs.runtimes)) {
      localFailedConfigs.add(configKey);
    }
  }

  return localFailedConfigs;
}
