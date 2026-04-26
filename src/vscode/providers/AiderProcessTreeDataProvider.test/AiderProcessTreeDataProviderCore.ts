/**
 * Core business logic for AiderProcessTreeDataProvider without external dependencies
 */
import type { GetAiderResponse } from "../../../api";

export type GraphNode = NonNullable<GetAiderResponse['nodes']>[number];
export type GraphEdge = NonNullable<GetAiderResponse['edges']>[number];
export type GraphData = GetAiderResponse;

export interface Agent {
  name: string;
}

export interface TreeItemData {
  description?: string;
  status?: string;
  exitCode?: number;
  runtime?: string;
  testName?: string;
  configKey?: string;
  containerId?: string;
  containerName?: string;
  isActive?: boolean;
  aiderId?: string;
  agentName?: string;
  isAgentAider?: boolean;
  entrypointId?: string;
  count?: number;
  refresh?: boolean;
}

export class AiderProcessTreeDataProviderCore {
  /**
   * Process graph data and agents to create tree items
   */
  processGraphData(graphData: GetAiderResponse | null, agents: Agent[]): TreeItemData[] {
    const items: TreeItemData[] = [];

    // Add refresh item
    items.push({
      description: 'Reload graph data',
      refresh: true
    });

    if (agents.length > 0) {
      items.push({
        description: `${agents.length} user-defined agents with aider`,
        count: agents.length
      });

      for (const agent of agents) {
        const agentName = agent.name;
        const agentAiderNodes = graphData?.nodes?.filter(node =>
          node.type === 'aider_process' &&
          node.metadata?.agentName === agentName
        ) || [];

        items.push({
          agentName,
          description: `${agentAiderNodes.length} aider process(es)`,
          count: agentAiderNodes.length
        });
      }
    } else {
      items.push({
        description: 'No user-defined agents found'
      });
    }

    if (graphData) {
      const aiderNodes = graphData.nodes.filter(node =>
        (node.type === 'aider' || node.type === 'aider_process') &&
        !node.metadata?.agentName
      );

      if (aiderNodes.length > 0) {
        items.push({
          description: `${aiderNodes.length} regular aider processes for tests`,
          count: aiderNodes.length
        });

        const entrypointMap = new Map<string, GraphNode[]>();

        for (const aiderNode of aiderNodes) {
          const connectedEdges = graphData.edges.filter(edge =>
            edge.target === aiderNode.id &&
            edge.attributes.type === 'hasAider'
          );

          let entrypointId = 'ungrouped';
          for (const edge of connectedEdges) {
            const entrypointNode = graphData.nodes.find(n => n.id === edge.source);
            if (entrypointNode && entrypointNode.type === 'entrypoint') {
              entrypointId = entrypointNode.id;
              break;
            }
          }

          if (!entrypointMap.has(entrypointId)) {
            entrypointMap.set(entrypointId, []);
          }
          entrypointMap.get(entrypointId)!.push(aiderNode);
        }

        for (const [entrypointId, aiderNodes] of entrypointMap.entries()) {
          items.push({
            entrypointId,
            description: `${aiderNodes.length} aider process(es)`,
            count: aiderNodes.length
          });
        }
      } else if (agents.length === 0) {
        items.push({
          description: 'No aider processes in graph'
        });
      }
    } else {
      // graphData is null
      if (agents.length === 0) {
        items.push({
          description: 'No aider processes in graph'
        });
      }
    }

    return items;
  }

  /**
   * Create tree item data from a graph node
   */
  createTreeItemData(node: GraphNode, entrypointNode?: GraphNode): TreeItemData {
    // GraphNode is now imported from api.ts
    const metadata = node.metadata || {};
    const status = metadata.status || 'stopped';
    const exitCode = metadata.exitCode;
    const isActive = metadata.isActive || false;
    const containerId = metadata.containerId || 'unknown';
    const containerName = metadata.aiderServiceName || metadata.containerName || 'unknown';
    const runtime = metadata.runtime || 'unknown';
    const testName = metadata.testName || 'unknown';
    const configKey = metadata.configKey || 'unknown';
    const agentName = metadata.agentName;
    const isAgentAider = metadata.isAgentAider || false;

    let description = `${status}`;
    if (exitCode !== undefined) {
      description += ` (exit: ${exitCode})`;
    }
    if (!isActive) {
      description += ' • inactive';
    }
    if (isAgentAider) {
      description += ' • agent';
    }

    return {
      description,
      status,
      exitCode,
      runtime,
      testName,
      configKey,
      containerId,
      containerName,
      isActive,
      aiderId: node.id,
      agentName,
      isAgentAider,
      entrypointId: entrypointNode?.id
    };
  }

  /**
   * Filter aider processes for a specific entrypoint
   */
  filterAiderProcessesForEntrypoint(
    graphData: GetAiderResponse,
    entrypointId: string
  ): GraphNode[] {
    const connectedEdges = graphData.edges.filter(edge =>
      edge.source === entrypointId &&
      edge.attributes.type === 'hasAider'
    );

    const aiderNodes: GraphNode[] = [];
    for (const edge of connectedEdges) {
      const aiderNode = graphData.nodes.find(n => n.id === edge.target);
      if (aiderNode && (aiderNode.type === 'aider' || aiderNode.type === 'aider_process')) {
        aiderNodes.push(aiderNode);
      }
    }
    return aiderNodes;
  }

  /**
   * Group nodes by type
   */
  groupNodesByType(nodes: GraphNode[]): Record<string, GraphNode[]> {
    // GraphNode is now imported from api.ts
    const groups: Record<string, GraphNode[]> = {};
    
    for (const node of nodes) {
      const type = node.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(node);
    }
    
    return groups;
  }
}
