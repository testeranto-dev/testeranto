import type { ITesterantoConfig } from "../../../src/server/Types";

export async function buildOutputImages(
  configs: ITesterantoConfig,
  spawnPromise: (command: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  // Now build docker images for output artifacts
  for (const [configKey, config] of Object.entries(configs.runtimes)) {
    const outputs = config.outputs;
    if (!outputs || outputs.length === 0) continue;

    consoleLog(`[Server_Docker] Building docker images for ${configKey} outputs`);

    for (const entrypoint of outputs) {
      try {
        const dockerfile = config.dockerfile;
        const projectRoot = process.cwd()

        // Create image name
        const cleanEntrypoint = entrypoint
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const imageName = `output-${configKey}-${cleanEntrypoint}:latest`;

        consoleLog(`[Server_Docker] Building ${imageName} from ${dockerfile}`);

        const buildCommand = `docker build -t ${imageName} -f ${dockerfile} ${projectRoot}`;
        await spawnPromise(buildCommand);

        consoleLog(`[Server_Docker] ✅ Built ${imageName}`);
      } catch (error) {
        consoleError(`[Server_Docker] Failed to build docker image for ${entrypoint}:`, error);
        // Continue with other outputs
      }
    }
  }
}
