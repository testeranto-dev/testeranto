import type { IRunTime } from "../../../Types";

export async function launchChecksUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  writeConfigForExtension: () => void,
  resourceChanged: (path: string) => void,
  graphManager?: any,
  createAiderMessageFile?: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>
): Promise<void> {
  console.log(`[launchChecksUtil] Launching checks for test ${testName} for config ${configKey}`);

  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    console.warn(`[launchChecksUtil] Skipping checks for test ${testName} because builder failed for config ${configKey}`);
    return;
  }

  const checks = configValue.checks || [];
  for (let i = 0; i < checks.length; i++) {
    // Start service logging for each check
    await startServiceLogging(`${configKey}-check-${i}`, runtime, configKey, testName);

    // Write config for extension
    writeConfigForExtension();

    // Notify resource changed
    resourceChanged(`/~/checks/${configKey}/${testName}/${i}`);

    // Create aider message file if needed
    if (createAiderMessageFile) {
      await createAiderMessageFile(runtime, testName, configKey, configValue);
    }

    // Update graph if graphManager is available
    if (graphManager && typeof (graphManager as any).updateGraphWithCheck === 'function') {
      await (graphManager as any).updateGraphWithCheck({
        runtime,
        testName,
        configKey,
        configValue,
        checkIndex: i,
        type: 'check'
      });
    }
  }
}
