import { existsSync, readFileSync, watch } from "fs";
import { join } from "path";
import { consoleLog, consoleWarn, processCwd } from "../Server_Docker_Dependents";

export const watchTestResults = (
  configKey: string,
  testName: string,
  runtime: string,
  onTestCompleted: (
    configKey: string,
    testName: string,
    testResults: any,
    testsJsonPath: string
  ) => void
): void => {
  const cwd = processCwd();
  const reportDir = join(cwd, "testeranto", "reports", configKey, testName);
  
  if (!existsSync(reportDir)) {
    consoleWarn(`[watchTestResults] Report directory does not exist: ${reportDir}`);
    return;
  }

  const testsJsonPath = join(reportDir, "tests.json");
  
  // Check if tests.json already exists
  if (existsSync(testsJsonPath)) {
    try {
      const content = readFileSync(testsJsonPath, 'utf-8');
      const testResults = JSON.parse(content);
      consoleLog(`[watchTestResults] Found existing tests.json for ${testName}`);
      onTestCompleted(configKey, testName, testResults, testsJsonPath);
    } catch (error: any) {
      consoleWarn(`[watchTestResults] Error reading existing tests.json: ${error.message}`);
    }
  }

  // Watch for changes to tests.json
  watch(reportDir, (eventType, filename) => {
    if (filename === 'tests.json') {
      consoleLog(`[watchTestResults] tests.json changed for ${testName}`);
      try {
        if (existsSync(testsJsonPath)) {
          const content = readFileSync(testsJsonPath, 'utf-8');
          const testResults = JSON.parse(content);
          onTestCompleted(configKey, testName, testResults, testsJsonPath);
        }
      } catch (error: any) {
        consoleWarn(`[watchTestResults] Error reading tests.json: ${error.message}`);
      }
    }
  });
  
  consoleLog(`[watchTestResults] Started watching tests.json for ${testName} in ${reportDir}`);
};
