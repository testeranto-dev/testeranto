import type { Server_Graph } from "../Server_Graph";

export function handleAiderRoute(graphManager: Server_Graph): Response {
  const aiderData = graphManager.getAiderSlice();
  return new Response(JSON.stringify(aiderData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}