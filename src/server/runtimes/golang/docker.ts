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
  const tests = config.runtimes[testName]?.tests || [];
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    golangConfigPath,
    testName,
    golangBuildCommand,
    tests
  )
};

export const golangBuildCommand = (projectConfigPath: string, golangConfigPath: string, testName: string, tests: string[]) => {
  return `go run /workspace/testeranto/golang_runtime.go /workspace/${projectConfigPath} /workspace/${golangConfigPath} ${testName} ${tests.join(' ')}`
}

export const golangBddCommand = (fpath: string, golangConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ 
    name: 'go-test',
    ports: [1111], 
    fs: "testeranto/reports/go",
    timeout: 30000,
    retries: 0,
    environment: {}
  });
  
  // For Go, we need to execute the compiled binary
  // The binary is at: testeranto/bundles/${configKey}/${binary_name}
  // where binary_name is the entry point without .go extension and with dots replaced by underscores
  const pathParts = fpath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const binaryName = fileName.replace('.go', '').replace(/\./g, '_');
  
  // Execute the compiled binary in the bundle directory
  return `testeranto/bundles/${configKey}/${binaryName} '${jsonStr}'`;
}
