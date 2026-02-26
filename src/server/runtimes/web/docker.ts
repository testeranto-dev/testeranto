import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

import webContent from "../../../../dist/prebuild/web/web.mjs" with { type: "text" };
import hoistContent from "../../../../dist/prebuild/web/hoist.mjs" with { type: "text" };

// Write the web file to a location that will be mounted in the container
const webScriptPath = join(process.cwd(), "testeranto", "web_runtime.ts");
await Bun.write(webScriptPath, webContent);

const webHoistScriptPath = join(process.cwd(), "testeranto", "web_hoist.ts");
await Bun.write(webHoistScriptPath, hoistContent);

export const webDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  webConfigPath: string,
  testName: string
) => {
  const x = {
    ...dockerComposeFile(
      config,
      container_name,
      projectConfigPath,
      webConfigPath,
      testName,
      webBuildCommand
    ),





    ...{
      expose: ["9223"], // # Internal container - to - container port exposure
      // ports: "9222:9222" // # Mapping for your local machine access
    }



  }

  console.log("wtf", x)
  return x
};

export const webBuildCommand = (projectConfigPath: string, webConfigPath: string, testName: string) => {
  return `sh -c "socat TCP-LISTEN:9223,fork,reuseaddr TCP:127.0.0.1:9222 & yarn tsx /workspace/testeranto/web_runtime.ts /workspace/${projectConfigPath} /workspace/${webConfigPath} ${testName} "`
}

export const webBddCommand = (fpath: string, webConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/web" });
  // return `node dist/prebuild/server/runtimes/web/hoist.mjs `;
  return `yarn tsx  /workspace/testeranto/web_hoist testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
