import fs from "fs";
import path from "path";
import type { IRunTime, ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { makeReportDirectory } from "../Server_Docker/utils";

export class AiderMessageManager {
  constructor(
    private configs: ITesterantoConfig,
    private mode: IMode,
    private getInputFilesForTest: (configKey: string, testName: string) => string[],
    private getOutputFilesForTest: (configKey: string, testName: string) => string[],
    private logMessage: (message: string) => void,
    private logError: (message: string, error?: any) => void
  ) { }

  async createAiderMessageFile(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any
  ): Promise<void> {
    try {
      const reportDir = makeReportDirectory(testName, configKey);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const messageFilePath = path.join(reportDir, "aider-message.txt");
      const inputFilesForTest = this.getInputFilesForTest(configKey, testName);

      // Get the project root directory
      const projectRoot = process.cwd();

      let messageContent = "";

      // Include all input files, but exclude aider-message.txt to avoid circular reference
      const filteredInputFiles = inputFilesForTest.filter(file =>
        !file.includes('aider-message.txt')
      );

      if (filteredInputFiles.length > 0) {
        messageContent +=
          filteredInputFiles.map((file) => {
            // Convert absolute path to relative path
            const relativePath = this.makePathRelative(file, projectRoot);
            return `/add ${relativePath}`;
          }).join("\n") + "\n\n";
      }

      // Get test-specific output files using configs
      // The logs are in the parent directory of reportDir
      // reportDir is where aider-message.txt is written (e.g., Rectangle.test.ts directory)
      // But logs are in the parent directory
      const parentReportDir = path.dirname(reportDir);

      // First, transform the test file name (not full path) to match the log file naming pattern
      // Example: "Rectangle.test.ts" -> "rectangle-test-ts"
      const testFileName = path.basename(testName);
      const cleanTestName = testFileName
        .toLowerCase()
        .replace(/\./g, '-')        // Replace dots with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric except hyphens

      // Get the runtime config to know how many checks there are
      const runtimeConfig = this.configs.runtimes[configKey];
      const checksCount = runtimeConfig?.checks?.length || 0;

      // Always look for bdd log
      const bddLogPath = path.join(parentReportDir, `${cleanTestName}_bdd.log`);
      if (fs.existsSync(bddLogPath)) {
        const relativeBddLogPath = this.makePathRelative(bddLogPath, projectRoot);
        messageContent += `/read ${relativeBddLogPath}\n`;
      } else {
        console.error(`${bddLogPath} was not found`)
      }

      // Look for check logs based on checks count
      for (let i = 0; i < checksCount; i++) {
        const checkLogPath = path.join(parentReportDir, `${cleanTestName}_check-${i}.log`);
        if (fs.existsSync(checkLogPath)) {
          const relativeCheckLogPath = this.makePathRelative(checkLogPath, projectRoot);
          messageContent += `/read ${relativeCheckLogPath}\n`;
        } else {
          console.error(`${checkLogPath} was not found`)
        }
      }


      // Add the tests.json file from the test-specific directory (which is reportDir)
      const testsJsonPath = path.join(reportDir, "tests.json");
      if (fs.existsSync(testsJsonPath)) {
        const relativeTestsJsonPath = this.makePathRelative(testsJsonPath, projectRoot);
        messageContent += `/read ${relativeTestsJsonPath}\n`;
      } else {
        console.error(`${testsJsonPath} was not found`)
      }

      if (messageContent.includes('/read')) {
        messageContent += "\n";
      }

      messageContent += "Observe these reports and apply. Fix any failing tests, and if that is done, cleanup this code.\n\n";

      fs.writeFileSync(messageFilePath, messageContent);
      this.logMessage(
        `[Server_Docker] Created aider message file at ${messageFilePath}`,
      );
    } catch (error: any) {
      this.logError(
        `[Server_Docker] Failed to create aider message file:`,
        error,
      );
    }
  }

  private makePathRelative(filePath: string, projectRoot: string): string {
    // If the file path is already relative, return it as is
    if (!path.isAbsolute(filePath)) {
      return filePath;
    }

    try {
      // Make the path relative to the project root
      let relativePath = path.relative(projectRoot, filePath);

      // If the path is outside the project root, return the original
      if (relativePath.startsWith('..')) {
        // Try to make it relative from a different perspective
        // For now, return a cleaned version of the absolute path
        return filePath.replace(projectRoot, '').replace(/^[\\/]+/, '');
      }

      // Ensure the path uses forward slashes (for consistency)
      relativePath = relativePath.replace(/\\/g, '/');

      // Ensure the path doesn't start with a slash
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }

      return relativePath;
    } catch (error) {
      // If there's an error, return a cleaned version
      return filePath.replace(projectRoot, '').replace(/^[\\/]+/, '');
    }
  }
}
