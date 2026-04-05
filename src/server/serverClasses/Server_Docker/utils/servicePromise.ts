import { existsSync, readFileSync, readdirSync } from "fs";
import { spawnPromise } from ".";
import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
import { consoleLog, execSyncWrapper, processCwd, consoleWarn, spawnWrapper, consoleError } from "../Server_Docker_Dependents";
import type { ITestconfigV2 } from "../../../../lib/tiposkripto/dist/types/Types";

export const servicePromise = async (
  serviceName: string,
  runtime: string,
  configKey: string,
  configs: ITestconfigV2,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>
) => {
  // Use the service name as-is (it's already based on configKey)
  const actualServiceName = serviceName;
  consoleLog(`[Server_Docker] Starting builder service: ${actualServiceName}`);

  // First, try to build the image using BuildKit if it doesn't exist
  const imageName = `testeranto-${runtime}-${configKey}:latest`;
  const imageExistsCmd = `docker image inspect ${imageName} > /dev/null 2>&1`;

  try {
    execSyncWrapper(imageExistsCmd, { cwd: processCwd() });
    consoleLog(`[Server_Docker] Image ${imageName} exists locally`);
  } catch (imageError) {
    consoleLog(
      `[Server_Docker] Image ${imageName} not found locally, building with BuildKit...`,
    );

    try {
      // Use BuildKitBuilder to build the image
      const result = await BuildKitBuilder.buildImage({
        runtime: runtime,
        configKey: configKey,
        dockerfilePath: configs.runtimes[configKey].dockerfile,
        buildContext: processCwd(),
        cacheMounts: configs.runtimes[configKey].buildKitOptions?.cacheMounts || [],
        targetStage: configs.runtimes[configKey].buildKitOptions?.targetStage,
        buildArgs: configs.runtimes[configKey].buildKitOptions?.buildArgs || {},
      });

      if (result.success) {
        consoleLog(`[Server_Docker] ✅ Built image ${imageName} with BuildKit in ${result.duration}ms`);
      } else {
        throw new Error(result.error || "BuildKit build failed");
      }
    } catch (buildError: any) {
      consoleWarn(
        `[Server_Docker] Could not build image ${imageName} with BuildKit: ${buildError.message}`,
      );
      // Fall back to regular docker build
      try {
        consoleLog(`[Server_Docker] Falling back to regular docker build for ${imageName}`);

        const buildProcess = spawnWrapper('docker', [
          'build',
          '-f', configs.runtimes[configKey].dockerfile,
          '-t', imageName,
          '.'
        ], {
          cwd: processCwd(),
          stdio: 'inherit'
        });

        await new Promise<void>((resolve, reject) => {
          buildProcess.on('close', (code) => {
            if (code === 0) {
              consoleLog(`[Server_Docker] ✅ Built image ${imageName} with fallback docker build`);
              resolve();
            } else {
              reject(new Error(`Fallback build failed with exit code ${code}`));
            }
          });
          buildProcess.on('error', (error) => {
            reject(error);
          });
        });
      } catch (fallbackError: any) {
        consoleWarn(
          `[Server_Docker] Fallback docker build also failed for ${imageName}: ${fallbackError.message}`,
        );
        // Continue anyway - docker-compose will try to build it
      }
    }
  }

  // Start the service
  consoleLog(`[Server_Docker] Starting builder service: ${actualServiceName}`);

  // Check if the service is already running
  const checkRunningCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${actualServiceName}`;
  try {
    const existingContainer = execSyncWrapper(checkRunningCmd, { cwd: processCwd() }).trim();
    if (existingContainer) {
      consoleLog(`[Server_Docker] Builder service ${actualServiceName} is already running`);
    } else {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${actualServiceName}`,
      );
      // Wait for the service to fully start (reduced from 5000ms)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error: any) {
    consoleWarn(`[Server_Docker] Error checking/starting ${actualServiceName}: ${error.message}`);
    // Try to start it anyway
    await spawnPromise(
      `docker compose -f "testeranto/docker-compose.yml" up -d ${actualServiceName}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Verify the service has produced output files
  let hasOutputFiles = false;
  const maxRetries = 5; // Reduced from 10 to 5 retries
  const retryDelay = 1000; // Reduced from 2 seconds to 1 second between checks

  for (let j = 0; j < maxRetries; j++) {
    try {
      // Check for inputFiles.json in the bundle directory
      const inputFilesPath = `${processCwd()}/testeranto/bundles/${configKey}/inputFiles.json`;
      const bundleDir = `${processCwd()}/testeranto/bundles/${configKey}`;

      if (existsSync(inputFilesPath)) {
        // Check if the file has content
        const fileContent = readFileSync(inputFilesPath, 'utf-8');
        if (fileContent.trim().length > 0) {
          // Also check for bundle files if needed
          const bundleFiles = readdirSync(bundleDir);
          const hasBundleFiles = bundleFiles.some(file =>
            file.endsWith('.js') || file.endsWith('.mjs') ||
            file.endsWith('.py') || file.endsWith('.go') ||
            file.endsWith('.rb') || file.endsWith('.rs') ||
            file.endsWith('.java') || file.endsWith('.class')
          );

          if (hasBundleFiles || bundleFiles.length > 0) {
            hasOutputFiles = true;
            consoleLog(`[Server_Docker] ✅ Builder service ${actualServiceName} produced output files`);
            break;
          }
        }
      }

      consoleLog(`[Server_Docker] Waiting for builder output files (attempt ${j + 1}/${maxRetries})...`);
    } catch (error) {
      // Ignore and retry
      consoleLog(`[Server_Docker] Error checking output files: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  if (hasOutputFiles) {
    await startServiceLogging(actualServiceName, runtime, configKey);
    consoleLog(`[Server_Docker] ✅ Builder service ${actualServiceName} completed successfully`);
    return { success: true, serviceName: actualServiceName, configKey: configKey };
  } else {
    consoleError(`[Server_Docker] ❌ Builder service ${actualServiceName} failed to produce output files`);
    failedConfigs.add(configKey);  // Track failed config
    return { success: false, serviceName: actualServiceName, error: 'No output files produced', configKey: configKey };
  }
}


