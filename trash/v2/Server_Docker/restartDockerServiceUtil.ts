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
