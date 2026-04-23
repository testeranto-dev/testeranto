import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addAgentNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.agents) return operations;

  for (const [agentName] of Object.entries(configs.agents)) {
    operations.push({
      type: 'addNode',
      data: {
        id: `agent:${agentName}`,
        type: { category: 'agent', type: 'agent' },
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
  }

  return operations;
}