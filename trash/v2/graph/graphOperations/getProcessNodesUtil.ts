import type { GraphData } from '../../../../graph';

export function getProcessNodesUtil(
  getGraphData: () => GraphData
): any[] {
  const graphData = getGraphData();
  return graphData.nodes.filter((node: any) => {
    return node.type && 
           typeof node.type === 'object' && 
           node.type.category === 'process';
  });
}
