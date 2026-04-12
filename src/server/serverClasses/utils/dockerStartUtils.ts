import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";

export async function handleDockerStartUtil(
  configs: ITesterantoConfig,
  mode: IMode,
  dockerComposeManager: any,
  aiderImageBuilder: any,
  failedBuilderConfigs: Set<string>,
  addProcessNodeToGraph: any,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  launchAllAgents: () => Promise<void>,
  handleBuilderServices: any,
  waitForBundlesPure: any,
  setupTestNodes: any,
  startGraphWatcher: () => void,
  embedConfigInHtml: (configs: ITesterantoConfig) => Promise<void>,
  stop: () => Promise<void>,
  processExit: (code: number) => void
): Promise<void> {
  // Build the aider image for agent services
  try {
    consoleLog('[Server_Docker] Building aider image for agent services...');
    await aiderImageBuilder.buildAiderImage();
    consoleLog('[Server_Docker] ✅ Aider image built successfully');
  } catch (error: any) {
    consoleError('[Server_Docker] Failed to build aider image:', error as string);
    consoleLog('[Server_Docker] ⚠️ Agent services may not start without aider image');
  }

  // Start all Docker services EXCEPT agent services
  await dockerComposeManager.DC_upAll();

  // Log information about accessing the HTTP server from services
  consoleLog('[Server_Docker] Services can access the HTTP server at host.docker.internal:3000');
  consoleLog('[Server_Docker] Network configuration includes extra_hosts for host.docker.internal');
  consoleLog('[Server_Docker] Ensure the server is running on port 3000 and accessible from Docker containers');
  consoleLog('[Server_Docker] Note: Server must bind to 0.0.0.0 (not localhost) to accept connections from containers');

  // Launch all agents at startup
  await launchAllAgents();

  // Handle builder services
  const updatedFailedBuilderConfigs = await handleBuilderServices(
    configs,
    mode,
    dockerComposeManager,
    failedBuilderConfigs,
    addProcessNodeToGraph,
    consoleLog,
    consoleError
  );

  // Wait for bundles to be ready
  const bundleResult = await waitForBundlesPure({
    configs,
    failedBuilderConfigs: updatedFailedBuilderConfigs,
    consoleLog,
    consoleWarn: consoleError,
    maxWaitTime: 30000,
    checkInterval: 500,
  });

  // Log the final status of builder services
  if (bundleResult.size > 0) {
    consoleLog(`[Server_Docker] Builder services completed with ${bundleResult.size} failed config(s): ${Array.from(bundleResult).join(', ')}`);
  } else {
    consoleLog(`[Server_Docker] ✅ All builder services started successfully`);
  }

  // Start a service to watch the graph for entrypoints that need services started
  startGraphWatcher();

  if (mode === "once") {
    try {
      consoleLog("[Server_Docker] Tests completed, waiting for pending operations...");

      // Generate graph-data.json for dual-mode operation
      await embedConfigInHtml(configs);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      await stop();
      processExit(0);
    } catch (error: any) {
      consoleError("[Server_Docker] Error in once mode:", error);
      try {
        await stop();
      } catch (stopError) {
        consoleError("[Server_Docker] Error stopping services:", stopError as string);
      }
      processExit(1);
    }
  }
}
