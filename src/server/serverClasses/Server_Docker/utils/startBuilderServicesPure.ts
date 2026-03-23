import { spawnPromise } from ".";
import type { ITestconfigV2 } from "../../../../Types";
import type { IMode } from "../../../types";
import { getBuilderServiceName } from "../Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  execSyncWrapper,
} from "../Server_Docker_Dependents";
import { getCwdPure } from "../Server_Docker_Utils";

// Pure function to start builder services
export const startBuilderServicesPure = async (
  configs: ITestconfigV2,
  mode: IMode,
  startServiceLogging: (
    serviceName: string,
    runtime: string,
    runtimeConfigKey: string,
  ) => Promise<void>,
): Promise<void> => {
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

    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
      const builderServiceName = getBuilderServiceName(runtime);
      builderServices.push({
        serviceName: builderServiceName,
        runtime: runtime,
        configKey: runtimeTestsName,
      });
    }

    if (runtime === "web") {
      hasWebRuntime = true;
    }
  }

  for (const { serviceName, runtime, configKey } of builderServices) {
    try {
      // For web runtime, the service name might be 'webtests' instead of 'web-builder'
      const actualServiceName = runtime === "web" ? "webtests" : serviceName;

      // First, try to build the image locally if it doesn't exist
      const imageName = `testeranto-${runtime}-${configKey}:latest`;
      const imageExistsCmd = `docker image inspect ${imageName} > /dev/null 2>&1`;

      try {
        execSyncWrapper(imageExistsCmd, { cwd: getCwdPure() });
        consoleLog(`[Server_Docker] Image ${imageName} exists locally`);
      } catch (imageError) {
        consoleLog(
          `[Server_Docker] Image ${imageName} not found locally, trying to build...`,
        );
        // Try to build the image
        const buildCmd = `docker build -f ${configs.runtimes[configKey].dockerfile} -t ${imageName} .`;
        try {
          execSyncWrapper(buildCmd, { cwd: getCwdPure() });
          consoleLog(`[Server_Docker] Built image ${imageName}`);
        } catch (buildError) {
          consoleWarn(
            `[Server_Docker] Could not build image ${imageName}: ${buildError}`,
          );
          // Continue anyway - docker-compose will try to build it
        }
      }

      // Start the service
      await spawnPromise(
        `docker compose -f "testeranto/docker-compose.yml" up -d ${actualServiceName}`,
      );

      await startServiceLogging(actualServiceName, runtime, configKey);
    } catch (error: any) {
      consoleError(
        `[Server_Docker] ❌ Failed to start builder service ${serviceName}: ${error.message}`,
      );
      consoleError(`[Server_Docker] Full error: ${error.stack || error}`);
      // Continue with other services even if one fails
    }
  }

  // Start chrome-service if there's a web runtime
  if (hasWebRuntime) {
    try {
      consoleLog(`[Server_Docker] Starting chrome-service for web runtime`);

      // First, ensure chrome-service is in the docker-compose.yml
      const checkCmd = `docker compose -f "testeranto/docker-compose.yml" config --services`;
      const servicesOutput = execSyncWrapper(checkCmd, { cwd: getCwdPure() });
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
      const containerId = execSyncWrapper(psCmd, { cwd: getCwdPure() }).trim();

      if (containerId) {
        consoleLog(
          `[Server_Docker] chrome-service container ID: ${containerId.substring(0, 12)}`,
        );

        // Check container status
        const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
        const status = execSyncWrapper(statusCmd, { cwd: getCwdPure() }).trim();
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
          const logs = execSyncWrapper(logsCmd, { cwd: getCwdPure() });
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

  consoleLog("[Server_Docker] ✅ All builder services started");
};
