

import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate, GraphOperation } from '../../../graph';
import type { TestResult } from '../Server_Docker/TestResultsCollector';
import { processSingleTestResultPure } from './processSingleTestResultPure';

// Pure function to create graph update from test results
export async function updateFromTestResultsPure(
  testResults: TestResult | TestResult[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  config?: any
): Promise<GraphUpdate> {
  console.log(`[updateFromTestResultsPure] Starting to update graph from test results`);
  
  const timestamp = new Date().toISOString();

  if (Array.isArray(testResults)) {
    console.log(`[updateFromTestResultsPure] Processing array of ${testResults.length} test results`);
    const allOps: GraphOperation[] = [];
    for (const singleResult of testResults) {
      console.log(`[updateFromTestResultsPure] Processing single test result:`, {
        configKey: singleResult.configKey,
        testName: singleResult.testName
      });
      const update = await updateFromTestResultsPure(
        singleResult,
        graph,
        projectRoot,
        featureIngestor,
        config
      );
      allOps.push(...update.operations);
    }
    console.log(`[updateFromTestResultsPure] Total operations from array: ${allOps.length}`);
    return {
      operations: allOps,
      timestamp
    };
  }

  console.log(`[updateFromTestResultsPure] Processing single test result:`, {
    configKey: testResults.configKey,
    testName: testResults.testName,
    hasIndividualResults: testResults.individualResults?.length || 0
  });

  return processSingleTestResultPure(
    testResults,
    graph,
    projectRoot,
    featureIngestor,
    config,
    timestamp
  );
}
