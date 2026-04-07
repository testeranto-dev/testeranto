import { LockManager } from "../../../graph/lockManager";
import type { Server } from "../../Server";


export async function handleLockStatusRoute(server: Server): Promise<Response> {
  const graphManager = server.graphManager?.getGraphManager();
  if (!graphManager) {
    throw new Error("Graph manager not available");
  }

  const lockManager = new LockManager(graphManager.graph);
  const lockedFiles = lockManager.getLockedFiles();
  const hasLockedFiles = lockManager.hasLockedFiles();

  return new Response(JSON.stringify({
    hasLockedFiles,
    lockedFiles,
    lockedCount: lockedFiles.length,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
