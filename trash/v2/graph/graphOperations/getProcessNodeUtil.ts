import type { GraphData } from '../../../../graph';

export function getProcessNodeUtil(
  getGraphData: () => GraphData,
  processId: string
): any {
  const graphData = getGraphData();
  return graphData.nodes.find((node: any) => 
    node.id === processId && 
    node.type && 
    typeof node.type === 'object' && 
    node.type.category === 'process'
  );
}
