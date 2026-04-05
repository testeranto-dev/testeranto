// Common types for test results across the application

// Individual test result from getTestResultsPure
export interface TestResultFile {
  file: string;
  filePath: string;
  relativePath: string;
  result: any | null;
  content: string | null;
  configKey: string;
  testName: string;
}

// Individual test step result
export interface IndividualTestResult {
  stepName: string;
  failed: boolean;
  features: string[];
  inputFiles?: string[];
  [key: string]: any;
}

// Test result for a specific test
export interface TestResult {
  configKey?: string;
  runtime?: string;
  testName: string;
  individualResults?: IndividualTestResult[];
  failed?: boolean;
  metadata?: Record<string, any>;
  inputFiles?: string[];
  [key: string]: any;
}

// Runtime-level test results (keyed by configKey)
export interface RuntimeTestResults {
  [testName: string]: TestResult;
}

// All test results (keyed by configKey/runtime)
export interface AllTestResults {
  [configKey: string]: RuntimeTestResults;
}

// Type guard for TestResult
export function isTestResult(obj: any): obj is TestResult {
  return obj && typeof obj === 'object' && typeof obj.testName === 'string';
}

// Type guard for RuntimeTestResults
export function isRuntimeTestResults(obj: any): obj is RuntimeTestResults {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).every(value => isTestResult(value));
}

// Type guard for AllTestResults
export function isAllTestResults(obj: any): obj is AllTestResults {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).every(value => isRuntimeTestResults(value));
}
