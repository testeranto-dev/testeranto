// import type { IRunTime } from "../../../Types";
// import { clearStoredLogs } from "../Server_Docker/clearStoredLogs";
// import { captureExistingLogs } from "../Server_Docker/utils";
// import { launchChecksPure } from "../Server_Docker/utils/launchChecksPure";

// export async function launchChecksUtil(
//   runtime: IRunTime,
//   testName: string,
//   configKey: string,
//   configValue: any,
//   failedBuilderConfigs: Set<string>,
//   startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
//   writeConfigForExtension: () => void,
//   resourceChanged: (path: string) => void,
//   graphManager?: any,
//   createAiderMessageFile?: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>
// ): Promise<void> {
//   console.log(`[launchChecksUtil] Launching checks for ${testName}`);

//   // Check if files are locked before running checks
//   if (graphManager && graphManager.graph) {
//     // const lockManager = new LockManager(graphManager.graph);

//     // Check if any file nodes are locked by system restart
//     if (lockManager.hasLockedFiles()) {
//       console.log(`[launchChecksUtil] Skipping checks for ${testName} because files are locked for restart`);
//       return;
//     }
//   } else {
//     console.log(`[launchChecksUtil] No graphManager provided, skipping lock check for ${testName}`);
//   }

//   if (failedBuilderConfigs.has(configKey)) {
//     console.log(`[launchChecksUtil] Skipping checks for ${testName} because builder failed for config ${configKey}`);
//     return;
//   }

//   if (createAiderMessageFile) {
//     await createAiderMessageFile(runtime, testName, configKey, configValue);
//   }

//   await launchChecksPure(
//     runtime,
//     testName,
//     configKey,
//     configValue,
//     (serviceName, runtime, configKey, testName) => {
//       clearStoredLogs(serviceName, configKey, testName);
//       return captureExistingLogs(serviceName, runtime, configKey, testName);
//     },
//     (serviceName, runtime, configKey, testName) =>
//       startServiceLogging(serviceName, runtime, configKey, testName),
//     () => resourceChanged("/~/graph"),
//     writeConfigForExtension,
//   );
// }
