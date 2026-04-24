import type { ITesterantoConfig } from "../../../../../Types";
import type { GraphOperation } from "../../../../../graph";

export function addRuntimeNodesFromConfig(
  configs: ITesterantoConfig,
  timestamp: string,
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  for (const [configKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const runtimeNodeId = `runtime:${configKey}`;

    // Add runtime node
    operations.push({
      type: 'addNode',
      data: {
        id: runtimeNodeId,
        type: { category: 'resource', type: 'runtime' },
        label: configKey,
        description: `Runtime: ${runtimeConfig.runtime}`,
        metadata: {
          runtime: runtimeConfig.runtime,
          configKey,
        },
        timestamp,
      },
      timestamp,
    });

    // Add test nodes and edges
    const tests = runtimeConfig.tests || [];
    for (const testPath of tests) {
      const testNodeId = `test:${configKey}:${testPath}`;

      operations.push({
        type: 'addNode',
        data: {
          id: testNodeId,
          type: { category: 'file', type: 'entrypoint' },
          label: testPath.split('/').pop() || testPath,
          description: `Test: ${testPath}`,
          metadata: {
            testPath,
            configKey,
            runtime: runtimeConfig.runtime,
          },
          timestamp,
        },
        timestamp,
      });

      // Add edge from runtime to test
      operations.push({
        type: 'addEdge',
        data: {
          source: runtimeNodeId,
          target: testNodeId,
          attributes: {
            type: { category: 'ownership', type: 'has', directed: true },
            timestamp,
          },
        },
        timestamp,
      });
    }
  }

  return operations;
}
