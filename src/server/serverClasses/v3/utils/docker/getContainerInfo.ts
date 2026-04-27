import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

/**
 * Get container information
 * Uses `docker inspect` directly (works for any container, not just docker-compose services)
 */
export async function getContainerInfo(containerIdOrName: string): Promise<any> {
  console.log(`[getContainerInfo] Getting info for container ${containerIdOrName}`);

  const command = `docker inspect ${containerIdOrName}`;

  try {
    const { stdout } = await execAsync(command);
    const containerInfo = JSON.parse(stdout)[0];

    if (!containerInfo) {
      throw new Error(`Container ${containerIdOrName} not found`);
    }

    return {
      id: containerInfo.Id,
      name: containerInfo.Name.replace(/^\//, ''),
      status: containerInfo.State.Status,
      state: containerInfo.State,
      config: containerInfo.Config
    };
  } catch (error: any) {
    console.error(`[getContainerInfo] failed for ${containerIdOrName}: ${error.message}`);
    throw error;
  }
}
