import path from "path";
import fs from "fs";
import { jsonResponse } from "./jsonResponse";

export const handleInputFiles = (url: URL, server: any): Response => {
  const runtime = url.searchParams.get("runtime");
  const testName = url.searchParams.get("testName");

  if (!runtime || !testName) {
    return jsonResponse(
      {
        error: "Missing runtime or testName",
      },
      400,
    );
  }

  // First, try to use the server's getInputFiles method if available
  const getInputFiles = server.getInputFiles;
  if (typeof getInputFiles === "function") {
    const inputFiles = getInputFiles(runtime, testName);
    if (inputFiles && inputFiles.length > 0) {
      return jsonResponse({
        runtime,
        testName,
        inputFiles: inputFiles,
        message: "Success",
      });
    }
  }

  // Fallback: try to read inputFiles.json directly
  const inputFilesPath = path.join(
    process.cwd(),
    "testeranto",
    "bundles",
    runtime,
    "inputFiles.json",
  );

  if (!fs.existsSync(inputFilesPath)) {
    return jsonResponse({
      runtime,
      testName,
      inputFiles: [],
      message: "Input files not found",
    });
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

    return jsonResponse({
      runtime,
      testName,
      inputFiles: matchedFiles,
      message:
        matchedFiles.length > 0 ? "Success" : "No matching input files found",
    });
  } catch (error: any) {
    return jsonResponse({
      runtime,
      testName,
      inputFiles: [],
      message: `Error reading input files: ${error.message}`,
    });
  }
};
