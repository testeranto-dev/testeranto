import { AiderMessageManager } from "../Server_Docker/AiderMessageManager";
import { TestCompletionWaiter } from "../Server_Docker/TestCompletionWaiter";
import { TestFileManager } from "../Server_Docker/TestFileManager";
import { TestResultsCollector } from "../Server_Docker/TestResultsCollector";

export function createTestManagerComponentsUtil(
  configs: any,
  mode: any,
  resourceChanged: (path: string) => void,
  getProcessSummary: () => any,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  consoleWarn: (message: string) => void,
  processCwd: () => string
): {
  testFileManager: TestFileManager;
  testResultsCollector: TestResultsCollector;
  aiderMessageManager: AiderMessageManager;
  testCompletionWaiter: TestCompletionWaiter;
  inputFiles: any;
  hashs: any;
  outputFiles: any;
  aiderProcesses: Map<string, any>;
} {
  const inputFiles = {};
  const hashs = {};
  const outputFiles = {};
  const aiderProcesses = new Map();

  const testFileManager = new TestFileManager(configs, mode, resourceChanged);

  const testResultsCollector = new TestResultsCollector(
    configs,
    mode,
    testFileManager.inputFiles,
    testFileManager.outputFiles,
  );

  const aiderMessageManager = new AiderMessageManager(
    configs,
    mode,
    (configKey: string, testName: string) =>
      testFileManager.getInputFilesForTest(configKey, testName),
    (configKey: string, testName: string) =>
      testFileManager.getOutputFilesForTest(configKey, testName),
    consoleLog,
    consoleError,
  );

  const testCompletionWaiter = new TestCompletionWaiter(
    consoleError,
    getProcessSummary,
    new Map(),
  );

  return {
    testFileManager,
    testResultsCollector,
    aiderMessageManager,
    testCompletionWaiter,
    inputFiles,
    hashs,
    outputFiles,
    aiderProcesses
  };
}
