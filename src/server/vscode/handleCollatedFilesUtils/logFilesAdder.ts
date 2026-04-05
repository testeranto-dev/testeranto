import path from "path";
import type { TreeNode } from "./types";
import { getExitCodeFromFile } from "./fileOperations";

export const addLogFilesToTestNode = (
  testNode: TreeNode,
  outputFiles: string[],
  runtime: string,
  runtimeKey: string,
  testName: string
): void => {
  const logFiles = outputFiles.filter(
    (f) => f.endsWith(".log") && !f.includes("build.log")
  );

  if (logFiles.length === 0) {
    return;
  }

  if (!testNode.children) {
    testNode.children = {};
  }

  // Create a logs directory to contain all log files
  const logsDirKey = "logs";
  if (!testNode.children[logsDirKey]) {
    testNode.children[logsDirKey] = {
      type: "directory",
      name: "Logs",
      children: {},
    };
  }

  const logsDir = testNode.children[logsDirKey];
  if (!logsDir.children) {
    logsDir.children = {};
  }

  // Add each log file individually
  for (const logFile of logFiles) {
    const baseName = path.basename(logFile);
    
    // Find corresponding exit code file
    const exitCodeFile = outputFiles.find((f) => {
      const fBase = path.basename(f);
      return (
        fBase === baseName.replace(".log", ".exitcode") ||
        fBase === baseName.replace(".log", ".container.exitcode")
      );
    });

    const exitCodeInfo = exitCodeFile
      ? getExitCodeFromFile(exitCodeFile)
      : { code: "unknown", color: "gray" };

    // Create a descriptive label
    let label = baseName;
    if (exitCodeInfo.code !== "unknown") {
      label = `${baseName} (exit: ${exitCodeInfo.code})`;
    }

    // Use the filename as the key, but ensure it's unique
    const fileKey = baseName.replace(/[^a-zA-Z0-9]/g, "_");
    
    logsDir.children[fileKey] = {
      type: "file",
      path: logFile,
      runtime,
      runtimeKey,
      testName,
      fileType: "log",
      exitCode: exitCodeInfo.code,
      exitCodeColor: exitCodeInfo.color,
      description: `Log file: ${baseName}`,
    };
  }

  // Note: BDD logs are already added to the "logs" directory above
  // No need to add them again at the top level
};
