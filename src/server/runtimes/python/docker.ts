import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
import { BuildKitBuilder } from "../../serverClasses/v3/technological/utils/BuildKit_Utils";

// Import the python runtime file as text
import pythonContent from "./python.py" with { type: "text" };
// Import the native detection module
import nativeDetectionContent from "./native_detection.py" with { type: "text" };
import type { IConfigSlice } from "../../types";

// Write the python file to a location that will be mounted in the container
const pythonScriptPath = join(process.cwd(), "testeranto", "python_runtime.py");
await Bun.write(pythonScriptPath, pythonContent);

// Write the native detection module
const nativeDetectionPath = join(process.cwd(), "testeranto", "runtimes", "python", "native_detection.py");
await Bun.write(nativeDetectionPath, nativeDetectionContent);

export const pythonDockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  pythonConfigPath: string,
  slice: IConfigSlice
) => {
  // const tests = config.runtimes[testName]?.tests || [];
  // const outputs = config.runtimes[testName]?.outputs || [];

  // For python builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile:
        config.runtimes[container_name]?.dockerfile ||
        "testeranto/runtimes/python/python.Dockerfile",
    },
    container_name,
    environment: {
      ENV: "python",
      MODE: process.env.MODE || "once",
    },
    working_dir: "/workspace",
    volumes: [
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: pythonBuildCommand(
      projectConfigPath,
      pythonConfigPath,
      slice
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const pythonBuildCommand = (
  projectConfigPath: string,
  pythonConfigPath: string,
  slice: IConfigSlice,
) => {
  const configJson = JSON.stringify(slice);
  return `python /workspace/testeranto/python_runtime.py /workspace/${projectConfigPath} /workspace/${pythonConfigPath}  '${configJson}'`;
};

export const pythonBddCommand = (
  fpath: string,
  pythonConfigPath: string,
  configKey: string,
) => {
  const jsonStr = JSON.stringify({
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
  });
  return `python testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// BuildKit-based building for python runtime
export const pythonBuildKitBuild = async (
  config: ITesterantoConfig,
  configKey: string,
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: "python",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ["/root/.cache/pip"],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
    buildArgs: buildKitConfig.buildArgs || {},
  };

  console.log(`[Python BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(
      `[Python BuildKit] Successfully built image in ${result.duration}ms`,
    );
  } else {
    console.error(`[Python BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
