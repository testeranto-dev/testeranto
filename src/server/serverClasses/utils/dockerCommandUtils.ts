export async function startDockerServiceUtil(
  serviceName: string,
  spawnPromise: (command: any) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  try {
    consoleLog(`[startDockerServiceUtil] Starting Docker service: ${serviceName}`);
    // Always use docker compose up -d to ensure the service is created and started
    const command = `docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`;
    await spawnPromise(command);
    consoleLog(`[startDockerServiceUtil] Successfully started service: ${serviceName}`);
  } catch (error) {
    consoleError(`[startDockerServiceUtil] Failed to start service ${serviceName}:`, error);
    throw error;
  }
}

export async function restartDockerServiceUtil(
  serviceName: string,
  spawnPromise: (command: any) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  try {
    consoleLog(`[restartDockerServiceUtil] Restarting Docker service: ${serviceName}`);
    // Use docker compose up -d --force-recreate to restart the service
    const command = `docker compose -f "testeranto/docker-compose.yml" up -d --force-recreate ${serviceName}`;
    await spawnPromise(command);
    consoleLog(`[restartDockerServiceUtil] Successfully restarted service: ${serviceName}`);
  } catch (error) {
    consoleError(`[restartDockerServiceUtil] Failed to restart service ${serviceName}:`, error);
    throw error;
  }
}
