import { RUN_TIMES } from "../../../../runtimes";
import type {
  IRunTime,
  ITesterantoConfig,
} from "../../../../src/server/Types";
import type { IMode } from "../../../types";
import { runTimeToCompose } from "../runTimeToCompose";
import {
  cleanTestName,
  getAiderServiceName,
  getBddServiceName,
  getBuilderServiceName,
  getCheckServiceName,
} from "../Server_Docker_Constants";
import { aiderDockerComposeFile } from "./aiderDockerComposeFile";
import { bddTestDockerComposeFile } from "./bddTestDockerComposeFile";
import { staticTestDockerComposeFile } from "./staticTestDockerComposeFile";
import { consoleLog } from "../Server_Docker_Dependents";
import type { IChecks } from "../../../../lib/tiposkripto/trash/internal/BaseCheck";

export const generateServicesPure = (
  configs: ITesterantoConfig,
  mode: IMode,
): Record<string, any> => {

  const services: any = {};
  const processedRuntimes = new Set<IRunTime>();
  let hasWebRuntime = false;

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {

    const runtime: IRunTime = runtimeTests.runtime as IRunTime;
    const buildOptions = runtimeTests.buildOptions;
    const testsObj = runtimeTests.tests;
    const checks: IChecks<any> = runtimeTests.checks;

    if (!RUN_TIMES.includes(runtime)) {
      throw `unknown runtime ${runtime}`;
    }

    if (runtime === "web") {
      hasWebRuntime = true;
    }

    // Create a builder service for each config, not just each runtime
    // This ensures each config has its own builder service
    const builderServiceName = getBuilderServiceName(runtimeTestsName);

    // Check if we've already created a builder service for this config
    if (!services[builderServiceName]) {
      const composeFunc = runTimeToCompose[runtime][0];
      const projectConfigPath = "testeranto/testeranto.ts";
      const runtimeConfigPath = buildOptions;

      services[builderServiceName] = composeFunc(
        configs,
        builderServiceName,
        projectConfigPath,
        runtimeConfigPath,
        {
          name: runtimeTestsName,
          tests: configs.runtimes[runtimeTestsName].tests,
          outputs: configs.runtimes[runtimeTestsName].outputs,
        }
      );

      if (!services[builderServiceName].environment) {
        services[builderServiceName].environment = {};
      }
      services[builderServiceName].environment.MODE = mode;

      // Add restart: "no" policy to prevent automatic restarts
      services[builderServiceName].restart = "no";

      // Always set the image name for builder services
      services[builderServiceName].image = `testeranto-${runtime}-${runtimeTestsName}:latest`;

      // Remove build section since BuildKit handles building
      // Docker-compose will pull or use the pre-built image
      delete services[builderServiceName].build;
    }

    // Still track processed runtimes for other purposes
    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
    }

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

      const bddCommand = bddCommandFunc(f, buildOptions, runtimeTestsName);

      services[getBddServiceName(uid)] = bddTestDockerComposeFile(
        configs,
        runtime,
        getBddServiceName(uid),
        bddCommand,
      );
      // Add restart: "no" policy to prevent automatic restarts
      services[getBddServiceName(uid)].restart = "no";


      checks.forEach((check: ICheck, ndx: number) => {
        const command = check([]);
        services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(
          runtime,
          getCheckServiceName(uid, ndx),
          command,
          configs,
          runtimeTestsName,
        );
        // Add restart: "no" policy to prevent automatic restarts
        services[getCheckServiceName(uid, ndx)].restart = "no";
      });
    }
  }

  if (hasWebRuntime) {
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
      restart: "no",
    };
  }


  for (const serviceName in services) {
    if (!services[serviceName].networks) {
      services[serviceName].networks = ["allTests_network"];
    }
    // Add extra_hosts to allow services to access the host's HTTP server on port 3000
    // This enables services to reach the server via host.docker.internal:3000
    // Merge with existing extra_hosts if any
    const currentExtraHosts = services[serviceName].extra_hosts || [];
    // Add host.docker.internal:host-gateway for accessing the host machine
    // host-gateway is a special Docker Compose feature that resolves to the host's IP
    // Avoid adding duplicates
    const hostEntry = "host.docker.internal:host-gateway";
    if (!currentExtraHosts.includes(hostEntry)) {
      services[serviceName].extra_hosts = [...currentExtraHosts, hostEntry];
    } else {
      services[serviceName].extra_hosts = currentExtraHosts;
    }
  }

  return services;
};
