// import type { IRunTime, ITesterantoConfig } from "../../src/Types";
// import type { IMode } from "../../src/server/types";
// import { Server_Test_WS } from "../Server_Test_WS";
// import { consoleLog, consoleError } from "./Server_Docker/Server_Docker_Dependents";
// import { makeReportDirectory } from "./Server_Docker/utils";

// export abstract class Server_Aider extends Server_Test_WS {
//   constructor(configs: ITesterantoConfig, mode: IMode) {
//     super(configs, mode);
//   }

//   async createAiderMessageFile(
//     runtime: IRunTime,
//     testName: string,
//     configKey: string,
//     configValue: any
//   ): Promise<void> {
//     try {
//       const reportDir = makeReportDirectory(testName, configKey);

//       // Create the report directory if it doesn't exist
//       const fs = await import("fs");
//       if (!fs.existsSync(reportDir)) {
//         fs.mkdirSync(reportDir, { recursive: true });
//       }

//       const path = await import("path");
//       const messageFilePath = path.join(reportDir, "aider-message.txt");

//       // Get input files for the test
//       const inputFiles = this.getInputFiles(configKey, testName);

//       // Get the project root directory
//       const projectRoot = process.cwd();

//       let messageContent = "";

//       // Include all input files, but exclude aider-message.txt to avoid circular reference
//       const filteredInputFiles = inputFiles.filter(file =>
//         !file.includes('aider-message.txt')
//       );

//       if (filteredInputFiles.length > 0) {
//         messageContent +=
//           filteredInputFiles.map((file) => {
//             // Convert absolute path to relative path
//             const relativePath = this.makePathRelative(file, projectRoot);
//             return `/add ${relativePath}`;
//           }).join("\n") + "\n\n";
//       }

//       // Get test-specific output files
//       const parentReportDir = path.dirname(reportDir);

//       // Transform the test file name to match the log file naming pattern
//       const testFileName = path.basename(testName);
//       const cleanTestName = testFileName
//         .toLowerCase()
//         .replace(/\./g, '-')
//         .replace(/[^a-z0-9-]/g, '');

//       // Get the runtime config to know how many checks there are
//       const runtimeConfig = this.configs.runtimes[configKey];
//       const checksCount = runtimeConfig?.checks?.length || 0;

//       // Always look for bdd log
//       const bddLogPath = path.join(parentReportDir, `${cleanTestName}_bdd.log`);
//       if (fs.existsSync(bddLogPath)) {
//         const relativeBddLogPath = this.makePathRelative(bddLogPath, projectRoot);
//         messageContent += `/read ${relativeBddLogPath}\n`;
//       }

//       // Look for check logs based on checks count
//       for (let i = 0; i < checksCount; i++) {
//         const checkLogPath = path.join(parentReportDir, `${cleanTestName}_check-${i}.log`);
//         if (fs.existsSync(checkLogPath)) {
//           const relativeCheckLogPath = this.makePathRelative(checkLogPath, projectRoot);
//           messageContent += `/read ${relativeCheckLogPath}\n`;
//         }
//       }

//       // Add the tests.json file from the test-specific directory
//       const testsJsonPath = path.join(reportDir, "tests.json");
//       if (fs.existsSync(testsJsonPath)) {
//         const relativeTestsJsonPath = this.makePathRelative(testsJsonPath, projectRoot);
//         messageContent += `/read ${relativeTestsJsonPath}\n`;
//       }

//       if (messageContent.includes('/read')) {
//         messageContent += "\n";
//       }

//       messageContent += "Observe these reports and apply. Fix any failing tests, and if that is done, cleanup this code.\n\n";

//       fs.writeFileSync(messageFilePath, messageContent);
//       consoleLog(
//         `[Server_Aider] Created aider message file at ${messageFilePath}`,
//       );
//     } catch (error: any) {
//       consoleError(
//         `[Server_Aider] Failed to create aider message file:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   private makePathRelative(filePath: string, projectRoot: string): string {
//     // If the file path is already relative, return it as is
//     const path = require("path");
//     if (!path.isAbsolute(filePath)) {
//       return filePath;
//     }

//     try {
//       // Make the path relative to the project root
//       let relativePath = path.relative(projectRoot, filePath);

//       // If the path is outside the project root, return the original
//       if (relativePath.startsWith('..')) {
//         // Try to make it relative from a different perspective
//         // For now, return a cleaned version of the absolute path
//         return filePath.replace(projectRoot, '').replace(/^[\\/]+/, '');
//       }

//       // Ensure the path uses forward slashes (for consistency)
//       relativePath = relativePath.replace(/\\/g, '/');

//       // Ensure the path doesn't start with a slash
//       if (relativePath.startsWith('/')) {
//         relativePath = relativePath.substring(1);
//       }

//       return relativePath;
//     } catch (error) {
//       // If there's an error, return a cleaned version
//       return filePath.replace(projectRoot, '').replace(/^[\\/]+/, '');
//     }
//   }
// }
