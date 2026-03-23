import fs from "fs";
import path from "path";
import type { ITestconfigV2 } from "../../../../Types";

export async function collectAllTestResults(
  configs: ITestconfigV2,
): Promise<Record<string, any>> {
  if (!configs || !configs.runtimes) {
    return {};
  }

  const allTestResults: Record<string, any> = {};
  const runtimes = configs.runtimes;
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");

  // Helper function to find all tests.json files
  const findAllTestsJsonFiles = (dir: string): string[] => {
    let results: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            results = results.concat(findAllTestsJsonFiles(fullPath));
          } else if (item === "tests.json") {
            results.push(fullPath);
          }
        } catch {
          // Skip if we can't stat
        }
      }
    } catch {
      // Skip if we can't read directory
    }
    return results;
  };

  // First, collect all tests.json files
  const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);

  // Process each runtime and test
  for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
    const config = runtimeConfig as any;
    const runtime = config.runtime;
    const tests = config.tests || [];

    if (!allTestResults[runtimeKey]) {
      allTestResults[runtimeKey] = {};
    }

    for (const testName of tests) {
      // Try to find a matching tests.json file
      let found = false;
      for (const filePath of allTestsJsonFiles) {
        // Only process actual JSON files
        if (!filePath.endsWith(".json") && !filePath.endsWith("tests.json")) {
          continue;
        }

        const normalizedPath = filePath.toLowerCase();
        const runtimeLower = runtime.toLowerCase();
        const testNameLower = testName.toLowerCase();

        // Extract test name from path (last directory before tests.json)
        const dirName = path.dirname(filePath);
        const lastDir = path.basename(dirName).toLowerCase();

        // Check various patterns
        const containsRuntime = normalizedPath.includes(runtimeLower);
        const containsTestName =
          normalizedPath.includes(testNameLower) ||
          lastDir.includes(testNameLower.replace(/\./g, "")) ||
          testNameLower.includes(lastDir);

        if (containsRuntime && containsTestName) {
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            // Check if content is valid JSON before parsing
            const trimmedContent = content.trim();
            if (
              trimmedContent.startsWith("{") ||
              trimmedContent.startsWith("[")
            ) {
              const testData = JSON.parse(content);
              allTestResults[runtimeKey][testName] = testData;
              found = true;
              break;
            } else {
              console.log(`File ${filePath} is not valid JSON, skipping`);
            }
          } catch (error) {
            console.error(
              `Error reading test results from ${filePath}:`,
              error.message,
            );
          }
        }
      }

      // If not found, try to find in runtime directory
      if (!found) {
        const runtimeDir = path.join(reportsDir, runtime);
        if (fs.existsSync(runtimeDir)) {
          const runtimeTestsJsonFiles = findAllTestsJsonFiles(runtimeDir);
          for (const filePath of runtimeTestsJsonFiles) {
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              const testData = JSON.parse(content);
              allTestResults[runtimeKey][testName] = testData;
              found = true;
              break;
            } catch (error) {
              // Continue
            }
          }
        }
      }

      // If still not found, leave empty
      if (!found) {
        console.log(`No test results found for ${runtimeKey}/${testName}`);
      }
    }
  }

  return allTestResults;
}
