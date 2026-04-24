import type { ITesterantoConfig } from "../../../src/server/Types";
import type { GraphOperation } from "../../../graph";

export function addAgentNodesPure(
  configs: ITesterantoConfig,
  timestamp: string
): GraphOperation[] {
  const agents = configs.agents;
  if (!agents) return [];

  const operations: GraphOperation[] = [];

  for (const [agentName, agentConfig] of Object.entries(agents)) {
    const agentNodeId = `agent:${agentName}`;

    operations.push({
      type: 'addNode',
      data: {
        id: agentNodeId,
        type: { category: 'agent', type: 'agent' },
        label: agentName,
        description: `Agent: ${agentName}`,
        agentName: agentName,
        config: agentConfig,
        message: agentConfig.message, // Add the message field
        timestamp: timestamp,
        status: 'todo',
        icon: 'user'
      },
      timestamp: timestamp
    });
  }

  return operations;
}
