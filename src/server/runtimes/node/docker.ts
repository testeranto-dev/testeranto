import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the node runtime file as text
import nodeContent from "../../../../dist/prebuild/node/node.mjs" with { type: "text" };

// Write the node file to a location that will be mounted in the container
const nodeScriptPath = join(process.cwd(), "testeranto", "node_runtime.ts");
await Bun.write(nodeScriptPath, nodeContent);

export const nodeDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string,
) => {
  const tests = config.runtimes[testName]?.tests || [];

  // For node builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile:
        config.runtimes[container_name]?.dockerfile ||
        "testeranto/runtimes/node/node.Dockerfile",
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ENV: "node",
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      // Note: node_modules is NOT mounted to avoid platform incompatibility
    ],
    command: nodeBuildCommand(
      projectConfigPath,
      nodeConfigPath,
      testName,
      tests,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const nodeBuildCommand = (
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string,
  tests: string[],
) => {
  // The MODE environment variable should be set in the container environment
  // We'll use the value from the environment, defaulting to 'once'
  const entryPointsArg = tests.map(t => t.replace(/^\.\//, '')).join(' ');
  return `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/${projectConfigPath} /workspace/${nodeConfigPath} ${testName} ${entryPointsArg}`;
};

export const nodeBddCommand = (
  fpath: string,
  nodeConfigPath: string,
  configKey: string,
) => {
  // fpath has .mjs extension (the bundled file), but we need to use the original test file path
  // for the directory structure. The original test file has .ts extension.
  // Convert .mjs back to .ts for the fs path to match the directory we created.
  const originalPath = fpath.replace(/\.mjs$/, '.ts');
  
  const jsonStr = JSON.stringify({
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${originalPath}/`,
  });
  return `yarn tsx testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// BuildKit-based building
export const nodeBuildKitBuild = async (
  config: ITestconfigV2,
  configKey: string,
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: "node",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: ["/root/.npm", "/usr/local/share/.cache/yarn"],
    targetStage: buildKitConfig.targetStage, // Don't default to 'runtime'
    buildArgs: {
      NODE_ENV: "production",
      ...(buildKitConfig.buildArgs || {}),
    },
  };

  console.log(`[Node BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(
      `[Node BuildKit] Successfully built image in ${result.duration}ms`,
    );
  } else {
    console.error(`[Node BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};

