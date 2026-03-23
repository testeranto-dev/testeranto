import type { ITestconfigV2 } from "../../../../Types";
import { consoleLog } from "../Server_Docker_Dependents";

export const getOutputFilesPure = (
  configs: ITestconfigV2,
  outputFiles: Record<string, Record<string, string[]>>,
  runtime: string,
  testName: string,
): string[] => {
  let configKey: string | null = null;

  // First, try to find config where configValue.runtime === runtime
  for (const [key, configValue] of Object.entries(configs.runtimes)) {
    if (
      configValue.runtime === runtime &&
      configValue.tests.includes(testName)
    ) {
      configKey = key;
      break;
    }
  }

  // If not found, try to find config where key === runtime (config key passed instead of runtime type)
  if (!configKey) {
    for (const [key, configValue] of Object.entries(configs.runtimes)) {
      if (key === runtime && configValue.tests.includes(testName)) {
        configKey = key;
        break;
      }
    }
  }

  if (!configKey) {
    consoleLog(
      `[Server_Docker] No config found for runtime ${runtime} and test ${testName}`,
    );
    return [];
  }

  // Check if we have output files in memory under the configKey
  if (
    outputFiles &&
    typeof outputFiles === "object" &&
    outputFiles[configKey] &&
    typeof outputFiles[configKey] === "object" &&
    outputFiles[configKey][testName]
  ) {
    const files = outputFiles[configKey][testName];
    consoleLog(
      `[Server_Docker] Found ${files.length} output files in memory for ${configKey}/${testName}`,
    );
    return Array.isArray(files) ? files : [];
  }

  consoleLog(
    `[Server_Docker] No output files in memory for ${configKey}/${testName}`,
  );
  return [];
};
