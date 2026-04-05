import { type GraphOperation } from '../../graph/index';
import type { IndividualTestResult } from "../types/testResults";
import { handleBddPatternPure } from './handleBddPatternPure';
import { handleAaaPatternPure } from './handleAaaPatternPure';
import { handleTdtPatternPure } from './handleTdtPatternPure';
import { handleGenericPatternPure } from './handleGenericPatternPure';

// Pure function to create verb nodes for an individual test result
export function createVerbNodesForIndividualResultPure(
  individualResult: IndividualTestResult,
  testId: string,
  stepIndex: number,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  
  // Check if we have testJob data
  if (!individualResult.testJob) {
    return operations;
  }

  const testJob = individualResult.testJob as any;
  
  // Determine the test pattern based on the structure
  // BDD pattern has givens, whens, thens
  // AAA pattern has describes, its
  // TDT pattern has confirms, values, shoulds, expecteds
  
  // Check for BDD pattern (Given, When, Then)
  if (testJob.key !== undefined && (testJob.whens !== undefined || testJob.thens !== undefined)) {
    return handleBddPatternPure(testJob, testId, stepIndex, timestamp);
  }
  // Check for AAA pattern (Describe, It)
  else if (testJob.describes !== undefined || testJob.its !== undefined) {
    return handleAaaPatternPure(testJob, testId, stepIndex, timestamp);
  }
  // Check for TDT pattern (Confirm, Value, Should, Expected)
  else if (testJob.confirms !== undefined || testJob.values !== undefined || testJob.shoulds !== undefined || testJob.expecteds !== undefined) {
    return handleTdtPatternPure(testJob, testId, stepIndex, timestamp);
  }
  // If no specific pattern is detected but we have a key, create a generic verb node
  else if (testJob.key !== undefined) {
    return handleGenericPatternPure(testJob, testId, stepIndex, timestamp);
  }

  return operations;
}
