import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate } from '../../../../graph';
import type { ITesterantoConfig } from '../../../../Types';
import { updateFromTestResultsPure } from '../../graph/updateFromTestResultsPure';

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
