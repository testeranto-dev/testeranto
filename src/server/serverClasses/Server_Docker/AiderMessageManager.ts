import fs from "fs";
import path from "path";
import type { IRunTime, ITestconfigV2 } from "../../../Types";
import type { IMode } from "../../types";
import { makeReportDirectory } from "../Server_Docker/utils";

export class AiderMessageManager {
  constructor(
    private configs: ITestconfigV2,
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
      const outputFilesForTest = this.getOutputFilesForTest(configKey, testName);

      let messageContent = "";
      if (inputFilesForTest.length > 0) {
        messageContent +=
          inputFilesForTest.map((file) => {
            // Remove leading slash if present to make paths relative to workspace root
            const cleanFile = file.startsWith('/') ? file.substring(1) : file;
            return `/add ${cleanFile}`;
          }).join("\n") + "\n\n";
      }
      if (outputFilesForTest.length > 0) {
        messageContent +=
          outputFilesForTest.map((file) => {
            // Remove leading slash if present to make paths relative to workspace root
            const cleanFile = file.startsWith('/') ? file.substring(1) : file;
            return `/read ${cleanFile}`;
          }).join("\n") + "\n\n";
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
}
