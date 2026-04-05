import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { AiderImageBuilder } from "./AiderImageBuilder";
import { AiderMessageManager } from "./AiderMessageManager";
import { BuilderServicesManager } from "./BuilderServicesManager";
import { TestCompletionWaiter } from "./TestCompletionWaiter";
import { TestFileManager } from "./TestFileManager";
import { TestResultsCollector } from "./TestResultsCollector";

export function setupServerDockerPure(
  configs: ITesterantoConfig,
  mode: IMode,
  resourceChanged: (path: string) => void,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  consoleWarn: (message: string) => void,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>
) {
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

  const builderServicesManager = new BuilderServicesManager(
    configs,
    mode,
    (serviceName: string, runtime: string, runtimeConfigKey: string) =>
      startServiceLogging(serviceName, runtime, runtimeConfigKey),
  );

  const aiderImageBuilder = new AiderImageBuilder(
    consoleLog,
    consoleError,
  );

  const testCompletionWaiter = new TestCompletionWaiter(
    consoleError,
    () => ({ /* getProcessSummary placeholder */ }),
    new Map()
  );

  return {
    testFileManager,
    testResultsCollector,
    aiderMessageManager,
    builderServicesManager,
    aiderImageBuilder,
    testCompletionWaiter
  };
}