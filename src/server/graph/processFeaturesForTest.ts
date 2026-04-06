import {
  type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph
} from '../../graph/index';
import { processSingleFeaturePure } from './processSingleFeaturePure';

// Helper function to process features for a test
export async function processFeaturesForTest(
  features: string[],
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  timestamp: string
): Promise<void> {

  for (const featureUrl of features) {
    await processSingleFeaturePure(
      featureUrl,
      testId,
      operations,
      graph,
      projectRoot,
      featureIngestor,
      timestamp
    );
  }
}
