// import type { ITesterantoConfig } from "../../../Types";
// import type { IMode } from "../../types";
// import type { GraphUpdate } from "../../../graph";
// import { setupTestNodes } from "./dockerTestSetupUtils";

// export async function startDockerPure(
//   configs: ITesterantoConfig,
//   mode: IMode,
//   failedBuilderConfigs: Set<string>,
//   // Pure functions that return data or operations
//   makeReportDirectory: (testName: string, configKey: string) => string,
//   getTestManager: () => any,
//   // Functions that return GraphUpdate
//   updateTestStatusInGraphPure: (testName: string, status: string) => Promise<GraphUpdate>,
//   updateEntrypointForServiceStartPure: (testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider') => Promise<GraphUpdate>,
//   consoleLog: (message: string) => void,
//   consoleError: (message: string, error?: any) => void
// ): Promise<GraphUpdate[]> {
//   // This function will contain the logic that was in Server_Docker.start()
//   // But for now, we'll just call setupTestNodes
//   return await setupTestNodes(
//     configs,
//     mode,
//     failedBuilderConfigs,
//     makeReportDirectory,
//     getTestManager,
//     updateTestStatusInGraphPure,
//     updateEntrypointForServiceStartPure,
//     consoleLog,
//     consoleError
//   );
// }
