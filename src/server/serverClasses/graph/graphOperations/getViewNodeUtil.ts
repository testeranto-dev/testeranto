import type { GraphData } from '../../../../graph';
import { getViewNodePure } from '../graphSliceUtils';

export function getViewNodeUtil(
  getGraphData: () => GraphData,
  viewKey: string
): any {
  const graphData = getGraphData();
  return getViewNodePure(graphData, viewKey);
}
