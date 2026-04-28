import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addConfigNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  // Add a global config node for agents (which are not tied to a specific runtime)
  operations.push({
    type: 'addNode',
    data: {
      id: 'config:global',
      type: { category: 'resource', type: 'config' },
      label: 'global',
      description: 'Global configuration (agents)',
      status: 'todo',
      icon: 'gear',
      metadata: {
        configKey: 'global',
        timestamp
      }
    },
    timestamp
  });

  if (!configs.runtimes) {
    console.error("No runtimes found in config");
    return operations;
  }

  for (const configKey of Object.keys(configs.runtimes)) {
    operations.push({
      type: 'addNode',
      data: {
        id: `config:${configKey}`,
        type: { category: 'resource', type: 'config' },
        label: configKey,
        description: `Config: ${configKey}`,
        status: 'todo',
        icon: 'gear',
        metadata: {
          configKey,
          timestamp
        }
      },
      timestamp
    });
  }

  return operations;
}
