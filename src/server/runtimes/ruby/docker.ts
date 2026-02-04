import type { ITestconfigV2 } from "../../../Types";

import { join } from "node:path";
import { tmpdir } from "node:os";

// 1. Get the path as Bun resolved it
import rubyImportPath from "./ruby.rb" with { type: "file" };

// 2. Resolve it to an ABSOLUTE path so Bun.file doesn't get lost
// rubyImportPath is often just the filename; join it with the script's directory
const absoluteRubySrc = join(import.meta.dir, rubyImportPath);

const embeddedFile = Bun.file(absoluteRubySrc);
const tempRubyPath = join(tmpdir(), `ruby-${Date.now()}.rb`);

// Now Bun.file has a full path to look at
await Bun.write(tempRubyPath, embeddedFile);

console.log("[Server] Ruby builder", tempRubyPath, embeddedFile)

export const rubyBuildCommand = (projectConfigPath: string, rubyConfigPath: string, testName: string) => {
  return `ruby ${tempRubyPath} /workspace/${rubyConfigPath} ${testName}`;
}


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
      `${process.cwd()}/example:/workspace/example`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/../../testeranto:/workspace/testeranto`,
    ],
    command: rubyBuildCommand(projectConfigPath, rubyConfigPath, testName),
  }
};


export const rubyBddCommand = (fpath: string) => {

  // return `bundle exec rubeno /workspace/testeranto/testeranto.ts /workspace/${rubyConfigPath} ${testName}`;

  // const jsonStr = JSON.stringify({ ports: [1111] });
  // return `ruby example/Calculator-test.rb '${jsonStr}'`;
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `ruby ${fpath} '${jsonStr}'`;
}
