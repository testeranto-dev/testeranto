import type { GraphData } from '../../../../graph';
import { getViewNodesPure } from '../graphSliceUtils';

export function getViewNodesUtil(
  getGraphData: () => GraphData
): any[] {
  const graphData = getGraphData();
  return getViewNodesPure(graphData);
}
