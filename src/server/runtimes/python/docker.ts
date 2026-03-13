import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the python runtime file as text
import pythonContent from "./python.py" with { type: "text" };

// Write the python file to a location that will be mounted in the container
const pythonScriptPath = join(process.cwd(), "testeranto", "python_runtime.py");
await Bun.write(pythonScriptPath, pythonContent);

export const pythonDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  pythonConfigPath: string,
  testName: string
) => {
  const tests = config.runtimes[testName]?.tests || [];
  
  // For python builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile: config.runtimes[container_name]?.dockerfile || 'testeranto/runtimes/python/python.Dockerfile',
    },
    container_name,
    environment: {
      ENV: "python",
      MODE: process.env.MODE || 'once',
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: pythonBuildCommand(projectConfigPath, pythonConfigPath, testName, tests),
    networks: ["allTests_network"],
  };
  
  return service;
};

export const pythonBuildCommand = (projectConfigPath: string, pythonConfigPath: string, testName: string, tests: string[]) => {
  // MODE is now passed via environment in the service configuration
  return `python /workspace/testeranto/python_runtime.py /workspace/${projectConfigPath} /workspace/${pythonConfigPath} ${testName}  ${tests.join(' ')} `
}

export const pythonBddCommand = (fpath: string, pythonConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/pythontests" });
  return `python testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}

// BuildKit-based building for python runtime
export const pythonBuildKitBuild = async (
  config: ITestconfigV2,
  configKey: string
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];
  
  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }
  
  const buildKitConfig = runtimeConfig.buildKitOptions || {};
  
  const buildKitOptions = {
    runtime: 'python',
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || ['/root/.cache/pip'],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
    buildArgs: buildKitConfig.buildArgs || {}
  };
  
  console.log(`[Python BuildKit] Building image for ${configKey}...`);
  
  const result = await BuildKitBuilder.buildImage(buildKitOptions);
  
  if (result.success) {
    console.log(`[Python BuildKit] Successfully built image in ${result.duration}ms`);
  } else {
    console.error(`[Python BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
