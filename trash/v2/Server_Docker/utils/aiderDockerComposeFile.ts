import type { ITesterantoConfig } from "../../../../src/server/Types";
import { processCwd } from "../Server_Docker_Dependents";

export const aiderDockerComposeFile = (container_name: string, config: ITesterantoConfig) => {
  return {
    image: "testeranto-aider:latest",
    container_name,
    environment: {
      NODE_ENV: "production",
    },
    volumes: [
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      // Mount the aider config file
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
