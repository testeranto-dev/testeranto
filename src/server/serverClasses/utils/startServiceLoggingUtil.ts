import type { GraphManager } from "../../graph";
import { clearStoredLogs } from "../Server_Docker/clearStoredLogs";
import { createLogFileNodePure } from "../Server_Docker/createLogFileNodePure";
import { startServiceLoggingPure } from "../Server_Docker/utils/startServiceLoggingPure";
import { processCwd } from "../Server_Docker/Server_Docker_Dependents";

export const startServiceLoggingUtil = async (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName: string,
  clearStoredLogsFn: typeof clearStoredLogs,
  startServiceLoggingPureFn: typeof startServiceLoggingPure,
  createLogFileNodePureFn: typeof createLogFileNodePure,
  processCwdFn: typeof processCwd,
  graphManager: GraphManager,
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
    (logFilePath, serviceName, runtime, runtimeConfigKey, testName) => {
      createLogFileNodePureFn(
        logFilePath,
        serviceName,
        runtime,
        runtimeConfigKey,
        testName,
        graphManager
      );
    }
  );
  writeConfigForExtension();
};
