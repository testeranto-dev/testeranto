import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphData } from '../../../../graph';
import { graphToData } from '../../graph/graphToData';

export function getGraphDataUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): GraphData {
  return graphToData(graph);
}
