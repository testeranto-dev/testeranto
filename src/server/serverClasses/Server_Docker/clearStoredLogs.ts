import path from "path";
import fs from "fs";
import { processCwd, consoleLog, consoleWarn } from "./Server_Docker_Dependents";

export const clearStoredLogs = (configKey: string, testName: string, serviceName: string) => {
  // Clear any stored log files for this service
  const reportsDir = `${processCwd()}/testeranto/reports/${configKey}`;
  try {
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);

      // Determine which files to delete
      for (const file of files) {
        let shouldDelete = false;

        if (testName) {
          // Try to match the file naming pattern
          const cleanedTestName = testName.toLowerCase().replace(/\./g, '-').replace(/[^a-z0-9_\-/]/g, '');
          // The file should contain the cleaned test name and end with .log
          if (file.includes(cleanedTestName) && file.endsWith('.log')) {
            shouldDelete = true;
          }
        } else {
          // If no testName, delete files that might be related to the service
          // This is less precise but necessary for builder services
          if (file.includes(serviceName) && file.endsWith('.log')) {
            shouldDelete = true;
          }
        }

        if (shouldDelete) {
          const filePath = path.join(reportsDir, file);
          fs.unlinkSync(filePath);
          consoleLog(`[clearStoredLogs] Deleted old log file: ${filePath}`);
        }
      }
    }
  } catch (error) {
    consoleWarn(`[clearStoredLogs] Error clearing logs for ${serviceName}: ${error}`);
  }
}