import type { ITesterantoConfig } from "../../Types";

export async function writeViewSliceFilesUtil(
  configs: ITesterantoConfig,
  graphManager: any,
  projectRoot: string,
  writeSliceFile: (viewKey: string, sliceData: any) => Promise<void>,
  writeAgentSliceFile: (agentName: string, sliceData: any) => Promise<void>,
  addViewNodeToGraph: (viewKey: string, viewPath: string, sliceData: any) => void,
  addAgentNodeToGraph: (agentName: string, agentConfig: any, sliceData: any) => void,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  // Get the full graph data
  const graphData = graphManager.getGraphData();
  consoleLog(`[Server_GraphManager] Graph has ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);

  // Log agent nodes
  const agentNodes = graphData.nodes.filter((node: any) => node.type === 'agent');
  consoleLog(`[Server_GraphManager] Found ${agentNodes.length} agent nodes:`,
    agentNodes.map((node: any) => ({ id: node.id, label: node.label })));

  // Write view slice files
  if (configs.views) {
    for (const [viewKey, v] of Object.entries(configs.views)) {
      const sliceFunction = (v as any).slicer;
      let sliceData: any;

      if (sliceFunction) {
        sliceData = sliceFunction(graphData);
      } else {
        sliceData = {
          ...graphData,
          metadata: {
            ...graphData.metadata,
            viewType: 'generic',
            timestamp: new Date().toISOString()
          }
        };
      }

      await writeSliceFile(viewKey, sliceData);
      addViewNodeToGraph(viewKey, (v as any).filePath, sliceData);
    }
  }

  // Write agent slice files
  const agents = configs.agents;
  if (!agents) {
    throw new Error('No agents configured in configs');
  }

  consoleLog(`[Server_GraphManager] Writing agent slices for ${Object.keys(agents).length} agents`);

  for (const [agentName, agentConfig] of Object.entries(agents)) {
    consoleLog(`[Server_GraphManager] Processing agent: ${agentName}`);

    const sliceFunction = (agentConfig as any).sliceFunction;
    if (typeof sliceFunction !== 'function') {
      throw new Error(`Agent ${agentName} has no valid sliceFunction`);
    }

    consoleLog(`[Server_GraphManager] Calling slice function for ${agentName}`);

    const graphManagerForSlice = {
      getGraphData: () => graphManager.getGraphData()
    };

    const sliceData = sliceFunction(graphManagerForSlice);
    consoleLog(`[Server_GraphManager] Agent ${agentName} slice has ${sliceData?.nodes?.length || 0} nodes, ${sliceData?.edges?.length || 0} edges`);

    if (sliceData?.nodes?.length > 0) {
      const sliceNodeTypes: Record<string, number> = {};
      sliceData.nodes.forEach((node: any) => {
        sliceNodeTypes[node.type] = (sliceNodeTypes[node.type] || 0) + 1;
      });
      consoleLog(`[Server_GraphManager] Agent ${agentName} slice node types:`, sliceNodeTypes);
    }

    await writeAgentSliceFile(agentName, sliceData);
    consoleLog(`[Server_GraphManager] Wrote agent slice for ${agentName}`);
    addAgentNodeToGraph(agentName, agentConfig as any, sliceData);
  }
}
