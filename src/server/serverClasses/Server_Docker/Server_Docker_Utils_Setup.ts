// Server_Docker_Utils_Setup: Setup-related pure functions for Server_Docker
import type { ICheck, IChecks, IRunTime, ITestconfigV2 } from "../../../Types";
import { RUN_TIMES } from "../../../runtimes";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";
import { chromeServiceConfig } from "../../runtimes/web/docker";
import type { IMode } from "../../types";
import {
  cleanTestName,
  getAiderServiceName,
  getBddServiceName,
  getBuilderServiceName,
  getCheckServiceName,
  getRuntimeLabel,
  runTimeToCompose,
} from "./Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  consoleWarn,
  existsSync,
  join,
  mkdirSync,
  processCwd,
  readFileSync,
  unlinkSync,
  writeFileSync,
  yamlDump,
} from "./Server_Docker_Dependents";
import { getCwdPure } from "./Server_Docker_Utils";
// import { buildAiderImagePure } from "./utils/aider";

export const generateServicesPure = (
  configs: ITestconfigV2,
  mode: IMode,
): Record<string, any> => {
  consoleLog(`[generateServicesPure] Starting with ${Object.keys(configs.runtimes).length} runtimes`);
  const services: any = {};
  const processedRuntimes = new Set<IRunTime>();
  let hasWebRuntime = false;

  for (const [runtimeTestsName, runtimeTests] of Object.entries(
    configs.runtimes,
  )) {
    consoleLog(`[generateServicesPure] Processing runtime: ${runtimeTestsName}, runtime type: ${runtimeTests.runtime}`);
    consoleLog(`[generateServicesPure] Checks for ${runtimeTestsName}: ${runtimeTests.checks?.length || 0} checks`);
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
      consoleLog(`[generateServicesPure] Adding builder service: ${builderServiceName} for runtime ${runtime}`);
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
      consoleLog(`[generateServicesPure] Builder service ${builderServiceName} configured`);
    }

    consoleLog(`[generateServicesPure] Processing ${testsObj.length} tests for ${runtimeTestsName}`);
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
      services[getAiderServiceName(uid)] = aiderDockerComposeFile(
        getAiderServiceName(uid),
      );

      consoleLog(`[generateServicesPure] Added BDD and aider services for test ${tName}`);

      checks.forEach((check: ICheck, ndx) => {
        const command = check([]);
        services[getCheckServiceName(uid, ndx)] = staticTestDockerComposeFile(
          runtime,
          getCheckServiceName(uid, ndx),
          command,
          configs,
          runtimeTestsName,
        );
        consoleLog(`[generateServicesPure] Added check service ${getCheckServiceName(uid, ndx)}`);
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
        DEFAULT_BLOCK_ADS: "true"
      },
      shm_size: "2g",
      expose: ["3000"],
      ports: [
        "9222:3000"
      ],
      networks: ["allTests_network"]
    };
    consoleLog(`[generateServicesPure] chrome-service added with browserless/chrome configuration`);
  }

  // Ensure all services have network configuration
  for (const serviceName in services) {
    if (!services[serviceName].networks) {
      services[serviceName].networks = ["allTests_network"];
    }
  }

  consoleLog(`[generateServicesPure] Generated ${Object.keys(services).length} services: ${Object.keys(services).join(', ')}`);
  return services;
};

export const writeConfigForExtensionOnStop = () => {
  try {
    const configDir = join(getCwdPure(), "testeranto");
    const configPath = join(configDir, "extension-config.json");

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const configData = {
      runtimes: [],
      timestamp: new Date().toISOString(),
      source: "testeranto.ts",
      serverStarted: false,
    };

    const configJson = JSON.stringify(configData, null, 2);
    writeFileSync(configPath, configJson);
  } catch (error: any) {
    consoleError(
      `[Server_Docker] Failed to write extension config on stop:`,
      error,
    );
  }
};

export const writeComposeFile = (services: Record<string, any>) => {
  const composeFilePath = join(getCwdPure(), "testeranto/docker-compose.yml");

  // Delete the old file first to ensure fresh generation
  if (existsSync(composeFilePath)) {
    consoleLog(`[writeComposeFile] Removing old docker-compose.yml`);
    try {
      unlinkSync(composeFilePath);
    } catch (error: any) {
      consoleWarn(`[writeComposeFile] Could not delete old docker-compose.yml: ${error.message}`);
    }
  }

  consoleLog(`[writeComposeFile] Writing ${Object.keys(services).length} services to docker-compose.yml`);
  consoleLog(`[writeComposeFile] Services: ${Object.keys(services).join(', ')}`);

  // Check if chrome-service is in services
  if (services["chrome-service"]) {
    consoleLog(`[writeComposeFile] chrome-service is included in services`);
  } else {
    consoleWarn(`[writeComposeFile] chrome-service is NOT included in services`);
  }

  const dockerComposeFileContents = BaseCompose(services);

  // Log the structure for debugging
  consoleLog(`[writeComposeFile] docker-compose.yml structure:`, JSON.stringify({
    services: Object.keys(dockerComposeFileContents.services || {}),
    networks: Object.keys(dockerComposeFileContents.networks || {}),
    volumes: Object.keys(dockerComposeFileContents.volumes || {})
  }, null, 2));

  const yamlContent = yamlDump(dockerComposeFileContents, {
    lineWidth: -1,
    noRefs: true,
  });

  writeFileSync(composeFilePath, yamlContent);
  consoleLog(`[writeComposeFile] docker-compose.yml written successfully to ${composeFilePath}`);

  // Verify the file was written
  if (existsSync(composeFilePath)) {
    const fileContent = readFileSync(composeFilePath, 'utf-8');
    consoleLog(`[writeComposeFile] First 500 chars of docker-compose.yml:\n${fileContent.substring(0, 500)}...`);

    // Check if chrome-service appears in the file
    if (fileContent.includes('chrome-service:')) {
      consoleLog(`[writeComposeFile] ✅ chrome-service found in docker-compose.yml`);
    } else {
      consoleWarn(`[writeComposeFile] ⚠️ chrome-service NOT found in docker-compose.yml content`);
    }
  } else {
    consoleError(`[writeComposeFile] ❌ docker-compose.yml was not created at ${composeFilePath}`);
  }
};

export const BaseCompose = (services: any) => {
  return {
    services,
    volumes: {
      node_modules: {
        driver: "local",
      },
    },
    networks: {
      allTests_network: {
        driver: "bridge",
      },
    },
  };
};

export const staticTestDockerComposeFile = (
  runtime: string,
  container_name: string,
  command: string,
  config: any,
  runtimeTestsName: string,
) => {
  return {
    build: {
      context: processCwd(),
      dockerfile: config.runtimes[runtimeTestsName].dockerfile,
    },
    container_name,
    environment: {
      // NODE_ENV: "production",
      // ...config.env,
    },
    working_dir: "/workspace",
    command: command,
    networks: ["allTests_network"],
  };
};

export const bddTestDockerComposeFile = (
  configs: ITestconfigV2,
  runtime: string,
  container_name: string,
  command: string,
) => {
  let dockerfilePath = "";
  for (const [key, value] of Object.entries(configs.runtimes)) {
    if (value.runtime === runtime) {
      dockerfilePath = value.dockerfile;
      break;
    }
  }

  if (!dockerfilePath) {
    throw `[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(configs)}`;
  }

  const service: any = {
    build: {
      context: processCwd(),
      dockerfile: dockerfilePath,
    },
    container_name,
    environment: {
      // NODE_ENV: "production",
      // ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      `${processCwd()}/src:/workspace/src`,
      `${processCwd()}/dist:/workspace/dist`,
      `${processCwd()}/testeranto:/workspace/testeranto`,
    ],
    command: command,
    networks: ["allTests_network"],
  };

  return service;
};

export const aiderDockerComposeFile = (container_name: string) => {
  return {
    image: "testeranto-aider:latest",
    container_name,
    environment: {
      NODE_ENV: "production",
    },
    volumes: [
      `${processCwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      // Mount the entire workspace to allow aider to access files
      `${processCwd()}:/workspace`,
    ],
    working_dir: "/workspace",
    command: "tail -f /dev/null", // Keep container running
    networks: ["allTests_network"],
    tty: true,
    stdin_open: true,
  };
};

export const writeConfigForExtensionPure = (
  configs: any,
  mode: string,
  processSummary: any,
  cwd: string,
): void => {
  const configDir = join(cwd, "testeranto");
  const configPath = join(configDir, "extension-config.json");

  const runtimesArray: Array<{
    key: string;
    runtime: string;
    label: string;
    tests: string[];
  }> = [];

  for (const [key, value] of Object.entries(configs.runtimes)) {
    const runtimeObj = value as any;
    if (runtimeObj && typeof runtimeObj === "object") {
      const runtime = runtimeObj.runtime;
      const tests = runtimeObj.tests || [];

      if (runtime) {
        runtimesArray.push({
          key,
          runtime: runtime,
          label: getRuntimeLabel(runtime),
          tests: Array.isArray(tests) ? tests : [],
        });
      } else {
        throw `[Server_Docker] No runtime property found for key: ${key}`;
      }
    } else {
      throw `[Server_Docker] Invalid runtime configuration for key: ${key}, value type: ${typeof value}`;
    }
  }

  const configData = {
    runtimes: runtimesArray,
    timestamp: new Date().toISOString(),
    source: "testeranto.ts",
    serverStarted: true,
    processes: processSummary.processes || [],
    totalProcesses: processSummary.total || 0,
    lastUpdated: new Date().toISOString(),
  };

  const configJson = JSON.stringify(configData, null, 2);
  writeFileSync(configPath, configJson);
};


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

    if (!buildKitOptions) {
      consoleLog(
        `[Server_Docker] No BuildKit options for ${configKey} (${runtime}), skipping BuildKit build`,
      );
      continue;
    }

    try {
      consoleLog(
        `[Server_Docker] Building ${configKey} (${runtime}) with BuildKit`,
      );

      // Build the image using BuildKitBuilder
      const result = await BuildKitBuilder.buildImage({
        runtime: runtime,
        configKey: configKey,
        dockerfilePath: configValue.dockerfile,
        buildContext: processCwd(),
        cacheMounts: buildKitOptions.cacheMounts || [],
        targetStage: buildKitOptions.targetStage,
        buildArgs: buildKitOptions.buildArgs || {},
      });

      if (result.success) {
        consoleLog(
          `[Server_Docker] ✅ BuildKit build successful for ${configKey} (${runtime}) in ${result.duration}ms`,
        );
      } else {
        throw new Error(result.error || 'Build failed');
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
