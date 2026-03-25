import { spawnPromise } from ".";
import type { IRunTime } from "../../../../Types";
import { generateUid, getCheckServiceName, type IR } from "../Server_Docker_Constants";

export const launchChecksPure = async (
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  captureExistingLogs: (serviceName: string, runtime: string, configKey: string, testName?: string) => void,
  startServiceLogging: (serviceName: string, runtime: string, configKey: string, testName?: string) => Promise<void>,
  resourceChanged: () => void,
  writeConfigForExtension: () => void,
): Promise<void> => {
  const uid = generateUid(configKey, testName);
  const checks = configValue.checks || [];
  for (let i = 0; i < checks.length; i++) {
    const checkServiceName = getCheckServiceName(uid, i);
    try {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`,
      );
      // Capture any existing logs first
      captureExistingLogs(checkServiceName, runtime, configKey, testName);
      await startServiceLogging(checkServiceName, runtime, configKey, testName);
      resourceChanged();
    } catch (error: any) {
      captureExistingLogs(checkServiceName, runtime, configKey, testName);
    }
  }

  writeConfigForExtension();
};
