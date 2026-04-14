import type { GraphData } from '../../../../graph';
import { getViewSlicePure } from '../graphSliceUtils';

export function getViewSliceUtil(
  getGraphData: () => GraphData,
  viewKey: string
): {
  nodes: any[],
  edges: any[]
} {
  const graphData = getGraphData();
  return getViewSlicePure(graphData, viewKey);
}
