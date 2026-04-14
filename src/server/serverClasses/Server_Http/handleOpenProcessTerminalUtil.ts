import type { Request, Response } from 'bun';

export async function handleOpenProcessTerminalUtil(
  request: Request,
  getAiderProcesses: () => any[],
  getGraphManager: () => any,
  generateTerminalScript: (options: any) => string
): Promise<Response> {
  try {
    const body = await request.json();
    const { nodeId, label, containerId, serviceName } = body;

    if (!nodeId) {
      return new Response(JSON.stringify({
        error: 'Missing nodeId parameter',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parts = nodeId.split(':');
    const type = parts[0];

    let containerName = containerId;
    let processInfo: any = null;

    if (!containerName) {
      if (type === 'agent') {
        const agentName = parts[1];
        containerName = `agent-${agentName}`;
      } else if (type === 'aider_process') {
        if (parts[1] === 'agent') {
          const agentName = parts[2];
          containerName = `agent-${agentName}`;
        } else {
          const aiderProcesses = getAiderProcesses();
          const identifier = parts.length > 1 ? parts.slice(1).join(':') : '';
          const aiderProcess = aiderProcesses.find((p: any) =>
            p.id === nodeId ||
            p.containerName?.includes(identifier) ||
            p.testName?.includes(identifier)
          );
          if (aiderProcess) {
            containerName = aiderProcess.containerName;
            processInfo = aiderProcess;
          }
        }
      } else if (type === 'container') {
        containerName = parts[1] || nodeId.replace('container:', '');
      } else if (type === 'process') {
        const graphManager = getGraphManager();
        if (graphManager) {
          try {
            const graphData = graphManager.getGraphData();
            const processNode = graphData.nodes.find((n: any) => n.id === nodeId);
            if (processNode) {
              const metadata = processNode.metadata || {};
              containerName = metadata.containerId || metadata.containerName;
              processInfo = metadata;
            }
          } catch (error) {
            console.warn(`[Server_HTTP] Error getting process info from graph:`, error);
          }
        }
      } else if (type === 'aider') {
        const aiderProcesses = getAiderProcesses();
        const identifier = parts.length > 1 ? parts.slice(1).join(':') : '';
        const aiderProcess = aiderProcesses.find((p: any) =>
          p.id === nodeId ||
          p.containerName?.includes(identifier) ||
          p.testName?.includes(identifier)
        );
        if (aiderProcess) {
          containerName = aiderProcess.containerName;
          processInfo = aiderProcess;
        }
      }

      if (!containerName && serviceName) {
        containerName = serviceName;
      }
    }

    if (containerName) {
      const graphManager = getGraphManager();
      let graphContainerName = containerName;
      let graphContainerId = '';
      let graphContainerStatus = 'unknown';

      if (graphManager) {
        try {
          const graphData = graphManager.getGraphData();
          let processNode = graphData.nodes.find((n: any) => n.id === nodeId);

          if (!processNode && type === 'aider_process' && parts[1] === 'agent') {
            const agentName = parts[2];
            const agentNodeId = `agent:${agentName}`;
            processNode = graphData.nodes.find((n: any) => n.id === agentNodeId);
          }

          if (processNode) {
            const metadata = processNode.metadata || {};
            const graphContainer = metadata.containerId || metadata.containerName;
            if (graphContainer) {
              graphContainerName = graphContainer;
            }
            graphContainerId = metadata.containerId || '';
            graphContainerStatus = processNode.status || metadata.status || 'unknown';
          }
        } catch (error) {
          console.warn(`[Server_HTTP] Error getting container info from graph:`, error);
        }
      }

      const finalContainerName = graphContainerName || containerName;
      const isRunning = graphContainerStatus === 'running';
      const containerStatus = graphContainerStatus;
      const actualContainerId = graphContainerId;

      const isAgentOrAider = finalContainerName.includes('agent-') || finalContainerName.includes('aider');
      const script = generateTerminalScript({
        type,
        nodeId,
        label,
        containerName: finalContainerName,
        containerStatus,
        isAgentOrAider
      });

      return new Response(JSON.stringify({
        success: true,
        script,
        nodeId,
        containerName,
        containerId: actualContainerId || containerName,
        containerStatus: isRunning ? containerStatus : 'not_running',
        nodeType: type,
        message: isRunning ?
          `${type} container ${containerName} is running` :
          `${type} container ${containerName} is not running`,
        terminalNotes: isRunning ? {
          aiderOrAgent: isAgentOrAider,
          detachSequence: isAgentOrAider ? 'Ctrl+P, Ctrl+Q' : 'exit or Ctrl+D',
          sigint: 'Ctrl+C sends SIGINT to the process inside container'
        } : null,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({
        error: `Cannot determine container for process type ${type}`,
        nodeId,
        message: `Unable to find container information for ${nodeId}. Please provide containerId parameter.`,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error('[Server_HTTP] Error in handleOpenProcessTerminal:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
