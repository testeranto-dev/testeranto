import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

import webContent from "../../../../dist/prebuild/web/web.mjs" with { type: "text" };

// Write the web file to a location that will be mounted in the container
const webScriptPath = join(process.cwd(), "testeranto", "web_runtime.ts");
await Bun.write(webScriptPath, webContent);

export const webDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  webConfigPath: string,
  testName: string
) => {
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    webConfigPath,
    testName,
    webBuildCommand
  )
};

export const webBuildCommand = (projectConfigPath: string, webConfigPath: string, testName: string) => {
  return `yarn tsx /workspace/testeranto/web_runtime.ts /workspace/${projectConfigPath} /workspace/${webConfigPath} ${testName}`
}

export const webBddCommand = (fpath: string, webConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `node dist/prebuild/server/runtimes/web/hoist.mjs `;
}
