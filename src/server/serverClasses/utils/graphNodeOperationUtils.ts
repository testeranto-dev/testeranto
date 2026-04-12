import type { GraphManager } from "../../graph";

export function addViewNodeToGraphUtil(
  graphManager: GraphManager,
  projectRoot: string,
  viewKey: string,
  viewPath: string,
  sliceData: any
): void {
  const viewNodeId = `view:${viewKey}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === viewNodeId);

  if (!existingNode) {
    graphManager.applyUpdate({
      operations: [{
        type: 'addNode',
        data: {
          id: viewNodeId,
          type: 'view',
          label: viewKey,
          description: `View: ${viewKey}`,
          status: 'done',
          icon: 'eye',
          metadata: {
            viewKey,
            viewPath,
            sliceDataPath: `${projectRoot}/testeranto/slices/views/${viewKey}.json`,
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  } else {
    graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: viewNodeId,
          metadata: {
            ...existingNode.metadata,
            viewPath,
            sliceDataPath: `${projectRoot}/testeranto/slices/views/${viewKey}.json`,
            lastUpdated: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  }
}

export function addAgentNodeToGraphUtil(
  graphManager: GraphManager,
  projectRoot: string,
  agentName: string,
  agentConfig: any,
  sliceData: any
): void {
  const agentNodeId = `agent:${agentName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === agentNodeId);

  if (!existingNode) {
    graphManager.applyUpdate({
      operations: [{
        type: 'addNode',
        data: {
          id: agentNodeId,
          type: 'agent',
          label: agentName,
          description: `Agent: ${agentName}`,
          status: 'done',
          icon: 'user',
          metadata: {
            agentName,
            load: agentConfig.load,
            message: agentConfig.message,
            sliceDataPath: `${projectRoot}/testeranto/slices/agents/${agentName}.json`,
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  } else {
    graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: agentNodeId,
          metadata: {
            ...existingNode.metadata,
            load: agentConfig.load,
            message: agentConfig.message,
            sliceDataPath: `${projectRoot}/testeranto/slices/agents/${agentName}.json`,
            lastUpdated: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  }
}
