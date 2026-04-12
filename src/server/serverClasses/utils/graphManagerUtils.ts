import type { GraphManager } from "../../graph";
import type { ITesterantoConfig } from "../../../Types";

export function generateFeatureTreeUtil(graphData: any): any {
  const featureNodes = graphData.nodes.filter((node: any) => node.type === 'feature');
  const featureEdges = graphData.edges.filter((edge: any) =>
    edge.attributes.type === 'dependsUpon' || edge.attributes.type === 'blocks'
  );

  const tree: any = {};

  featureNodes.forEach((node: any) => {
    tree[node.id] = {
      ...node,
      children: [],
      parents: []
    };
  });

  featureEdges.forEach((edge: any) => {
    if (edge.attributes.type === 'dependsUpon') {
      if (tree[edge.source]) {
        tree[edge.source].parents.push(edge.target);
      }
      if (tree[edge.target]) {
        tree[edge.target].children.push(edge.source);
      }
    } else if (edge.attributes.type === 'blocks') {
      if (tree[edge.source]) {
        tree[edge.source].children.push(edge.target);
      }
      if (tree[edge.target]) {
        tree[edge.target].parents.push(edge.source);
      }
    }
  });

  return tree;
}

export function addAgentNodesFromConfigUtil(
  graphManager: GraphManager,
  configs: ITesterantoConfig
): void {
  const agents = configs.agents;
  if (!agents) {
    return;
  }

  const timestamp = new Date().toISOString();

  for (const [agentName, agentConfig] of Object.entries(agents)) {
    const agentNodeId = `agent:${agentName}`;

    // Create agent node attributes
    const agentNodeAttributes: any = {
      id: agentNodeId,
      type: 'agent',
      label: `Agent: ${agentName}`,
      description: agentConfig.message ? agentConfig.message.substring(0, 100) + '...' : `Agent ${agentName}`,
      agentName: agentName,
      agentConfig: {
        load: agentConfig.load || [],
        hasSliceFunction: typeof agentConfig.sliceFunction === 'function'
      },
      timestamp: timestamp,
      metadata: {
        frontmatter: {
          title: `Agent: ${agentName}`,
          type: 'agent',
          agentType: 'user-defined'
        }
      }
    };

    // Add the agent node to the graph
    const operations: any[] = [
      {
        type: 'addNode',
        data: agentNodeAttributes,
        timestamp: timestamp
      }
    ];

    const update = {
      operations: operations,
      timestamp: timestamp
    };

    graphManager.applyUpdate(update);
  }
}
