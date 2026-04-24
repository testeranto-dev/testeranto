import { join } from "path";
import { existsSync, readFileSync } from "fs";
import type { UnifiedFileWatcherOptions } from "../unifiedFileWatcher";

export interface InputFileWatcherState {
  inputFileHashes: Map<string, Map<string, string>>; // configKey -> testPath -> hash
  timeoutIds: Map<string, NodeJS.Timeout>;
}

export async function processInputFileChange(
  configKey: string,
  configValue: any,
  inputFilePath: string,
  state: InputFileWatcherState,
  options: UnifiedFileWatcherOptions
): Promise<void> {
  const { consoleLog, consoleError } = options;

  // Check if file exists now
  if (!existsSync(inputFilePath)) {
    consoleLog(`[InputFileWatcher] Input file doesn't exist: ${inputFilePath}`);
    state.inputFileHashes.get(configKey)?.clear();
    return;
  }

  consoleLog(`[InputFileWatcher] Input file changed: ${inputFilePath}`);

  // Read the file content
  let content: string;
  try {
    content = readFileSync(inputFilePath, 'utf-8');
  } catch (error) {
    consoleError(`[InputFileWatcher] Error reading file:`, error);
    return;
  }

  // Check if content is valid JSON and not empty
  if (!content || content.trim() === '') {
    consoleLog(`[InputFileWatcher] Input file is empty`);
    return;
  }

  let allTestsInfo: any;
  try {
    allTestsInfo = JSON.parse(content);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error parsing JSON:`, error);
    return;
  }

  // Check if allTestsInfo is an object
  if (typeof allTestsInfo !== 'object' || allTestsInfo === null) {
    consoleError(`[InputFileWatcher] Invalid JSON structure: not an object`);
    return;
  }

  await handleInputFileContent(
    configKey,
    configValue,
    allTestsInfo,
    inputFilePath,
    state,
    options
  );
}

async function handleInputFileContent(
  configKey: string,
  configValue: any,
  allTestsInfo: any,
  inputFilePath: string,
  state: InputFileWatcherState,
  options: UnifiedFileWatcherOptions
): Promise<void> {
  const { consoleLog, consoleError, launchBddTest, launchChecks, launchAider } = options;

  try {
    const runtime = configValue.runtime;
    const tests = configValue.tests || [];
    const hashes = state.inputFileHashes.get(configKey)!;

    consoleLog(`[InputFileWatcher] Config has ${tests.length} tests: ${JSON.stringify(tests)}`);
    consoleLog(`[InputFileWatcher] Found ${Object.keys(allTestsInfo).length} tests in inputFiles.json`);

    // Check each test in the config
    for (const testName of tests) {
      await handleTestInputFile(
        testName,
        runtime,
        configKey,
        configValue,
        allTestsInfo,
        hashes,
        options
      );
    }

    // Update hashes for any new tests
    updateHashesFromFile(configKey, inputFilePath, state, options);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error processing input file change:`, error);
  }
}

async function handleTestInputFile(
  testName: string,
  runtime: string,
  configKey: string,
  configValue: any,
  allTestsInfo: any,
  hashes: Map<string, string>,
  options: UnifiedFileWatcherOptions
): Promise<void> {
  const { consoleLog, consoleError, launchBddTest, launchChecks, launchAider } = options;

  // Find the test by its full path
  const { foundTestPath, newHash } = findTestInInputFiles(testName, allTestsInfo, consoleLog);

  if (foundTestPath) {
    const oldHash = hashes.get(foundTestPath) || '';
    consoleLog(`[InputFileWatcher] For test ${testName}: found at ${foundTestPath}, old hash: ${oldHash}, new hash: ${newHash}`);

    if (newHash !== oldHash) {
      consoleLog(`[InputFileWatcher] Hash changed for ${testName} (found at ${foundTestPath}), relaunching services`);

      // Update the hash
      hashes.set(foundTestPath, newHash);

      // Relaunch services
      await relaunchServicesForTest(
        runtime,
        testName,
        configKey,
        configValue,
        options
      );
    } else {
      consoleLog(`[InputFileWatcher] Hash unchanged for ${testName} (${foundTestPath}): ${newHash}`);
    }
  } else {
    consoleLog(`[InputFileWatcher] Could not find test ${testName} in inputFiles.json`);
    // Log all available test paths for debugging
    const availablePaths = Object.keys(allTestsInfo);
    consoleLog(`[InputFileWatcher] Available test paths: ${availablePaths.join(', ')}`);
  }
}

function findTestInInputFiles(
  testName: string,
  allTestsInfo: any,
  consoleLog: (message: string) => void
): { foundTestPath: string; newHash: string } {
  let foundTestPath = '';
  let newHash = '';

  // First, try to find an exact match by checking if any testPath ends with the testName
  for (const [testPath, testInfo] of Object.entries(allTestsInfo)) {
    // Check if testPath ends with testName or contains it as a directory
    if (testPath.includes(testName)) {
      // More precise matching: check if it's the last part of the path
      const pathParts = testPath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.includes(testName) || testPath.includes(`/${testName}/`) || testPath.includes(`/${testName}.`)) {
        foundTestPath = testPath;
        newHash = (testInfo as any).hash || '';
        break;
      }
    }
  }

  // If not found, try a broader search
  if (!foundTestPath) {
    for (const [testPath, testInfo] of Object.entries(allTestsInfo)) {
      if (testPath.includes(testName)) {
        foundTestPath = testPath;
        newHash = (testInfo as any).hash || '';
        break;
      }
    }
  }

  return { foundTestPath, newHash };
}

async function relaunchServicesForTest(
  runtime: string,
  testName: string,
  configKey: string,
  configValue: any,
  options: UnifiedFileWatcherOptions
): Promise<void> {
  const { consoleLog, consoleError, launchBddTest, launchChecks, launchAider } = options;

  try {
    consoleLog(`[InputFileWatcher] Launching BDD test for ${testName}...`);
    await launchBddTest(runtime, testName, configKey, configValue);
    consoleLog(`[InputFileWatcher] Successfully launched BDD test for ${testName}`);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error launching BDD test for ${testName}:`, error);
  }

  try {
    consoleLog(`[InputFileWatcher] Launching checks for ${testName}...`);
    await launchChecks(runtime, testName, configKey, configValue);
    consoleLog(`[InputFileWatcher] Successfully launched checks for ${testName}`);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error launching checks for ${testName}:`, error);
  }

  try {
    consoleLog(`[InputFileWatcher] Launching aider for ${testName}...`);
    await launchAider(runtime, testName, configKey, configValue);
    consoleLog(`[InputFileWatcher] Successfully launched aider for ${testName}`);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error launching aider for ${testName}:`, error);
  }
}

export function updateHashesFromFile(
  configKey: string,
  inputFilePath: string,
  state: InputFileWatcherState,
  options: UnifiedFileWatcherOptions
): void {
  const { consoleLog, consoleError } = options;

  try {
    if (!existsSync(inputFilePath)) {
      state.inputFileHashes.get(configKey)?.clear();
      consoleLog(`[InputFileWatcher] Input file doesn't exist: ${inputFilePath}`);
      return;
    }

    const content = readFileSync(inputFilePath, 'utf-8');
    const allTestsInfo = JSON.parse(content);

    const hashes = state.inputFileHashes.get(configKey)!;
    hashes.clear();

    for (const [testPath, testInfo] of Object.entries(allTestsInfo)) {
      const hash = (testInfo as any).hash || '';
      hashes.set(testPath, hash);
      consoleLog(`[InputFileWatcher] Stored hash for ${testPath}: ${hash}`);
    }
    consoleLog(`[InputFileWatcher] Updated hashes for ${configKey}: ${hashes.size} entries`);
  } catch (error) {
    consoleError(`[InputFileWatcher] Error reading input file:`, error);
    state.inputFileHashes.get(configKey)?.clear();
  }
}
