import { spawnPromise } from ".";
import type { IRunTime } from "../../../../Types";
import { generateUid, getBddServiceName } from "../Server_Docker_Constants";

export const launchBddTestPure = async (
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  captureExistingLogs: (serviceName: string, runtime: string) => void,
  startServiceLogging: (serviceName: string, runtime: string) => Promise<void>,
  resourceChanged: () => void,
  writeConfigForExtension: () => void,
): Promise<void> => {
  const uid = generateUid(configKey, testName);
  const bddServiceName = getBddServiceName(uid);

  try {
    await spawnPromise(
      `docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`,
    );

    await captureExistingLogs(bddServiceName, runtime);

    await startServiceLogging(bddServiceName, runtime);

    resourceChanged();
    writeConfigForExtension();
  } catch (error: any) {
    // Even if starting failed, try to capture any logs that might exist
    captureExistingLogs(bddServiceName, runtime);
    // Still update the config even if there's an error
    writeConfigForExtension();
  }
};
