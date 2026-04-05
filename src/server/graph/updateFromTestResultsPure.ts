import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type GraphUpdate, type TesterantoGraph } from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { processSingleTestResultPure } from './processSingleTestResultPure';

// Pure function to create graph update from test results
export async function updateFromTestResultsPure(
  testResults: TestResult | TestResult[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  config?: any
): Promise<GraphUpdate> {
  const timestamp = new Date().toISOString();

  // Handle array of test results
  if (Array.isArray(testResults)) {
    console.log(`[GraphManager] updateFromTestResults called with array of ${testResults.length} test results`);
    const allOps: GraphOperation[] = [];
    for (const singleResult of testResults) {
      const update = await updateFromTestResultsPure(
        singleResult,
        graph,
        projectRoot,
        featureIngestor,
        config
      );
      allOps.push(...update.operations);
    }
    return {
      operations: allOps,
      timestamp
    };
  }

  // Process single test result
  return processSingleTestResultPure(
    testResults,
    graph,
    projectRoot,
    featureIngestor,
    config,
    timestamp
  );
}
