import { join } from "node:path";

import type { ITestconfigV2 } from "../../../Types";

import rubyContent from "./ruby.rb" with { type: "text" };
import { dockerComposeFile } from "../dockerComposeFile";

// Write the Ruby script to a location that will be mounted in the container
const rubyScriptPath = join(process.cwd(), "testeranto", "ruby_runtime.rb");

await Bun.write(rubyScriptPath, rubyContent);

export const rubyDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string
) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    nodeConfigPath,
    testName,
    rubyBuildCommand,
    tests
  )
};

export const rubyBuildCommand = (projectConfigPath: string, rubyConfigPath: string, testName: string, tests: string[]) => {
  return `ruby /workspace/testeranto/ruby_runtime.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} ${testName} ${tests.join(' ')}`
}

export const rubyBddCommand = (fpath: string, nodeConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ 
    name: 'ruby-test',
    ports: [1111], 
    fs: "testeranto/reports/ruby",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  return `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}

