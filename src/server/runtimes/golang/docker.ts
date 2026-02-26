import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

// Import the golang runtime file as text
import golangContent from "./main.go" with { type: "text" };

// Write the golang file to a location that will be mounted in the container
const golangScriptPath = join(process.cwd(), "testeranto", "golang_runtime.go");
await Bun.write(golangScriptPath, golangContent);

export const golangDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  golangConfigPath: string,
  testName: string
) => {
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    golangConfigPath,
    testName,
    golangBuildCommand
  )
};

export const golangBuildCommand = (projectConfigPath: string, golangConfigPath: string, testName: string) => {
  return `go run /workspace/testeranto/golang_runtime.go /workspace/${projectConfigPath} /workspace/${golangConfigPath} ${testName}`
}

export const golangBddCommand = (fpath: string, golangConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `go run testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
