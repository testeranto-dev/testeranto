import type { GraphData, GraphNode, GraphEdge } from "./Server_GraphManagerCoreBase";

export interface FeatureTreeNode {
  id: string;
  type: string;
  children: string[];
  parents: string[];
  [key: string]: any;
}

export interface FeatureTree {
  [key: string]: FeatureTreeNode;
}

/**
 * Generate a feature tree from graph data
 */
export function generateFeatureTreeUtil(graphData: GraphData): FeatureTree {
  const tree: FeatureTree = {};
  
  // First pass: create all nodes
  graphData.nodes.forEach((node: GraphNode) => {
    tree[node.id] = {
      id: node.id,
      type: node.type,
      children: [],
      parents: [],
      ...node
    };
  });
  
  // Second pass: populate relationships based on edges
  graphData.edges.forEach((edge: GraphEdge) => {
    const sourceNode = tree[edge.source];
    const targetNode = tree[edge.target];
    
    if (sourceNode && targetNode) {
      // Add target as child of source
      if (!sourceNode.children.includes(targetNode.id)) {
        sourceNode.children.push(targetNode.id);
      }
      
      // Add source as parent of target
      if (!targetNode.parents.includes(sourceNode.id)) {
        targetNode.parents.push(sourceNode.id);
      }
    }
  });
  
  return tree;
}

/**
 * Get slice for a specific agent
 */
export function getAgentSliceCoreUtil(
  graphData: GraphData,
  agents: Record<string, any> | undefined,
  agentName: string
): { nodes: GraphNode[], edges: GraphEdge[] } {
  if (!agents) {
    throw new Error(`No agents configured`);
  }
  
  const agentConfig = agents[agentName];
  if (!agentConfig) {
    throw new Error(`Agent ${agentName} not found in configuration`);
  }
  
  if (typeof agentConfig.sliceFunction !== 'function') {
    throw new Error(`Agent ${agentName} has invalid sliceFunction`);
  }
  
  // Note: In a real implementation, we would need to pass a graph manager
  // But for the core, we'll return empty for now
  // This is a placeholder to show the interface
  return { nodes: [], edges: [] };
}

/**
 * Add agent nodes from config to graph manager
 */
export function addAgentNodesFromConfigUtil(
  graphManager: any,
  configs: any
): void {
  const agents = configs.agents;
  if (!agents) {
    return;
  }

  console.log(`[addAgentNodesFromConfigUtil] Adding ${Object.keys(agents).length} agent nodes to graph`);

  for (const [agentName, agentConfig] of Object.entries(agents)) {
    console.log(`[addAgentNodesFromConfigUtil] Processing agent: ${agentName}`);
    
    // Check if agent node already exists
    const existingNode = graphManager.getNodeById?.(`agent:${agentName}`);
    if (existingNode) {
      console.log(`[addAgentNodesFromConfigUtil] Agent node ${agentName} already exists, skipping`);
      continue;
    }

    // Add agent node to graph
    try {
      graphManager.addNode?.({
        id: `agent:${agentName}`,
        type: 'agent',
        label: agentName,
        agentName: agentName,
        config: agentConfig,
        timestamp: new Date().toISOString()
      });
      console.log(`[addAgentNodesFromConfigUtil] Added agent node for ${agentName}`);
    } catch (error) {
      console.error(`[addAgentNodesFromConfigUtil] Error adding agent node for ${agentName}:`, error);
    }
  }
}
