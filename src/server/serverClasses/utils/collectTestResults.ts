/**
 * Collect test results from reports directory
 */
export async function collectTestResults(
  reportsDir: string,
): Promise<Record<string, any>> {
  const fs = require("fs").promises;
  const path = require("path");
  const { existsSync } = require("fs");

  const testResults: Record<string, any> = {};

  console.log(`[utils] collectTestResults: looking in ${reportsDir}`);

  if (!existsSync(reportsDir)) {
    console.log(`[utils] Reports directory does not exist: ${reportsDir}`);
    return testResults;
  }

  // Walk through the reports directory to find all tests.json files
  const walk = async (dir: string, basePath: string = ""): Promise<void> => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      console.log(`[utils] Walking ${dir}, found ${entries.length} entries`);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath
          ? path.join(basePath, entry.name)
          : entry.name;

        if (entry.isDirectory()) {
          console.log(`[utils] Entering directory: ${entry.name}`);
          await walk(fullPath, relativePath);
        } else if (entry.isFile() && entry.name === "tests.json") {
          console.log(`[utils] Found tests.json at: ${relativePath}`);
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const testData = JSON.parse(content);

            // The directory structure can help us identify which test this belongs to
            // Typically: testeranto/reports/{configKey}/{testName}/tests.json
            // Where testName is the test entrypoint path
            const pathParts = relativePath.split("/");
            console.log(`[utils] Path parts for ${relativePath}:`, pathParts);

            if (pathParts.length >= 3) {
              // The structure is: reports/{configKey}/{testName}/tests.json
              const configKey = pathParts[0]; // First part after reports
              // The testName is everything between configKey and tests.json
              const testNameParts = pathParts.slice(1, -1); // Remove configKey and tests.json
              const testName = testNameParts.join("/");
              const key = `${configKey}/${testName}`;
              testResults[key] = testData;
              console.log(
                `[utils] Mapped to key: ${key} (configKey: ${configKey}, testName: ${testName})`,
              );
            } else {
              console.warn(
                `[utils] Unexpected path structure for tests.json: ${relativePath} (${pathParts.length} parts)`,
              );
            }
          } catch (error) {
            console.warn(
              `[utils] Could not read test results file ${fullPath}: ${error}`,
            );
          }
        }
      }
    } catch (error) {
      console.warn(`[utils] Error walking directory ${dir}: ${error}`);
    }
  };

  // Start walking from the reports directory
  await walk(reportsDir);
  console.log(
    `[utils] Collected ${Object.keys(testResults).length} test results`,
  );

  // Log all collected test results for debugging
  for (const [key, value] of Object.entries(testResults)) {
    console.log(
      `[utils] Test result key: ${key}, has testJob: ${!!value.testJob}`,
    );
  }

  return testResults;
}
