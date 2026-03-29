import { existsSync, readFileSync } from "fs";
import type { ITestconfigV2 } from "../../../../Types";
import { getInputFilePath } from "../Server_Docker_Constants";
import { consoleLog } from "../Server_Docker_Dependents";

export const getInputFilesPure = (
  configs: ITestconfigV2,
  inputFiles: Record<string, Record<string, string[]>>,
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
    // Return empty array instead of throwing to prevent crashes
    return [];
  }

  // First, try to get files from in-memory structure
  if (
    inputFiles &&
    typeof inputFiles === "object" &&
    inputFiles[configKey] &&
    typeof inputFiles[configKey] === "object" &&
    inputFiles[configKey][testName]
  ) {
    const files = inputFiles[configKey][testName];
    if (Array.isArray(files) && files.length > 0) {
      // consoleLog(
      //   `[Server_Docker] Found ${files.length} files in memory for ${configKey}/${testName}`,
      // );
      return files;
    }
  }

  // If no files in memory, try to load from the input file directly
  // consoleLog(
  //   `[Server_Docker] No files in memory for ${configKey}/${testName}, trying to load from input file`,
  // );
  try {
    // Use the runtime type from the config, not the parameter
    const configRuntime = configs.runtimes[configKey]?.runtime;
    const inputFilePath = getInputFilePath(configRuntime || runtime, configKey);
    if (existsSync(inputFilePath)) {
      const fileContent = readFileSync(inputFilePath, "utf-8");
      const allTestsInfo = JSON.parse(fileContent);
      if (allTestsInfo[testName]) {
        const testInfo = allTestsInfo[testName];
        const files = testInfo.files || [];
        consoleLog(
          `[Server_Docker] Loaded ${files.length} files from ${inputFilePath} for test ${testName}`,
        );
        return files;
      } else {
        consoleLog(
          `[Server_Docker] Test ${testName} not found in ${inputFilePath}`,
        );
      }
    } else {
      consoleLog(`[Server_Docker] Input file does not exist: ${inputFilePath}`);
    }
  } catch (error: any) {
    consoleLog(`[Server_Docker] Error loading input file: ${error.message}`);
  }

  consoleLog(
    `[Server_Docker] Returning empty array for ${configKey}/${testName}`,
  );
  return [];
};