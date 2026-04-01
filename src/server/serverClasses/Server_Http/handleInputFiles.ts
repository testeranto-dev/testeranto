import path from "path";
import fs from "fs";
import { jsonResponse } from "./jsonResponse";
import type { VscodeHttpResponse } from "../../../api";
import { vscodeHttpAPI } from "../../../api/vscodeExtensionHttp";

export const handleInputFiles = (url: URL, server: any, request?: Request): Response => {
  // Validate against API definition
  const apiDef = vscodeHttpAPI.getInputFiles;

  if (request && request.method !== apiDef.method) {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed for inputfiles. Expected ${apiDef.method}`,
      },
      405,
    );
  }

  const runtime = url.searchParams.get("runtime");
  const testName = url.searchParams.get("testName");

  // Validate required query parameters using API query type
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
      const response: VscodeHttpResponse<'getInputFiles'> = {
        runtime,
        testName,
        inputFiles: inputFiles,
        message: "Success",
      };
      return jsonResponse(response, 200, vscodeHttpAPI.getInputFiles);
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
    const response: VscodeHttpResponse<'getInputFiles'> = {
      runtime,
      testName,
      inputFiles: [],
      message: "Input files not found",
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getInputFiles);
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

    const response: VscodeHttpResponse<'getInputFiles'> = {
      runtime,
      testName,
      inputFiles: matchedFiles,
      message:
        matchedFiles.length > 0 ? "Success" : "No matching input files found",
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getInputFiles);
  } catch (error: any) {
    const response: VscodeHttpResponse<'getInputFiles'> = {
      runtime,
      testName,
      inputFiles: [],
      message: `Error reading input files: ${error.message}`,
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getInputFiles);
  }
};
