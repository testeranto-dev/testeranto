import { existsSync, readFileSync, readdirSync } from "fs";
import { spawnPromise } from ".";
import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
import { consoleLog, execSyncWrapper, processCwd, consoleWarn, spawnWrapper, consoleError } from "../Server_Docker_Dependents";
import type { ITesterantoConfig } from "../../../../src/server/Types";

export const servicePromise = async (
  serviceName: string,
  runtime: string,
  configKey: string,
  configs: ITesterantoConfig,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>,
  failedConfigs: Set<string>
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
      // Wait for the service to fully start
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error: any) {
    consoleWarn(`[Server_Docker] Error checking/starting ${actualServiceName}: ${error.message}`);
    // Try to start it anyway
    try {
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${actualServiceName}`,
      );
      consoleLog(`[Server_Docker] Started ${actualServiceName} via docker compose up`);
      // Wait longer for the service to start
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (startError: any) {
      consoleError(`[Server_Docker] Failed to start ${actualServiceName}: ${startError.message}`);
      // Check if the service exists in docker-compose.yml
      try {
        const checkCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
        const servicesOutput = execSyncWrapper(checkCmd, { cwd: processCwd() }).trim();
        const services = servicesOutput.split('\n').map(s => s.trim());
        if (!services.includes(actualServiceName)) {
          consoleError(`[Server_Docker] Service ${actualServiceName} not found in docker-compose.yml`);
          failedConfigs.add(configKey);
          return { success: false, serviceName: actualServiceName, error: 'Service not in docker-compose.yml', configKey: configKey };
        }
      } catch (configError: any) {
        consoleError(`[Server_Docker] Error checking docker-compose config: ${configError.message}`);
      }
    }
  }

  // Verify the service has produced output files
  let hasOutputFiles = false;
  const maxRetries = 10; // Increased from 5 to 10 retries
  const retryDelay = 2000; // Increased from 1 second to 2 seconds between checks

  for (let j = 0; j < maxRetries; j++) {
    try {
      // Check for inputFiles.json in the bundle directory
      const inputFilesPath = `${processCwd()}/testeranto/bundles/${configKey}/inputFiles.json`;
      const bundleDir = `${processCwd()}/testeranto/bundles/${configKey}`;

      // Check if bundle directory exists
      if (!existsSync(bundleDir)) {
        consoleLog(`[Server_Docker] Bundle directory does not exist: ${bundleDir}`);
        continue;
      }

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
      // Log what we're looking for
      consoleLog(`[Server_Docker] Checking for inputFiles.json at: ${inputFilesPath}`);
      consoleLog(`[Server_Docker] Bundle directory exists: ${existsSync(bundleDir)}`);
      if (existsSync(bundleDir)) {
        try {
          const files = readdirSync(bundleDir);
          consoleLog(`[Server_Docker] Files in bundle directory: ${files.join(', ')}`);
        } catch (e) {
          consoleLog(`[Server_Docker] Error reading bundle directory: ${e.message}`);
        }
      }
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
    // Check if the service is actually running
    try {
      const psCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${actualServiceName}`;
      const containerId = execSyncWrapper(psCmd, { cwd: processCwd() }).trim();
      if (containerId) {
        // Get container status
        const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
        const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
        consoleError(`[Server_Docker] Container ${containerId.substring(0, 12)} status: ${status}`);

        // Get logs
        const logsCmd = `docker compose -f "testeranto/docker-compose.yml" logs ${actualServiceName} --tail=20`;
        const logs = execSyncWrapper(logsCmd, { cwd: processCwd() });
        consoleError(`[Server_Docker] Last 20 lines of logs:\n${logs}`);
      } else {
        consoleError(`[Server_Docker] No container found for ${actualServiceName}`);
      }
    } catch (checkError: any) {
      consoleError(`[Server_Docker] Error checking container status: ${checkError.message}`);
    }

    failedConfigs.add(configKey);  // Track failed config
    return { success: false, serviceName: actualServiceName, error: 'No output files produced', configKey: configKey };
  }
}


