import path from "path";
import fs from "fs";
import { jsonResponse } from "./jsonResponse";
import { vscodeHttpAPI, VscodeHttpResponse } from "../../../api";

export const handleOutputFiles = (url: URL, server: any, request?: Request): Response => {
  // Validate against API definition
  const apiDef = vscodeHttpAPI.getOutputFiles;

  if (request && request.method !== apiDef.method) {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed for outputfiles. Expected ${apiDef.method}`,
      },
      405,
    );
  }

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

  // First, try to use the server's getOutputFiles method if available
  const getOutputFiles = server.getOutputFiles;
  if (typeof getOutputFiles === "function") {
    const outputFiles = getOutputFiles(runtime, testName);
    if (outputFiles && outputFiles.length > 0) {
      const response: VscodeHttpResponse<'getOutputFiles'> = {
        runtime,
        testName,
        outputFiles: outputFiles,
        message: "Success",
      };
      return jsonResponse(response, 200, vscodeHttpAPI.getOutputFiles);
    }
  }

  // Output files are organized by runtime directory
  // Look for files in testeranto/reports/ - we need to find directories that match either runtime or runtimeKey
  const reportsBaseDir = path.join(process.cwd(), "testeranto", "reports");
  const outputFiles: string[] = [];

  if (!fs.existsSync(reportsBaseDir)) {
    const response: VscodeHttpResponse<'getOutputFiles'> = {
      runtime,
      testName,
      outputFiles: [],
      message: "No reports directory found",
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getOutputFiles);
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

  const response: VscodeHttpResponse<'getOutputFiles'> = {
    runtime,
    testName,
    outputFiles: uniqueFiles,
    message: `Found ${uniqueFiles.length} output files for runtime ${runtime}`,
  };
  return jsonResponse(response, 200, vscodeHttpAPI.getOutputFiles);
};
