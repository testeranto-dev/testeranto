import { join } from "path";
import { existsSync, readFileSync } from "fs";
import type { UnifiedFileWatcherOptions } from "../unifiedFileWatcher";

export interface TestResultsWatcherState {
  timeoutIds: Map<string, NodeJS.Timeout>;
}

export function watchTestResults(
  configKey: string,
  testName: string,
  runtime: string,
  testsJsonPath: string,
  state: TestResultsWatcherState,
  options: UnifiedFileWatcherOptions
): void {
  const { consoleLog, consoleError, onTestCompleted } = options;

  // Check if tests.json already exists
  if (existsSync(testsJsonPath)) {
    try {
      const content = readFileSync(testsJsonPath, 'utf-8');
      const testResults = JSON.parse(content);
      consoleLog(`[TestResultsWatcher] Found existing tests.json for ${testName}`);
      onTestCompleted(configKey, testName, testResults, testsJsonPath);
    } catch (error) {
      consoleError(`[TestResultsWatcher] Error reading existing tests.json:`, error);
    }
  }

  const handler = () => {
    const key = `testsJson:${configKey}:${testName}`;
    const existingTimeout = state.timeoutIds.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      state.timeoutIds.delete(key);

      if (!existsSync(testsJsonPath)) {
        return;
      }

      consoleLog(`[TestResultsWatcher] tests.json changed for ${testName}`);
      try {
        const content = readFileSync(testsJsonPath, 'utf-8');
        const testResults = JSON.parse(content);
        onTestCompleted(configKey, testName, testResults, testsJsonPath);
      } catch (error) {
        consoleError(`[TestResultsWatcher] Error reading tests.json:`, error);
      }
    }, 500); // Debounce for 500ms

    state.timeoutIds.set(key, timeoutId);
  };

  return handler;
}

export function getTestsJsonPath(
  processCwd: () => string,
  configKey: string,
  testName: string
): string {
  const cwd = processCwd();
  const reportDir = join(cwd, "testeranto", "reports", configKey, testName);
  return join(reportDir, "tests.json");
}
