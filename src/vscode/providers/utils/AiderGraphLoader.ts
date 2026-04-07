import { ApiUtils } from './apiUtils';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class AiderGraphLoader {
  static async loadGraphData(): Promise<{ graphData: GraphData | null; agents: any[] }> {
    try {
      console.log('[AiderGraphLoader] Loading graph data from aider slice and agents');

      const aiderResponse = await fetch(ApiUtils.getAiderSliceUrl());
      if (!aiderResponse.ok) {
        throw new Error(`HTTP error! status: ${aiderResponse.status}`);
      }
      const aiderData = await aiderResponse.json();

      const agentsData = await this.loadAgentData();

      const graphData: GraphData = {
        nodes: [...(aiderData.nodes || []), ...(agentsData.nodes || [])],
        edges: [...(aiderData.edges || []), ...(agentsData.edges || [])]
      };

      console.log('[AiderGraphLoader] Loaded graph data:',
        graphData?.nodes?.length, 'nodes,',
        graphData?.edges?.length, 'edges,',
        agentsData.agents?.length, 'agents');

      return { graphData, agents: agentsData.agents };
    } catch (error) {
      console.error('[AiderGraphLoader] Failed to load graph data:', error);
      return { graphData: null, agents: [] };
    }
  }

  private static async loadAgentData(): Promise<{ nodes: any[]; edges: any[]; agents: any[] }> {
    try {
      const agentsResponse = await fetch(ApiUtils.getUserAgentsUrl());
      if (!agentsResponse.ok) {
        throw new Error(`HTTP error! status: ${agentsResponse.status}`);
      }
      const agentsData = await agentsResponse.json();

      const agents = agentsData.userAgents || [];

      if (agents.length === 0) {
        return { nodes: [], edges: [], agents: [] };
      }

      const allNodes: any[] = [];
      const allEdges: any[] = [];

      for (const agent of agents) {
        const agentName = agent.name;
        try {
          const agentResponse = await fetch(ApiUtils.getAgentSliceUrl(agentName));
          if (agentResponse.ok) {
            const agentSliceData = await agentResponse.json();
            if (agentSliceData.nodes && Array.isArray(agentSliceData.nodes)) {
              allNodes.push(...agentSliceData.nodes);
            }
            if (agentSliceData.edges && Array.isArray(agentSliceData.edges)) {
              allEdges.push(...agentSliceData.edges);
            }
          }
        } catch (error) {
          console.error(`[AiderGraphLoader] Failed to load data for agent ${agentName}:`, error);
        }
      }

      return { nodes: allNodes, edges: allEdges, agents };
    } catch (error) {
      console.error('[AiderGraphLoader] Failed to load agent data:', error);
      return { nodes: [], edges: [], agents: [] };
    }
  }
}
