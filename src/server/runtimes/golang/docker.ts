import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
import type { IConfigSlice } from "../../types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the golang runtime file as text
import golangContent from "./main.go" with { type: "text" };
// Import the native detection module
import nativeDetectionContent from "./native_detection.go" with { type: "text" };

// Write the golang file to a location that will be mounted in the container
const golangScriptPath = join(process.cwd(), "testeranto", "golang_runtime.go");
await Bun.write(golangScriptPath, golangContent);

// Write the native detection module
const nativeDetectionPath = join(process.cwd(), "testeranto", "runtimes", "golang", "native_detection.go");
await Bun.write(nativeDetectionPath, nativeDetectionContent);

export const golangDockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  golangConfigPath: string,
  slice: IConfigSlice
) => {
  // const tests = config.runtimes[testName]?.tests || [];
  // const outputs = config.runtimes[testName]?.outputs || [];

  // For golang builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || 'testeranto/runtimes/golang/golang.Dockerfile',
    },
    container_name,
    environment: {
      ENV: "golang",
      MODE: process.env.MODE || 'once',
    },
    working_dir: "/workspace",
    volumes: [
      ...config.volumes,
      // `${process.cwd()}/src:/workspace/src`,
      // `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: golangBuildCommand(projectConfigPath, golangConfigPath, slice),
    networks: ["allTests_network"],
  };

  return service;
};

export const golangBuildCommand = (
  projectConfigPath: string,
  golangConfigPath: string,
  slice: IConfigSlice
) => {
  const configJson = JSON.stringify(slice);
  return `go run /workspace/testeranto/golang_runtime.go /workspace/${projectConfigPath} /workspace/${golangConfigPath} '${configJson}'`
}

export const golangBddCommand = (fpath: string, golangConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({
    name: 'go-test',
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
    timeout: 30000,
    retries: 0,
    environment: {}
  });

  // For Go, we need to execute the compiled binary
  // The binary is at: testeranto/bundles/${configKey}/${binary_name}
  // where binary_name is the entry point without .go extension and with dots replaced by underscores
  const pathParts = fpath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace('.go', '').replace(/\./g, '_');

  // Execute the compiled binary in the bundle directory
  // The binary is at /workspace/testeranto/bundles/${configKey}/${binaryName}
  // The container's working directory is /workspace
  return `./testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
}

// BuildKit-based building for golang runtime
export const golangBuildKitBuild = async (
  config: ITesterantoConfig,
  configKey: string
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: 'golang',
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ['/go/pkg/mod', '/root/.cache/go-build'],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
    buildArgs: buildKitConfig.buildArgs || {}
  };

  console.log(`[Golang BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(`[Golang BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Golang BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
