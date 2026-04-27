import type { GraphOperation, TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addRuntimeNodesPure(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.runtimes) return operations;

  for (const [runtimeName] of Object.entries(configs.runtimes)) {
    const runtimeId = `runtime:${runtimeName}`;

    // Check for existing nodes in the graph
    if (!graph.hasNode(runtimeId)) {
      // Add runtime node only (edges are added by generateEdgesPure)
      operations.push({
        type: 'addNode',
        data: {
          id: runtimeId,
          type: { category: 'resource', type: 'runtime' },
          label: runtimeName,
          description: `Runtime: ${runtimeName}`,
          status: 'todo',
          icon: 'terminal',
          metadata: {
            runtimeName,
            timestamp
          }
        },
        timestamp
      });
    }

    // Associate runtime with its config node
    operations.push({
      type: 'addEdge',
      data: {
        source: `config:${runtimeName}`,
        target: runtimeId,
        attributes: {
          type: { category: 'structural', type: 'contains', directed: true },
          timestamp
        }
      },
      timestamp
    });
  }

  return operations;
}
