// // DEPRECATED: This class has been replaced by Server_Aider
// // Please use Server_Aider instead for aider message file creation

// import fs from "fs";
// import path from "path";
// import type { IRunTime, ITesterantoConfig } from "../../../Types";
// import type { IMode } from "../../types";
// import { makeReportDirectory } from "../Server_Docker/utils";

// /**
//  * @deprecated Use Server_Aider instead
//  */
// export class AiderMessageManager {
//   constructor(
//     private configs: ITesterantoConfig,
//     private mode: IMode,
//     private getInputFilesForTest: (configKey: string, testName: string) => string[],
//     private getOutputFilesForTest: (configKey: string, testName: string) => string[],
//     private logMessage: (message: string) => void,
//     private logError: (message: string, error?: any) => void
//   ) { 
//     console.warn("AiderMessageManager is deprecated. Use Server_Aider instead.");
//   }

//   async createAiderMessageFile(
//     runtime: IRunTime,
//     testName: string,
//     configKey: string,
//     configValue: any
//   ): Promise<void> {
//     console.warn("AiderMessageManager.createAiderMessageFile is deprecated. Use Server_Aider.createAiderMessageFile instead.");
//     throw new Error("AiderMessageManager is deprecated. Use Server_Aider instead.");
//   }

//   private makePathRelative(filePath: string, projectRoot: string): string {
//     console.warn("AiderMessageManager is deprecated. Use Server_Aider instead.");
//     throw new Error("AiderMessageManager is deprecated. Use Server_Aider instead.");
//   }
// }
