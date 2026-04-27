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

  // Connect runtime nodes to config nodes and test nodes
  if (config?.runtimes) {
    for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
      const runtimeId = `runtime:${runtimeName}`;
      if (!nodeMap.has(runtimeId)) continue;

      // Connect runtime to config node
      const configNodeId = `config:${runtimeName}`;
      if (nodeMap.has(configNodeId)) {
        let edgeExists = false;
        for (const edge of graphData.edges) {
          if (edge.source === configNodeId && edge.target === runtimeId) {
            edgeExists = true;
            break;
          }
        }
        if (!edgeExists) {
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
      }

      // Connect runtime to test nodes
      const testNames = runtimeConfig.tests || [];
      for (const testName of testNames) {
        const testNodeId = `test:${runtimeName}:${testName}`;
        if (nodeMap.has(testNodeId)) {
          let edgeExists = false;
          for (const edge of graphData.edges) {
            if (edge.source === runtimeId && edge.target === testNodeId) {
              edgeExists = true;
              break;
            }
          }
          if (!edgeExists) {
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
  }

  // Connect test nodes to process nodes (check and bdd)
  if (config?.runtimes) {
    for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
      const testNames = runtimeConfig.tests || [];
      for (const testName of testNames) {
        const testNodeId = `test:${runtimeName}:${testName}`;
        if (!nodeMap.has(testNodeId)) continue;

        // Connect to bdd process
        const bddProcessId = `bdd_process:${runtimeName}:${testName}`;
        if (nodeMap.has(bddProcessId)) {
          let edgeExists = false;
          for (const edge of graphData.edges) {
            if (edge.source === testNodeId && edge.target === bddProcessId) {
              edgeExists = true;
              break;
            }
          }
          if (!edgeExists) {
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
        }

        // Connect to check process
        const checkProcessId = `check_process:${runtimeName}:${testName}`;
        if (nodeMap.has(checkProcessId)) {
          let edgeExists = false;
          for (const edge of graphData.edges) {
            if (edge.source === testNodeId && edge.target === checkProcessId) {
              edgeExists = true;
              break;
            }
          }
          if (!edgeExists) {
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
  }

  // Connect agent nodes to config nodes and test nodes
  if (config?.agents) {
    for (const [agentName] of Object.entries(config.agents)) {
      const agentId = `agent:${agentName}`;
      if (!nodeMap.has(agentId)) continue;

      // Connect agent to config nodes
      if (config.runtimes) {
        for (const [configKey] of Object.entries(config.runtimes)) {
          const configNodeId = `config:${configKey}`;
          if (nodeMap.has(configNodeId)) {
            let edgeExists = false;
            for (const edge of graphData.edges) {
              if (edge.source === configNodeId && edge.target === agentId) {
                edgeExists = true;
                break;
              }
            }
            if (!edgeExists) {
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
      }

      // Connect agent to test nodes
      if (config.runtimes) {
        for (const [runtimeName, runtimeConfig] of Object.entries(config.runtimes)) {
          const testNames = runtimeConfig.tests || [];
          for (const testName of testNames) {
            const testNodeId = `test:${runtimeName}:${testName}`;
            if (nodeMap.has(testNodeId)) {
              let edgeExists = false;
              for (const edge of graphData.edges) {
                if (edge.source === testNodeId && edge.target === agentId) {
                  edgeExists = true;
                  break;
                }
              }
              if (!edgeExists) {
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
  }

  // Connect process nodes to file nodes (input/output files)
  for (const node of graphData.nodes) {
    if (node.type?.category === 'process') {
      const processId = node.id;
      // Find file nodes that are associated with this process
      for (const fileNode of graphData.nodes) {
        if (fileNode.type?.category === 'file') {
          const fileId = fileNode.id;
          // Check if edge already exists
          let edgeExists = false;
          for (const edge of graphData.edges) {
            if (edge.source === processId && edge.target === fileId) {
              edgeExists = true;
              break;
            }
          }
          if (!edgeExists) {
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
