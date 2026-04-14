// import { LockManager } from "../../../graph/lockManager";
import type { Server } from "../Server_Static";

export async function handleDown(server: Server): Promise<Response> {
  const graphManager = server.graphManager?.getGraphManager();
  if (graphManager) {
    // const lockManager = new LockManager(graphManager.graph);
    lockManager.lockAllFiles('system:restart');
  }

  if (typeof (server as any).stopServices === 'function') {
    await (server as any).stopServices();
  } else if (typeof (server as any).DC_down === 'function') {
    await (server as any).DC_down();
  } else {
    throw new Error("Service stopping not available on this server");
  }

  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleUp(server: Server): Promise<Response> {
  const graphManager = server.graphManager?.getGraphManager();
  if (graphManager) {
    // const lockManager = new LockManager(graphManager.graph);
    lockManager.unlockAllFiles();
  }

  if (typeof (server as any).startServices === 'function') {
    await (server as any).startServices();
  } else if (typeof (server as any).DC_upAll === 'function') {
    await (server as any).DC_upAll();
  } else {
    throw new Error("Service starting not available on this server");
  }

  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
