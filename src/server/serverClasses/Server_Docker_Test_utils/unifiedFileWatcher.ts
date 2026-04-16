import { join } from "path";
import { existsSync } from "fs";
import type { UnifiedFileWatcherOptions } from "./unifiedFileWatcher/types";
import { 
  InputFileWatcherState, 
  processInputFileChange,
  updateHashesFromFile 
} from "./unifiedFileWatcher/inputFileWatcher";
import {
  TestResultsWatcherState,
  watchTestResults,
  getTestsJsonPath
} from "./unifiedFileWatcher/testResultsWatcher";
import {
  WatcherManagerState,
  setupFileWatcher,
  stopAllWatchers
} from "./unifiedFileWatcher/watcherManager";

export interface UnifiedFileWatcherOptions {
  configKey: string;
  configValue: any;
  processCwd: () => string;
  consoleLog: (message: string) => void;
  consoleError: (message: string, error?: any) => void;
  launchBddTest: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>;
  launchChecks: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>;
  launchAider: (runtime: any, testName: string, configKey: string, configValue: any) => Promise<void>;
  onTestCompleted: (configKey: string, testName: string, testResults: any, testsJsonPath: string) => Promise<void>;
}

export class UnifiedFileWatcher {
  private watcherState: WatcherManagerState = {
    watchers: new Map(),
    timeoutIds: new Map()
  };
  private inputFileState: InputFileWatcherState = {
    inputFileHashes: new Map(),
    timeoutIds: this.watcherState.timeoutIds
  };
  private testResultsState: TestResultsWatcherState = {
    timeoutIds: this.watcherState.timeoutIds
  };

  constructor(private options: UnifiedFileWatcherOptions) {}

  async start(): Promise<void> {
    const { configKey, configValue, processCwd, consoleLog } = this.options;
    
    consoleLog(`[UnifiedFileWatcher] Starting watcher for config ${configKey} with ${configValue.tests?.length || 0} tests`);
    
    // Watch inputFiles.json for this config
    await this.watchInputFiles(configKey, configValue);
    
    // Watch tests.json for each test in this config
    const tests = configValue.tests || [];
    const runtime = configValue.runtime;
    
    consoleLog(`[UnifiedFileWatcher] Will watch tests.json for ${tests.length} tests: ${JSON.stringify(tests)}`);
    
    for (const testName of tests) {
      this.watchTestResults(configKey, testName, runtime);
    }
    
    consoleLog(`[UnifiedFileWatcher] Started watching files for config ${configKey}`);
  }

  stop(): void {
    stopAllWatchers(this.watcherState, this.options);
    this.inputFileState.inputFileHashes.clear();
  }

  private async watchInputFiles(configKey: string, configValue: any): Promise<void> {
    const { processCwd, consoleLog } = this.options;
    const cwd = processCwd();
    const inputFilePath = join(cwd, "testeranto", "bundles", configKey, "inputFiles.json");
    
    // Initialize hashes for this config
    if (!this.inputFileState.inputFileHashes.has(configKey)) {
      this.inputFileState.inputFileHashes.set(configKey, new Map());
    }
    
    // Initial update
    updateHashesFromFile(configKey, inputFilePath, this.inputFileState, this.options);
    
    const handler = async () => {
      const key = `inputFiles:${configKey}`;
      const existingTimeout = this.watcherState.timeoutIds.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeoutId = setTimeout(async () => {
        this.watcherState.timeoutIds.delete(key);
        await processInputFileChange(
          configKey,
          configValue,
          inputFilePath,
          this.inputFileState,
          this.options
        );
      }, 1000); // Debounce for 1 second
      
      this.watcherState.timeoutIds.set(key, timeoutId);
    };
    
    try {
      // Check if file exists before watching
      if (!existsSync(inputFilePath)) {
        consoleLog(`[UnifiedFileWatcher] Input file doesn't exist yet: ${inputFilePath}. Will watch for creation.`);
      }
      
      const unwatch = setupFileWatcher(
        inputFilePath,
        handler,
        this.watcherState,
        this.options
      );
      
      this.watcherState.watchers.set(inputFilePath, unwatch);
    } catch (error) {
      this.options.consoleError(`[UnifiedFileWatcher] Failed to watch input file ${inputFilePath}:`, error);
    }
  }

  private watchTestResults(configKey: string, testName: string, runtime: string): void {
    const { processCwd, consoleLog, consoleError, onTestCompleted } = this.options;
    const testsJsonPath = getTestsJsonPath(processCwd, configKey, testName);
    
    const handler = watchTestResults(
      configKey,
      testName,
      runtime,
      testsJsonPath,
      this.testResultsState,
      this.options
    );
    
    try {
      const unwatch = setupFileWatcher(
        testsJsonPath,
        handler,
        this.watcherState,
        this.options
      );
      
      this.watcherState.watchers.set(testsJsonPath, unwatch);
    } catch (error) {
      consoleError(`[UnifiedFileWatcher] Failed to watch tests.json ${testsJsonPath}:`, error);
    }
  }
}
