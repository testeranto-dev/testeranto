import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphOperation } from '../../../graph';
import type { TestResult } from '../Server_Docker/TestResultsCollector';
import { processFeaturesForTest } from './processFeaturesForTest';

export async function processTopLevelFeaturesPure(
  singleTestResult: TestResult,
  sanitizedConfigKey: string,
  filePathForEntrypoint: string,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor: ((url: string) => Promise<{ data: string; filepath: string }>) | undefined,
  operations: GraphOperation[],
  timestamp: string
): Promise<void> {
  if (singleTestResult.features && Array.isArray(singleTestResult.features)) {
    const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:0`;

    await processFeaturesForTest(
      singleTestResult.features,
      testId,
      operations,
      graph,
      projectRoot,
      featureIngestor,
      timestamp
    );
  } else {
    console.log(`[processTopLevelFeaturesPure] No top-level features found for test ${singleTestResult.testName}`);
  }
}
