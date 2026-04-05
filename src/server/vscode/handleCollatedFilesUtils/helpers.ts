import fs from "fs";
import path from "path";

export const getAllSourceFiles = (
  runtimeKey: string,
  testName: string,
  inputFiles: string[]
): string[] => {
  const inputFilesJsonPath = path.join(
    process.cwd(),
    "testeranto",
    "bundles",
    runtimeKey,
    "inputFiles.json"
  );

  if (!fs.existsSync(inputFilesJsonPath)) {
    return inputFiles;
  }

  try {
    const content = fs.readFileSync(inputFilesJsonPath, "utf-8");
    const inputFilesData = JSON.parse(content);

    for (const [key, value] of Object.entries(inputFilesData)) {
      if (key === testName) {
        const entry = value as any;
        if (entry.files && Array.isArray(entry.files)) {
          return entry.files;
        }
      }
    }

    for (const [key, value] of Object.entries(inputFilesData)) {
      if (key.includes(testName) || testName.includes(key)) {
        const entry = value as any;
        if (entry.files && Array.isArray(entry.files)) {
          return entry.files;
        }
      }
    }
  } catch (error) {
    console.error(`Error reading inputFiles.json:`, error);
  }

  return inputFiles;
};

export const findTestsJsonFile = (
  outputFiles: string[],
  runtimeKey: string,
  testName: string
): string | undefined => {
  const sanitizedTestName = testName
    .replace(/\//g, "_")
    .replace(/\./g, "-");

  let testsJsonFile = outputFiles.find((f) => {
    if (!f.includes("tests.json")) {
      return false;
    }
    const containsRuntimeKey = f.includes(runtimeKey);
    const containsTestName =
      f.includes(testName) || f.includes(sanitizedTestName);
    return containsRuntimeKey && containsTestName;
  });

  if (!testsJsonFile) {
    testsJsonFile = outputFiles.find(
      (f) => f.includes("tests.json") && f.includes(runtimeKey)
    );
  }

  if (testsJsonFile) {
    return path.join(process.cwd(), testsJsonFile);
  }

  return undefined;
};
