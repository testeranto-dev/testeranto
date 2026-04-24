import { join } from "node:path";
import type { ITesterantoConfig } from "../../../Types";
import type { IConfigSlice } from "../../types";
import { BuildKitBuilder } from "../../serverClasses/v3/technological/utils/BuildKit_Utils";

const cargoTomlContent = `[package]
name = "rust_builder"
version = "0.1.0"
edition = "2024"
rust-version = "1.77"

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
ctrlc = "3.4"
md5 = "0.8.0"`;

const rustDir = join(process.cwd(), "testeranto", "rust_builder");
await Bun.$`mkdir -p ${join(rustDir, "src")}`;

await Bun.write(join(rustDir, "Cargo.toml"), cargoTomlContent);

import rustContent from "./main.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "main.rs"), rustContent);

import filCollectorContent from "./file_collector.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "file_collector.rs"), filCollectorContent);

import nativeDetectionContent from "./native_detection.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "native_detection.rs"), nativeDetectionContent);

import output_artifactsContent from "./output_artifacts.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "output_artifacts.rs"), output_artifactsContent);

import permissions_artifactsContent from "./permissions.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "permissions.rs"), permissions_artifactsContent);

import test_processor_artifactsContent from "./test_processor.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "test_processor.rs"), test_processor_artifactsContent);

import wrapperContent from "./wrapper_generator.rs" with { type: "text" };
await Bun.write(join(rustDir, "src", "wrapper_generator.rs"), wrapperContent);

export const rustDockerComposeFile = (
  config: ITesterantoConfig,
  container_name: string,
  projectConfigPath: string,
  rustConfigPath: string,
  slice: IConfigSlice
) => {
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
      slice,
    ),
    networks: ["allTests_network"],
  };

  return service;
};

export const rustBuildCommand = (
  projectConfigPath: string,
  rustConfigPath: string,
  slice: IConfigSlice,
) => {
  const configJson = JSON.stringify(slice);
  return `cargo run --manifest-path /workspace/testeranto/rust_builder/Cargo.toml -- /workspace/${projectConfigPath} /workspace/${rustConfigPath} '${configJson}'`;
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
  config: ITesterantoConfig,
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
