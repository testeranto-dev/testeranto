import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

import webContent from "../../../../dist/prebuild/web/web.mjs" with { type: "text" };
import hoistContent from "../../../../dist/prebuild/web/hoist.mjs" with { type: "text" };

// Write the web file to a location that will be mounted in the container
const webScriptPath = join(process.cwd(), "testeranto", "web_runtime.ts");
await Bun.write(webScriptPath, webContent);

const webHoistScriptPath = join(process.cwd(), "testeranto", "web_hoist.ts");
await Bun.write(webHoistScriptPath, hoistContent);

export const webDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  webConfigPath: string,
  testName: string,
) => {
  // For web builder service, we need a proper build configuration
  // Since this is a builder service (not BuildKit), it needs a build field
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile:
        config.runtimes[container_name]?.dockerfile ||
        "testeranto/runtimes/web/web.Dockerfile",
    },
    container_name,
    environment: {
      NODE_ENV: "production",
      ENV: "web",
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
      // Note: node_modules is NOT mounted to avoid platform incompatibility
    ],
    command: webBuildCommand(projectConfigPath, webConfigPath, testName, config.runtimes[testName]?.tests || []),
    networks: ["allTests_network"],
    expose: ["8000"],
    depends_on: ["chrome-service"],
  };

  return service;
};

// Chrome standalone service configuration
export const chromeServiceConfig = () => {
  return {
    image: "chromium/chromium:latest",
    container_name: "chrome-service",
    command: [
      "chromium-browser",
      "--headless",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--remote-debugging-address=0.0.0.0",
      "--remote-debugging-port=9222",
    ].join(" "),
    expose: ["9222"],
    ports: ["9222:9222"],
    networks: ["allTests_network"],
  };
};

export const webBuildCommand = (
  projectConfigPath: string,
  webConfigPath: string,
  testName: string,
  tests: string[],
) => {
  // Pass MODE environment variable to the builder
  const entryPointsArg = tests.map(t => t.replace(/^\.\//, '')).join(' ');
  return `MODE=${process.env.MODE || "once"} yarn tsx /workspace/testeranto/web_runtime.ts /workspace/${projectConfigPath} /workspace/${webConfigPath} ${testName} ${entryPointsArg}`;
};

export const webBddCommand = (
  fpath: string,
  webConfigPath: string,
  configKey: string,
) => {
  const jsonStr = JSON.stringify({
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
  });
  return `yarn tsx /workspace/testeranto/web_hoist.ts testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
};

// BuildKit-based building for web runtime
export const webBuildKitBuild = async (
  config: ITestconfigV2,
  configKey: string,
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: "web",
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

  console.log(`[Web BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(
      `[Web BuildKit] Successfully built image in ${result.duration}ms`,
    );
  } else {
    console.error(`[Web BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
