export async function getContainerInfoUtil(
  serviceName: string,
  getGraphData: () => any,
  consoleError: (message: string, error?: any) => void
): Promise<any> {
  // First try to get container info from the graph
  try {
    // Get all process nodes from the graph
    const graphData = getGraphData();
    const processNodes = graphData.nodes.filter((node: any) => {
      // Check if node is a process node
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'process';
      }
      // For backward compatibility
      return node.type === 'docker_process' ||
        node.type === 'bdd_process' ||
        node.type === 'check_process' ||
        node.type === 'builder_process' ||
        node.type === 'aider_process';
    });

    // Find the process node with matching service name
    for (const node of processNodes) {
      const metadata = node.metadata || {};
      if (metadata.serviceName === serviceName || metadata.containerName === serviceName) {
        // Return the container info from the graph
        return {
          Id: metadata.containerId || null,
          Name: metadata.containerName || serviceName,
          State: {
            Running: metadata.status === 'running' || metadata.status === 'done',
            Status: metadata.status || 'unknown'
          },
          // Include all metadata for compatibility
          ...metadata
        };
      }
    }

    // Also check by container ID if serviceName might be a container ID
    for (const node of processNodes) {
      const metadata = node.metadata || {};
      if (metadata.containerId === serviceName) {
        return {
          Id: metadata.containerId,
          Name: metadata.containerName || serviceName,
          State: {
            Running: metadata.status === 'running' || metadata.status === 'done',
            Status: metadata.status || 'unknown'
          },
          ...metadata
        };
      }
    }

    // For agent containers, check if serviceName matches agent-{agentName} pattern
    if (serviceName.startsWith('agent-')) {
      const agentName = serviceName.replace('agent-', '');
      const agentProcessId = `aider_process:agent:${agentName}`;

      // Look for the agent process node
      for (const node of processNodes) {
        if (node.id === agentProcessId) {
          const metadata = node.metadata || {};
          if (metadata.containerId) {
            return {
              Id: metadata.containerId,
              Name: metadata.serviceName || serviceName,
              State: {
                Running: metadata.status === 'running' || metadata.containerStatus === 'running',
                Status: metadata.status || metadata.containerStatus || 'unknown'
              },
              ...metadata
            };
          }
        }
      }

      // Also check if any process node has this serviceName in metadata
      for (const node of processNodes) {
        const metadata = node.metadata || {};
        if (metadata.serviceName === serviceName) {
          if (metadata.containerId) {
            return {
              Id: metadata.containerId,
              Name: metadata.serviceName || serviceName,
              State: {
                Running: metadata.status === 'running' || metadata.containerStatus === 'running',
                Status: metadata.status || metadata.containerStatus || 'unknown'
              },
              ...metadata
            };
          }
        }
      }
    }
  } catch (error) {
    consoleError(`[Server_Docker_Test] Error getting container info for ${serviceName} from graph:`, error);
  }

  // If not found in graph or graph says not running, check Docker directly
  try {
    // Dynamically import child_process
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Try to get container info by name
    const { stdout } = await execAsync(`docker inspect ${serviceName} 2>/dev/null || docker ps -a --filter "name=${serviceName}" --format "{{.ID}}"`);

    if (stdout.trim()) {
      // If we got container ID from docker ps, use it to inspect
      const containerId = stdout.trim().split('\n')[0];
      const { stdout: inspectStdout } = await execAsync(`docker inspect ${containerId}`);
      const containerInfo = JSON.parse(inspectStdout)[0];

      return {
        Id: containerInfo.Id,
        Name: containerInfo.Name ? containerInfo.Name.replace(/^\//, '') : serviceName,
        State: containerInfo.State,
        Config: containerInfo.Config
      };
    }
  } catch (error) {
    consoleError(`[Server_Docker_Test] Error getting container info for ${serviceName} from Docker:`, error);
  }

  // No container info found
  consoleError(`[Server_Docker_Test] Container info for ${serviceName} not found`);
  return null;
}
