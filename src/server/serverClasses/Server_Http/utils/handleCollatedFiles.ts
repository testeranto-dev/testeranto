import { jsonResponse } from "./jsonResponse";
import { processTest } from "./handleCollatedFilesUtils/index";
import type { TreeNode } from "./handleCollatedFilesUtils/index";

export const handleCollatedFiles = (server: any): Response => {
  // Get all runtimes from configs
  const configs = server.configs;
  if (!configs || !configs.runtimes) {
    return jsonResponse({
      tree: {},
      message: "No runtimes configured",
    });
  }

  // Build a unified tree of all files across all runtimes
  const treeRoot: Record<string, TreeNode> = {};

  // For each runtime, get input and output files for each test
  const runtimes = configs.runtimes;

  for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
    const config = runtimeConfig as any;
    const runtime = config.runtime;
    const tests = config.tests || [];

    for (const testName of tests) {
      try {
        console.log(
          `[DEBUG] Processing ${runtime}/${testName}`,
        );
        processTest(runtimeKey, runtime, testName, treeRoot);
      } catch (error) {
        console.error(`Error processing ${runtimeKey}/${testName}:`, error);
      }
    }
  }

  console.log("[collation]", JSON.stringify(treeRoot, null, 2));

  return jsonResponse({
    tree: treeRoot,
    message: "Success",
  });
};
