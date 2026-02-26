import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

// Import the rust runtime file as text
import rustContent from "./main.rs" with { type: "text" };

// Write the rust file and a Cargo.toml to a location that will be mounted in the container
const rustDir = join(process.cwd(), "testeranto", "rust_builder");
const rustScriptPath = join(rustDir, "src", "main.rs");
const cargoTomlPath = join(rustDir, "Cargo.toml");

// Create directory structure
await Bun.$`mkdir -p ${join(rustDir, "src")}`;

// Write the Rust builder source
await Bun.write(rustScriptPath, rustContent);

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
  testName: string
) => {
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    rustConfigPath,
    testName,
    rustBuildCommand,
    tests
  )
};

export const rustBuildCommand = (projectConfigPath: string, rustConfigPath: string, testName: string, tests: string[]) => {
  return `cargo run --manifest-path /workspace/testeranto/rust_builder/Cargo.toml -- /workspace/${projectConfigPath} /workspace/${rustConfigPath} ${testName} ${tests.join(' ')}`
}

export const rustBddCommand = (fpath: string, rustConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ 
    name: 'rust-test',
    ports: [1111], 
    fs: "testeranto/reports/rust",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  
  // For Rust, we need to execute the compiled binary
  // The binary is at: testeranto/bundles/${configKey}/${binary_name}
  // where binary_name is the entry point without .rs extension
  // fpath might be something like "src/tests/my_test.rs"
  // We need to extract the base name and replace dots with underscores
  const pathParts = fpath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace('.rs', '').replace(/\./g, '_');
  
  // Execute the compiled binary in the bundle directory
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
}
