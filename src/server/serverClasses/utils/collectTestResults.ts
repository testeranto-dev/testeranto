import type { ITesterantoConfig } from "../../../Types";

/**
 * Collect test results based on configuration only
 * According to SOUL.md: no guessing, no fallbacks
 * Only collect results for tests explicitly defined in the config
 */
export async function collectTestResults(
  reportsDir: string,
  configs?: ITesterantoConfig
): Promise<Record<string, any>> {
  const fs = require("fs").promises;
  const path = require("path");
  const { existsSync } = require("fs");

  const testResults: Record<string, any> = {};

  if (!configs?.runtimes) {
    console.warn(`[utils] No runtimes in config, cannot collect test results`);
    return testResults;
  }

  if (!existsSync(reportsDir)) {
    console.warn(`[utils] Reports directory does not exist: ${reportsDir}`);
    return testResults;
  }

  // Only collect results for tests defined in the config
  for (const [configKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const tests = (runtimeConfig as any).tests || [];
    
    for (const testName of tests) {
      // Construct the expected path for this test's results
      // Format: testeranto/reports/{configKey}/{testName}/tests.json
      const testResultsPath = path.join(reportsDir, configKey, testName, "tests.json");
      
      if (existsSync(testResultsPath)) {
        try {
          const content = await fs.readFile(testResultsPath, "utf-8");
          const testData = JSON.parse(content);
          const key = `${configKey}/${testName}`;
          testResults[key] = testData;
        } catch (error) {
          console.warn(
            `[utils] Could not read test results file ${testResultsPath}: ${error}`,
          );
        }
      } else {
        // According to SOUL.md: no fallbacks, no guessing
        // If the file doesn't exist, we don't create placeholder data
        console.debug(`[utils] Test results not found for ${configKey}/${testName} at ${testResultsPath}`);
      }
    }
  }

  console.log(`[utils] Collected test results for ${Object.keys(testResults).length} tests from config`);
  return testResults;
}
