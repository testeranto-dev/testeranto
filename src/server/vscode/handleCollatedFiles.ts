import type { TreeNode } from "../stakeholder/StakeholderUtils";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";
import { processTest } from "../serverClasses/Server_Http/utils/handleCollatedFilesUtils";
import { vscodeHttpAPI } from "../../api/vscodeExtensionHttp";
import type { VscodeHttpResponse } from "../../api";

export const handleCollatedFiles = (server: any, request?: Request): Response => {
  // Validate against API definition
  const apiDef = vscodeHttpAPI.getCollatedFiles;

  if (request && request.method !== apiDef.method) {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed for collated-files. Expected ${apiDef.method}`,
      },
      405,
    );
  }

  // Get all runtimes from configs
  const configs = server.configs;
  if (!configs || !configs.runtimes) {
    const response: VscodeHttpResponse<'getCollatedFiles'> = {
      tree: {},
      message: "No runtimes configured",
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getCollatedFiles);
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
        processTest(runtimeKey, runtime, testName, treeRoot);
      } catch (error) {
        console.error(`Error processing ${runtimeKey}/${testName}:`, error);
      }
    }
  }

  const response: VscodeHttpResponse<'getCollatedFiles'> = {
    tree: treeRoot,
    message: "Success",
  };
  return jsonResponse(response, 200, vscodeHttpAPI.getCollatedFiles);
};
