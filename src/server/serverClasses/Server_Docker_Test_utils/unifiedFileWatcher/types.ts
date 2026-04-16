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
