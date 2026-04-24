import { spawnPromise } from ".";
import type { ITesterantoConfig } from "../../../../src/server/Types";
import type { IMode } from "../../../types";
import { getBuilderServiceName } from "../Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  execSyncWrapper,
  existsSync,
  processCwd,
  readFileSync,
  readdirSync,
  spawnWrapper,
} from "../Server_Docker_Dependents";
import { servicePromise } from "./servicePromise";

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

      // Call servicePromise with the correct arguments
      const servicePromiseResult = servicePromise(
        serviceName,
        runtime,
        configKey,
        configs,
        startServiceLogging,
        failedConfigs
      );

      // Add timeout to the service promise
      return await Promise.race([servicePromiseResult, timeoutPromise]);

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
