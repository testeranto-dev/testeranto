import fs from "fs";
import path from "path";

export const getInputFilesForTest = (runtime: string, testName: string): string[] => {
  // Similar logic to handleInputFiles but without HTTP response
  // First, try to find inputFiles.json in the bundles directory
  const inputFilesPath = path.join(
    process.cwd(),
    "testeranto",
    "bundles",
    runtime,
    "inputFiles.json",
  );

  if (!fs.existsSync(inputFilesPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(inputFilesPath, "utf-8");
    const inputFilesData = JSON.parse(content);

    // Try to find matching test entry
    let matchedFiles: string[] = [];

    // 1. Exact match
    if (inputFilesData[testName] && inputFilesData[testName].files) {
      matchedFiles = inputFilesData[testName].files;
    } else {
      // 2. Try variations
      const possibleKeys = Object.keys(inputFilesData);

      // Common pattern: testName might be src/ts/Calculator.test.ts but key is src/ts/Calculator.test.node.ts
      // Try to find a key that contains the testName (without extension) as a substring
      const testNameWithoutExt = testName.replace(/\.[^/.]+$/, "");

      for (const key of possibleKeys) {
        const keyWithoutExt = key.replace(/\.[^/.]+$/, "");
        if (
          keyWithoutExt.includes(testNameWithoutExt) ||
          testNameWithoutExt.includes(keyWithoutExt)
        ) {
          matchedFiles = inputFilesData[key].files || [];
          break;
        }
      }

      // 3. If still not found, try any key that ends with the same filename
      if (matchedFiles.length === 0) {
        const testFileName = path.basename(testName);
        for (const key of possibleKeys) {
          const keyFileName = path.basename(key);
          if (
            keyFileName.includes(testFileName) ||
            testFileName.includes(keyFileName)
          ) {
            matchedFiles = inputFilesData[key].files || [];
            break;
          }
        }
      }
    }

    return matchedFiles;
  } catch (error: any) {
    console.error(
      `Error reading input files for ${runtime}/${testName}:`,
      error,
    );
    return [];
  }
};

export const getOutputFilesForTest = (runtime: string, testName: string): string[] => {
  // Similar logic to handleOutputFiles but without HTTP response
  const outputFiles: string[] = [];

  // Output files are organized by runtime directory
  // Look for files in testeranto/reports/
  const reportsBaseDir = path.join(process.cwd(), "testeranto", "reports");

  if (!fs.existsSync(reportsBaseDir)) {
    return [];
  }

  // Get all directories in reports
  const collectFilesFromReports = (): void => {
    try {
      const items = fs.readdirSync(reportsBaseDir);
      for (const item of items) {
        const fullPath = path.join(reportsBaseDir, item);
        const stat = fs.statSync(fullPath);

        // Check if this directory name contains the runtime or is likely related
        if (stat.isDirectory()) {
          // Include directories that contain the runtime name or are likely matches
          const dirName = item.toLowerCase();
          const runtimeLower = runtime.toLowerCase();

          // Check if directory name contains runtime, or runtime contains directory name
          // Also check for common patterns like "rusttests" containing "rust"
          if (
            dirName.includes(runtimeLower) ||
            runtimeLower.includes(dirName) ||
            dirName.includes(runtimeLower.replace(/tests$/, "")) ||
            dirName.includes(runtimeLower.replace(/test$/, ""))
          ) {
            // Collect all files in this directory
            const collectAllFiles = (dir: string): void => {
              try {
                const subItems = fs.readdirSync(dir);
                for (const subItem of subItems) {
                  const subFullPath = path.join(dir, subItem);
                  const subStat = fs.statSync(subFullPath);

                  if (subStat.isDirectory()) {
                    collectAllFiles(subFullPath);
                  } else {
                    const relativePath = path.relative(
                      process.cwd(),
                      subFullPath,
                    );
                    outputFiles.push(relativePath);
                  }
                }
              } catch (error) {
                console.error(`Error scanning directory ${dir}:`, error);
              }
            };

            collectAllFiles(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning reports directory:`, error);
    }
  };

  collectFilesFromReports();

  // Also check for files in testeranto/bundles/
  const bundlesBaseDir = path.join(process.cwd(), "testeranto", "bundles");
  if (fs.existsSync(bundlesBaseDir)) {
    const collectFilesFromBundles = (): void => {
      try {
        const items = fs.readdirSync(bundlesBaseDir);
        for (const item of items) {
          const fullPath = path.join(bundlesBaseDir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            const dirName = item.toLowerCase();
            const runtimeLower = runtime.toLowerCase();

            if (
              dirName.includes(runtimeLower) ||
              runtimeLower.includes(dirName) ||
              dirName.includes(runtimeLower.replace(/tests$/, "")) ||
              dirName.includes(runtimeLower.replace(/test$/, ""))
            ) {
              const collectAllFiles = (dir: string): void => {
                try {
                  const subItems = fs.readdirSync(dir);
                  for (const subItem of subItems) {
                    const subFullPath = path.join(dir, subItem);
                    const subStat = fs.statSync(subFullPath);

                    if (subStat.isDirectory()) {
                      collectAllFiles(subFullPath);
                    } else {
                      const relativePath = path.relative(
                        process.cwd(),
                        subFullPath,
                      );
                      outputFiles.push(relativePath);
                    }
                  }
                } catch (error) {
                  console.error(`Error scanning directory ${dir}:`, error);
                }
              };

              collectAllFiles(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning bundles directory:`, error);
      }
    };
    collectFilesFromBundles();
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(outputFiles)];
  return uniqueFiles;
};

export const getExitCodeFromFile = (
  filePath: string,
): { code: string; color: string } => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      const code = content || "unknown";
      // Determine color based on exit code
      let color = "gray";
      if (code !== "unknown") {
        const num = parseInt(code, 10);
        if (!isNaN(num)) {
          if (num === 0) {
            color = "green";
          } else if (num > 0) {
            color = "yellow";
          } else {
            color = "red";
          }
        }
      }
      return { code, color };
    }
  } catch (error) {
    console.error(`Error reading exit code from ${filePath}:`, error);
  }
  return { code: "unknown", color: "gray" };
};
