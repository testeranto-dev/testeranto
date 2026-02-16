import { join } from "node:path";

import type { ITestconfigV2 } from "../../../Types";

import rubyContent from "./ruby.rb" with { type: "text" };

// Write the Ruby script to a location that will be mounted in the container
const rubyScriptPath = join(process.cwd(), "testeranto", "extracted_script.rb");
console.log("rubyScriptPath", rubyScriptPath);
await Bun.write(rubyScriptPath, rubyContent);

export const rubyDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  rubyConfigPath: string,
  testName: string
) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: config[container_name].dockerfile,
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      // No need to mount the temp file separately since it's already in testeranto
    ],
    command: rubyBuildCommand(projectConfigPath, rubyConfigPath, testName),
  }
};

export const rubyBuildCommand = (projectConfigPath: string, rubyConfigPath: string, testName: string) => {
  // The Ruby script is now at /workspace/testeranto/extracted_script.rb
  return `ruby /workspace/testeranto/extracted_script.rb /workspace/${rubyConfigPath}`
}

export const rubyBddCommand = (fpath: string) => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `ruby testeranto/bundles/allTests/ruby/example/Calculator.test.rb '${jsonStr}'`;
}

