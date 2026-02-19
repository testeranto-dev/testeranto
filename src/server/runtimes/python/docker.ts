import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

export const pythonDockerComposeFile = (
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
    pythonBuildCommand
  )
};

export const pythonBuildCommand = (fpath: string) => {
  return `python src/server/runtimes/python/pitono.py /workspace/${fpath}`;
}

export const pythonBddCommand = (fpath: string) => {
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `python ${fpath} '${jsonStr}'`;
}
