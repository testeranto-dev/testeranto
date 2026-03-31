import type { IChecks, ICheck } from "../../../../lib/tiposkripto/dist/types/Types";
import { RUN_TIMES } from "../../../../runtimes";
import type {
  ITesterantoConfig,
  IRunTime,

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
    const checks: IChecks = runtimeTests.checks;

    if (!RUN_TIMES.includes(runtime)) {
      throw `unknown runtime ${runtime}`;
    }

    if (runtime === "web") {
      hasWebRuntime = true;
    }

    if (!processedRuntimes.has(runtime)) {
      processedRuntimes.add(runtime);
      const builderServiceName = getBuilderServiceName(runtime);

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

      // Add restart: "no" policy to prevent automatic restarts
      services[builderServiceName].restart = "no";

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

      services[getAiderServiceName(uid)] = aiderDockerComposeFile(
        getAiderServiceName(uid),
        configs
      );
      // Add restart: "no" policy to prevent automatic restarts
      services[getAiderServiceName(uid)].restart = "no";

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
  }

  return services;
};
