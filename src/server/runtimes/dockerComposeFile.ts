import type { ITestconfigV2 } from "../../Types";

export const dockerComposeFile = (
  config: ITestconfigV2,
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
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      // Note: node_modules is NOT mounted to avoid platform incompatibility
    ],
    // command: nodeBuildCommand(projectConfigPath, nodeConfigPath, testName),
    command: command(projectConfigPath, nodeConfigPath, testName, tests)
  }
};
