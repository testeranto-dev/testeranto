

import type { GraphOperation } from '../../../graph';
import type { TestResult } from '../Server_Docker/TestResultsCollector';
import { createVerbNodesForIndividualResultPure } from './createVerbNodesForIndividualResultPure';

export function createVerbNodesFromTestResultsPure(
  testResult: TestResult,
  testId: string,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Check if we have individual results
  if (!testResult.individualResults || !Array.isArray(testResult.individualResults)) {
    return operations;
  }

  // Process each individual result (each step)
  for (let i = 0; i < testResult.individualResults.length; i++) {
    const individualResult = testResult.individualResults[i];

    // Create verb nodes for this individual result
    const verbOps = createVerbNodesForIndividualResultPure(
      individualResult,
      testId,
      i,
      timestamp
    );
    operations.push(...verbOps);
  }

  return operations;
}
