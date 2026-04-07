import type { IChecks } from "../../../../lib/tiposkripto/trash/internal/BaseCheck";
import { RUN_TIMES } from "../../../../runtimes";
import type {
  IRunTime,
  ITesterantoConfig,
} from "../../../../Types";
import type { IMode } from "../../../types";
import {
  cleanTestName,
  getAiderServiceName,
  getBddServiceName,
  getBuilderServiceName,
  getCheckServiceName,
  runTimeToCompose,
} from "../Server_Docker_Constants";
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
        runtimeTestsName,
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

  // Add agent services
  const agents = configs.agents || {};
  console.log(`[generateServicesPure] Found ${Object.keys(agents).length} agents in config`);

  for (const [agentName, agentConfig] of Object.entries(agents)) {
    const agentServiceName = `agent-${agentName}`;
    console.log(`[generateServicesPure] Creating agent service: ${agentServiceName}`);

    // Create a service for each agent that runs aider
    // Use the testeranto-aider image which has aider installed
    services[agentServiceName] = {
      image: 'testeranto-aider:latest',
      container_name: agentServiceName,
      volumes: [
        ...(configs.volumes || []),
        // Mount the current directory to access files
        `${process.cwd()}:/workspace`,
        // Mount the agents directory instead of individual files to avoid mount issues
        // Mount to /workspace/agents where the container can access all agent files
        `${process.cwd()}/testeranto/agents:/workspace/agents:ro`,
        // Mount the aider config file
        `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      ],
      working_dir: '/workspace',
      command: [
        'sh', '-c',
        // First, set up the agent markdown file
        `echo "Agent ${agentName} is starting" && \
         # Create a symlink from the mounted agents directory
         if [ -f "/workspace/agents/${agentName}.md" ]; then \
           ln -sf "/workspace/agents/${agentName}.md" /workspace/agent.md && \
           echo "Created symlink to agent markdown file at /workspace/agent.md"; \
         else \
           echo "Agent markdown file not found at /workspace/agents/${agentName}.md"; \
           # Create an empty file as fallback
           touch /workspace/agent.md; \
         fi && \
         echo "Aider is installed and available" && \
         # Launch aider with the agent markdown file in a loop
         # If aider exits, wait and restart it
         while true; do \
           echo "Launching aider with agent markdown file..." && \
           aider --no-show-model-warnings --no-show-release-notes --no-check-update --message-file /workspace/agent.md || true; \
           echo "Aider exited, restarting in 5 seconds..." && \
           sleep 5; \
         done`
      ],
      environment: {
        MODE: mode,
        NODE_ENV: 'production',
        AGENT_MARKDOWN_FILE: `/workspace/agents/${agentName}.md`,
        // Aider environment variables - API key is read from .aider.conf.yml file
        EDITOR: 'vim',
      },
      restart: 'unless-stopped',
      networks: ['allTests_network'],
      tty: true,
      stdin_open: true,
      // Simple health check that just checks if container is running
      healthcheck: {
        test: ["CMD", "echo", "healthy"],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '10s'
      }
    };
  }

  for (const serviceName in services) {
    if (!services[serviceName].networks) {
      services[serviceName].networks = ["allTests_network"];
    }
  }

  return services;
};
