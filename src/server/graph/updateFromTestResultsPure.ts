
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate, GraphOperation } from ".";
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

  if (Array.isArray(testResults)) {
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

  return processSingleTestResultPure(
    testResults,
    graph,
    projectRoot,
    featureIngestor,
    config,
    timestamp
  );
}
