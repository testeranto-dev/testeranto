// Server_Docker_Utils
// this file contains general pure utility functions for Server_Docker
// Setup-related functions are in Server_Docker_Utils_Setup.ts
// Run-related functions are in Server_Docker_Utils_Run.ts

import { DOCKER_COMPOSE_BASE } from "./Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processCwd,
  processExit,
} from "./Server_Docker_Dependents";

export const getReportDirPure = (): string => {
  return `testeranto/reports`;
};

export const getDockerComposeDownPure = (): string => {
  return 'docker compose -f "testeranto/docker-compose.yml" down -v --remove-orphans';
};

export const getDockerComposeCommandsPure = () => {
  const DOCKER_COMPOSE_BASE =
    'docker compose -f "testeranto/docker-compose.yml"';
  return {
    up: `${DOCKER_COMPOSE_BASE} up -d`,
    down: `${DOCKER_COMPOSE_BASE} down -v --remove-orphans`,
    ps: `${DOCKER_COMPOSE_BASE} ps`,
    logs: (serviceName?: string, tail: number = 100) => {
      const base = `${DOCKER_COMPOSE_BASE} logs --no-color --tail=${tail}`;
      return serviceName ? `${base} ${serviceName}` : base;
    },
    config: `${DOCKER_COMPOSE_BASE} config --services`,
    build: `${DOCKER_COMPOSE_BASE} build`,
    start: `${DOCKER_COMPOSE_BASE} start`,
  };
};

// Wrapper functions for globals
export const getCwdPure = (): string => {
  return processCwd();
};

export const exitProcessPure = (code: number): never => {
  return processExit(code);
};

export const logMessagePure = (message: string): void => {
  consoleLog(message);
};

export const logErrorPure = (message: string): void => {
  consoleError(message);
};
