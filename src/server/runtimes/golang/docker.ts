import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

export const golangDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string
) => {
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    nodeConfigPath,
    testName,
    golangBuildCommand
  )
};

export const golangBuildCommand = () => {
  return "go run src/server/runtimes/golang/main.go";
  // return `go run src/server/runtimes/golang/golang.go /workspace/testeranto/runtimes/golang/golang.go`;
}

// this image "builds" test bundles. it is not a "docker build" thing
export const golangBddCommand = () => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `go run example/cmd/calculator-test`
}

// export const golangTestCommand = (config: IBuiltConfig, inputfiles: string[]) => {
//   return `
// ${config.golang.checks?.map((c) => {
//     return c(inputfiles);
//   }).join('\n') || ''}

//     ${golangBddCommand()}
//   `;
// }
