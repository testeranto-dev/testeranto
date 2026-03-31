import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
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
  testName: string,
) => {
  const tests = config.runtimes[testName]?.tests || [];

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
      testName,
      tests,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const rubyBuildCommand = (
  projectConfigPath: string,
  rubyConfigPath: string,
  testName: string,
  tests: string[],
) => {
  // First run native detection to analyze dependencies and generate bundles
  // Then run the tests
  if (tests.length === 0) {
    return "echo 'No tests specified'";
  }
  
  // Run native detection first to generate inputFiles.json and copy test files to bundles
  const nativeDetectionCmd = `ruby /workspace/testeranto/native_detection.rb /workspace/${projectConfigPath} /workspace/${rubyConfigPath} ${testName} ${tests.join(" ")}`;
  
  // Default configuration for Rubeno tests
  const defaultConfig = JSON.stringify({
    name: testName,
    fs: `/workspace/testeranto/reports/${testName}`,
    ports: [],
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  
  // Build commands for each test file
  const testCmds = tests.map(test => {
    const testPath = `/workspace/${test}`;
    const bundleTestPath = `/workspace/testeranto/bundles/${testName}/${test}`;
    
    // Add bundle directory to LOAD_PATH
    const bundleDir = `/workspace/testeranto/bundles/${testName}`;
    const rubyLoadPath = `RUBYLIB="${bundleDir}:${bundleDir}/src/ruby:$RUBYLIB"`;
    
    if (test.includes('.rspec.test.rb')) {
      // RSpec test - run with rspec command if available, or ruby -r rspec
      return `if command -v rspec >/dev/null 2>&1; then ${rubyLoadPath} rspec "${bundleTestPath}"; else ${rubyLoadPath} ruby -r rspec -e "RSpec::Core::Runner.run(['${bundleTestPath}'])"; fi`;
    } else {
      // Rubeno test - pass the configuration
      return `${rubyLoadPath} ruby "${bundleTestPath}" '${defaultConfig}'`;
    }
  }).join(' && ');
  
  return `${nativeDetectionCmd} && ${testCmds}`;
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
