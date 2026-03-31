// Server_Docker_Constants: this file contains constants, types, string interpolations and very simple functions
// This file should not contain anything that needs to be tested

import type { IRunTime, ITesterantoConfig } from "../../../Types";
import {
  golangBddCommand,
  golangBuildCommand,
  golangDockerComposeFile,
} from "../../runtimes/golang/docker";
import {
  javaBddCommand,
  javaBuildCommand,
  javaDockerComposeFile,
} from "../../runtimes/java/docker";
import {
  nodeBddCommand,
  nodeBuildCommand,
  nodeDockerComposeFile,
} from "../../runtimes/node/docker";
import {
  pythonBddCommand,
  pythonBuildCommand,
  pythonDockerComposeFile,
} from "../../runtimes/python/docker";
import {
  rubyBddCommand,
  rubyBuildCommand,
  rubyDockerComposeFile,
} from "../../runtimes/ruby/docker";
import {
  rustBddCommand,
  rustBuildCommand,
  rustDockerComposeFile,
} from "../../runtimes/rust/docker";
import {
  webBddCommand,
  webBuildCommand,
  webDockerComposeFile,
} from "../../runtimes/web/docker";

export const getReportDirPure = (): string => {
  return `testeranto/reports`;
};

export const getDockerComposeDownPure = (): string => {
  return 'docker compose -f "testeranto/docker-compose.yml" down -v --remove-orphans';
};


export const SERVICE_SUFFIXES = {
  BUILDER: "builder",
  BDD: "bdd",
  AIDER: "aider",
  CHECK: "check",
} as const;

export const RUNTIME_LABELS: Record<string, string> = {
  node: "Node",
  web: "Web",
  python: "Python",
  golang: "Golang",
  ruby: "Ruby",
  rust: "Rust",
  java: "Java",
};

export const LOG_PREFIX = "[Server_Docker]";

export const DOCKER_COMPOSE_BASE =
  'docker compose -f "testeranto/docker-compose.yml"';
export const DOCKER_COMPOSE_UP = `${DOCKER_COMPOSE_BASE} up -d`;
export const DOCKER_COMPOSE_DOWN = `${DOCKER_COMPOSE_BASE} down -v --remove-orphans`;
export const DOCKER_COMPOSE_PS = `${DOCKER_COMPOSE_BASE} ps`;
export const DOCKER_COMPOSE_LOGS = `${DOCKER_COMPOSE_BASE} logs --no-color`;
export const DOCKER_COMPOSE_BUILD = `${DOCKER_COMPOSE_BASE} build`;
export const DOCKER_COMPOSE_START = `${DOCKER_COMPOSE_BASE} start`;
export const DOCKER_COMPOSE_CONFIG = `${DOCKER_COMPOSE_BASE} config --services`;

// export const COMMON_VOLUMES = [
//   `${process.cwd()}/src:/workspace/src`,
//   `${process.cwd()}/dist:/workspace/dist`,
//   `${process.cwd()}/testeranto:/workspace/testeranto`,
// ];

export const NETWORK_CONFIG = {
  networks: ["allTests_network"],
};

export const WAIT_FOR_TESTS_MAX_ATTEMPTS = 120; // 10 minutes (5 seconds per attempt)
export const WAIT_FOR_TESTS_CHECK_INTERVAL = 5000; // 5 seconds
export const WAIT_FOR_TESTS_INITIAL_DELAY = 10000; // 10 seconds

// Types
export type IService = any;

export interface IDockerComposeResult {
  exitCode: number;
  out: string;
  err: string;
  data: any;
}

// Runtime configuration
export const runTimeToCompose: Record<
  IRunTime,
  [
    (
      config: ITesterantoConfig,
      container_name: string,
      projectConfigPath: string,
      nodeConfigPath: string,
      testName: string,
    ) => object,
    (
      projectConfig: string,
      nodeConfigPath: string,
      testname: string,
      tests: string[],
    ) => string,
    (fpath: string, nodeConfigPath: string, configKey: string) => string,
  ]
> = {
  node: [nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand],
  web: [webDockerComposeFile, webBuildCommand, webBddCommand],
  python: [pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand],
  golang: [golangDockerComposeFile, golangBuildCommand, golangBddCommand],
  ruby: [rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand],
  rust: [rustDockerComposeFile, rustBuildCommand, rustBddCommand],
  java: [javaDockerComposeFile, javaBuildCommand, javaBddCommand],
};

// Docker Compose Commands
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

// Service name generation
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

// File path utilities
export const getInputFilePath = (
  runtime: string,
  configKey: string,
): string => {
  return `testeranto/bundles/${configKey}/inputFiles.json`;
};

export const getLogFilePath = (
  cwd: string,
  runtime: string,
  serviceName: string,
  runtimeConfigKey: string
): string => {
  return `${cwd}/testeranto/reports/${runtimeConfigKey}/${serviceName}.log`;
};

export const getExitCodeFilePath = (
  cwd: string,
  runtimeConfigKey: string,
  testName: string,
): string => {
  return `${cwd}/testeranto/reports/${runtimeConfigKey}/${testName}.exitcode`;
};

export const getContainerExitCodeFilePath = (
  cwd: string,
  runtime: string,
  serviceName: string,
  runtimeConfigKey: string
): string => {
  return `${cwd}/testeranto/reports/${runtimeConfigKey}/${serviceName}.container.exitcode`;
};

export const getStatusFilePath = (
  cwd: string,
  runtime: string,
  serviceName: string,
  runtimeConfigKey: string
): string => {
  return `${cwd}/testeranto/reports/${runtimeConfigKey}/${serviceName}.container.status`;
};

export const getFullReportDir = (cwd: string, runtime: string): string => {
  return `${cwd}/testeranto/reports/${runtime}`;
};

export const getReportDir = (runtime: string): string => {
  return `testeranto/reports/${runtime}`;
};

// String utilities
export const logMessage = (message: string): string => {
  return `${LOG_PREFIX} ${message}`;
};

export const getContainerInspectFormat = (): string => {
  return "{{.State.ExitCode}}|{{.State.StartedAt}}|{{.State.FinishedAt}}|{{.State.Status}}";
};

// Test name utilities
export const cleanTestName = (testName: string): string => {
  return testName
    .toLowerCase()
    .replaceAll("/", "_")
    .replaceAll(".", "-")
    .replace(/[^a-z0-9_-]/g, "");
};

export const generateUid = (configKey: string, testName: string): string => {
  const cleanedName = cleanTestName(testName);
  return `${configKey}-${cleanedName}`;
};

export const generateContainerName = (
  configKey: string,
  testName: string,
  suffix: string,
): string => {
  const cleanedName = cleanTestName(testName);
  return `${configKey}-${cleanedName}-${suffix}`;
};

// Runtime utilities
export const getRuntimeLabel = (runtime: string): string => {
  return (
    RUNTIME_LABELS[runtime] ||
    runtime.charAt(0).toUpperCase() + runtime.slice(1)
  );
};

// Container utilities
export const isContainerActive = (state: string): boolean => {
  return state === "running";
};

export const getServiceType = (serviceName: string): string => {
  if (serviceName.includes("-aider")) return "aider";
  if (serviceName.includes("-bdd")) return "bdd";
  if (serviceName.includes("-check-")) return "check";
  if (serviceName.includes("-builder")) return "builder";
  return "unknown";
};

export const entryContent = (absolutePath: string) => `
import React from 'react';
import ReactDOM from 'react-dom/client';
import CustomStakeholderApp from '${absolutePath}';

export function renderApp(rootElement, data) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <CustomStakeholderApp data={data} />
    </React.StrictMode>
  );
}
        `;

export type IR = (
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName?: string,
) => void;

















// Pure function to wait for all tests to complete


// Note: DOCKER_COMPOSE_BASE needs to be imported or defined
// export const DOCKER_COMPOSE_BASE = 'docker compose -f "testeranto/docker-compose.yml"';
