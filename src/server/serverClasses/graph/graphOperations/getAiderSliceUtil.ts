import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { getAiderSlice } from '../sliceUtils';

export function getAiderSliceUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
  nodes: GraphNodeAttributes[],
  edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
  return getAiderSlice(graph);
}
