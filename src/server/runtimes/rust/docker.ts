import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

// Import the rust runtime file as text
import rustContent from "./main.rs" with { type: "text" };

// Write the rust file to a location that will be mounted in the container
const rustScriptPath = join(process.cwd(), "testeranto", "rust_runtime.rs");
await Bun.write(rustScriptPath, rustContent);

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
  return `cargo run /workspace/testeranto/rust_runtime.rs /workspace/${projectConfigPath} /workspace/${rustConfigPath} ${testName} ${tests.join(' ')}`
}

export const rustBddCommand = (fpath: string, rustConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/rusttests" });
  return `cargo run testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
