// Utility functions and constants for Server_Docker
// This file contains repetitive code, constants, and boilerplate extracted from Server_Docker.ts

import type { IBaseTestConfig, IRunTime, ITestconfigV2 } from "../../Types";
import { golangDockerComposeFile, golangBuildCommand, golangBddCommand } from "../runtimes/golang/docker";
import { javaDockerComposeFile, javaBuildCommand, javaBddCommand } from "../runtimes/java/docker";
import { nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand } from "../runtimes/node/docker";
import { pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand } from "../runtimes/python/docker";
import { rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand } from "../runtimes/ruby/docker";
import { rustDockerComposeFile, rustBuildCommand, rustBddCommand } from "../runtimes/rust/docker";
import { webDockerComposeFile, webBuildCommand, webBddCommand } from "../runtimes/web/docker";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export type IService = any;

export interface IDockerComposeResult {
  exitCode: number;
  out: string;
  err: string;
  data: any;
}

export const runTimeToCompose: Record<IRunTime, [
  (
    config: ITestconfigV2,
    container_name: string,
    projectConfigPath: string,
    nodeConfigPath: string,
    testName: string
  ) => object,

  (projectConfig: string, nodeConfigPath: string, testname: string, tests: string[]) => string,
  (fpath: string, nodeConfigPath: string, configKey: string) => string,
]> = {
  'node': [nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand],
  'web': [webDockerComposeFile, webBuildCommand, webBddCommand],
  'python': [pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand],
  'golang': [golangDockerComposeFile, golangBuildCommand, golangBddCommand],
  'ruby': [rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand],
  'rust': [rustDockerComposeFile, rustBuildCommand, rustBddCommand],
  "java": [javaDockerComposeFile, javaBuildCommand, javaBddCommand]
};

// Container name generation utilities
export const generateContainerName = (configKey: string, testName: string, suffix: string): string => {
  const cleanTestName = testName.toLowerCase()
    .replaceAll("/", "_")
    .replaceAll(".", "-")
    .replace(/[^a-z0-9_-]/g, '');
  return `${configKey}-${cleanTestName}-${suffix}`;
};

export const generateUid = (configKey: string, testName: string): string => {
  const cleanTestName = testName.toLowerCase()
    .replaceAll("/", "_")
    .replaceAll(".", "-")
    .replace(/[^a-z0-9_-]/g, '');
  return `${configKey}-${cleanTestName}`;
};

// Path construction utilities
export const getReportDir = (runtime: string): string => {
  return `testeranto/reports/${runtime}`;
};

export const getFullReportDir = (cwd: string, runtime: string): string => {
  return `${cwd}/testeranto/reports/${runtime}`;
};

export const getLogFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.log`;
};

export const getExitCodeFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.exitcode`;
};

export const getContainerExitCodeFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.exitcode`;
};

export const getStatusFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/${runtime}/${serviceName}.container.status`;
};

// Docker command templates
export const DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
export const DOCKER_COMPOSE_UP = `${DOCKER_COMPOSE_BASE} up -d`;
export const DOCKER_COMPOSE_DOWN = `${DOCKER_COMPOSE_BASE} down -v --remove-orphans`;
export const DOCKER_COMPOSE_PS = `${DOCKER_COMPOSE_BASE} ps`;
export const DOCKER_COMPOSE_LOGS = `${DOCKER_COMPOSE_BASE} logs --no-color`;
export const DOCKER_COMPOSE_BUILD = `${DOCKER_COMPOSE_BASE} build`;
export const DOCKER_COMPOSE_START = `${DOCKER_COMPOSE_BASE} start`;
export const DOCKER_COMPOSE_CONFIG = `${DOCKER_COMPOSE_BASE} config --services`;

// Runtime label mapping
export const RUNTIME_LABELS: Record<string, string> = {
  'node': 'Node',
  'web': 'Web',
  'python': 'Python',
  'golang': 'Golang',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'java': 'Java'
};

export const getRuntimeLabel = (runtime: string): string => {
  return RUNTIME_LABELS[runtime] || runtime.charAt(0).toUpperCase() + runtime.slice(1);
};

// Service name patterns
export const SERVICE_SUFFIXES = {
  BUILDER: 'builder',
  BDD: 'bdd',
  AIDER: 'aider',
  CHECK: 'check'
};

export const getBuilderServiceName = (runtime: string): string => {
  return `${runtime}-${SERVICE_SUFFIXES.BUILDER}`;
};

export const getBddServiceName = (uid: string): string => {
  return `${uid}-${SERVICE_SUFFIXES.BDD}`;
};

export const getAiderServiceName = (uid: string): string => {
  return `${uid}-${SERVICE_SUFFIXES.AIDER}`;
};

export const getCheckServiceName = (uid: string, index: number): string => {
  return `${uid}-${SERVICE_SUFFIXES.CHECK}-${index}`;
};

export const INPUT_FILE_PATTERNS: Record<string, (testName: string) => string> = {
  'node': (testName: string) =>
    `testeranto/bundles/node/${testName.split('.').slice(0, -1).concat('mjs').join('.')}-inputFiles.json`,
  'ruby': () =>
    `testeranto/bundles/ruby/Calculator.test.rb-inputFiles.json`,
  'web': (testName: string) =>
    `testeranto/bundles/web/${testName.split('.').slice(0, -1).concat('mjs').join('.')}-inputFiles.json`,
  'python': (testName) =>
    `testeranto/bundles/python/${testName}-inputFiles.json`,
  'rust': (testName) =>
    `testeranto/bundles/rust/${testName}-inputFiles.json`,
  'java': (testName) =>
    `testeranto/bundles/java/${testName}-inputFiles.json`,
  'golang': (testName) =>
    `testeranto/bundles/golang/${testName}-inputFiles.json`,
};

export const getInputFilePath = (runtime: string, testName: string): string => {
  const pattern = INPUT_FILE_PATTERNS[runtime];
  if (!pattern) {
    throw new Error(`Input file pattern not defined for runtime: ${runtime}`);
  }
  return pattern(testName);
};

// Common volume mounts
export const COMMON_VOLUMES = [
  `${process.cwd()}/src:/workspace/src`,
  `${process.cwd()}/dist:/workspace/dist`,
  `${process.cwd()}/testeranto:/workspace/testeranto`,
];

// Network configuration
export const NETWORK_CONFIG = {
  networks: ["allTests_network"]
};

// Container status helpers
export const isContainerActive = (state: string): boolean => {
  return state === 'running';
};

// Log message templates
export const LOG_PREFIX = '[Server_Docker]';
export const logMessage = (message: string): string => {
  return `${LOG_PREFIX} ${message}`;
};

// Container inspection helpers
export const getContainerInspectFormat = (): string => {
  return '{{.State.ExitCode}}|{{.State.StartedAt}}|{{.State.FinishedAt}}|{{.State.Status}}';
};

// Test name cleaning
export const cleanTestName = (testName: string): string => {
  return testName.toLowerCase()
    .replaceAll("/", "_")
    .replaceAll(".", "-")
    .replace(/[^a-z0-9_-]/g, '');
};

// Service type detection
export const getServiceType = (serviceName: string): string => {
  if (serviceName.includes('-aider')) return 'aider';
  if (serviceName.includes('-bdd')) return 'bdd';
  if (serviceName.includes('-check-')) return 'check';
  if (serviceName.includes('-builder')) return 'builder';
  return 'unknown';
};

export const writeConfigForExtensionOnStop = () => {
  try {
    const configDir = path.join(process.cwd(), 'testeranto');
    const configPath = path.join(configDir, 'extension-config.json');

    // Ensure the directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`[Server_Docker] Created directory: ${configDir}`);
    }

    const configData = {
      runtimes: [],
      timestamp: new Date().toISOString(),
      source: 'testeranto.ts',
      serverStarted: false
    };

    const configJson = JSON.stringify(configData, null, 2);
    fs.writeFileSync(configPath, configJson);
    console.log(`[Server_Docker] Updated extension config to indicate server stopped`);

  } catch (error: any) {
    console.error(`[Server_Docker] Failed to write extension config on stop:`, error);
  }
}

export const writeComposeFile = (
  services: Record<string, IService>,
) => {
  const dockerComposeFileContents = BaseCompose(services);

  fs.writeFileSync(
    'testeranto/docker-compose.yml',
    yaml.dump(dockerComposeFileContents, {
      lineWidth: -1,
      noRefs: true,
    })
  );
}

// Base compose configuration
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

// Static test docker compose file generator
export const staticTestDockerComposeFile = (
  runtime: string,
  container_name: string,
  command: string,
  config: any,
  runtimeTestsName: string
) => {
  return {
    build: {
      context: process.cwd(),
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


// BDD test docker compose file generator
export const bddTestDockerComposeFile = (
  configs: ITestconfigV2,
  runtime: string,
  container_name: string,
  command: string
) => {
  // Find the dockerfile path from configs
  let dockerfilePath = '';
  for (const [key, value] of Object.entries(configs.runtimes)) {
    if (value.runtime === runtime) {
      dockerfilePath = value.dockerfile;
      break;
    }
  }

  // If no dockerfile found, use a default based on runtime
  if (!dockerfilePath) {
    throw (`[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(configs)}`)
  }

  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile: dockerfilePath,
    },
    container_name,
    environment: {
      // NODE_ENV: "production",
      // ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: command,
    networks: ["allTests_network"],
  };

  return service;
};

// Aider docker compose file generator
export const aiderDockerComposeFile = (container_name: string) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: 'aider.Dockerfile',
    },
    container_name,
    environment: {
      // NODE_ENV: "production",
      // ...config.env,
    },
    volumes: [
      `${process.cwd()}/.aider.conf.yml:/workspace/.aider.conf.yml`,
      // Mount the entire workspace to allow aider to access files
      `${process.cwd()}:/workspace`,
    ],
    working_dir: "/workspace",
    command: "tail -f /dev/null",  // Keep container running
    networks: ["allTests_network"],
    tty: true,           // Allocate a pseudo-TTY
    stdin_open: true,    // Keep STDIN open even if not attached
  };
};

// Generic Docker Compose command execution helper
export interface IDockerComposeResult {
  exitCode: number;
  out: string;
  err: string;
  data: any;
}

export const executeDockerComposeCommand = async (
  command: string,
  options?: {
    useExec?: boolean;
    execOptions?: { cwd: string };
    errorMessage?: string;
  }
): Promise<IDockerComposeResult> => {
  const useExec = options?.useExec ?? false;
  const execOptions = options?.execOptions ?? { cwd: process.cwd() };
  const errorMessage = options?.errorMessage ?? 'Error executing docker compose command';

  try {
    if (useExec) {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync(command, execOptions);
      return {
        exitCode: 0,
        out: stdout,
        err: stderr,
        data: null,
      };
    } else {
      // For spawn-based commands, we need to handle them differently
      // Since spawnPromise is in Server_Docker.ts, we'll return a special result
      // and let the caller handle it
      return {
        exitCode: 0,
        out: '',
        err: '',
        data: { command, spawn: true },
      };
    }
  } catch (error: any) {
    console.error(`[Docker] ${errorMessage}: ${error.message}`);
    return {
      exitCode: 1,
      out: '',
      err: `${errorMessage}: ${error.message}`,
      data: null,
    };
  }
};

// Predefined command templates for common operations
export const DC_COMMANDS = {
  up: DOCKER_COMPOSE_UP,
  down: DOCKER_COMPOSE_DOWN,
  ps: DOCKER_COMPOSE_PS,
  logs: (serviceName?: string, tail: number = 100) => {
    const base = `${DOCKER_COMPOSE_LOGS} --tail=${tail}`;
    return serviceName ? `${base} ${serviceName}` : base;
  },
  config: DOCKER_COMPOSE_CONFIG,
  build: DOCKER_COMPOSE_BUILD,
  start: DOCKER_COMPOSE_START,
};
