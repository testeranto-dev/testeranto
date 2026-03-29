import type { ITestconfigV2 } from "../../../../Types";
import { processCwd } from "../Server_Docker_Dependents";

export const bddTestDockerComposeFile = (
  configs: ITestconfigV2,
  runtime: string,
  container_name: string,
  command: string,
) => {
  let dockerfilePath = "";
  for (const [key, value] of Object.entries(configs.runtimes)) {
    if (value.runtime === runtime) {
      dockerfilePath = value.dockerfile;
      break;
    }
  }

  if (!dockerfilePath) {
    throw `[Docker] [bddTestDockerComposeFile] no dockerfile found for ${dockerfilePath}, ${Object.entries(configs)}`;
  }

  const service: Record<string, any> = {
    build: {
      context: processCwd(),
      dockerfile: dockerfilePath,
    },
    container_name,
    environment: {
      // NODE_ENV: "production",
      // ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      ...configs.volumes,
      // `${processCwd()}/src:/workspace/src`,
      // `${processCwd()}/dist:/workspace/dist`,
      `${processCwd()}/testeranto:/workspace/testeranto`,
    ],
    command: command,
    networks: ["allTests_network"],
  };

  // Add ESBUILD_HOST environment variable for web runtime
  if (runtime === "web") {
    service.environment.ESBUILD_HOST = "webtests";
  }

  return service;
};
