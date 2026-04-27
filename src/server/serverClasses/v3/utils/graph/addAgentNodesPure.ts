import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addAgentNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.agents) return operations;

  for (const [agentName, agentConfig] of Object.entries(configs.agents)) {
    operations.push({
      type: 'addNode',
      data: {
        id: `agent:${agentName}`,
        type: { category: 'process', type: 'agent' },
        label: agentName,
        description: `Agent: ${agentName}`,
        status: 'todo',
        icon: 'robot',
        metadata: {
          agentName,
          timestamp
        }
      },
      timestamp
    });

    // Associate agent with the global config node
    operations.push({
      type: 'addEdge',
      data: {
        source: 'config:global',
        target: `agent:${agentName}`,
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
