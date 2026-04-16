import type { IRunTime, ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";

export const initializeTestsPure = async (
  configs: ITesterantoConfig,
  mode: IMode,
  inputFiles: Record<string, Record<string, string[]>>,
  watchInputFile: (runtime: IRunTime, testName: string) => Promise<void>,
  watchOutputFile: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
  ) => void,
  loadInputFileOnce: (
    runtime: IRunTime,
    testName: string,
    configKey: string,
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
  makeReportDirectory: (testName: string, configKey: string) => string,
  existsSync: (path: string) => boolean,
  mkdirSync: (path: string, options?: { recursive: boolean }) => void,
  onTestCompleted?: (
    configKey: string,
    testName: string,
    testResults: any,
    testsJsonPath: string
  ) => void,
): Promise<{
  inputFiles: Record<string, Record<string, string[]>>;
}> => {
  const newInputFiles = { ...inputFiles };

  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    const runtime: IRunTime = configValue.runtime as IRunTime;
    const tests = configValue.tests;

    if (!newInputFiles[configKey]) {
      newInputFiles[configKey] = {};
    }

    for (const testName of tests) {
      if (!newInputFiles[configKey][testName]) {
        newInputFiles[configKey][testName] = [];
      }

      const reportDir = makeReportDirectory(testName, configKey);

      if (!existsSync(reportDir)) {
        mkdirSync(reportDir, { recursive: true });
      }

      if (mode === "dev") {
        consoleLog(`[initializeTestsPure] Setting up file watching for test ${testName} with runtime ${runtime}`);
        await watchInputFile(runtime, testName);
        consoleLog(`[initializeTestsPure] Watching output files for test ${testName} with config ${configKey}`);
        // Pass a callback to handle tests.json creation
        watchOutputFile(runtime, testName, configKey, (configKey, testName, testsJsonPath, testResults) => {
          consoleLog(`[initializeTestsPure] Test ${testName} completed with results at ${testsJsonPath}`);
          // Call the onTestCompleted callback if provided
          if (onTestCompleted) {
            onTestCompleted(configKey, testName, testResults, testsJsonPath);
          }
        });
      } else {
        consoleLog(`[initializeTestsPure] Loading input file once for test ${testName} with runtime ${runtime}`);
        loadInputFileOnce(runtime, testName, configKey);
      }

      await launchBddTest(runtime, testName, configKey, configValue);
      await launchChecks(runtime, testName, configKey, configValue);
    }
  }

  return { inputFiles: newInputFiles };
};
