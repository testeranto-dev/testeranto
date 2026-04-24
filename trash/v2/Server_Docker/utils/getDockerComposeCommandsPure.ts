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