import type { FilesAndFoldersResponse } from "../../../api";
import type { Server_Graph } from "../Server_Graph";

export function handleGetViewsUtil(configs: any): Response {
  try {
    const views = configs.views || {};
    const viewList = Object.entries(views).map(([key, value]) => ({
      key,
      path: (value as any).filePath || value,
      type: 'view'
    }));

    return new Response(JSON.stringify({
      views: viewList,
      count: viewList.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error('[handleGetViewsUtil] Error:', error);
    return new Response(JSON.stringify({
      error: "Failed to get views",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export function handleFilesRoute(graphManager: Server_Graph): Response {
  const filesData = graphManager.getFilesAndFolders();

  const response: FilesAndFoldersResponse = {
    nodes: filesData.nodes.map(node => ({
      id: node.id,
      type: node.type as 'file' | 'folder',
      label: node.label || '',
      description: node.description,
      status: node.status,
      priority: node.priority,
      timestamp: node.timestamp,
      metadata: node.metadata,
      icon: node.icon
    })),
    edges: filesData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      attributes: {
        type: edge.attributes.type || '',
        timestamp: edge.attributes.timestamp,
        metadata: edge.attributes.metadata,
        directed: edge.attributes.directed
      }
    }))
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function handleProcessRoute(graphManager: Server_Graph): Response {
  const processData = graphManager.getProcessSlice();
  return new Response(JSON.stringify(processData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function handleAiderRoute(graphManager: Server_Graph): Response {
  const aiderData = graphManager.getAiderSlice();
  return new Response(JSON.stringify(aiderData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function handleRuntimeRoute(graphManager: Server_Graph): Response {
  const runtimeData = graphManager.getRuntimeSlice();
  return new Response(JSON.stringify(runtimeData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
