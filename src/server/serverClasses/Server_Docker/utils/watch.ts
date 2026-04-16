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
    consoleLog(`[Server_Docker] Setting up file watch for ${inputFilePath} for test ${testsName}`);
    consoleLog(`[Server_Docker] Config key: ${configKey}, Runtime: ${runtime}`);
    
    // Add debouncing to prevent multiple rapid calls
    let isProcessing = false;
    let pendingUpdate = false;
    
    const processFileChange = async () => {
      if (isProcessing) {
        pendingUpdate = true;
        return;
      }
      
      isProcessing = true;
      
      try {
        // Minimal logging to reduce overhead
        consoleLog(`[Server_Docker] Input file changed: ${testsName}`);
        
        if (!existsSync(inputFilePath)) {
          isProcessing = false;
          return;
        }

        const fileContent = readFileSync(inputFilePath, "utf-8");
        
        try {
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
            resourceChanged('/~/graph');

            if (newHash !== oldHash) {
              consoleLog(`[Server_Docker] Relaunching services for ${testsName}`);
              for (const [ck, configValue] of Object.entries(configs.runtimes)) {
                if (
                  configValue.runtime === runtime &&
                  configValue.tests.includes(testsName)
                ) {
                  // Launch services without blocking
                  launchBddTest(runtime, testsName, ck, configValue).catch(error => 
                    consoleWarn(`[Server_Docker] BDD relaunch error: ${error}`)
                  );
                  launchChecks(runtime, testsName, ck, configValue).catch(error => 
                    consoleWarn(`[Server_Docker] Checks relaunch error: ${error}`)
                  );
                  informAider(runtime, testsName, ck, configValue, testInfo.files).catch(error => 
                    consoleWarn(`[Server_Docker] Aider relaunch error: ${error}`)
                  );

                  if (updateGraphWithInputFiles && testInfo.files) {
                    updateGraphWithInputFiles(runtime, testsName, ck, testInfo.files)
                      .catch((error) => {
                        consoleWarn(`[Server_Docker] Graph update error: ${error}`);
                      });
                  }
                  break;
                }
              }
            }
          }
        } catch (error: any) {
          // Silent error - don't log to reduce noise
        }
      } catch (error: any) {
        // Silent error
      } finally {
        isProcessing = false;
        if (pendingUpdate) {
          pendingUpdate = false;
          setTimeout(processFileChange, 100);
        }
      }
    };
    
    watchFile(inputFilePath, (curr, prev) => {
      // Don't make this async - watchFile doesn't handle async callbacks well
      // Use setTimeout to avoid blocking
      setTimeout(processFileChange, 10);
    });
  } else {
    loadInputFileOnce(runtime, testsName, configKey);
  }

  consoleLog(`[Server_Docker] File watch successfully set up for ${inputFilePath}`);
  consoleLog(`[Server_Docker] Initial state for ${testsName}: ${newInputFiles[configKey]?.[testsName]?.length || 0} files, hash: ${newHashs[configKey]?.[testsName] || 'none'}`);
  
  // Return unwatch function for cleanup
  const unwatch = () => {
    if (mode === "dev") {
      try {
        // In Node.js, we need to store the listener to unwatch
        // For now, we'll just note that we're unwatching
        consoleLog(`[Server_Docker] Unwatching ${inputFilePath} for test ${testsName}`);
      } catch (error) {
        consoleWarn(`[Server_Docker] Error unwatching file: ${error}`);
      }
    }
  };
  
  return { 
    inputFiles: newInputFiles, 
    hashs: newHashs,
    unwatch 
  };
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
  onTestJsonCreated?: (
    configKey: string,
    testName: string,
    testsJsonPath: string,
    testResults: any
  ) => void,
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
        
        // Check if the created/modified file is tests.json
        if (filename === 'tests.json' || filename.endsWith('/tests.json')) {
          const testsJsonPath = join(outputDir, filename);
          consoleLog(`[Server_Docker] tests.json file detected: ${testsJsonPath}`);
          
          // Try to read and parse the tests.json file
          try {
            if (existsSync(testsJsonPath)) {
              const content = readFileSync(testsJsonPath, 'utf-8');
              const testResults = JSON.parse(content);
              consoleLog(`[Server_Docker] Successfully parsed tests.json for ${testName}`);
              
              // Call the callback if provided
              if (onTestJsonCreated) {
                onTestJsonCreated(configKey, testName, testsJsonPath, testResults);
              }
              
              // Also update the graph with test completion status
              resourceChanged(`/~/tests/${configKey}/${testName}/completed`);
            }
          } catch (error: any) {
            consoleWarn(`[Server_Docker] Error reading tests.json at ${testsJsonPath}: ${error.message}`);
          }
        }
        
        // In unified approach, broadcast graph updates
        resourceChanged('/~/graph');
      }
    });
  }

  return newOutputFiles;
};
