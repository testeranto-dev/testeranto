// import type { ITesterantoConfig } from "../../../../Types";
import type { ITesterantoConfig } from "../../../../Types";
import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
import { consoleLog, processCwd } from "../Server_Docker_Dependents";

// Track failed builds to prevent infinite retries
const failedBuilds = new Set<string>();

// Pure function to build with BuildKit
export const buildWithBuildKitPure = async (
  configs: ITesterantoConfig,
  logError: (error: any) => void,
): Promise<Set<string>> => {
  const buildErrors: string[] = [];
  const failedConfigs = new Set<string>();

  // temporarily disabled
  // try {
  //   await buildAiderImagePure();
  // } catch (error: any) {
  //   logError(`[Server_Docker] ❌ Aider image build failed: ${error.message}`);
  //   buildErrors.push(`aider: ${error.message}`);
  // }

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

    // if (!buildKitOptions) {
    //   consoleLog(
    //     `[Server_Docker] No BuildKit options for ${configKey} (${runtime}), skipping BuildKit build`,
    //   );
    //   continue;
    // }

    try {
      consoleLog(`[Server_Docker] Starting BuildKit build for ${configKey} (${runtime})...`);
      // Build the image using BuildKitBuilder
      const result = await BuildKitBuilder.buildImage({
        runtime: runtime,
        configKey: configKey,
        dockerfilePath: configValue.dockerfile,
        buildContext: processCwd(),
        cacheMounts: buildKitOptions?.cacheMounts || [],
        targetStage: buildKitOptions?.targetStage,
        buildArgs: buildKitOptions?.buildArgs || {},
      });

      if (result.success) {
        consoleLog(`[Server_Docker] ✅ BuildKit build succeeded for ${configKey} (${runtime}) in ${result.duration}ms`);
        // If build succeeds, remove from failed builds set
        failedBuilds.delete(buildId);
      } else {
        consoleLog(`[Server_Docker] ❌ BuildKit build failed for ${configKey} (${runtime}): ${result.error}`);
        throw new Error(result.error || "Build failed");
      }
    } catch (error: any) {
      // Mark this build as failed
      failedBuilds.add(buildId);
      failedConfigs.add(configKey);

      const errorMsg = `[Server_Docker] ❌ BuildKit build failed for ${configKey} (${runtime}): ${error.message}`;
      logError(errorMsg);
      buildErrors.push(`${configKey} (${runtime}): ${error.message}`);
    }
  }

  if (buildErrors.length > 0) {
    const errorMessage =
      `BuildKit builds failed for ${buildErrors.length} runtime(s):\n` +
      buildErrors.map((error) => `  - ${error}`).join("\n");
    consoleLog(`[buildWithBuildKitPure] Build failures: ${errorMessage}`);
    // Don't throw - return which configs failed
  }

  return failedConfigs;
};
