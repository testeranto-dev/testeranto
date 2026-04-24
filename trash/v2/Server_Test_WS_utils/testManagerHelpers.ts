import path from 'path';

/**
 * Helper functions for test manager operations
 */

export function getInputFilesHelper(
  testResultsCollector: any,
  runtime: string,
  testName: string
): string[] {
  if (!testResultsCollector || typeof testResultsCollector.getInputFiles !== 'function') {
    console.warn(`[getInputFilesHelper] testResultsCollector.getInputFiles not available`);
    return [];
  }
  return testResultsCollector.getInputFiles(runtime, testName);
}

export function getOutputFilesHelper(
  testResultsCollector: any,
  runtime: string,
  testName: string
): string[] {
  if (!testResultsCollector || typeof testResultsCollector.getOutputFiles !== 'function') {
    console.warn(`[getOutputFilesHelper] testResultsCollector.getOutputFiles not available`);
    return [];
  }
  const result = testResultsCollector.getOutputFiles(runtime, testName);
  const outputDir = path.join(
    process.cwd(),
    "testeranto",
    "reports",
    runtime,
  );
  return result || [];
}

export function getTestResultsHelper(
  testResultsCollector: any,
  runtime?: string,
  testName?: string
): any[] {
  if (!testResultsCollector || typeof testResultsCollector.getTestResults !== 'function') {
    console.warn(`[getTestResultsHelper] testResultsCollector.getTestResults not available`);
    return [];
  }
  return testResultsCollector.getTestResults(runtime, testName);
}

export function getProcessSummaryHelper(
  testResultsCollector: any,
  dockerComposeManager?: any
): any {
  let processSummary = {};
  if (testResultsCollector && typeof testResultsCollector.getProcessSummary === 'function') {
    processSummary = testResultsCollector.getProcessSummary();
  }
  
  const buildErrors = dockerComposeManager?.getBuildErrors?.();
  if (buildErrors && buildErrors.length > 0) {
    return {
      ...processSummary,
      buildErrors: buildErrors
    };
  }
  return processSummary;
}
