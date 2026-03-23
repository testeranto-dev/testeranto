import path from "path";

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
