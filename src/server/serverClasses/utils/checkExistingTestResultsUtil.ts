import type { ITesterantoConfig } from "../../../Types";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export async function checkExistingTestResultsUtil(
  configs: ITesterantoConfig,
  processCwd: () => string,
  handleTestCompleted: (configKey: string, testName: string, testResults: any, testsJsonPath: string) => Promise<void>,
  consoleWarn: (message: string) => void
): Promise<void> {
  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    const tests = configValue.tests || [];

    for (const testName of tests) {
      const cwd = processCwd();
      const reportDir = join(cwd, "testeranto", "reports", configKey, testName);
      const testsJsonPath = join(reportDir, "tests.json");

      if (existsSync(testsJsonPath)) {
        try {
          const content = readFileSync(testsJsonPath, 'utf-8');
          const testResults = JSON.parse(content);
          await handleTestCompleted(configKey, testName, testResults, testsJsonPath);
        } catch (error: any) {
          consoleWarn(`[Server_Docker_Test] Error reading existing tests.json for ${testName}: ${error.message}`);
        }
      }
    }
  }
}
