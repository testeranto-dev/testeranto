import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

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
  return `yarn tsx node_modules/testeranto/src/server/runtimes/node/node.ts /workspace/testeranto/testeranto.ts /workspace/${nodeConfigPath} ${testName}`;
}

export const nodeBddCommand = (fpath: string, nodeConfigPath: string, configKey: string) => {
  return `yarn tsx testeranto/${configKey}/${fpath} /workspace/${nodeConfigPath}`;
}
