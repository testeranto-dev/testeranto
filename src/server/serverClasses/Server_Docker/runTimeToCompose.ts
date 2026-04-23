import type { IRunTime, ITesterantoConfig } from "../../../Types";
import { golangBddCommand, golangBuildCommand, golangDockerComposeFile } from "../../runtimes/golang/docker";
import { javaBddCommand, javaBuildCommand, javaDockerComposeFile } from "../../runtimes/java/docker";
import { nodeBddCommand, nodeBuildCommand, nodeDockerComposeFile } from "../../runtimes/node/docker";
import { pythonBddCommand, pythonBuildCommand, pythonDockerComposeFile } from "../../runtimes/python/docker";
import { rubyBddCommand, rubyBuildCommand, rubyDockerComposeFile } from "../../runtimes/ruby/docker";
import { rustBddCommand, rustBuildCommand, rustDockerComposeFile } from "../../runtimes/rust/docker";
import { webBddCommand, webBuildCommand, webDockerComposeFile } from "../../runtimes/web/docker";
import type { IConfigSlice } from "../../types";

export const runTimeToCompose: Record<
  IRunTime,
  [
    (
      config: ITesterantoConfig,
      container_name: string,
      projectConfigPath: string,
      nodeConfigPath: string,
      slice: IConfigSlice
    ) => object,
    (
      projectConfig: string,
      nodeConfigPath: string,
      slice: IConfigSlice
    ) => string,
    (fpath: string, nodeConfigPath: string, configKey: string) => string,
  ]
> = {
  node: [nodeDockerComposeFile, nodeBuildCommand, nodeBddCommand],
  web: [webDockerComposeFile, webBuildCommand, webBddCommand],
  python: [pythonDockerComposeFile, pythonBuildCommand, pythonBddCommand],
  golang: [golangDockerComposeFile, golangBuildCommand, golangBddCommand],
  ruby: [rubyDockerComposeFile, rubyBuildCommand, rubyBddCommand],
  rust: [rustDockerComposeFile, rustBuildCommand, rustBddCommand],
  java: [javaDockerComposeFile, javaBuildCommand, javaBddCommand],
};
