import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { getFilesAndFoldersSlice } from '../sliceUtils';

export function getFilesAndFoldersUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
  nodes: GraphNodeAttributes[],
  edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
  return getFilesAndFoldersSlice(graph);
}
