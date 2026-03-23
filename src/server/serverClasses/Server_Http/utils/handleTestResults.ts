export const handleTestResults = (url: URL, server: any): Response => {
  const runtime = url.searchParams.get("runtime");
  const testName = url.searchParams.get("testName");

  // Try to find test.json files in the reports directory
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");

  if (!fs.existsSync(reportsDir)) {
    return Server_HTTP_utils.jsonResponse({
      testResults: [],
      message: "No reports directory found",
    });
  }

  const testResults: any[] = [];

  // Helper function to find all tests.json files
  const findAllTestsJsonFiles = (dir: string): string[] => {
    let results: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            results = results.concat(findAllTestsJsonFiles(fullPath));
          } else if (item === "tests.json") {
            results.push(fullPath);
          }
        } catch {
          // Skip if we can't stat
        }
      }
    } catch {
      // Skip if we can't read directory
    }
    return results;
  };

  // If runtime and testName are provided, look for specific test results
  if (runtime && testName) {
    // First, find all tests.json files
    const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);

    // Try to find a matching file
    for (const filePath of allTestsJsonFiles) {
      // Check if the file path contains runtime and testName patterns
      const normalizedPath = filePath.toLowerCase();
      const runtimeLower = runtime.toLowerCase();
      const testNameLower = testName.toLowerCase();

      // Extract test name from path (last directory before tests.json)
      const dirName = path.dirname(filePath);
      const lastDir = path.basename(dirName).toLowerCase();

      // Check various patterns
      const containsRuntime = normalizedPath.includes(runtimeLower);
      const containsTestName =
        normalizedPath.includes(testNameLower) ||
        lastDir.includes(testNameLower.replace(/\./g, "")) ||
        testNameLower.includes(lastDir);

      if (containsRuntime && containsTestName) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const testData = JSON.parse(content);
          testResults.push({
            file: filePath,
            data: testData,
            runtime,
            testName,
          });
          // Found a match, break
          break;
        } catch (error) {
          // Continue to next file
        }
      }
    }

    // If no match found, try to find any tests.json in runtime directory
    if (testResults.length === 0) {
      const runtimeDir = path.join(reportsDir, runtime);
      if (fs.existsSync(runtimeDir)) {
        const runtimeTestsJsonFiles = findAllTestsJsonFiles(runtimeDir);
        for (const filePath of runtimeTestsJsonFiles) {
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            const testData = JSON.parse(content);
            testResults.push({
              file: filePath,
              data: testData,
              runtime,
              testName,
            });
            // Take the first one
            break;
          } catch (error) {
            // Continue
          }
        }
      }
    }
  } else {
    // Find all test.json files
    const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);

    for (const filePath of allTestsJsonFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const testData = JSON.parse(content);
        testResults.push({
          file: filePath,
          data: testData,
        });
      } catch (error) {
        // Skip invalid JSON
      }
    }
  }

  return Server_HTTP_utils.jsonResponse({
    testResults,
    message: "Success",
  });
};
