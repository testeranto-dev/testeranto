import type { ITesterantoConfig } from "../../Types";

export const dockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string,
  command: (a: string, b: string, c: string, d: string[]) => string,
  tests: string[]
) => {
  return {
    // expose: ["9222"],
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name].dockerfile,
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      // ENV: "node",  // <- important
      ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    // command: nodeBuildCommand(projectConfigPath, nodeConfigPath, testName),
    command: command(projectConfigPath, nodeConfigPath, testName, tests)
  }
};
