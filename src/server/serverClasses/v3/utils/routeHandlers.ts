
import type { GetAiderResponse } from "../../../../api";
import { buildFileTreeFromGraph, queryNodes, queryEdges } from "./graphUtils";

export async function handleFilesRoute(graph: any): Promise<Response> {
  const tree = buildFileTreeFromGraph(graph.nodes, graph.edges);
  return new Response(
    JSON.stringify({
      tree,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export async function handleProcessRoute(graph: any): Promise<Response> {
  const processNodes = queryNodes(graph, (node: any) => {
    return node.type?.category === 'process';
  });

  const processes = processNodes.map((node: any) => ({
    id: node.id,
    type: node.type?.type,
    label: node.label,
    metadata: node.metadata,
  }));

  return new Response(
    JSON.stringify({
      processes,
      message: `Found ${processes.length} process(es)`,
      timestamp: new Date().toISOString(),
      count: processes.length,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export async function handleAiderRoute(graph: any): Promise<Response> {
  const aiderNodes = queryNodes(graph, (node: any) =>
    node.type?.category === 'process' && node.type?.type === 'aider'
  );

  const aiderEdges = queryEdges(graph, (edge: any) =>
    aiderNodes.some(n => n.id === edge.source || n.id === edge.target)
  );

  const response: GetAiderResponse = {
    nodes: aiderNodes,
    edges: aiderEdges,
    timestamp: new Date().toISOString()
  };

  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
