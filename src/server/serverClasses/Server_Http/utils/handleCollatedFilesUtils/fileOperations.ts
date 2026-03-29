import fs from "fs";
import path from "path";

export const getInputFilesForTest = (runtime: string, testName: string): string[] => {
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

    let matchedFiles: string[] = [];

    // 1. Exact match
    if (inputFilesData[testName] && inputFilesData[testName].files) {
      matchedFiles = inputFilesData[testName].files;
    } else {
      const possibleKeys = Object.keys(inputFilesData);
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
  const outputFiles: string[] = [];
  const reportsBaseDir = path.join(process.cwd(), "testeranto", "reports");

  if (!fs.existsSync(reportsBaseDir)) {
    return [];
  }

  // First, find the runtime directory
  const findRuntimeDir = (): string | null => {
    try {
      const items = fs.readdirSync(reportsBaseDir);
      for (const item of items) {
        const fullPath = path.join(reportsBaseDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const dirName = item.toLowerCase();
          const runtimeLower = runtime.toLowerCase();

          // Check if this directory matches the runtime
          if (
            dirName.includes(runtimeLower) ||
            runtimeLower.includes(dirName) ||
            dirName.includes(runtimeLower.replace(/tests$/, "")) ||
            dirName.includes(runtimeLower.replace(/test$/, ""))
          ) {
            return fullPath;
          }
        }
      }
    } catch (error) {
      console.error(`Error finding runtime directory:`, error);
    }
    return null;
  };

  const runtimeDir = findRuntimeDir();
  if (!runtimeDir) {
    return [];
  }

  // Now, find the test-specific directory within the runtime directory
  // The test name might be something like "src/lib/tiposkripto/tests/calculator/calculator-test-node-ts"
  // We need to look for a directory that matches the test name
  
  // Helper function to find test directory
  const findTestDir = (dir: string, testNameParts: string[]): string | null => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Check if this directory name matches any part of the test name
          const dirName = item.toLowerCase();
          
          // Try to match with test name parts
          for (const part of testNameParts) {
            const partLower = part.toLowerCase();
            if (dirName.includes(partLower) || partLower.includes(dirName)) {
              // This might be the test directory, but we need to check if it contains the full test path
              // For now, assume it's correct and collect files from it
              return fullPath;
            }
          }
          
          // Recursively search in subdirectories
          const found = findTestDir(fullPath, testNameParts);
          if (found) {
            return found;
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for test directory:`, error);
    }
    return null;
  };

  // Split test name into parts for matching
  const testNameParts = testName.split('/').filter(part => part.length > 0);
  const testDir = findTestDir(runtimeDir, testNameParts);

  // Collect files from the test directory if found, otherwise from runtime directory
  const collectDir = testDir || runtimeDir;

  // Helper function to collect all files recursively from a directory
  const collectAllFilesRecursive = (dir: string): void => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          collectAllFilesRecursive(fullPath);
        } else {
          const relativePath = path.relative(process.cwd(), fullPath);
          outputFiles.push(relativePath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  };

  // Collect files from the target directory
  collectAllFilesRecursive(collectDir);

  // Also collect from bundles directory (but only for this runtime)
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
              // Only collect files from bundles if they're for this runtime
              collectAllFilesRecursive(fullPath);
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
