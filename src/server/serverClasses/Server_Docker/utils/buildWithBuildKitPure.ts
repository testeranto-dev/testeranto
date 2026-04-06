import type { ITesterantoConfig } from "../../../../Types";
import { consoleLog, processCwd } from "../Server_Docker_Dependents";
import { spawnPromise } from "./index";

// Track failed builds to prevent infinite retries
const failedBuilds = new Set<string>();

// Pure function to build with BuildKit
export const buildWithBuildKitPure = async (
  configs: ITesterantoConfig,
  logError: (error: any) => void,
): Promise<Set<string>> => {
  const buildErrors: string[] = [];
  const failedConfigs = new Set<string>();

  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    const runtime = configValue.runtime;
    const buildKitOptions = configValue.buildKitOptions;

    // Create a unique identifier for this build
    const buildId = `${configKey}-${runtime}`;

    // Skip if this build has already failed
    if (failedBuilds.has(buildId)) {
      const skipMsg = `[Server_Docker] ⏭️ Skipping previously failed build for ${configKey} (${runtime})`;
      logError(skipMsg);
      buildErrors.push(`${configKey} (${runtime}): Previously failed, skipping`);
      failedConfigs.add(configKey);
      continue;
    }

    try {
      consoleLog(`[Server_Docker] Starting Docker build for ${configKey} (${runtime})...`);
      
      // Construct docker build command
      const dockerfilePath = configValue.dockerfile;
      const buildContext = processCwd();
      
      let buildArgs = '';
      if (buildKitOptions?.buildArgs) {
        for (const [key, value] of Object.entries(buildKitOptions.buildArgs)) {
          buildArgs += ` --build-arg ${key}=${value}`;
        }
      }
      
      let cacheMounts = '';
      if (buildKitOptions?.cacheMounts && buildKitOptions.cacheMounts.length > 0) {
        cacheMounts = buildKitOptions.cacheMounts.map(mount => `--cache-from ${mount}`).join(' ');
      }
      
      let targetStage = '';
      if (buildKitOptions?.targetStage) {
        targetStage = `--target ${buildKitOptions.targetStage}`;
      }
      
      // Build the image name
      const imageName = `testeranto-${configKey.toLowerCase()}:latest`;
      
      // Construct the full command with BuildKit enabled
      const buildCommand = `DOCKER_BUILDKIT=1 docker build ${buildArgs} ${cacheMounts} ${targetStage} -f "${dockerfilePath}" -t ${imageName} "${buildContext}"`;
      
      consoleLog(`[Server_Docker] Running: ${buildCommand}`);
      
      // Execute the build command with spawnPromise which streams output
      await spawnPromise(buildCommand);
      
      consoleLog(`[Server_Docker] ✅ Docker build succeeded for ${configKey} (${runtime})`);
      // If build succeeds, remove from failed builds set
      failedBuilds.delete(buildId);
    } catch (error: any) {
      // Mark this build as failed
      failedBuilds.add(buildId);
      failedConfigs.add(configKey);

      const errorMsg = `[Server_Docker] ❌ Docker build failed for ${configKey} (${runtime}): ${error.message}`;
      logError(errorMsg);
      buildErrors.push(`${configKey} (${runtime}): ${error.message}`);
    }
  }

  if (buildErrors.length > 0) {
    const errorMessage =
      `Docker builds failed for ${buildErrors.length} runtime(s):\n` +
      buildErrors.map((error) => `  - ${error}`).join("\n");
    consoleLog(`[buildWithBuildKitPure] Build failures: ${errorMessage}`);
    // Don't throw - return which configs failed
  }

  return failedConfigs;
};
