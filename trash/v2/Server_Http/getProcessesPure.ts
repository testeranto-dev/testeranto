import type { GraphData } from "../../../graph";

export function getProcessesPure(
  graphData: GraphData,
  getProcessSlice: () => any
): any[] {
  // Filter for process nodes
  const processNodes = graphData.nodes.filter((node: any) => {
    const isProcess = node.type &&
      typeof node.type === 'object' &&
      node.type.category === 'process';
    return isProcess;
  });

  // Also get from process slice for compatibility
  const processSlice = getProcessSlice();
  let sliceProcesses: any[] = [];
  if (processSlice && processSlice.nodes && Array.isArray(processSlice.nodes)) {
    sliceProcesses = processSlice.nodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      status: node.status,
      metadata: node.metadata,
      timestamp: node.timestamp
    }));
  }

  // Merge both sources, preferring graph nodes
  const allProcesses = [...processNodes, ...sliceProcesses];

  // Remove duplicates by id
  const uniqueProcesses = Array.from(new Map(
    allProcesses.map(process => [process.id, process])
  ).values());

  return uniqueProcesses;
}
