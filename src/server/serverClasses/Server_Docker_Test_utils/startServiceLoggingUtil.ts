import { clearStoredLogs } from "../Server_Docker/clearStoredLogs";
import { startServiceLoggingPure } from "../Server_Docker/utils/startServiceLoggingPure";
import { processCwd } from "../Server_Docker/Server_Docker_Dependents";

export const startServiceLoggingUtil = async (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName: string,
  clearStoredLogsFn: typeof clearStoredLogs,
  startServiceLoggingPureFn: typeof startServiceLoggingPure,
  createLogFileNode: (
    logFilePath: string,
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
    testName: string
  ) => void,
  processCwdFn: typeof processCwd,
  writeConfigForExtension: () => void
): Promise<void> => {
  clearStoredLogsFn(serviceName, runtimeConfigKey, testName);

  await startServiceLoggingPureFn(
    serviceName,
    runtime,
    processCwdFn(),
    new Map(),
    runtimeConfigKey,
    testName,
    createLogFileNode
  );
  writeConfigForExtension();
};
