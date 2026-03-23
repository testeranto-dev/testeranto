import fs from "fs";
import {
  consoleLog,
  existsSync,
  join,
  readdirSync,
  readFileSync,
  sep,
} from "../Server_Docker_Dependents";
import { getCwdPure } from "../Server_Docker_Utils";

export const getTestResultsPure = (
  runtime?: string,
  testName?: string,
): any[] => {
  const testResults: any[] = [];
  const cwd = getCwdPure();
  const reportsDir = join(cwd, "testeranto", "reports");

  // Helper function to recursively collect all files
  const collectFiles = (
    dir: string,
    baseConfigKey: string,
    relativePath: string = "",
  ): void => {
    if (!existsSync(dir)) {
      return;
    }

    const items = readdirSync(dir);

    for (const item of items) {
      const itemPath = join(dir, item);
      const stat = fs.statSync(itemPath);
      const currentRelativePath = relativePath
        ? `${relativePath}/${item}`
        : item;

      if (stat.isDirectory()) {
        // Recursively collect files in subdirectories
        collectFiles(itemPath, baseConfigKey, currentRelativePath);
      } else {
        // It's a file
        try {
          let result = null;
          let fileContent = null;

          // For JSON files, try to parse them
          if (item.endsWith(".json")) {
            try {
              const content = readFileSync(itemPath, "utf-8");
              fileContent = content;
              result = JSON.parse(content);
            } catch (parseError) {
              // If we can't parse it as JSON, just include it as a file
              result = null;
            }
          }

          // For other files, we might want to read them differently
          // For now, just mark them as non-JSON files

          testResults.push({
            file: item,
            filePath: itemPath,
            relativePath: currentRelativePath,
            result: result,
            content: fileContent,
            configKey: baseConfigKey, // Store configKey instead of runtime
            testName: relativePath, // The directory path is the test name
            isJson: item.endsWith(".json"),
            size: stat.size,
            modified: stat.mtime.toISOString(),
          });
        } catch (error) {
          consoleLog(
            `[Server_Docker] Error processing file ${itemPath}:`,
            error,
          );
        }
      }
    }
  };

  // If both runtime and testName are provided, look for specific test results
  // Note: 'runtime' parameter is actually configKey in this context
  if (runtime && testName) {
    // Convert testName to a filesystem path
    const testPath = testName.replace(/\//g, sep);
    const outputDir = join(reportsDir, runtime, testPath);

    if (existsSync(outputDir)) {
      collectFiles(outputDir, runtime, testName);
    } else {
      // Try to find any directory that matches the test name pattern
      const configDir = join(reportsDir, runtime);
      if (existsSync(configDir)) {
        // Search for directories that might contain this test
        const searchForTest = (dir: string, currentPath: string = ""): void => {
          const items = readdirSync(dir);

          for (const item of items) {
            const itemPath = join(dir, item);
            const stat = fs.statSync(itemPath);
            const newPath = currentPath ? `${currentPath}/${item}` : item;

            if (stat.isDirectory()) {
              // Check if this directory path matches the test name
              if (newPath.includes(testName) || testName.includes(newPath)) {
                collectFiles(itemPath, runtime, newPath);
              }
              // Also search deeper
              searchForTest(itemPath, newPath);
            }
          }
        };

        searchForTest(configDir);
      }
    }
  } else {
    // Get all config directories (e.g., nodetests, golangtests, etc.)
    const configDirs = readdirSync(reportsDir).filter((item) => {
      const itemPath = join(reportsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const configDir of configDirs) {
      const configPath = join(reportsDir, configDir);

      // Collect all files in this config directory
      collectFiles(configPath, configDir);
    }
  }

  return testResults;
};
