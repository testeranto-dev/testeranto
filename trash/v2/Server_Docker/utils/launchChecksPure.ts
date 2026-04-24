import { spawnPromise } from ".";
import type { IRunTime } from "../../../../src/server/Types";
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

  // Launch all checks in parallel
  const checkPromises = checks.map(async (check: any, i: number) => {
    const checkServiceName = getCheckServiceName(uid, i);
    try {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${checkServiceName}`,
      );
      // Start logging immediately
      await startServiceLogging(checkServiceName, runtime, configKey, testName);
    } catch (error: any) {
      captureExistingLogs(checkServiceName, runtime, configKey, testName);
    }
  });

  // Wait for all checks to be launched
  await Promise.allSettled(checkPromises);

  resourceChanged();
  writeConfigForExtension();
};
