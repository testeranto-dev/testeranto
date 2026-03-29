import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { BuildKitBuilder } from "../../buildkit/BuildKit_Utils";

// Import the rust runtime file as text
import rustContent from "./main.rs" with { type: "text" };
// Import the native detection module
import nativeDetectionContent from "./native_detection.rs" with { type: "text" };

// Write the rust file and a Cargo.toml to a location that will be mounted in the container
const rustDir = join(process.cwd(), "testeranto", "rust_builder");
const rustScriptPath = join(rustDir, "src", "main.rs");
const cargoTomlPath = join(rustDir, "Cargo.toml");
const nativeDetectionPath = join(rustDir, "src", "native_detection.rs");

// Create directory structure
await Bun.$`mkdir -p ${join(rustDir, "src")}`;

// Write the Rust builder source
await Bun.write(rustScriptPath, rustContent);

// Write the native detection module
await Bun.write(nativeDetectionPath, nativeDetectionContent);

// Write a minimal Cargo.toml for the rust builder
const cargoTomlContent = `[package]
name = "rust_builder"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }`;

await Bun.write(cargoTomlPath, cargoTomlContent);

export const rustDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  rustConfigPath: string,
  testName: string,
) => {
  const tests = config.runtimes[testName]?.tests || [];

  // For rust builder service, we need a proper build configuration
  const service: any = {
    build: {
      context: process.cwd(),
      dockerfile:
        config.runtimes[container_name]?.dockerfile ||
        "testeranto/runtimes/rust/rust.Dockerfile",
    },
    container_name,
    environment: {
      ENV: "rust",
      MODE: process.env.MODE || "once",
    },
    working_dir: "/workspace",
    volumes: [
      ...config.volumes,
      `${process.cwd()}/testeranto:/workspace/testeranto`,
    ],
    command: rustBuildCommand(
      projectConfigPath,
      rustConfigPath,
      testName,
      tests,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const rustBuildCommand = (
  projectConfigPath: string,
  rustConfigPath: string,
  testName: string,
  tests: string[],
) => {
  // MODE is now passed via environment in the service configuration
  return `cargo run --manifest-path /workspace/testeranto/rust_builder/Cargo.toml -- /workspace/${projectConfigPath} /workspace/${rustConfigPath} ${testName} ${tests.join(" ")}`;
};

export const rustBddCommand = (
  fpath: string,
  rustConfigPath: string,
  configKey: string,
) => {
  const jsonStr = JSON.stringify({
    name: "rust-test",
    ports: [1111],
    fs: `testeranto/reports/${configKey}/${fpath}/`,
    timeout: 30000,
    retries: 0,
    environment: {},
  });

  // For Rust, we need to execute the compiled binary
  // The binary name is the entry point with special characters replaced
  // fpath might be something like "src/rust/testeranto/Calculator.rusto.test.rs"
  // We need to create a consistent binary name that matches what the Rust builder creates
  const binaryName = fpath
    .replace(/\//g, "_")
    .replace(/\./g, "_")
    .replace(/-/g, "_")
    // Ensure only alphanumeric and underscores remain
    .replace(/[^a-zA-Z0-9_]/g, "");

  // Execute the compiled binary in the bundle directory
  // Use a direct approach without complex variable handling
  const fullPath = `/workspace/testeranto/bundles/${configKey}/${binaryName}`;
  // Escape single quotes in JSON by replacing them with '"'"'
  const escapedJson = jsonStr.replace(/'/g, "'\"'\"'");
  return `sh -c 'cd /workspace && if [ -f "${fullPath}" ]; then "${fullPath}" '\''${escapedJson}'\''; elif [ -f "${fullPath}.exe" ]; then "${fullPath}.exe" '\''${escapedJson}'\''; else echo "Binary not found: ${fullPath} or ${fullPath}.exe"; ls -la "/workspace/testeranto/bundles/${configKey}/"; exit 1; fi'`;
};

// BuildKit-based building for rust runtime
export const rustBuildKitBuild = async (
  config: ITestconfigV2,
  configKey: string,
): Promise<void> => {
  const runtimeConfig = config.runtimes[configKey];

  if (!runtimeConfig) {
    throw new Error(`Configuration not found for ${configKey}`);
  }

  const buildKitConfig = runtimeConfig.buildKitOptions || {};

  const buildKitOptions = {
    runtime: "rust",
    configKey,
    dockerfilePath: runtimeConfig.dockerfile,
    buildContext: process.cwd(),
    cacheMounts: buildKitConfig.cacheMounts || [
      "/usr/local/cargo/registry",
      "/usr/local/cargo/git",
    ],
    targetStage: buildKitConfig.targetStage, // Keep as is (undefined if not specified)
    buildArgs: buildKitConfig.buildArgs || {},
  };

  console.log(`[Rust BuildKit] Building image for ${configKey}...`);

  const result = await BuildKitBuilder.buildImage(buildKitOptions);

  if (result.success) {
    console.log(
      `[Rust BuildKit] Successfully built image in ${result.duration}ms`,
    );
  } else {
    console.error(`[Rust BuildKit] Build failed: ${result.error}`);
    throw new Error(`BuildKit build failed: ${result.error}`);
  }
};
