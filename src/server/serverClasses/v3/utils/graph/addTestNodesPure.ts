import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addTestNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.runtimes) return operations;

  for (const [runtimeName, runtimeConfig] of Object.entries(configs.runtimes)) {
    const testNames = runtimeConfig.tests || [];
    for (const testName of testNames) {
      const testNodeId = `test:${runtimeName}:${testName}`;

      operations.push({
        type: 'addNode',
        data: {
          id: testNodeId,
          type: { category: 'process', type: 'bdd' },
          label: testName,
          description: `Test: ${testName}`,
          status: 'todo',
          icon: 'beaker',
          metadata: {
            runtimeName,
            testName,
            timestamp
          }
        },
        timestamp
      });

      // Connect the test node to its config node
      operations.push({
        type: 'addEdge',
        data: {
          source: `config:${runtimeName}`,
          target: testNodeId,
          attributes: {
            type: { category: 'structural', type: 'contains', directed: true },
            timestamp
          }
        },
        timestamp
      });
    }
  }

  return operations;
}
