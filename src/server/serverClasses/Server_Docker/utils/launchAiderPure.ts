import { execSync } from "child_process";
import type { IRunTime } from "../../../../Types";
import { generateUid, getAiderServiceName } from "../Server_Docker_Constants";
import { consoleError, consoleLog, consoleWarn, processCwd } from "../Server_Docker_Dependents";

export async function launchAiderPure({
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
}: {
  runtime: IRunTime;
  testName: string;
  configKey: string;
  configValue: any;
  failedBuilderConfigs: Set<string>;
  createAiderMessageFile: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>;
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName?: string) => Promise<void>;
  resourceChanged: (path: string) => void;
  writeConfigForExtension: () => void;
  getContainerInfo: (serviceName: string) => Promise<any>;
  aiderProcesses: Map<string, any>;
}): Promise<void> {
  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    consoleLog(`[Server_Docker] Skipping aider for ${testName} because builder failed for config ${configKey}`);
    return;
  }

  // Create aider message file and launch aider in parallel
  const uid = generateUid(configKey, testName);
  const aiderServiceName = getAiderServiceName(uid);

  try {
    // Run both operations in parallel
    await Promise.all([
      createAiderMessageFile(runtime, testName, configKey, configValue),
      (async () => {
        // Start the aider service
        execSync(`docker compose -f "${processCwd()}/testeranto/docker-compose.yml" up -d ${aiderServiceName}`, {
          stdio: "inherit",
          cwd: processCwd(),
        });

        // Get container info
        const containerInfo = await getContainerInfo(aiderServiceName);

        // Track the aider process
        const processId = containerInfo?.Id || aiderServiceName;
        if (!aiderProcesses) {
          consoleWarn('[Server_Docker] aiderProcesses not initialized, initializing now');
          aiderProcesses = new Map();
        }
        aiderProcesses.set(processId, {
          id: processId,
          containerId: containerInfo?.Id || 'unknown',
          containerName: aiderServiceName,
          runtime: runtime,
          testName: testName,
          configKey: configKey,
          isActive: true,
          status: 'running',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });

        // Start logging for the aider service
        await startServiceLogging(aiderServiceName, runtime, configKey, testName);
      })()
    ]);

    resourceChanged("/~/processes");
    resourceChanged("/~/aider-processes");
    writeConfigForExtension();

    consoleLog(`[Server_Docker] Started aider service: ${aiderServiceName}`);
  } catch (error: any) {
    consoleError(`[Server_Docker] Failed to start aider service ${aiderServiceName}:`, error);
  }
}
