import type { IRunTime } from "../../../Types";
import { launchAiderPure } from "../Server_Docker/utils/launchAiderPure";
import { checkFilesLockedUtil } from "./checkFilesLockedUtil";
import { validateBuilderConfigUtil } from "./validateBuilderConfigUtil";

export async function launchAiderUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  createAiderMessageFile: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  resourceChanged: (path: string) => void,
  writeConfigForExtension: () => void,
  getContainerInfo: (serviceName: string) => Promise<any>,
  aiderProcesses: Map<string, any>,
  graphManager?: any,
  consoleWarn?: (message: string) => void
): Promise<void> {
  // Check if files are locked
  const filesLocked = await checkFilesLockedUtil(graphManager);
  if (filesLocked) {
    consoleWarn?.(`[launchAiderUtil] Skipping aider for ${testName} because files are locked for restart`);
    return;
  }

  // Validate builder config
  const isValid = await validateBuilderConfigUtil(configKey, failedBuilderConfigs);
  if (!isValid) {
    return;
  }

  await launchAiderPure({
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
    updateGraphWithAiderNode: async (params) => {
      await (graphManager as any).updateGraphWithAiderNode(params);
    },
  });
}
