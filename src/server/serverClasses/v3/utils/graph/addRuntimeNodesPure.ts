import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addRuntimeNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.runtimes) return operations;

  for (const [runtimeName] of Object.entries(configs.runtimes)) {
    operations.push({
      type: 'addNode',
      data: {
        id: `runtime:${runtimeName}`,
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

  return operations;
}