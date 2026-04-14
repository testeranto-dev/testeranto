// import type { IRunTime } from "../../../Types";
// import { addProcessNodeToGraphPure } from "../Server_Docker/addProcessNodeToGraphPure";
// import { clearStoredLogs } from "../Server_Docker/clearStoredLogs";
// import { captureExistingLogs } from "../Server_Docker/utils";
// import { launchBddTestPure } from "../Server_Docker/utils/launchBddTestPure";
// import { launchChecksPure } from "../Server_Docker/utils/launchChecksPure";

// export async function launchBddTestUtil(
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
//   // Check if graphManager is provided and has a graph property
//   if (graphManager && graphManager.graph) {
//     // const lockManager = new LockManager(graphManager.graph);

//     // Check if any file nodes are locked by system restart
//     if (lockManager.hasLockedFiles()) {
//       console.log(`[launchBddTestUtil] Skipping BDD test ${testName} because files are locked for restart`);
//       return;
//     }
//   } else {
//     console.log(`[launchBddTestUtil] No graphManager provided, skipping lock check for ${testName}`);
//   }

//   if (failedBuilderConfigs.has(configKey)) {
//     console.log(`[launchBddTestUtil] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
//     return;
//   }

//   if (createAiderMessageFile) {
//     await createAiderMessageFile(runtime, testName, configKey, configValue);
//   }

//   await launchBddTestPure(
//     runtime,
//     testName,
//     configKey,
//     configValue,
//     (serviceName, runtime, configKey, testName) => {
//       clearStoredLogs(serviceName, configKey, testName as string);
//       return captureExistingLogs(serviceName, runtime, configKey, testName);
//     },
//     (serviceName, runtime, configKey, testName) =>
//       startServiceLogging(serviceName, runtime, configKey, testName as string),
//     () => resourceChanged("/~/graph"),
//     writeConfigForExtension,
//   );
// }
