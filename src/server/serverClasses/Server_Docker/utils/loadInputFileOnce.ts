import { getInputFilePath } from "../Server_Docker_Constants";
import { readFileSync } from "../Server_Docker_Dependents";

export const loadInputFileOnce = (
  inputFiles: Record<string, Record<string, string[]>>,
  hashs: Record<string, Record<string, string>>,
  configKey: string,
  testName: string,
  runtime: string,
  configKeyParam: string,
): {
  inputFiles: Record<string, Record<string, string[]>>;
  hashs: Record<string, Record<string, string>>;
} => {
  const inputFilePath: string = getInputFilePath(runtime, configKeyParam);

  const newInputFiles = { ...inputFiles };
  const newHashs = { ...hashs };

  if (!newInputFiles[configKey]) {
    newInputFiles[configKey] = {};
  }

  console.log(`reading input file`, inputFilePath)

  try {
    const fileContent = readFileSync(inputFilePath, "utf-8");
    const allTestsInfo = JSON.parse(fileContent);
    if (allTestsInfo[testName]) {
      const testInfo = allTestsInfo[testName];
      newInputFiles[configKey][testName] = testInfo.files || [];
      if (!newHashs[configKey]) {
        newHashs[configKey] = {};
      }
      newHashs[configKey][testName] = testInfo.hash || "";
    } else {
      newInputFiles[configKey][testName] = [];
      if (!newHashs[configKey]) {
        newHashs[configKey] = {};
      }
      newHashs[configKey][testName] = "";
    }
  } catch (e) {
    console.error(e)
    console.log(inputFilePath, 'was not found. skipping...')
  }


  return { inputFiles: newInputFiles, hashs: newHashs };
};
