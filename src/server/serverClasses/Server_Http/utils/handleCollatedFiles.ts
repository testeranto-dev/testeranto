import fs from "fs";
import path from "path";
import { jsonResponse } from "./jsonResponse";
import {
  getInputFilesForTest,
  getOutputFilesForTest,
  getExitCodeFromFile,
} from "./handleCollatedFilesUtils";

export const handleCollatedFiles = (server: any): Response => {
  // Get all runtimes from configs
  const configs = server.configs;
  if (!configs || !configs.runtimes) {
    return jsonResponse({
      tree: {},
      message: "No runtimes configured",
    });
  }

  // Build a unified tree of all files across all runtimes
  const treeRoot: Record<string, any> = {};

  // For each runtime, get input and output files for each test
  const runtimes = configs.runtimes;

  for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
    const config = runtimeConfig as any;
    const runtime = config.runtime;
    const tests = config.tests || [];

    for (const testName of tests) {
      try {
        // Get input files (source files)
        const inputFiles = getInputFilesForTest(runtime, testName);

        // Get output files
        const outputFiles = getOutputFilesForTest(runtime, testName);

        console.log(
          `[DEBUG] Processing ${runtime}/${testName}: inputFiles=${inputFiles.length}, outputFiles=${outputFiles.length}`,
        );

        // Create runtime node if it doesn't exist
        if (!treeRoot[runtimeKey]) {
          treeRoot[runtimeKey] = {
            type: "directory",
            children: {},
          };
        }

        const runtimeNode = treeRoot[runtimeKey];
        if (!runtimeNode.children) {
          runtimeNode.children = {};
        }

        // Create test node
        const testNodeKey = testName;
        if (!runtimeNode.children[testNodeKey]) {
          runtimeNode.children[testNodeKey] = {
            type: "directory",
            children: {},
          };
        }

        const testNode = runtimeNode.children[testNodeKey];
        if (!testNode.children) {
          testNode.children = {};
        }

        // 1. Add tests.json if found in output files
        const testsJsonFile = outputFiles.find((f) => f.includes("tests.json"));
        if (testsJsonFile) {
          testNode.children["tests.json"] = {
            type: "file",
            path: testsJsonFile,
            runtime,
            runtimeKey,
            testName,
            fileType: "test-results",
          };
        }

        // 2. Add build.log if found
        const buildLogFile = outputFiles.find((f) => f.includes("build.log"));
        if (buildLogFile) {
          testNode.children["build.log"] = {
            type: "file",
            path: buildLogFile,
            runtime,
            runtimeKey,
            testName,
            fileType: "log",
          };
        }

        // 3. Create source section with actual source files
        const sourceSectionKey = "source";
        if (!testNode.children[sourceSectionKey]) {
          testNode.children[sourceSectionKey] = {
            type: "directory",
            name: "Source Files",
            children: {},
          };
        }

        const sourceSection = testNode.children[sourceSectionKey];

        // First, try to get all source files from inputFiles.json
        // Look in testeranto/bundles/{runtimeKey}/inputFiles.json, not {runtime}
        const inputFilesJsonPath = path.join(
          process.cwd(),
          "testeranto",
          "bundles",
          runtimeKey,
          "inputFiles.json",
        );
        console.log(
          `[DEBUG] Looking for inputFiles.json at: ${inputFilesJsonPath}`,
        );
        let allSourceFiles: string[] = [];

        if (fs.existsSync(inputFilesJsonPath)) {
          try {
            const content = fs.readFileSync(inputFilesJsonPath, "utf-8");
            const inputFilesData = JSON.parse(content);
            console.log(
              `[DEBUG] Found inputFiles.json with keys:`,
              Object.keys(inputFilesData),
            );

            // Find the entry for this test
            // The key in inputFiles.json is the test name (e.g., "src/ts/Calculator.test.web.ts")
            for (const [key, value] of Object.entries(inputFilesData)) {
              console.log(
                `[DEBUG] Checking key: ${key} against testName: ${testName}`,
              );
              if (key === testName) {
                const entry = value as any;
                if (entry.files && Array.isArray(entry.files)) {
                  allSourceFiles = entry.files;
                  console.log(
                    `[DEBUG] Found ${allSourceFiles.length} source files for test ${testName}`,
                  );
                  break;
                }
              }
            }
            // If not found by exact match, try partial match
            if (allSourceFiles.length === 0) {
              for (const [key, value] of Object.entries(inputFilesData)) {
                if (key.includes(testName) || testName.includes(key)) {
                  const entry = value as any;
                  if (entry.files && Array.isArray(entry.files)) {
                    allSourceFiles = entry.files;
                    console.log(
                      `[DEBUG] Found ${allSourceFiles.length} source files via partial match`,
                    );
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Error reading inputFiles.json for ${runtimeKey}/${testName}:`,
              error,
            );
          }
        } else {
          console.log(
            `[DEBUG] inputFiles.json not found at ${inputFilesJsonPath}`,
          );
        }

        // If we couldn't get files from inputFiles.json, use the inputFiles from getInputFilesForTest
        if (allSourceFiles.length === 0) {
          console.log(
            `[DEBUG] Using inputFiles from getInputFilesForTest: ${inputFiles.length} files`,
          );
          allSourceFiles = inputFiles;
        }

        // Add all source files to the source section
        console.log(
          `[DEBUG] Adding ${allSourceFiles.length} source files to source section`,
        );
        for (const file of allSourceFiles) {
          // Normalize the path: remove leading slash if present
          // Store the path as relative to workspace root (without leading '/')
          const normalizedPath = file.startsWith("/")
            ? file.substring(1)
            : file;
          const parts = normalizedPath
            .split("/")
            .filter((part) => part.length > 0);

          if (parts.length === 0) continue;

          let currentNode = sourceSection.children;

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (!currentNode[part]) {
              if (isLast) {
                currentNode[part] = {
                  type: "file",
                  // Store the normalized path (without leading '/')
                  path: normalizedPath,
                  runtime,
                  runtimeKey,
                  testName,
                  fileType: "source",
                };
              } else {
                currentNode[part] = {
                  type: "directory",
                  name: part,
                  children: {},
                };
              }
            }

            if (!isLast && currentNode[part].type === "directory") {
              currentNode = currentNode[part].children;
            }
          }
        }
        console.log(
          `[DEBUG] Source section now has ${Object.keys(sourceSection.children).length} top-level items`,
        );

        // Add features from tests.json if they exist
        try {
          // Look for tests.json in output files that matches this test
          // The path pattern is often: testeranto/reports/{runtimeKey}/{testName}/tests.json
          // But testName might have slashes replaced with underscores
          const sanitizedTestName = testName
            .replace(/\//g, "_")
            .replace(/\./g, "-");
          let testsJsonFile = outputFiles.find((f) => {
            // Check if it's a tests.json file
            if (!f.includes("tests.json")) {
              return false;
            }
            // Check if it contains the runtimeKey and testName (or sanitized version)
            const containsRuntimeKey = f.includes(runtimeKey);
            const containsTestName =
              f.includes(testName) || f.includes(sanitizedTestName);
            return containsRuntimeKey && containsTestName;
          });

          if (!testsJsonFile) {
            // Try any tests.json file in the runtime directory
            const fallbackTestsJsonFile = outputFiles.find(
              (f) => f.includes("tests.json") && f.includes(runtimeKey),
            );
            if (fallbackTestsJsonFile) {
              console.log(
                `[DEBUG] Using fallback tests.json: ${fallbackTestsJsonFile}`,
              );
              testsJsonFile = fallbackTestsJsonFile;
            }
          }

          console.log(`[DEBUG] Selected tests.json file: ${testsJsonFile}`);
          if (testsJsonFile) {
            const testsJsonPath = path.join(process.cwd(), testsJsonFile);
            if (fs.existsSync(testsJsonPath)) {
              const content = fs.readFileSync(testsJsonPath, "utf-8");
              const testData = JSON.parse(content);

              // Extract features from test data
              let features: string[] = [];

              // Log the structure of testData for debugging
              console.log(`[DEBUG] Test data keys:`, Object.keys(testData));

              // Check for features in various locations in the test data structure
              if (testData.features && Array.isArray(testData.features)) {
                features = testData.features;
                console.log(
                  `[DEBUG] Found features in testData.features:`,
                  features,
                );
              } else if (testData.testJob) {
                console.log(
                  `[DEBUG] testJob keys:`,
                  Object.keys(testData.testJob),
                );
                if (
                  testData.testJob.givens &&
                  Array.isArray(testData.testJob.givens)
                ) {
                  console.log(
                    `[DEBUG] Number of givens:`,
                    testData.testJob.givens.length,
                  );
                  // Extract features from givens
                  const allFeatures = new Set<string>();
                  for (const given of testData.testJob.givens) {
                    console.log(`[DEBUG] Given keys:`, Object.keys(given));
                    if (given.features && Array.isArray(given.features)) {
                      console.log(
                        `[DEBUG] Found features in given:`,
                        given.features,
                      );
                      for (const feature of given.features) {
                        allFeatures.add(feature);
                      }
                    }
                  }
                  features = Array.from(allFeatures);
                }
              }

              if (features.length > 0) {
                console.log(
                  `[DEBUG] Found ${features.length} features for ${testName} in tests.json:`,
                  features,
                );

                // Separate documentation file references from regular features
                const regularFeatures: string[] = [];
                const docFilePaths: string[] = [];

                for (const feature of features) {
                  // Check if feature is a documentation file reference
                  // Common documentation file extensions
                  const docExtensions = [
                    ".md",
                    ".txt",
                    ".rst",
                    ".adoc",
                    ".asciidoc",
                    ".markdown",
                    ".mdown",
                  ];
                  const isDocByExtension = docExtensions.some((ext) =>
                    feature.toLowerCase().endsWith(ext),
                  );

                  // Check if it looks like a file path
                  const looksLikePath =
                    feature.includes("/") ||
                    feature.includes("\\") ||
                    feature.startsWith("./") ||
                    feature.startsWith("/") ||
                    feature.includes(".");

                  if (isDocByExtension || looksLikePath) {
                    // Normalize the path
                    let normalizedPath = feature;
                    // Remove leading './' if present
                    if (normalizedPath.startsWith("./")) {
                      normalizedPath = normalizedPath.substring(2);
                    }
                    // Remove leading '/' if present (absolute from project root)
                    if (normalizedPath.startsWith("/")) {
                      normalizedPath = normalizedPath.substring(1);
                    }
                    // Also handle Windows-style paths (though less likely)
                    normalizedPath = normalizedPath.replace(/\\/g, "/");
                    docFilePaths.push(normalizedPath);
                  } else {
                    regularFeatures.push(feature);
                  }
                }

                console.log(
                  `[DEBUG] Regular features: ${regularFeatures.length}, Documentation files: ${docFilePaths.length}`,
                );

                // Add regular features to features section
                if (regularFeatures.length > 0) {
                  // Create a features section under source
                  const featuresSectionKey = "features";
                  if (!sourceSection.children[featuresSectionKey]) {
                    sourceSection.children[featuresSectionKey] = {
                      type: "directory",
                      name: "Features",
                      children: {},
                    };
                    console.log(
                      `[DEBUG] Created Features directory for ${testName}`,
                    );
                  }

                  const featuresSection =
                    sourceSection.children[featuresSectionKey];

                  // Add each regular feature as a non-clickable item
                  for (const feature of regularFeatures) {
                    const featureKey = `feature:${feature}`.replace(
                      /[^a-zA-Z0-9]/g,
                      "_",
                    );
                    console.log(
                      `[DEBUG] Adding regular feature: ${feature} with key: ${featureKey}`,
                    );
                    featuresSection.children[featureKey] = {
                      type: "feature",
                      name: feature,
                      runtime,
                      runtimeKey,
                      testName,
                      feature: feature,
                      // Mark as non-clickable
                      clickable: false,
                      // For future styling with red-yellow-green status
                      status: "unknown", // Can be 'passed', 'failed', 'unknown', etc.
                    };
                  }
                  console.log(
                    `[DEBUG] Features section now has ${Object.keys(featuresSection.children).length} regular features`,
                  );
                }

                // Add documentation files to source tree
                if (docFilePaths.length > 0) {
                  console.log(
                    `[DEBUG] Adding ${docFilePaths.length} documentation files to source tree`,
                  );
                  for (const docPath of docFilePaths) {
                    // Normalize the path: remove leading slash if present
                    // Store the path as relative to workspace root (without leading '/')
                    const normalizedPath = docPath.startsWith("/")
                      ? docPath.substring(1)
                      : docPath;
                    const parts = normalizedPath
                      .split("/")
                      .filter((part) => part.length > 0);

                    if (parts.length === 0) continue;

                    let currentNode = sourceSection.children;

                    for (let i = 0; i < parts.length; i++) {
                      const part = parts[i];
                      const isLast = i === parts.length - 1;

                      if (!currentNode[part]) {
                        if (isLast) {
                          currentNode[part] = {
                            type: "file",
                            // Store the normalized path (without leading '/')
                            path: normalizedPath,
                            runtime,
                            runtimeKey,
                            testName,
                            fileType: "documentation", // Mark as documentation
                          };
                        } else {
                          currentNode[part] = {
                            type: "directory",
                            name: part,
                            children: {},
                          };
                        }
                      }

                      if (!isLast && currentNode[part].type === "directory") {
                        currentNode = currentNode[part].children;
                      }
                    }
                  }
                  console.log(
                    `[DEBUG] Added documentation files to source tree`,
                  );
                }
              } else {
                console.log(
                  `[DEBUG] No features found for ${testName} in tests.json`,
                );
                console.log(
                  `[DEBUG] Test data structure:`,
                  Object.keys(testData),
                );
                if (testData.testJob) {
                  console.log(
                    `[DEBUG] testJob structure:`,
                    Object.keys(testData.testJob),
                  );
                }
              }
            } else {
              console.log(
                `[DEBUG] tests.json file not found at path: ${testsJsonPath}`,
              );
            }
          } else {
            console.log(
              `[DEBUG] No tests.json found in output files for ${testName}`,
            );
          }
        } catch (error) {
          console.error(
            `[DEBUG] Error reading features from tests.json for ${runtimeKey}/${testName}:`,
            error,
          );
        }

        // 4. Group log files by type (BDD, check0, check1, etc.)
        const logFiles = outputFiles.filter(
          (f) => f.endsWith(".log") && !f.includes("build.log"),
        );
        console.log(
          `[DEBUG] Found ${logFiles.length} log files for ${runtimeKey}/${testName}`,
        );

        // Group logs by pattern
        const logGroups: Record<
          string,
          { logFile: string; exitCodeFile?: string }
        > = {};

        for (const logFile of logFiles) {
          const baseName = path.basename(logFile);
          console.log(`[DEBUG] Processing log file: ${baseName}`);

          // Extract pattern: webtests-src_ts_calculator-test-web-ts-bdd.log -> BDD
          let groupName = "Other Logs";

          if (baseName.includes("-bdd.log")) {
            groupName = "BDD";
          } else if (baseName.includes("-check-")) {
            // Extract check number: webtests-src_ts_calculator-test-web-ts-check-0.log -> check0
            const match = baseName.match(/check-(\d+)\.log/);
            if (match) {
              groupName = `check${match[1]}`;
            }
          }

          // Look for corresponding exitcode file
          const exitCodeFile = outputFiles.find((f) => {
            const fBase = path.basename(f);
            return (
              fBase === baseName.replace(".log", ".exitcode") ||
              fBase === baseName.replace(".log", ".container.exitcode")
            );
          });

          if (exitCodeFile) {
            console.log(
              `[DEBUG] Found exit code file: ${path.basename(exitCodeFile)} for ${baseName}`,
            );
          } else {
            console.log(`[DEBUG] No exit code file found for ${baseName}`);
          }

          logGroups[groupName] = {
            logFile,
            exitCodeFile,
          };
        }

        // Add log groups to test node
        for (const [groupName, files] of Object.entries(logGroups)) {
          const exitCodeInfo = files.exitCodeFile
            ? getExitCodeFromFile(files.exitCodeFile)
            : { code: "unknown", color: "gray" };

          console.log(
            `[DEBUG] Exit code for ${groupName}: ${exitCodeInfo.code}, color: ${exitCodeInfo.color}`,
          );

          const label = `${groupName} - ${exitCodeInfo.code}`;

          testNode.children[label] = {
            type: "file",
            path: files.logFile,
            runtime,
            runtimeKey,
            testName,
            fileType: "log",
            exitCode: exitCodeInfo.code,
            exitCodeColor: exitCodeInfo.color,
            groupName,
            description: `Click to show ${path.basename(files.logFile)}`,
          };
        }

        // 5. Create bundle section for bundle files
        const bundleFiles = outputFiles.filter(
          (f) =>
            f.includes("testeranto/bundles/") && !f.includes("inputFiles.json"),
        );

        if (bundleFiles.length > 0) {
          const bundleSectionKey = "bundle";
          if (!testNode.children[bundleSectionKey]) {
            testNode.children[bundleSectionKey] = {
              type: "directory",
              name: "Bundle Files",
              children: {},
            };
          }

          const bundleSection = testNode.children[bundleSectionKey];

          for (const file of bundleFiles) {
            const fileName = path.basename(file);
            bundleSection.children[fileName] = {
              type: "file",
              path: file,
              runtime,
              runtimeKey,
              testName,
              fileType: "bundle",
            };
          }
        }

        // 6. Add inputFiles.json to bundle section or directly
        const inputFilesJson = outputFiles.find((f) =>
          f.includes("inputFiles.json"),
        );
        if (inputFilesJson) {
          if (!testNode.children["bundle"]) {
            testNode.children["bundle"] = {
              type: "directory",
              name: "Bundle Files",
              children: {},
            };
          }
          const bundleSection = testNode.children["bundle"];
          bundleSection.children["inputFiles.json"] = {
            type: "file",
            path: inputFilesJson,
            runtime,
            runtimeKey,
            testName,
            fileType: "bundle",
          };
        }
      } catch (error) {
        console.error(`Error processing ${runtimeKey}/${testName}:`, error);
      }
    }
  }

  console.log("[collation]", JSON.stringify(treeRoot, null, 2));

  return jsonResponse({
    tree: treeRoot,
    message: "Success",
  });
};
