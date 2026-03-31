import fs from "fs";
import path from "path";
// import { glob } from "glob";
import type { ITesterantoConfig } from "../../../Types";
import { getFileType } from "./getFileType";

export async function generateCollatedFilesTree(
  configs: ITesterantoConfig,
): Promise<Record<string, any>> {
  if (!configs || !configs.runtimes) {
    return {
      type: "directory",
      path: "",
      name: "root",
      children: {},
    };
  }

  // Build a unified tree of all files across all runtimes
  const treeRoot: Record<string, any> = {};

  // For each runtime, fetch input and output files for each test
  const runtimes = configs.runtimes;
  const promises: Promise<void>[] = [];

  for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
    const config = runtimeConfig as any;
    const runtime = config.runtime;
    const tests = config.tests || [];

    for (const testName of tests) {
      promises.push(
        (async () => {
          try {
            // Fetch input files
            const inputResponse = await fetch(
              `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`,
            );
            const inputData = inputResponse.ok
              ? await inputResponse.json()
              : { inputFiles: [] };
            const inputDataTyped = inputData as { inputFiles?: string[] };
            const inputFiles = inputDataTyped.inputFiles || [];

            // Fetch output files
            const outputResponse = await fetch(
              `http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`,
            );
            const outputData = outputResponse.ok
              ? await outputResponse.json()
              : { outputFiles: [] };
            const outputDataTyped = outputData as { outputFiles?: string[] };
            const outputFiles = outputDataTyped.outputFiles || [];

            // Add all input files to the tree
            for (const file of inputFiles) {
              const normalizedPath = file.startsWith("/")
                ? file.substring(1)
                : file;
              const parts = normalizedPath
                .split("/")
                .filter((part: string) => part.length > 0 && part !== ".");

              if (parts.length === 0) continue;

              let currentNode = treeRoot;

              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;

                if (!currentNode[part]) {
                  if (isLast) {
                    currentNode[part] = {
                      type: "file",
                      path: file,
                      name: part,
                      runtime,
                      testName,
                      fileType: "input",
                    };
                  } else {
                    currentNode[part] = {
                      type: "directory",
                      name: part,
                      path: parts.slice(0, i + 1).join("/"),
                      children: {},
                    };
                  }
                } else if (isLast) {
                  // If it's already a file, update with additional info
                  if (currentNode[part].type === "file") {
                    // Keep existing info, but add runtime and testName if not present
                    if (!currentNode[part].runtimes) {
                      currentNode[part].runtimes = [];
                    }
                    if (!currentNode[part].runtimes.includes(runtime)) {
                      currentNode[part].runtimes.push(runtime);
                    }
                    if (!currentNode[part].tests) {
                      currentNode[part].tests = [];
                    }
                    if (!currentNode[part].tests.includes(testName)) {
                      currentNode[part].tests.push(testName);
                    }
                  }
                }

                if (!isLast && currentNode[part].type === "directory") {
                  currentNode = currentNode[part].children;
                }
              }
            }

            // Add all output files to the tree
            for (const file of outputFiles) {
              const normalizedPath = file.startsWith("/")
                ? file.substring(1)
                : file;
              const parts = normalizedPath
                .split("/")
                .filter((part: string) => part.length > 0 && part !== ".");

              if (parts.length === 0) continue;

              let currentNode = treeRoot;

              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;

                if (!currentNode[part]) {
                  if (isLast) {
                    currentNode[part] = {
                      type: "file",
                      path: file,
                      name: part,
                      runtime,
                      testName,
                      fileType: "output",
                    };
                  } else {
                    currentNode[part] = {
                      type: "directory",
                      name: part,
                      path: parts.slice(0, i + 1).join("/"),
                      children: {},
                    };
                  }
                } else if (isLast) {
                  // If it's already a file, update with additional info
                  if (currentNode[part].type === "file") {
                    // Keep existing info, but add runtime and testName if not present
                    if (!currentNode[part].runtimes) {
                      currentNode[part].runtimes = [];
                    }
                    if (!currentNode[part].runtimes.includes(runtime)) {
                      currentNode[part].runtimes.push(runtime);
                    }
                    if (!currentNode[part].tests) {
                      currentNode[part].tests = [];
                    }
                    if (!currentNode[part].tests.includes(testName)) {
                      currentNode[part].tests.push(testName);
                    }
                    // Update fileType to include both if needed
                    if (currentNode[part].fileType === "input") {
                      // If it was already marked as input, now it's both
                      currentNode[part].fileType = "both";
                    } else if (currentNode[part].fileType !== "both") {
                      currentNode[part].fileType = "output";
                    }
                  }
                }

                if (!isLast && currentNode[part].type === "directory") {
                  currentNode = currentNode[part].children;
                }
              }
            }
          } catch (error) {
            console.error(
              `Error processing ${runtimeKey}/${testName}:`,
              error,
            );
          }
        })(),
      );
    }
  }

  // Wait for all fetches to complete
  await Promise.all(promises);

  // Also add test results files from the reports directory
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");
  if (fs.existsSync(reportsDir)) {
    addTestResultsFilesToTree(treeRoot, reportsDir);
  }

  // Add documentation files from configs.documentationGlob
  if (configs.documentationGlob) {
    try {
      // For now, skip glob to avoid import issues
      // const docFiles = glob.sync(configs.documentationGlob, {
      //   cwd: process.cwd(),
      //   ignore: ["**/node_modules/**", "**/.git/**"],
      //   nodir: true,
      // });
      const docFiles: string[] = [];

      for (const file of docFiles) {
        const normalizedPath = file.startsWith("/")
          ? file.substring(1)
          : file;
        const parts = normalizedPath
          .split("/")
          .filter((part: string) => part.length > 0 && part !== ".");

        if (parts.length === 0) continue;

        let currentNode = treeRoot;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;

          if (!currentNode[part]) {
            if (isLast) {
              currentNode[part] = {
                type: "file",
                path: file,
                name: part,
                fileType: "documentation",
              };
            } else {
              currentNode[part] = {
                type: "directory",
                name: part,
                path: parts.slice(0, i + 1).join("/"),
                children: {},
              };
            }
          }

          if (!isLast && currentNode[part].type === "directory") {
            currentNode = currentNode[part].children;
          }
        }
      }
    } catch (error) {
      console.error("Error adding documentation files to tree:", error);
    }
  }

  // Convert the tree to the format expected by the stakeholder app
  const convertTree = (
    node: Record<string, any>,
    currentPath: string = "",
  ): any => {
    if (node.type === "file") {
      const result: any = {
        type: "file",
        path: node.path,
        name: node.name || path.basename(node.path),
        fileType: node.fileType || "file",
        runtime: node.runtime,
        testName: node.testName,
      };

      // Only try to parse JSON files that are likely test results
      const isJsonFile =
        node.path &&
        (node.path.endsWith(".json") ||
          node.path.endsWith("tests.json") ||
          path.basename(node.path) === "tests.json");

      // Check if it's a test results file (in reports directory)
      const isInReportsDir =
        node.path && node.path.includes("testeranto/reports/");
      const isTestResultsFile = isJsonFile && isInReportsDir;

      if (isTestResultsFile && node.path) {
        try {
          const content = fs.readFileSync(node.path, "utf-8");
          // First, check if the content looks like JSON
          const trimmedContent = content.trim();
          if (
            trimmedContent.startsWith("{") ||
            trimmedContent.startsWith("[")
          ) {
            const testData = JSON.parse(content);
            result.testData = testData;
            result.fileType = "test-results";
          } else {
            // Not valid JSON, keep as regular file
            console.log(
              `File ${node.path} is not valid JSON, skipping parse`,
            );
          }
        } catch (error) {
          // If parsing fails, it's not a valid JSON file
          console.log(`Error parsing JSON from ${node.path}:`, error instanceof Error ? error.message : String(error));
          // Keep as regular file, don't set testData
        }
      }

      return result;
    } else if (node.type === "directory") {
      const children: Record<string, any> = {};
      for (const [childName, childNode] of Object.entries(
        node.children || {},
      )) {
        children[childName] = convertTree(
          childNode as Record<string, any>,
          currentPath ? `${currentPath}/${childName}` : childName,
        );
      }
      return {
        type: "directory",
        path: node.path || currentPath,
        name: node.name || path.basename(currentPath) || "root",
        children: children,
      };
    }
    return node;
  };

  // Convert the entire tree
  const convertedTree: Record<string, any> = {};
  for (const [key, node] of Object.entries(treeRoot)) {
    convertedTree[key] = convertTree(node as Record<string, any>, key);
  }

  // Return as a single root node
  return {
    type: "directory",
    path: "",
    name: "root",
    children: convertedTree,
  };
}

function addTestResultsFilesToTree(
  treeRoot: Record<string, any>,
  reportsDir: string,
): void {
  const addFilesToTree = (dir: string, relativePath: string = "") => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        const itemRelativePath = relativePath
          ? `${relativePath}/${item}`
          : item;

        if (stat.isDirectory()) {
          addFilesToTree(fullPath, itemRelativePath);
        } else {
          // Add ALL files, including logs
          const fileType = getFileType(item);

          // Add file to tree
          const parts = itemRelativePath
            .split("/")
            .filter((part) => part.length > 0);
          if (parts.length === 0) continue;

          let currentNode = treeRoot;

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (!currentNode[part]) {
              if (isLast) {
                currentNode[part] = {
                  type: "file",
                  path: fullPath,
                  name: part,
                  fileType: fileType,
                };
              } else {
                currentNode[part] = {
                  type: "directory",
                  name: part,
                  path: parts.slice(0, i + 1).join("/"),
                  children: {},
                };
              }
            }

            if (!isLast && currentNode[part].type === "directory") {
              currentNode = currentNode[part].children;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  };

  addFilesToTree(reportsDir);
}
