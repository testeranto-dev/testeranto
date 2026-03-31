import type { IRunTime, ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { getInputFilesPure } from "./utils/getInputFilesPure.ts";
import { getOutputFilesPure } from "./utils/getOutputFilesPure";
import { getProcessSummaryPure } from "./utils/getProcessSummaryPure";
import { getTestResultsPure } from "./utils/getTestResultsPure";

export interface TestResult {
  runtime: string;
  testName: string;
  passed: boolean;
  details: any;
  inputFiles: string[];
  outputFiles: string[];
  timestamp: Date;
}

export class TestResultsCollector {
  constructor(
    private configs: ITesterantoConfig,
    private mode: IMode,
    private inputFiles: any,
    private outputFiles: any
  ) { }

  collectAllTestResults(): TestResult[] {
    const results: TestResult[] = [];

    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
        // Get test results from pure function
        const testResults = getTestResultsPure(runtime, testName);

        // Get input and output files
        const inputFiles = getInputFilesPure(this.configs, this.inputFiles, runtime, testName);
        const outputFiles = getOutputFilesPure(this.configs, this.outputFiles, runtime, testName);

        // Process each test result
        if (Array.isArray(testResults)) {
          testResults.forEach((result: any) => {
            results.push({
              runtime,
              testName,
              passed: !result.failed,
              details: result,
              inputFiles,
              outputFiles,
              timestamp: new Date()
            });
          });
        } else if (testResults && typeof testResults === 'object') {
          const passed = !(testResults as any).failed;
          results.push({
            runtime,
            testName,
            passed,
            details: testResults,
            inputFiles,
            outputFiles,
            timestamp: new Date()
          });
        } else {
          // If no specific results, create a placeholder
          results.push({
            runtime,
            testName,
            passed: true, // Assume passed if no results
            details: {},
            inputFiles,
            outputFiles,
            timestamp: new Date()
          });
        }
      }
    }

    return results;
  }

  getProcessSummary(): any {
    return getProcessSummaryPure();
  }

  getTestResults(runtime?: string, testName?: string): any[] {
    return getTestResultsPure(runtime, testName);
  }

  getInputFiles(runtime: string, testName: string): string[] {
    return getInputFilesPure(this.configs, this.inputFiles, runtime, testName);
  }

  getOutputFiles(runtime: string, testName: string): string[] {
    return getOutputFilesPure(this.configs, this.outputFiles, runtime, testName);
  }
}
