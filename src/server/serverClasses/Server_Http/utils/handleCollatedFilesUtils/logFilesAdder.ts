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

  const logGroups: Record<string, { logFile: string; exitCodeFile?: string }> = {};

  for (const logFile of logFiles) {
    const baseName = path.basename(logFile);
    let groupName = "Other Logs";

    if (baseName.includes("-bdd.log")) {
      groupName = "BDD";
    } else if (baseName.includes("-check-")) {
      const match = baseName.match(/check-(\d+)\.log/);
      if (match) {
        groupName = `check${match[1]}`;
      }
    }

    const exitCodeFile = outputFiles.find((f) => {
      const fBase = path.basename(f);
      return (
        fBase === baseName.replace(".log", ".exitcode") ||
        fBase === baseName.replace(".log", ".container.exitcode")
      );
    });

    logGroups[groupName] = {
      logFile,
      exitCodeFile,
    };
  }

  if (!testNode.children) {
    testNode.children = {};
  }

  for (const [groupName, files] of Object.entries(logGroups)) {
    const exitCodeInfo = files.exitCodeFile
      ? getExitCodeFromFile(files.exitCodeFile)
      : { code: "unknown", color: "gray" };

    const label = `${groupName} - ${exitCodeInfo.code}`;

    testNode.children[label] = {
      type: "file",
      path: files.logFile,
      runtime,
      runtimeKey,
      testName,
      fileType: "log",
      exitCode: exitCodeInfo.code,
      exitCodeColor: exitCodeInfo.color,
      groupName,
      description: `Click to show ${path.basename(files.logFile)}`,
    };
  }
};
