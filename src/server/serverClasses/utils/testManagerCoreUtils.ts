import type { IRunTime } from "../../../Types";
import type { GraphManager } from "../../graph";
import { AiderMessageManager } from "../Server_Docker/AiderMessageManager";
import { TestCompletionWaiter } from "../Server_Docker/TestCompletionWaiter";
import { TestFileManager } from "../Server_Docker/TestFileManager";
import { TestResultsCollector } from "../Server_Docker/TestResultsCollector";
import { updateGraphWithInputFilesPure } from "../Server_Docker/updateGraphWithInputFilesPure";
import { getAiderProcessesPure } from "../Server_Docker/utils/getAiderProcessesPure";
import { launchAiderPure } from "../Server_Docker/utils/launchAiderPure";

/**
 * Utility functions for test manager operations
 */

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

export async function launchBddTestUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  writeConfigForExtension: () => void,
  resourceChanged: (path: string) => void,
  graphManager?: GraphManager,
  createAiderMessageFile?: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>
): Promise<void> {
  console.log(`[launchBddTestUtil] Launching BDD test ${testName} for config ${configKey}`);
  
  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    console.warn(`[launchBddTestUtil] Skipping BDD test ${testName} because builder failed for config ${configKey}`);
    return;
  }
  
  // Start service logging
  await startServiceLogging(`${configKey}-bdd`, runtime, configKey, testName);
  
  // Write config for extension
  writeConfigForExtension();
  
  // Notify resource changed
  resourceChanged(`/~/tests/${configKey}/${testName}`);
  
  // Create aider message file if needed
  if (createAiderMessageFile) {
    await createAiderMessageFile(runtime, testName, configKey, configValue);
  }
  
  // Update graph if graphManager is available
  if (graphManager && typeof (graphManager as any).updateGraphWithTest === 'function') {
    await (graphManager as any).updateGraphWithTest({
      runtime,
      testName,
      configKey,
      configValue,
      type: 'bdd'
    });
  }
}

export async function launchChecksUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  writeConfigForExtension: () => void,
  resourceChanged: (path: string) => void,
  graphManager?: GraphManager,
  createAiderMessageFile?: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>
): Promise<void> {
  console.log(`[launchChecksUtil] Launching checks for test ${testName} for config ${configKey}`);
  
  // Check if builder failed for this config
  if (failedBuilderConfigs.has(configKey)) {
    console.warn(`[launchChecksUtil] Skipping checks for test ${testName} because builder failed for config ${configKey}`);
    return;
  }
  
  const checks = configValue.checks || [];
  for (let i = 0; i < checks.length; i++) {
    // Start service logging for each check
    await startServiceLogging(`${configKey}-check-${i}`, runtime, configKey, testName);
    
    // Write config for extension
    writeConfigForExtension();
    
    // Notify resource changed
    resourceChanged(`/~/checks/${configKey}/${testName}/${i}`);
    
    // Create aider message file if needed
    if (createAiderMessageFile) {
      await createAiderMessageFile(runtime, testName, configKey, configValue);
    }
    
    // Update graph if graphManager is available
    if (graphManager && typeof (graphManager as any).updateGraphWithCheck === 'function') {
      await (graphManager as any).updateGraphWithCheck({
        runtime,
        testName,
        configKey,
        configValue,
        checkIndex: i,
        type: 'check'
      });
    }
  }
}

export async function addProcessNodeToGraphUtil(
  processType: 'bdd' | 'check' | 'aider' | 'builder',
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  checkIndex?: number,
  graphManager?: GraphManager,
  consoleLog?: (message: string) => void,
  consoleError?: (message: string, error?: any) => void,
  consoleWarn?: (message: string) => void,
  status?: 'running' | 'stopped' | 'failed'
): Promise<void> {
  consoleLog?.(`[addProcessNodeToGraphUtil] Adding ${processType} node for test ${testName}`);
  
  if (!graphManager) {
    consoleWarn?.('[addProcessNodeToGraphUtil] No graph manager available');
    return;
  }
  
  try {
    // Create node data
    const nodeId = `${processType}:${configKey}:${testName}${checkIndex !== undefined ? `:${checkIndex}` : ''}`;
    const nodeData = {
      id: nodeId,
      type: 'process',
      processType,
      runtime,
      testName,
      configKey,
      configValue,
      checkIndex,
      status: status || 'running',
      timestamp: new Date().toISOString()
    };
    
    // Add node to graph
    if (typeof (graphManager as any).addNode === 'function') {
      await (graphManager as any).addNode(nodeData);
      consoleLog?.(`[addProcessNodeToGraphUtil] Added node ${nodeId}`);
    } else {
      consoleWarn?.('[addProcessNodeToGraphUtil] Graph manager does not have addNode method');
    }
  } catch (error) {
    consoleError?.(`[addProcessNodeToGraphUtil] Error adding process node:`, error);
  }
}

export async function checkFilesLockedUtil(graphManager?: GraphManager): Promise<boolean> {
  return false;
}

export async function validateBuilderConfigUtil(
  configKey: string,
  failedBuilderConfigs: Set<string>
): Promise<boolean> {
  return !failedBuilderConfigs.has(configKey);
}

export async function launchAiderUtil(
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  failedBuilderConfigs: Set<string>,
  createAiderMessageFile: (runtime: IRunTime, testName: string, configKey: string, configValue: any) => Promise<void>,
  startServiceLogging: (serviceName: string, runtime: string, runtimeConfigKey: string, testName: string) => Promise<void>,
  resourceChanged: (path: string) => void,
  writeConfigForExtension: () => void,
  getContainerInfo: (serviceName: string) => Promise<any>,
  aiderProcesses: Map<string, any>,
  graphManager?: GraphManager,
  consoleWarn?: (message: string) => void
): Promise<void> {
  // Check if files are locked
  const filesLocked = await checkFilesLockedUtil(graphManager);
  if (filesLocked) {
    consoleWarn?.(`[launchAiderUtil] Skipping aider for ${testName} because files are locked for restart`);
    return;
  }
  
  // Validate builder config
  const isValid = await validateBuilderConfigUtil(configKey, failedBuilderConfigs);
  if (!isValid) {
    return;
  }
  
  await launchAiderPure({
    runtime,
    testName,
    configKey,
    configValue,
    failedBuilderConfigs,
    createAiderMessageFile,
    startServiceLogging,
    resourceChanged,
    writeConfigForExtension,
    getContainerInfo,
    aiderProcesses,
    updateGraphWithAiderNode: async (params) => {
      if (graphManager && typeof (graphManager as any).updateGraphWithAiderNode === 'function') {
        await (graphManager as any).updateGraphWithAiderNode(params);
      } else {
        consoleWarn?.('[launchAiderUtil] GraphManager or updateGraphWithAiderNode not available');
      }
    },
  });
}
