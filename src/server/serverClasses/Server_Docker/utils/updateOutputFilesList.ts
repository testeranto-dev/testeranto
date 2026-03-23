import {
  existsSync,
  readdirSync,
  consoleLog,
  join,
  relative,
  sep,
} from "../Server_Docker_Dependents";

export const updateOutputFilesList = (
  outputFiles: Record<string, Record<string, string[]>>,
  configKey: string,
  testName: string,
  outputDir: string,
  projectRoot: string,
): Record<string, Record<string, string[]>> => {
  // Check if the output directory exists
  if (!existsSync(outputDir)) {
    consoleLog(`[Server_Docker] Output directory does not exist: ${outputDir}`);
    // Create a new object to avoid mutating the input
    const newOutputFiles = { ...outputFiles };
    if (!newOutputFiles[configKey]) {
      newOutputFiles[configKey] = {};
    }
    newOutputFiles[configKey][testName] = [];
    return newOutputFiles;
  }

  const files = readdirSync(outputDir);

  const testFiles = files.filter(
    (file) =>
      file.includes(testName.replace("/", "_").replace(".", "-")) ||
      file.includes(
        `${configKey}-${testName.toLowerCase().replaceAll("/", "_").replaceAll(".", "-")}`,
      ),
  );

  const relativePaths = testFiles.map((file) => {
    const absolutePath = join(outputDir, file);
    let relativePath = relative(projectRoot, absolutePath);
    relativePath = relativePath.split(sep).join("/");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  });

  // Create a new object to avoid mutating the input
  const newOutputFiles = { ...outputFiles };
  if (!newOutputFiles[configKey]) {
    newOutputFiles[configKey] = {};
  }
  newOutputFiles[configKey][testName] = relativePaths;

  return newOutputFiles;
};
