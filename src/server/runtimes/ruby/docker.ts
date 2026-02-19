import { join } from "node:path";

import type { ITestconfigV2 } from "../../../Types";

import rubyContent from "./ruby.rb" with { type: "text" };
import { dockerComposeFile } from "../dockerComposeFile";

// Write the Ruby script to a location that will be mounted in the container
const rubyScriptPath = join(process.cwd(), "testeranto", "extracted_script.rb");
console.log("rubyScriptPath", rubyScriptPath);
await Bun.write(rubyScriptPath, rubyContent);

export const rubyDockerComposeFile = (
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
    rubyBuildCommand
  )
};

export const rubyBuildCommand = (projectConfigPath: string, rubyConfigPath: string, testName: string) => {
  return `ruby /workspace/testeranto/extracted_script.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} ${testName}`
}

export const rubyBddCommand = (fpath: string, nodeConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}

