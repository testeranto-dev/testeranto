import type { Server_Graph } from "../Server_Graph";

export function handleProcessRoute(graphManager: Server_Graph): Response {
  const processData = graphManager.getProcessSlice();
  return new Response(JSON.stringify(processData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
