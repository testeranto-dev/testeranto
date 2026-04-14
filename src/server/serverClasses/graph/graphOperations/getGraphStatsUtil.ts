import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from '../../../../graph';
import { getGraphStatsPure } from '../getGraphStatsPure';

export function getGraphStatsUtil(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): { nodes: number; edges: number; nodeTypes: Record<string, number>; edgeTypes: Record<string, number> } {
  return getGraphStatsPure(graph);
}
