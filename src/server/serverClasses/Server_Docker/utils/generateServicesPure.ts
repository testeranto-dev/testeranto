import { RUN_TIMES } from "../../../../runtimes";
import type {
  ITestconfigV2,
  IRunTime,
  IChecks,
  ICheck,
} from "../../../../Types";
import type { IMode } from "../../../types";
import {
  getBuilderServiceName,
  runTimeToCompose,
  cleanTestName,
  getBddServiceName,
  getAiderServiceName,
  getCheckServiceName,
} from "../Server_Docker_Constants";
import {
  consoleLog,
  consoleWarn,
  processCwd,
} from "../Server_Docker_Dependents";
import { aiderDockerComposeFile } from "./aiderDockerComposeFile";
import { bddTestDockerComposeFile } from "./bddTestDockerComposeFile";
import { staticTestDockerComposeFile } from "./staticTestDockerComposeFile";


export const generateServicesPure = (
  configs: ITestconfigV2,
  mode: IMode,
): Record<string, any> => {
  consoleLog(
    `[generateServicesPure] Starting with ${Object.keys(configs.runtimes).length} runtimes`,
  );
  const services: any = {};
  const processedRuntimes = new Set<IRunTime>();
  let hasWebRuntime = false;

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {
    consoleLog(
      `[generateServicesPure] Processing runtime: ${runtimeTestsName}, runtime type: ${runtimeTests.runtime}`,
    );
    consoleLog(
      `[generateServicesPure] Checks for ${runtimeTestsName}: ${runtimeTests.checks?.length || 0} checks`,
    );
    const runtime: IRunTime = runtimeTests.runtime as IRunTime;
    const buildOptions = runtimeTests.buildOptions;
    const testsObj = runtimeTests.tests;
    const checks: IChecks = runtimeTests.checks;

    if (!RUN_TIMES.includes(runtime)) {
      throw `unknown runtime ${runtime}`;
    }

    if (runtime === "web") {
      hasWebRuntime = true;
    }

    if (runtimeTests.buildKitOptions === undefined) {
      consoleWarn(
        `[Server_Docker] No BuildKit options for ${runtimeTestsName}`,
      );
    }

    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
      let builderServiceName = getBuilderServiceName(runtime);
      // For web runtime, use 'webtests' as the service name to match the code expectations
      if (runtime === "web") {
        builderServiceName = "webtests";
      }
      consoleLog(
        `[generateServicesPure] Adding builder service: ${builderServiceName} for runtime ${runtime}`,
      );
      const composeFunc = runTimeToCompose[runtime][0];
      const projectConfigPath = "testeranto/testeranto.ts";
      const runtimeConfigPath = buildOptions;

      services[builderServiceName] = composeFunc(
        configs,
        builderServiceName,
        projectConfigPath,
        runtimeConfigPath,
        runtimeTestsName,
      );

      if (!services[builderServiceName].environment) {
        services[builderServiceName].environment = {};
      }
      services[builderServiceName].environment.MODE = mode;

      if (runtimeTests.buildKitOptions) {
        // Keep the build section, but also set the image name
        // This way docker-compose can build if the image doesn't exist
        services[builderServiceName].image =
          `testeranto-${runtime}-${runtimeTestsName}:latest`;
        // Ensure build section exists
        if (!services[builderServiceName].build) {
          services[builderServiceName].build = {
            context: processCwd(),
            dockerfile: runtimeTests.dockerfile,
          };
        }
      }
      consoleLog(
        `[generateServicesPure] Builder service ${builderServiceName} configured`,
      );
    }

    consoleLog(
      `[generateServicesPure] Processing ${testsObj.length} tests for ${runtimeTestsName}`,
    );
    for (const tName of testsObj) {
      const cleanedTestName = cleanTestName(tName);
      const uid = `${runtimeTestsName.toLowerCase()}-${cleanedTestName}`;
      const bddCommandFunc = runTimeToCompose[runtime][2];

      let f;
      if (runtime === "node" || runtime === "web") {
        f = tName.split(".").slice(0, -1).concat("mjs").join(".");
      } else {
        f = tName;
      }

      // For web runtime, we need to pass the container name as the fourth parameter
      let bddCommand;
      if (runtime === "web") {
        // The web builder service name is 'webtests'
        const webBuilderServiceName = "webtests";
        bddCommand = bddCommandFunc(
          f,
          buildOptions,
          runtimeTestsName,
        );
      } else {
        bddCommand = bddCommandFunc(f, buildOptions, runtimeTestsName);
      }

      services[getBddServiceName(uid)] = bddTestDockerComposeFile(
        configs,
        runtime,
        getBddServiceName(uid),
        bddCommand,
      );
      services[getAiderServiceName(uid)] = aiderDockerComposeFile(
        getAiderServiceName(uid),
      );

      consoleLog(
        `[generateServicesPure] Added BDD and aider services for test ${tName}`,
      );

      checks.forEach((check: ICheck, ndx) => {
        const command = check([]);
        services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(
          runtime,
          getCheckServiceName(uid, ndx),
          command,
          configs,
          runtimeTestsName,
        );
        consoleLog(
          `[generateServicesPure] Added check service ${getCheckServiceName(uid, ndx)}`,
        );
      });
    }
  }

  // Always add chrome-service if there's a web runtime
  if (hasWebRuntime) {
    consoleLog(`[generateServicesPure] Adding chrome-service for web runtime`);
    // Use browserless/chrome which is designed for headless Chrome with remote debugging
    services["chrome-service"] = {
      image: "browserless/chrome:latest",
      container_name: "chrome-service",
      environment: {
        CONNECTION_TIMEOUT: "60000",
        MAX_CONCURRENT_SESSIONS: "1",
        ENABLE_CORS: "true",
        PREBOOT_CHROME: "true",
        DEFAULT_BLOCK_ADS: "true",
      },
      shm_size: "2g",
      expose: ["3000"],
      ports: ["9222:3000"],
      networks: ["allTests_network"],
    };
    consoleLog(
      `[generateServicesPure] chrome-service added with browserless/chrome configuration`,
    );
  }

  // Ensure all services have network configuration
  for (const serviceName in services) {
    if (!services[serviceName].networks) {
      services[serviceName].networks = ["allTests_network"];
    }
  }

  consoleLog(
    `[generateServicesPure] Generated ${Object.keys(services).length} services: ${Object.keys(services).join(", ")}`,
  );
  return services;
};
