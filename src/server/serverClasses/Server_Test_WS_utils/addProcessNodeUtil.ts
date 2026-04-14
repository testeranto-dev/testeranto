import type { GraphOperation, GraphNodeType, GraphEdgeType } from '../../../graph';

export function addProcessNodeUtil(
  processType: 'builder' | 'bdd' | 'check' | 'aider' | 'docker_process',
  runtime: string,
  testName: string,
  configKey: string,
  configValue: any,
  status: 'running' | 'stopped' | 'failed' = 'running',
  containerId?: string,
  serviceName?: string
): GraphOperation[] {
  const timestamp = new Date().toISOString();
  const nodeId = `${processType}_process:${configKey}:${testName}`;

  const operations: GraphOperation[] = [{
    type: 'addNode',
    data: {
      id: nodeId,
      type: { category: 'process', type: processType } as GraphNodeType,
      label: `${processType}: ${testName}`,
      description: `${processType} process for ${testName} (${runtime})`,
      status: status === 'running' ? 'doing' :
        status === 'failed' ? 'blocked' : 'done',
      priority: 'medium',
      timestamp: timestamp,
      metadata: {
        runtime,
        testName,
        configKey,
        configValue,
        containerId,
        serviceName,
        status,
        processType,
        startTime: timestamp
      },
      icon: processType === 'aider' ? 'comment-discussion' :
        processType === 'bdd' ? 'beaker' :
          processType === 'check' ? 'checklist' :
            processType === 'builder' ? 'gear' : 'terminal'
    },
    timestamp: timestamp
  }];

  // Only add edge if this is a runtime config (not an agent)
  // Check if configKey is a runtime config (not 'agent')
  // Runtime configs have config nodes created by addRuntimeNodesFromConfigUtil
  // Agent configs don't have config nodes
  if (configKey !== 'agent') {
    const configNodeId = `config:${configKey}`;
    operations.push({
      type: 'addEdge',
      data: {
        source: configNodeId,
        target: nodeId,
        attributes: {
          type: {
            category: 'ownership',
            type: 'has',
            directed: true
          } as GraphEdgeType,
          timestamp: timestamp,
          metadata: {
            relationship: 'config_has_process'
          }
        }
      },
      timestamp: timestamp
    });
  } else {
    // For agent processes, add edge from agent node instead
    const agentNodeId = `agent:${testName}`;
    operations.push({
      type: 'addEdge',
      data: {
        source: agentNodeId,
        target: nodeId,
        attributes: {
          type: {
            category: 'ownership',
            type: 'has',
            directed: true
          } as GraphEdgeType,
          timestamp: timestamp,
          metadata: {
            relationship: 'agent_has_process'
          }
        }
      },
      timestamp: timestamp
    });
  }

  console.log(`[addProcessNodeUtil] Created process node ${nodeId} with type ${processType}`);

  return operations;
}
