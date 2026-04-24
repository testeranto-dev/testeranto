import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { getRuntimeSlice } from '../sliceUtils';

export function getRuntimeSliceUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
  nodes: GraphNodeAttributes[],
  edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
  return getRuntimeSlice(graph);
}
