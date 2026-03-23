// import type { ITestconfigV2 } from "../../../../Types";
import type { ITestconfigV2 } from "../../../../Types";
import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
import { processCwd } from "../Server_Docker_Dependents";

// Pure function to build with BuildKit
export const buildWithBuildKitPure = async (
  configs: ITestconfigV2,
  logError: (error: any) => void,
): Promise<void> => {
  const buildErrors: string[] = [];

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

    // if (!buildKitOptions) {
    //   consoleLog(
    //     `[Server_Docker] No BuildKit options for ${configKey} (${runtime}), skipping BuildKit build`,
    //   );
    //   continue;
    // }

    try {
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
      } else {
        throw new Error(result.error || "Build failed");
      }
    } catch (error: any) {
      const errorMsg = `[Server_Docker] ❌ BuildKit build failed for ${configKey} (${runtime}): ${error.message}`;
      logError(errorMsg);
      buildErrors.push(`${configKey} (${runtime}): ${error.message}`);
    }
  }

  if (buildErrors.length > 0) {
    const errorMessage =
      `BuildKit builds failed for ${buildErrors.length} runtime(s):\n` +
      buildErrors.map((error) => `  - ${error}`).join("\n");
    throw new Error(errorMessage);
  }
};
