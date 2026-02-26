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
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    nodeConfigPath,
    testName,
    nodeBuildCommand
  )
};

export const nodeBuildCommand = (projectConfigPath: string, nodeConfigPath: string, testName: string) => {
  return `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/${projectConfigPath} /workspace/${nodeConfigPath} ${testName}`
}

export const nodeBddCommand = (fpath: string, nodeConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/node" });
  return `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
