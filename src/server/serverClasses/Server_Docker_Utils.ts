// Utility functions and constants for Server_Docker
// This file contains repetitive code, constants, and boilerplate extracted from Server_Docker.ts

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
  return `testeranto/reports/allTests/example/${runtime}`;
};

export const getFullReportDir = (cwd: string, runtime: string): string => {
  return `${cwd}/testeranto/reports/allTests/example/${runtime}`;
};

export const getLogFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/allTests/example/${runtime}/${serviceName}.log`;
};

export const getExitCodeFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/allTests/example/${runtime}/${serviceName}.exitcode`;
};

export const getContainerExitCodeFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/allTests/example/${runtime}/${serviceName}.container.exitcode`;
};

export const getStatusFilePath = (cwd: string, runtime: string, serviceName: string): string => {
  return `${cwd}/testeranto/reports/allTests/example/${runtime}/${serviceName}.container.status`;
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

// File path patterns
export const INPUT_FILE_PATTERNS: Record<string, (testName: string) => string> = {
  'node': (testName: string) => 
    `testeranto/bundles/allTests/node/${testName.split('.').slice(0, -1).concat('mjs').join('.')}-inputFiles.json`,
  'ruby': () => 
    `testeranto/bundles/allTests/ruby/example/Calculator.test.rb-inputFiles.json`
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
  `${process.cwd()}/example:/workspace/example`,
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
