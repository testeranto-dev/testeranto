import type { IRunTime } from "../../../Types";

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

  // We need to update the graph with input file nodes
  // Create a test result-like object with input files
  // Ensure testName is treated as a file path for proper entrypoint creation
  const processedTestName = testName.includes('.') ? testName : `${configKey}:${testName}`;
  const testResult = {
    configKey,
    runtime,
    testName: processedTestName,
    inputFiles,
    // Add required fields for TestResult interface
    failed: false,
    // Add empty individualResults to satisfy the interface
    individualResults: [],
    timestamp: new Date().toISOString()
  };

  consoleLog(`[Server_Docker] Created test result for graph update:`, testResult);

  // Update the graph using the graph manager
  // The graph manager is in the parent class Server_HTTP
  if (graphManager && typeof graphManager.updateFromTestResults === 'function') {
    consoleLog(`[Server_Docker] Graph manager available, calling updateFromTestResults`);
    try {
      await graphManager.updateFromTestResults(testResult);
      consoleLog(`[Server_Docker] Updated graph with ${inputFiles.length} input files for ${testName}`);
    } catch (error) {
      consoleError(`[Server_Docker] Error updating graph with input files:`, error);
    }
  } else {
    consoleWarn(`[Server_Docker] Graph manager not available for updating input files`);
  }
}