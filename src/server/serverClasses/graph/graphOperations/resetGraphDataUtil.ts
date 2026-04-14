import type { GraphData } from '../../../../graph';

export async function resetGraphDataUtil(
  writeViewSliceFiles: () => Promise<void>,
  getGraphData: () => GraphData
): Promise<any> {
  await writeViewSliceFiles();
  const graphData = getGraphData();
  return {
    unifiedGraph: graphData,
    timestamp: new Date().toISOString()
  };
}
