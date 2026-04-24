import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphData } from '../../../../graph';
import { graphToData } from '../graphToData';

export function getGraphDataUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): GraphData {
  return graphToData(graph);
}
