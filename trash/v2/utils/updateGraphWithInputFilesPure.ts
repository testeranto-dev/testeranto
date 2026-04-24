import type { IRunTime } from "../../../src/server/Types";

export async function updateGraphWithInputFilesPure(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  inputFiles: string[],
  graphManager: any,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  consoleWarn: (message: string) => void
): Promise<void> {
  consoleLog(`[Server_Docker] updateGraphWithInputFiles called:`, {
    runtime,
    testName,
    configKey,
    inputFilesCount: inputFiles?.length || 0,
    inputFiles
  });

  if (!inputFiles || inputFiles.length === 0) {
    consoleLog(`[Server_Docker] No input files provided, skipping`);
    return;
  }

  // Use the graph manager's updateGraphWithInputFiles method if available
  if (graphManager && typeof graphManager.updateGraphWithInputFiles === 'function') {
    consoleLog(`[Server_Docker] Graph manager has updateGraphWithInputFiles method, calling it`);
    try {
      await graphManager.updateGraphWithInputFiles(runtime, testName, configKey, inputFiles);
      consoleLog(`[Server_Docker] Updated graph with ${inputFiles.length} input files for ${testName}`);
    } catch (error) {
      consoleError(`[Server_Docker] Error updating graph with input files via updateGraphWithInputFiles:`, error);
      // Fall back to the old method
      fallbackUpdate(graphManager, runtime, testName, configKey, inputFiles, consoleLog, consoleError);
    }
  } else {
    consoleWarn(`[Server_Docker] Graph manager does not have updateGraphWithInputFiles method, using fallback`);
    fallbackUpdate(graphManager, runtime, testName, configKey, inputFiles, consoleLog, consoleError);
  }
}

async function fallbackUpdate(
  graphManager: any,
  runtime: IRunTime,
  testName: string,
  configKey: string,
  inputFiles: string[],
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  // Fallback to the old method using updateFromTestResults
  const processedTestName = testName.includes('.') ? testName : `${configKey}:${testName}`;
  const testResult = {
    configKey,
    runtime,
    testName: processedTestName,
    inputFiles,
    failed: false,
    individualResults: [],
    timestamp: new Date().toISOString()
  };

  consoleLog(`[Server_Docker] Using fallback update with test result:`, testResult);

  if (graphManager && typeof graphManager.updateFromTestResults === 'function') {
    consoleLog(`[Server_Docker] Calling updateFromTestResults`);
    try {
      await graphManager.updateFromTestResults(testResult);
      consoleLog(`[Server_Docker] Updated graph via fallback method`);
    } catch (error) {
      consoleError(`[Server_Docker] Error in fallback update:`, error);
    }
  } else {
    consoleError(`[Server_Docker] Graph manager does not have updateFromTestResults method either`);
  }
}
