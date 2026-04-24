import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { getProcessSlice } from '../sliceUtils';

export function getProcessSliceUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
  nodes: GraphNodeAttributes[],
  edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
  return getProcessSlice(graph);
}
