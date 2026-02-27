import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

// Import the node runtime file as text
import nodeContent from "../../../../dist/prebuild/node/node.mjs" with { type: "text" };

// Write the node file to a location that will be mounted in the container
const nodeScriptPath = join(process.cwd(), "testeranto", "node_runtime.ts");
await Bun.write(nodeScriptPath, nodeContent);

export const nodeDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string
) => {
  const tests = config.runtimes[testName]?.tests || [];
  return {
    ...dockerComposeFile(
      config,
      container_name,
      projectConfigPath,
      nodeConfigPath,
      testName,
      nodeBuildCommand,
      tests
    ),

    environment: { ENV: "node" },

  }
};

export const nodeBuildCommand = (projectConfigPath: string, nodeConfigPath: string, testName: string, tests: string[]) => {
  // Node runtime doesn't need tests as arguments, but we keep the signature consistent
  return `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/${projectConfigPath} /workspace/${nodeConfigPath} ${testName}`
}

export const nodeBddCommand = (fpath: string, nodeConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/node" });
  return `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
