import { join } from "node:path";
import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

// Import the python runtime file as text
import pythonContent from "./python.py" with { type: "text" };

// Write the python file to a location that will be mounted in the container
const pythonScriptPath = join(process.cwd(), "testeranto", "python_runtime.py");
await Bun.write(pythonScriptPath, pythonContent);

export const pythonDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  pythonConfigPath: string,
  testName: string
) => {
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    pythonConfigPath,
    testName,
    pythonBuildCommand
  )
};

export const pythonBuildCommand = (projectConfigPath: string, pythonConfigPath: string, testName: string, tests: string[]) => {
  return `python /workspace/testeranto/python_runtime.py /workspace/${projectConfigPath} /workspace/${pythonConfigPath} ${testName}  ${tests.join(' ')} `
}

export const pythonBddCommand = (fpath: string, pythonConfigPath: string, configKey: string) => {
  const jsonStr = JSON.stringify({ ports: [1111], fs: "testeranto/reports/pythontests" });
  return `python testeranto/bundles/${configKey}/${fpath} '${jsonStr}'`;
}
