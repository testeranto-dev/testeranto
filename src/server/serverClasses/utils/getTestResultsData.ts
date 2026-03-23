/**
 * Get test results data from reports directory
 */
export async function getTestResultsData(): Promise<any> {
  const fs = require("fs").promises;
  const path = require("path");
  const { existsSync } = require("fs");

  const resultsDir = path.join(process.cwd(), "testeranto", "reports");
  if (!existsSync(resultsDir)) {
    return {};
  }

  const testResults: Record<string, any> = {};

  // Look for all JSON files in the reports directory
  const files = await fs.readdir(resultsDir);
  for (const file of files) {
    if (file.endsWith(".json") && file !== "data.json") {
      const filePath = path.join(resultsDir, file);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content);
        // Use the filename without extension as the key
        const key = file.replace(".json", "");
        testResults[key] = data;
      } catch (error) {
        console.error(
          `[utils] Failed to read test results file ${file}: ${error}`,
        );
      }
    }
  }

  return testResults;
}
