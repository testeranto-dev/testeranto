export async function updateTestStatusInGraph(
  graphManager: any,
  testName: string,
  status: 'todo' | 'doing' | 'done' | 'blocked'
): Promise<void> {
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  if (existingNode) {
    await graphManager.applyUpdate({
      operations: [{
        type: 'updateNode',
        data: {
          id: entrypointId,
          status: status,
          metadata: {
            ...existingNode.metadata,
            lastUpdated: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    });
  }
}
