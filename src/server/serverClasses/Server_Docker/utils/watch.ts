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

    // Create directories for each test entrypoint to ensure test.json files can be placed correctly
    // According to the bug report, test.json files should follow the structure of the entrypoint
    // For each test in the input JSON, create the appropriate directory under testeranto/reports/{correctConfigKey}/
    const cwd = processCwd();
    for (const [currentTestName, testInfo] of Object.entries(allTestsInfo)) {
      // Find which config this test belongs to
      let testConfigKey: string | null = null;
      for (const [ck, configValue] of Object.entries(configs.runtimes)) {
        if (configValue.tests.includes(currentTestName)) {
          testConfigKey = ck;
          break;
        }
      }

      // If we couldn't find a config for this test, skip it
      if (!testConfigKey) {
        consoleWarn(
          `[Server_Docker] Could not find config for test ${currentTestName}`,
        );
        continue;
      }

      // The entrypoint path is currentTestName (e.g., "src/ts/Calculator.test.node.ts")
      // We need to create a directory structure under testeranto/reports/{testConfigKey}/{entrypointPath}/
      // According to the bug report, test.json should be placed at {entrypointPath}/tests.json
      // So we need to create a directory for the entire entrypoint path (including the filename as a directory)
      const entrypointPath = currentTestName;
      // Remove leading "./" if present
      const cleanPath = entrypointPath.replace(/^\.\//, "");
      // Create directory path: testeranto/reports/{testConfigKey}/{cleanPath}/
      const fullDirPath = join(
        cwd,
        "testeranto",
        "reports",
        testConfigKey,
        cleanPath,
      );
      // We need to create the directory for fullDirPath, not remove the last component
      // Because tests.json will be placed inside a directory named after the entrypoint file
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
        resourceChanged("/~/inputfiles");

        if (newHash !== oldHash) {
          for (const [ck, configValue] of Object.entries(configs.runtimes)) {
            if (
              configValue.runtime === runtime &&
              configValue.tests.includes(testsName)
            ) {
              launchBddTest(runtime, testsName, ck, configValue);
              launchChecks(runtime, testsName, ck, configValue);
              informAider(runtime, testsName, ck, configValue, testInfo.files);

              // Update graph with input files
              consoleLog(`[Server_Docker] Checking if we should update graph with input files:`, {
                hasUpdateGraphWithInputFiles: !!updateGraphWithInputFiles,
                hasFiles: !!testInfo.files,
                filesCount: testInfo.files?.length || 0
              });
              if (updateGraphWithInputFiles && testInfo.files) {
                try {
                  consoleLog(`[Server_Docker] Calling updateGraphWithInputFiles for ${testsName} with ${testInfo.files.length} files`);
                  await updateGraphWithInputFiles(runtime, testsName, ck, testInfo.files);
                  consoleLog(`[Server_Docker] updateGraphWithInputFiles completed`);
                } catch (error) {
                  consoleWarn(`[Server_Docker] Failed to update graph with input files: ${error}`);
                }
              } else {
                consoleLog(`[Server_Docker] Not updating graph: updateGraphWithInputFiles=${!!updateGraphWithInputFiles}, files=${!!testInfo.files}`);
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

  // Ensure the output directory exists
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
        resourceChanged("/~/outputfiles");
      }
    });
  }

  return newOutputFiles;
};
