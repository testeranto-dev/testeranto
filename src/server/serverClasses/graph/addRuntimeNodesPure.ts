import type { ITesterantoConfig } from "../../../Types";
import type { GraphOperation } from "../../../graph";

export function addRuntimeNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const runtimes = configs.runtimes;
  if (!runtimes) return [];

  const operations: GraphOperation[] = [];

  for (const [configKey, runtimeConfig] of Object.entries(runtimes)) {
    const configNodeId = `config:${configKey}`;
    operations.push({
      type: 'addNode',
      data: {
        id: configNodeId,
        type: 'config',
        label: configKey,
        description: `Runtime config: ${configKey}`,
        status: 'todo',
        icon: 'settings-gear',
        metadata: {
          configKey,
          runtime: runtimeConfig.runtime,
          tests: runtimeConfig.tests,
          dockerfile: runtimeConfig.dockerfile,
          timestamp
        }
      },
      timestamp
    });

    const tests = runtimeConfig.tests || [];
    for (const testPath of tests) {
      const entrypointId = `entrypoint:${testPath}`;
      operations.push({
        type: 'addNode',
        data: {
          id: entrypointId,
          type: 'entrypoint',
          label: testPath.split('/').pop() || testPath,
          description: `Test entrypoint: ${testPath}`,
          status: 'todo',
          icon: 'file-text',
          metadata: {
            configKey,
            filePath: testPath,
            runtime: runtimeConfig.runtime,
            timestamp
          }
        },
        timestamp
      });
      operations.push({
        type: 'addEdge',
        data: {
          source: configNodeId,
          target: entrypointId,
          attributes: {
            type: 'configuredBy',
            timestamp
          }
        },
        timestamp
      });
    }
  }

  return operations;
}
