import type { ITesterantoConfig } from "../../../../../Types";
import { nodeDockerComposeFile } from "../../../../runtimes/node/docker";
import { webDockerComposeFile } from "../../../../runtimes/web/docker";

export async function generateRuntimeDockerCompose(
  configs: ITesterantoConfig,
  runtime: string,
  configKey: string,
  testName: string
): Promise<string> {
  switch (runtime) {
    case 'node':
      const nodeService = nodeDockerComposeFile(
        configs,
        `${configKey}-builder`,
        "testeranto/testeranto.ts",
        "testeranto/runtimes/node/node.mjs",
        { name: configKey, tests: [], outputs: [] }
      );
      return JSON.stringify(nodeService, null, 2);
    case 'web':
      const webService = webDockerComposeFile(
        configs,
        `${configKey}-builder`,
        "testeranto/testeranto.ts",
        "testeranto/runtimes/web/web.ts",
        { name: configKey, tests: [], outputs: [] }
      );
      return JSON.stringify(webService, null, 2);
    default:
      throw new Error(`Unsupported runtime for Docker Compose: ${runtime}`);
  }
}
