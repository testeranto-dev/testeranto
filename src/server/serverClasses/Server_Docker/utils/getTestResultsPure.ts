import {
  consoleLog,
  existsSync,
  join,
  processCwd,
  readFileSync,
} from "../Server_Docker_Dependents";
import type { TestResultFile } from "../../../types/testResults";
import type { ITesterantoConfig } from "../../../../Types";

export const getTestResultsPure = (
  runtime?: string,
  testName?: string,
  configs?: ITesterantoConfig,
): TestResultFile[] => {
  const testResults: TestResultFile[] = [];
  const cwd = processCwd();
  const reportsDir = join(cwd, "testeranto", "reports");

  // According to SOUL.md: no guessing, no fallbacks
  // We should only collect results for tests that are in the config

  // If configs is not provided, we cannot know which tests to collect
  if (!configs?.runtimes) {
    consoleLog(`[getTestResultsPure] No configs provided, cannot collect test results`);
    return testResults;
  }

  // If both runtime and testName are provided, look for specific test results
  // Note: 'runtime' parameter is actually configKey in this context
  if (runtime && testName) {
    // Only collect if this runtime is in the config
    if (!configs.runtimes[runtime]) {
      consoleLog(`[getTestResultsPure] Runtime ${runtime} not in config, skipping`);
      return testResults;
    }

    // Check if this test is in the config for this runtime
    const runtimeConfig = configs.runtimes[runtime];
    const tests = runtimeConfig.tests || [];
    if (!tests.includes(testName)) {
      consoleLog(`[getTestResultsPure] Test ${testName} not in config for runtime ${runtime}, skipping`);
      return testResults;
    }

    // Construct the exact path where test results should be
    const testResultsPath = join(reportsDir, runtime, testName, "tests.json");

    if (existsSync(testResultsPath)) {
      try {
        const content = readFileSync(testResultsPath, "utf-8");
        const result = JSON.parse(content);

        testResults.push({
          file: "tests.json",
          filePath: testResultsPath,
          relativePath: testName + "/tests.json",
          result: result,
          content: content,
          configKey: runtime,
          testName: testName,
        });
      } catch (error) {
        consoleLog(`[getTestResultsPure] Error reading test results file ${testResultsPath}: ${String(error)}`);
      }
    } else {
      consoleLog(`[getTestResultsPure] Test results not found at ${testResultsPath}`);
    }
  } else {
    // Collect results for all tests in the config
    for (const [configKey, runtimeConfig] of Object.entries(configs.runtimes)) {
      const tests = runtimeConfig.tests || [];

      for (const test of tests) {
        // Construct the exact path where test results should be
        const testResultsPath = join(reportsDir, configKey, test, "tests.json");

        if (existsSync(testResultsPath)) {
          try {
            const content = readFileSync(testResultsPath, "utf-8");
            const result = JSON.parse(content);

            testResults.push({
              file: "tests.json",
              filePath: testResultsPath,
              relativePath: test + "/tests.json",
              result: result,
              content: content,
              configKey: configKey,
              testName: test,
            });
          } catch (error) {
            consoleLog(`[getTestResultsPure] Error reading test results file ${testResultsPath}: ${String(error)}`);
          }
        } else {
          consoleLog(`[getTestResultsPure] Test results not found at ${testResultsPath}`);
        }
      }
    }
  }

  consoleLog(`[getTestResultsPure] Collected ${testResults.length} test results from config`);
  return testResults;
};
