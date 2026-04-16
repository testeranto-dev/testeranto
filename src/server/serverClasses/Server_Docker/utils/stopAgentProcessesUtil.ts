import { promisify } from 'util';
import { exec } from 'child_process';

export async function stopAgentProcessesUtil(
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  try {
    const execAsync = promisify(exec);
    
    // Get all container IDs with names starting with 'agent-'
    const { stdout } = await execAsync('docker ps --format "{{.ID}} {{.Names}}"');
    const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
    
    const agentContainers = lines.filter(line => {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        const containerName = parts[1];
        return containerName.startsWith('agent-');
      }
      return false;
    }).map(line => line.split(' ')[0]);
    
    if (agentContainers.length === 0) {
      consoleLog("[stopAgentProcessesUtil] No agent containers found");
      return;
    }
    
    consoleLog(`[stopAgentProcessesUtil] Found ${agentContainers.length} agent containers to stop`);
    
    // Stop each agent container
    for (const containerId of agentContainers) {
      try {
        consoleLog(`[stopAgentProcessesUtil] Stopping agent container: ${containerId}`);
        await execAsync(`docker stop ${containerId}`);
        consoleLog(`[stopAgentProcessesUtil] Stopped agent container: ${containerId}`);
      } catch (error: any) {
        consoleError(`[stopAgentProcessesUtil] Error stopping agent container ${containerId}: ${error.message}`);
      }
    }
    
    // Wait for them to stop
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove stopped agent containers
    for (const containerId of agentContainers) {
      try {
        await execAsync(`docker rm -f ${containerId}`);
        consoleLog(`[stopAgentProcessesUtil] Removed agent container: ${containerId}`);
      } catch (error: any) {
        // Container might already be removed, ignore
      }
    }
    
  } catch (error: any) {
    consoleError(`[stopAgentProcessesUtil] Error: ${error.message}`);
    throw error;
  }
}
