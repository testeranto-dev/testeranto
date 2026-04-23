import type { GraphData, GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function generateEdgesPure(
  graphData: GraphData,
  config: ITesterantoConfig | undefined,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Create a map of node IDs for quick lookup
  const nodeMap = new Map<string, any>();
  for (const node of graphData.nodes) {
    nodeMap.set(node.id, node);
  }

  // Connect agents to their associated resources
  if (config?.agents) {
    for (const [agentName] of Object.entries(config.agents)) {
      const agentId = `agent:${agentName}`;
      if (nodeMap.has(agentId)) {
        // Connect agent to view nodes
        if (config.views) {
          for (const [viewKey] of Object.entries(config.views)) {
            const viewId = `view:${viewKey}`;
            if (nodeMap.has(viewId)) {
              // Check if edge already exists
              let edgeExists = false;
              for (const edge of graphData.edges) {
                if (edge.source === agentId && edge.target === viewId) {
                  edgeExists = true;
                  break;
                }
              }
              if (!edgeExists) {
                operations.push({
                  type: 'addEdge',
                  data: {
                    source: agentId,
                    target: viewId,
                    attributes: {
                      type: {
                        category: 'association', type: 'associatedWith', directed:
                          true
                      },
                      timestamp
                    }
                  },
                  timestamp
                });
              }
            }
          }
        }
      }
    }
  }

  // Connect views to their slice files (represented as file nodes)
  if (config?.views) {
    for (const [viewKey] of Object.entries(config.views)) {
      const viewId = `view:${viewKey}`;
      if (nodeMap.has(viewId)) {
        // Connect view to runtime nodes
        if (config.runtimes) {
          for (const [runtimeName] of Object.entries(config.runtimes)) {
            const runtimeId = `runtime:${runtimeName}`;
            if (nodeMap.has(runtimeId)) {
              let edgeExists = false;
              for (const edge of graphData.edges) {
                if (edge.source === viewId && edge.target === runtimeId) {
                  edgeExists = true;
                  break;
                }
              }
              if (!edgeExists) {
                operations.push({
                  type: 'addEdge',
                  data: {
                    source: viewId,
                    target: runtimeId,
                    attributes: {
                      type: { category: 'dependency', type: 'uses', directed: true },
                      timestamp
                    }
                  },
                  timestamp
                });
              }
            }
          }
        }
      }
    }
  }

  return operations;
}