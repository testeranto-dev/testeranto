import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
import type { IConfigSlice } from "../../types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

import rubyContent from "./ruby.rb" with { type: "text" };
import sourceAnalyzerContent from "./source_analyzer.rb" with { type: "text" };
import nativeDetectionContent from "./native_detection.rb" with { type: "text" };

// Write the Ruby scripts to a location that will be mounted in the container
const rubyScriptPath = join(process.cwd(), "testeranto", "ruby_runtime.rb");
await Bun.write(rubyScriptPath, rubyContent);

const sourceAnalyzerPath = join(process.cwd(), "testeranto", "source_analyzer.rb");
await Bun.write(sourceAnalyzerPath, sourceAnalyzerContent);

const nativeDetectionPath = join(process.cwd(), "testeranto", "native_detection.rb");
await Bun.write(nativeDetectionPath, nativeDetectionContent);

export const rubyDockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  rubyConfigPath: string,
  slice: IConfigSlice
) => {
  // For ruby builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile:
        config.runtimes[container_name]?.dockerfile ||
        "testeranto/runtimes/ruby/ruby.Dockerfile",
    },
    container_name,
    environment: {
      ENV: "ruby",
      MODE: process.env.MODE || "once",
    },
    working_dir: "/workspace",
    volumes: [
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: rubyBuildCommand(
      projectConfigPath,
      rubyConfigPath,
      slice,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const rubyBuildCommand = (
  projectConfigPath: string,
  rubyConfigPath: string,
  slice: IConfigSlice,
) => {
  const configJson = JSON.stringify(slice);
  return `ruby /workspace/testeranto/ruby_runtime.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} '${configJson}'`;
};

export const rubyBddCommand = (
  fpath: string,
  rubyConfigPath: string,
  configKey: string,
) => {
  const jsonStr = JSON.stringify({
    name: "ruby-test",
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
    timeout: 30000,
    retries: 0,
    environment: {},
  });
  return `ruby testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// BuildKit-based building for ruby runtime
export const rubyBuildKitBuild = async (
  config: ITesterantoConfig,
  configKey: string,
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: "ruby",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/usr/local/bundle"],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
    buildArgs: buildKitConfig.buildArgs || {},
  };

  console.log(`[Ruby BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(
      `[Ruby BuildKit] Successfully built image in ${result.duration}ms`,
    );
  } else {
    console.error(`[Ruby BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
