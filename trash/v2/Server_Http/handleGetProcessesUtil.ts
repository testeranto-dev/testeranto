import type { Server_HTTP } from "../Server_HTTP";
import { getProcessesPure } from "./getProcessesPure";
import { filterProcessData } from "./utilities/filterProcessData";

export async function handleGetProcessesUtil(
  this: Server_HTTP,
): Promise<Response> {
  // Sync container statuses with Docker before returning data
  // This ensures we have the most up-to-date status
  if (typeof (this as any).syncAllContainerStatuses === 'function') {
    try {
      await (this as any).syncAllContainerStatuses();
    } catch (error) {
      console.error('[Server_HTTP] Error syncing container statuses:', error);
      // Continue even if sync fails
    }
  }

  const graphData = (this as any).getGraphData();
  const uniqueProcesses = getProcessesPure(graphData, () => (this as any).getProcessSlice());

  // Filter to reduce payload size but keep essential data
  const filteredProcesses = uniqueProcesses.map(filterProcessData);

  return new Response(JSON.stringify({
    processes: filteredProcesses,
    message: "Processes retrieved successfully",
    timestamp: new Date().toISOString(),
    count: filteredProcesses.length
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
