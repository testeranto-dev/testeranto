import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

export const webDockerComposeFile = (
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
    webBuildCommand
  )
};

export const webBuildCommand = (fpath: string) => {
  // return `yarn tsx src/server/runtimes/web/web.ts /workspace/${fpath}`;
  return `yarn tsx src/server/runtimes/web/web.ts /workspace/${fpath}`;
}

export const webBddCommand = (fpath: string) => {
  // return `node ${fpath} /workspace/web.js `;x
  return `node dist/prebuild/server/runtimes/web/hoist.mjs `;
}
