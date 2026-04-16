import type { Server_Graph } from "../Server_Graph";

export function handleRuntimeRoute(graphManager: Server_Graph): Response {
  const runtimeData = graphManager.getRuntimeSlice();
  return new Response(JSON.stringify(runtimeData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
