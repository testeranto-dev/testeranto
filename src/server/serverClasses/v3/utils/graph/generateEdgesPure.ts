import Graph from "graphology";
import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function generateEdgesPure(
  graph: Graph,
  config: ITesterantoConfig | undefined,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Helper to check if an edge exists between two nodes
  function edgeExists(source: string, target: string): boolean {
    return graph.hasEdge(source, target);
  }

  // Helper to check if a node exists
  function nodeExists(nodeId: string): boolean {
    return graph.hasNode(nodeId);
  }

  // Connect views to runtime nodes
  if (config?.views) {
    for (const [viewKey] of Object.entries(config.views)) {
      const viewId = `view:${viewKey}`;
      if (!nodeExists(viewId)) continue;

      if (config.runtimes) {
        for (const [runtimeName] of Object.entries(config.runtimes)) {
          const runtimeId = `runtime:${runtimeName}`;
          if (!nodeExists(runtimeId)) continue;

          if (!edgeExists(viewId, runtimeId)) {
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

  // Connect runtime nodes to config nodes and test nodes
  if (config?.runtimes) {
    for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
      const runtimeId = `runtime:${runtimeName}`;
      if (!nodeExists(runtimeId)) continue;

      // Connect runtime to config node
      const configNodeId = `config:${runtimeName}`;
      if (nodeExists(configNodeId) && !edgeExists(configNodeId, runtimeId)) {
        operations.push({
          type: 'addEdge',
          data: {
            source: configNodeId,
            target: runtimeId,
            attributes: {
              type: { category: 'ownership', type: 'has', directed: true },
              timestamp
            }
          },
          timestamp
        });
      }

      // Connect runtime to test nodes
      const testNames = runtimeConfig.tests || [];
      for (const testName of testNames) {
        const testNodeId = `test:${runtimeName}:${testName}`;
        if (!nodeExists(testNodeId)) continue;

        if (!edgeExists(runtimeId, testNodeId)) {
          operations.push({
            type: 'addEdge',
            data: {
              source: runtimeId,
              target: testNodeId,
              attributes: {
                type: { category: 'ownership', type: 'has', directed: true },
                timestamp
              }
            },
            timestamp
          });
        }
      }
    }
  }

  // Connect test nodes to process nodes (check and bdd)
  if (config?.runtimes) {
    for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
      const testNames = runtimeConfig.tests || [];
      for (const testName of testNames) {
        const testNodeId = `test:${runtimeName}:${testName}`;
        if (!nodeExists(testNodeId)) continue;

        // Connect to bdd process
        const bddProcessId = `bdd_process:${runtimeName}:${testName}`;
        if (nodeExists(bddProcessId) && !edgeExists(testNodeId, bddProcessId)) {
          operations.push({
            type: 'addEdge',
            data: {
              source: testNodeId,
              target: bddProcessId,
              attributes: {
                type: { category: 'ownership', type: 'has', directed: true },
                timestamp
              }
            },
            timestamp
          });
        }

        // Connect to check process
        const checkProcessId = `check_process:${runtimeName}:${testName}`;
        if (nodeExists(checkProcessId) && !edgeExists(testNodeId, checkProcessId)) {
          operations.push({
            type: 'addEdge',
            data: {
              source: testNodeId,
              target: checkProcessId,
              attributes: {
                type: { category: 'ownership', type: 'has', directed: true },
                timestamp
              }
            },
            timestamp
          });
        }
      }
    }
  }

  // Connect agent nodes to config nodes and test nodes
  if (config?.agents) {
    for (const [agentName] of Object.entries(config.agents)) {
      const agentId = `agent:${agentName}`;
      if (!nodeExists(agentId)) continue;

      // Connect agent to config nodes
      if (config.runtimes) {
        for (const [configKey] of Object.entries(config.runtimes)) {
          const configNodeId = `config:${configKey}`;
          if (nodeExists(configNodeId) && !edgeExists(configNodeId, agentId)) {
            operations.push({
              type: 'addEdge',
              data: {
                source: configNodeId,
                target: agentId,
                attributes: {
                  type: { category: 'ownership', type: 'has', directed: true },
                  timestamp
                }
              },
              timestamp
            });
          }
        }
      }

      // Connect agent to test nodes
      if (config.runtimes) {
        for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
          const testNames = runtimeConfig.tests || [];
          for (const testName of testNames) {
            const testNodeId = `test:${runtimeName}:${testName}`;
            if (nodeExists(testNodeId) && !edgeExists(testNodeId, agentId)) {
              operations.push({
                type: 'addEdge',
                data: {
                  source: testNodeId,
                  target: agentId,
                  attributes: {
                    type: { category: 'ownership', type: 'has', directed: true },
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

  // Connect process nodes to file nodes (input/output files)
  for (const nodeId of graph.nodes()) {
    const nodeAttrs = graph.getNodeAttributes(nodeId);
    if (nodeAttrs?.type?.category === 'process') {
      const processId = nodeId;
      // Find file nodes that are associated with this process
      for (const fileNodeId of graph.nodes()) {
        const fileNodeAttrs = graph.getNodeAttributes(fileNodeId);
        if (fileNodeAttrs?.type?.category === 'file') {
          const fileId = fileNodeId;
          if (!edgeExists(processId, fileId)) {
            operations.push({
              type: 'addEdge',
              data: {
                source: processId,
                target: fileId,
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

  return operations;
}
