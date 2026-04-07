import { existsSync, readFileSync, mkdirSync, watchFile, watch } from "fs";
import { join } from "path";
import type { IRunTime, ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { getInputFilePath, getFullReportDir } from "../Server_Docker_Constants";
import {
  consoleWarn,
  consoleLog,
  processCwd,
} from "../Server_Docker_Dependents";

// Pure function to watch output files
export const watchInputFilePure = async (
  runtime: IRunTime,
  testsName: string,
  configs: ITesterantoConfig,
  mode: IMode,
  inputFiles: Record<string, Record<string, string[]>>,
  hashs: Record<string, Record<string, string>>,
  setState: (
    inputFiles: Record<string, Record<string, string[]>>,
    hashs: Record<string, Record<string, string>>,
  ) => void,
  launchBddTest: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) => Promise<void>,
  launchChecks: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ) => Promise<void>,
  informAider: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any,
  ) => Promise<void>,
  resourceChanged: (path: string) => void,
  loadInputFileOnce: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
  ) => void,
  updateGraphWithInputFiles?: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
    inputFiles: string[],
  ) => Promise<void>,
): Promise<{
  inputFiles: Record<string, Record<string, string[]>>;
  hashs: Record<string, Record<string, string>>;
}> => {
  let configKey: string = "";
  for (const [key, configValue] of Object.entries(configs.runtimes)) {
    if (
      configValue.runtime === runtime &&
      configValue.tests.includes(testsName)
    ) {
      configKey = key;
      break;
    }
  }

  let inputFilePath: string;
  try {
    inputFilePath = getInputFilePath(runtime, configKey);
  } catch (error: any) {
    consoleWarn(
      `[Server_Docker] No input file path for ${runtime}/${configKey}: ${error.message}`,
    );
    return { inputFiles, hashs };
  }

  const newInputFiles = { ...inputFiles };
  const newHashs = { ...hashs };

  if (!newInputFiles[configKey]) {
    newInputFiles[configKey] = {};
  }

  if (!existsSync(inputFilePath)) {
    consoleWarn(`${inputFilePath} does not exist yet.`);
    return { inputFiles: newInputFiles, hashs: newHashs };
  }

  const fileContent = readFileSync(inputFilePath, "utf-8");
  const allTestsInfo = JSON.parse(fileContent);

  if (allTestsInfo[testsName]) {
    const testInfo = allTestsInfo[testsName];
    newInputFiles[configKey][testsName] = testInfo.files || [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testsName] = testInfo.hash || "";

    // Create directories for each test entrypoint
    const cwd = processCwd();
    for (const [currentTestName, testInfo] of Object.entries(allTestsInfo)) {
      let testConfigKey: string | null = null;
      for (const [ck, configValue] of Object.entries(configs.runtimes)) {
        if (configValue.tests.includes(currentTestName)) {
          testConfigKey = ck;
          break;
        }
      }

      if (!testConfigKey) {
        consoleWarn(
          `[Server_Docker] Could not find config for test ${currentTestName}`,
        );
        continue;
      }

      const entrypointPath = currentTestName;
      const cleanPath = entrypointPath.replace(/^\.\//, "");
      const fullDirPath = join(
        cwd,
        "testeranto",
        "reports",
        testConfigKey,
        cleanPath,
      );
      const dirToCreate = fullDirPath;
      try {
        if (!existsSync(dirToCreate)) {
          mkdirSync(dirToCreate, { recursive: true });
          consoleLog(
            `[Server_Docker] Created directory for test reports: ${dirToCreate}`,
          );
        }
      } catch (error: any) {
        consoleWarn(
          `[Server_Docker] Failed to create directory ${dirToCreate}: ${error.message}`,
        );
      }
    }
  } else {
    newInputFiles[configKey][testsName] = [];
    if (!newHashs[configKey]) {
      newHashs[configKey] = {};
    }
    newHashs[configKey][testsName] = "";
  }

  if (mode === "dev") {
    watchFile(inputFilePath, async (curr, prev) => {
      consoleLog(`[Server_Docker] File ${inputFilePath} changed`);

      if (!existsSync(inputFilePath)) {
        consoleWarn(`${inputFilePath} does not exist yet.`);
        return;
      }

      const fileContent = readFileSync(inputFilePath, "utf-8");
      const allTestsInfo = JSON.parse(fileContent);
      if (allTestsInfo[testsName]) {
        const testInfo = allTestsInfo[testsName];
        const newHash = testInfo.hash || "";
        const oldHash = newHashs[configKey]?.[testsName] || "";

        const updatedInputFiles = { ...newInputFiles };
        const updatedHashs = { ...newHashs };

        if (!updatedInputFiles[configKey]) {
          updatedInputFiles[configKey] = {};
        }
        if (!updatedHashs[configKey]) {
          updatedHashs[configKey] = {};
        }

        updatedInputFiles[configKey][testsName] = testInfo.files || [];
        updatedHashs[configKey][testsName] = newHash;

        setState(updatedInputFiles, updatedHashs);
        // In unified approach, we broadcast graph updates instead
        // TODO This should be defined in API 
        resourceChanged('/~/graph');

        consoleLog(`[Server_Docker] Input files changed for ${testsName}, hash changed: ${newHash !== oldHash}`);

        if (newHash !== oldHash) {
          for (const [ck, configValue] of Object.entries(configs.runtimes)) {
            if (
              configValue.runtime === runtime &&
              configValue.tests.includes(testsName)
            ) {
              launchBddTest(runtime, testsName, ck, configValue);
              launchChecks(runtime, testsName, ck, configValue);
              informAider(runtime, testsName, ck, configValue, testInfo.files);

              // Update graph with input files using unified approach
              if (updateGraphWithInputFiles && testInfo.files) {
                try {
                  await updateGraphWithInputFiles(runtime, testsName, ck, testInfo.files);
                  // Broadcast graph update
                  // TODO This should be defined in API 
                  resourceChanged('/~/graph');
                } catch (error) {
                  consoleWarn(`[Server_Docker] Failed to update graph with input files: ${error}`);
                }
              }
              break;
            }
          }
        }
      }
    });
  } else {
    loadInputFileOnce(runtime, testsName, configKey);
  }

  return { inputFiles: newInputFiles, hashs: newHashs };
};

export const watchOutputFilePure = (
  configKey: string,
  testName: string,
  runtime: IRunTime,
  mode: IMode,
  outputFiles: Record<string, Record<string, string[]>>,
  resourceChanged: (path: string) => void,
  updateOutputFilesList: (
    outputFiles: Record<string, Record<string, string[]>>,
    configKey: string,
    testName: string,
    outputDir: string,
    projectRoot: string,
  ) => Record<string, Record<string, string[]>>,
): Record<string, Record<string, string[]>> => {
  const cwd = processCwd();
  const outputDir = getFullReportDir(cwd, runtime);
  const projectRoot = cwd;

  if (!existsSync(outputDir)) {
    consoleLog(`[Server_Docker] Creating output directory: ${outputDir}`);
    mkdirSync(outputDir, { recursive: true });
  }

  let newOutputFiles = { ...outputFiles };
  if (!newOutputFiles[configKey]) {
    newOutputFiles[configKey] = {};
  }
  if (!newOutputFiles[configKey][testName]) {
    newOutputFiles[configKey][testName] = [];
  }

  newOutputFiles = updateOutputFilesList(
    newOutputFiles,
    configKey,
    testName,
    outputDir,
    projectRoot,
  );

  if (mode === "dev") {
    watch(outputDir, (eventType, filename) => {
      if (filename) {
        newOutputFiles = updateOutputFilesList(
          newOutputFiles,
          configKey,
          testName,
          outputDir,
          projectRoot,
        );
        // In unified approach, broadcast graph updates
        // TODO This should be defined in API 
        resourceChanged('/~/graph');
      }
    });
  }

  return newOutputFiles;
};
