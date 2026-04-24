import { join } from "path";
import { existsSync, readFileSync, watchFile, unwatchFile } from "fs";

export async function watchInputFilesForConfigPure(
  configKey: string,
  configValue: any,
  processCwd: () => string,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  launchBddTest: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>,
  launchChecks: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>,
  launchAider: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>,
  // getWatchers?: () => Map<string, { unwatch: () => void }>,
  addWatcher?: (key: string, unwatch: () => void) => void
): Promise<() => void> {
  const cwd = processCwd();
  const inputFilePath = join(cwd, "testeranto", "bundles", configKey, "inputFiles.json");

  // Store current hashes for all tests in this config
  const currentHashes = new Map<string, string>();

  // Function to update hashes from the file
  const updateHashes = () => {
    try {
      if (!existsSync(inputFilePath)) {
        // File doesn't exist yet, clear hashes
        currentHashes.clear();
        return;
      }

      const content = readFileSync(inputFilePath, 'utf-8');
      const allTestsInfo = JSON.parse(content);

      currentHashes.clear();
      for (const [testPath, testInfo] of Object.entries(allTestsInfo)) {
        currentHashes.set(testPath, (testInfo as any).hash || '');
      }
    } catch (error) {
      consoleError(`[watchInputFilesForConfig] Error reading input file:`, error);
      currentHashes.clear();
    }
  };

  // Initial hashes update
  updateHashes();

  // Create a proper debounced handler with timeout
  let timeoutId: NodeJS.Timeout | null = null;
  let lastProcessTime = 0;
  const DEBOUNCE_DELAY = 1000; // 1 second

  const handler = async (curr: any, prev: any) => {
    const now = Date.now();

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // If we processed recently, schedule for later
    if (now - lastProcessTime < DEBOUNCE_DELAY) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        processFileChange();
      }, DEBOUNCE_DELAY - (now - lastProcessTime));
      return;
    }

    // Process immediately
    processFileChange();

    async function processFileChange() {
      lastProcessTime = Date.now();

      // Check if file exists now
      if (!existsSync(inputFilePath)) {
        consoleLog(`[watchInputFilesForConfig] Input file doesn't exist: ${inputFilePath}`);
        currentHashes.clear();
        return;
      }

      consoleLog(`[watchInputFilesForConfig] Input file changed: ${inputFilePath}`);

      try {
        const content = readFileSync(inputFilePath, 'utf-8');
        const allTestsInfo = JSON.parse(content);

        const runtime = configValue.runtime;
        const tests = configValue.tests || [];

        // Check each test in the config
        for (const testName of tests) {
          // Find the test by its full path
          let foundTestPath = '';
          let newHash = '';

          for (const [testPath, testInfo] of Object.entries(allTestsInfo)) {
            if (testPath.includes(testName)) {
              foundTestPath = testPath;
              newHash = (testInfo as any).hash || '';
              break;
            }
          }

          if (foundTestPath) {
            const oldHash = currentHashes.get(foundTestPath) || '';
            if (newHash !== oldHash) {
              consoleLog(`[watchInputFilesForConfig] Hash changed for ${testName}, relaunching services`);
              consoleLog(`[watchInputFilesForConfig] Old hash: ${oldHash}, New hash: ${newHash}`);

              // Update the hash in our map
              currentHashes.set(foundTestPath, newHash);

              // Relaunch services for this test - but don't wait for all to complete
              // Launch them sequentially but don't block on completion
              try {
                await launchBddTest(runtime, testName, configKey, configValue);
              } catch (error) {
                consoleError(`[watchInputFilesForConfig] Error launching BDD test for ${testName}:`, error);
              }

              try {
                await launchChecks(runtime, testName, configKey, configValue);
              } catch (error) {
                consoleError(`[watchInputFilesForConfig] Error launching checks for ${testName}:`, error);
              }

              try {
                await launchAider(runtime, testName, configKey, configValue);
              } catch (error) {
                consoleError(`[watchInputFilesForConfig] Error launching aider for ${testName}:`, error);
              }

              consoleLog(`[watchInputFilesForConfig] Services relaunched for ${testName}`);
            }
          }
        }

        // Update hashes for any new tests that might have been added
        updateHashes();

      } catch (error) {
        consoleError(`[watchInputFilesForConfig] Error processing input file change:`, error);
      }
    }
  };

  // Watch for changes - even if file doesn't exist yet
  // watchFile will trigger when the file is created
  watchFile(inputFilePath, { persistent: false }, handler);

  const unwatch = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    unwatchFile(inputFilePath, handler);
    consoleLog(`[watchInputFilesForConfig] Stopped watching input file for config ${configKey}: ${inputFilePath}`);
  };

  // Store the unwatch function if provided
  if (addWatcher) {
    addWatcher(`inputFiles:${configKey}`, unwatch);
  }

  consoleLog(`[watchInputFilesForConfig] Now watching input file for config ${configKey}: ${inputFilePath}`);
  return unwatch;
}
