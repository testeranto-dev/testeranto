export async function updateContainerInfoFromDockerUtil(
  serviceName: string,
  getGraphData: () => any,
  applyUpdate: (update: any) => void,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  // This is an "update from below" - get container info from Docker and update the graph
  // This should be called when services start, not from getContainerInfo

  try {
    // Dynamically import child_process
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Get container ID for this service
    const { stdout } = await execAsync(`docker ps --filter "name=${serviceName}" --format "{{.ID}}"`);
    const containerId = stdout.trim();

    if (!containerId) {
      consoleError(`[Server_Docker_Test] No container found for service ${serviceName}`);
      return;
    }

    // Get more container info
    const { stdout: inspectStdout } = await execAsync(`docker inspect ${containerId}`);
    const containerInfo = JSON.parse(inspectStdout)[0];

    // Find the process node for this service
    const graphData = getGraphData();
    const processNodes = graphData.nodes.filter((node: any) => {
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'process';
      }
      return node.type === 'docker_process' ||
        node.type === 'bdd_process' ||
        node.type === 'check_process' ||
        node.type === 'builder_process' ||
        node.type === 'aider_process';
    });

    for (const node of processNodes) {
      const metadata = node.metadata || {};
      if (metadata.serviceName === serviceName) {
        // Update the process node with container information
        const updateTimestamp = new Date().toISOString();
        const containerUpdate = {
          operations: [{
            type: 'updateNode' as const,
            data: {
              id: node.id,
              metadata: {
                ...metadata,
                containerId: containerId,
                containerName: containerInfo.Name ? containerInfo.Name.replace(/^\//, '') : serviceName,
                containerInfo: {
                  Id: containerId,
                  Name: containerInfo.Name ? containerInfo.Name.replace(/^\//, '') : serviceName,
                  State: containerInfo.State,
                  Config: containerInfo.Config
                },
                updatedAt: updateTimestamp,
                status: containerInfo.State?.Running === true ? 'running' : 'stopped'
              }
            },
            timestamp: updateTimestamp
          }],
          timestamp: updateTimestamp
        };
        applyUpdate(containerUpdate);
        consoleLog(`[Server_Docker_Test] Updated process node ${node.id} with container info from Docker, status: ${containerInfo.State?.Running === true ? 'running' : 'stopped'}`);
        return;
      }
    }

    consoleError(`[Server_Docker_Test] No process node found for service ${serviceName} in graph`);

  } catch (error) {
    consoleError(`[Server_Docker_Test] Error updating container info for ${serviceName} from Docker:`, error);
  }
}
