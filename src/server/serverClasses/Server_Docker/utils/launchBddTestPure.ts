import { spawnPromise } from ".";
import type { IRunTime } from "../../../../Types";
import { generateUid, getBddServiceName } from "../Server_Docker_Constants";

export const launchBddTestPure = async (
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
  const bddServiceName = getBddServiceName(uid);

  try {
    // Start the service and logging in parallel
    const [startResult] = await Promise.allSettled([
      spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${bddServiceName}`,
      ),
      // Start logging immediately without waiting for service to fully start
      startServiceLogging(bddServiceName, runtime, configKey, testName),
    ]);

    // Only capture existing logs if the service start failed
    if (startResult.status === 'rejected') {
      captureExistingLogs(bddServiceName, runtime, configKey, testName);
    }

    resourceChanged();
    writeConfigForExtension();
  } catch (error: any) {
    // Even if starting failed, try to capture any logs that might exist
    captureExistingLogs(bddServiceName, runtime, configKey, testName);
    // Still update the config even if there's an error
    writeConfigForExtension();
  }
};
