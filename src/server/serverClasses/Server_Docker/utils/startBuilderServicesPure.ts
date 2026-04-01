import { spawnPromise } from ".";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { BuildKitBuilder } from "../../../buildkit/BuildKit_Utils";
import { getBuilderServiceName } from "../Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  execSyncWrapper,
  processCwd,
  spawnWrapper,
  existsSync,
  readFileSync,
  readdirSync,
} from "../Server_Docker_Dependents";
import { spawn } from "child_process";


// Pure function to start builder services
export const startBuilderServicesPure = async (
  configs: ITesterantoConfig,
  mode: IMode,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>,
): Promise<Set<string>> => {
  const failedConfigs = new Set<string>();
  const builderServices: Array<{
    serviceName: string;
    runtime: string;
    configKey: string;
  }> = [];
  const processedRuntimes = new Set<string>();
  let hasWebRuntime = false;

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {
    const runtime = runtimeTests.runtime;
    
    // Each config gets its own builder service
    const builderServiceName = getBuilderServiceName(runtimeTestsName);
    builderServices.push({
      serviceName: builderServiceName,
      runtime: runtime,
      configKey: runtimeTestsName,
    });

    if (runtime === "web") {
      hasWebRuntime = true;
    }
  }

  consoleLog(`[Server_Docker] Starting ${builderServices.length} builder services in parallel...`);

  // Create promises for all builder services
  const servicePromises = builderServices.map(async ({ serviceName, runtime, configKey }) => {
    consoleLog(`[Server_Docker] Processing builder service: ${serviceName} (runtime: ${runtime}, config: ${configKey})`);
    
    try {
      // Add a timeout for the entire service startup
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout starting ${serviceName}`)), 120000) // 2 minutes (reduced from 5)
      );
      
      const servicePromise = (async () => {
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
    })();
    
    // Add timeout to the service promise
    return await Promise.race([servicePromise, timeoutPromise]);
    
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Error with builder service ${serviceName}: ${error.message}`,
      );
      consoleError(`[Server_Docker] Full error: ${error.stack || error}`);
      
      // Even if there was an error, check if output files exist
      // This handles the case where the builder ran and exited
      const inputFilesPath = `${processCwd()}/testeranto/bundles/${configKey}/inputFiles.json`;
      if (existsSync(inputFilesPath)) {
        const fileContent = readFileSync(inputFilesPath, 'utf-8');
        if (fileContent.trim().length > 0) {
          consoleLog(`[Server_Docker] ⚠️ Builder service ${serviceName} had errors but output files exist`);
          return { success: true, serviceName: serviceName, warning: 'Service had errors but produced output', configKey: configKey };
        } else {
          failedConfigs.add(configKey);  // Track failed config even if file exists but is empty
        }
      } else {
        failedConfigs.add(configKey);  // Track failed config when no file exists
      }
      
      return { success: false, serviceName, error: error.message, configKey: configKey };
    }
  });

  // Run all services in parallel
  const results = await Promise.allSettled(servicePromises);

  // Log summary of results
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value?.success
  ).length;
  const failed = results.filter(r => 
    r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)
  ).length;

  consoleLog(`[Server_Docker] Builder services summary: ${successful} produced output files, ${failed} failed`);

  // Log which configs succeeded and failed
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.success) {
        consoleLog(`[Server_Docker]   ✅ ${value.serviceName}: Success`);
      } else {
        consoleLog(`[Server_Docker]   ❌ ${value.serviceName}: ${value.error || 'Failed'}`);
      }
    } else {
      consoleLog(`[Server_Docker]   ❌ Unknown service: ${result.reason}`);
    }
  }

  // Start chrome-service if there's a web runtime
  if (hasWebRuntime) {
    try {
      consoleLog(`[Server_Docker] Starting chrome-service for web runtime`);

      // First, ensure chrome-service is in the docker-compose.yml
      const checkCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
      const servicesOutput = execSyncWrapper(checkCmd, { cwd: processCwd() });
      const services = servicesOutput
        .trim()
        .split("\n")
        .map((s) => s.trim());

      if (!services.includes("chrome-service")) {
        consoleWarn(
          `[Server_Docker] chrome-service not found in docker-compose.yml. Regenerating...`,
        );
        // We need to regenerate the docker-compose.yml
        // This should have been done by generateServicesPure, but let's check
        consoleWarn(
          `[Server_Docker] Available services: ${services.join(", ")}`,
        );
        // We'll try to start it anyway - docker-compose might handle missing services gracefully
      } else {
        consoleLog(
          `[Server_Docker] Found chrome-service in docker-compose.yml`,
        );
      }

      // Start chrome-service with a longer timeout
      consoleLog(`[Server_Docker] Starting chrome-service...`);
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d chrome-service`,
      );

      // Wait longer for the service to start (chromium can take time)
      consoleLog(`[Server_Docker] Waiting for chrome-service to start...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if chrome-service is running
      const psCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q chrome-service`;
      const containerId = execSyncWrapper(psCmd, { cwd: processCwd() }).trim();

      if (containerId) {
        consoleLog(
          `[Server_Docker] chrome-service container ID: ${containerId.substring(0, 12)}`,
        );

        // Check container status
        const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
        const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
        consoleLog(`[Server_Docker] chrome-service status: ${status}`);

        // Wait a bit more if it's starting
        if (status === "starting" || status === "created") {
          consoleLog(
            `[Server_Docker] chrome-service is ${status}, waiting a bit more...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        // Start logging for chrome-service
        // Find any web runtime config key
        let webConfigKey = "";
        for (const [key, value] of Object.entries(configs.runtimes)) {
          if (value.runtime === "web") {
            webConfigKey = key;
            break;
          }
        }
        if (!webConfigKey) {
          // Use the first config key if no web runtime found
          webConfigKey = Object.keys(configs.runtimes)[0] || "default";
        }

        await startServiceLogging("chrome-service", "web", webConfigKey);
        consoleLog(`[Server_Docker] ✅ chrome-service started and logging`);
      } else {
        consoleWarn(
          `[Server_Docker] chrome-service container not found after start attempt`,
        );
        // Try to get logs to see what happened
        try {
          const logsCmd = `docker compose -f "testeranto/docker-compose.yml" logs chrome-service --tail=30`;
          const logs = execSyncWrapper(logsCmd, { cwd: processCwd() });
          consoleLog(`[Server_Docker] chrome-service logs:\n${logs}`);
        } catch (logError: any) {
          consoleWarn(
            `[Server_Docker] Could not get chrome-service logs: ${logError.message}`,
          );
        }
      }
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Failed to start chrome-service: ${error.message}`,
      );
      consoleError(`[Server_Docker] Full error: ${error.stack || error}`);

      // Don't fail the entire process if chrome-service fails
      consoleWarn(`[Server_Docker] Continuing without chrome-service...`);
    }
  }

  // Check and log bundle status
  consoleLog(`[Server_Docker] Builder services completed. Checking bundle status...`);
  for (const [configKey] of Object.entries(configs.runtimes)) {
    // Skip failed configs
    if (failedConfigs.has(configKey)) {
      consoleLog(`[Server_Docker]   ${configKey}: ❌ Builder failed, skipping bundle check`);
      continue;
    }
    
    const inputFilesPath = `${processCwd()}/testeranto/bundles/${configKey}/inputFiles.json`;
    const bundleDir = `${processCwd()}/testeranto/bundles/${configKey}`;
    
    if (existsSync(inputFilesPath)) {
      try {
        const fileContent = readFileSync(inputFilesPath, 'utf-8');
        const bundleFiles = readdirSync(bundleDir);
        consoleLog(`[Server_Docker]   ${configKey}: ✅ Bundle ready (${bundleFiles.length} files)`);
      } catch (error) {
        consoleLog(`[Server_Docker]   ${configKey}: ⚠️ Bundle exists but error reading`);
      }
    } else {
      consoleLog(`[Server_Docker]   ${configKey}: ❌ Bundle not found`);
    }
  }

  consoleLog("[Server_Docker] ✅ All builder services started");
  return failedConfigs;  // Return failed configs
};
