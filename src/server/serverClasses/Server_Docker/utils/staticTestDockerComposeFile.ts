import { processCwd } from "../Server_Docker_Dependents";

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
