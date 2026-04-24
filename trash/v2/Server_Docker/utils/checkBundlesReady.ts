import { existsSync } from "fs";
import type { ITesterantoConfig } from "../../../../src/server/Types";

export function checkBundlesReady(
  configs: ITesterantoConfig,
  cwd: string,
  failedBuilderConfigs: Set<string>
): boolean {
  // Check all runtime configs
  for (const [configKey] of Object.entries(configs.runtimes)) {
    // Skip configs that have already failed
    if (failedBuilderConfigs.has(configKey)) {
      continue;
    }

    const bundleDir = `${cwd}/testeranto/bundles/${configKey}`;
    const inputFilesPath = `${bundleDir}/inputFiles.json`;

    // If any required bundle is missing, bundles are not ready
    if (!existsSync(inputFilesPath)) {
      return false;
    }
  }

  // All non-failed bundles are present
  return true;
}
