import type { ITesterantoConfig } from "../../../src/server/Types";

export async function stopBuilderServices(
  configs: ITesterantoConfig,
  spawnPromise: (command: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  // First, stop builder services with SIGTERM so they can produce output artifacts
  // We'll send SIGTERM to builder containers directly
  for (const [configKey, config] of Object.entries(configs.runtimes)) {
    const outputs = config.outputs;
    if (!outputs || outputs.length === 0) continue;

    const builderServiceName = `${configKey}-builder`;
    consoleLog(`[Server_Docker] Stopping builder ${builderServiceName} to produce output artifacts`);

    try {
      // Send SIGTERM to builder container
      await spawnPromise(`docker compose -f "testeranto/docker-compose.yml" kill -s SIGTERM ${builderServiceName}`);
      // Wait for builder to exit and produce artifacts
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      consoleError(`[Server_Docker] Error stopping builder ${builderServiceName}:`, error);
    }
  }
}
