import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate } from '../../../../graph';
import type { ITesterantoConfig } from '../../../../src/server/Types';
import { updateFromTestResultsPure } from '../updateFromTestResultsPure';

export function updateFromTestResultsUtil(
  testResults: any,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  configs?: ITesterantoConfig
): Promise<GraphUpdate> {
  return updateFromTestResultsPure(
    testResults,
    graph,
    projectRoot,
    featureIngestor,
    configs
  );
}
