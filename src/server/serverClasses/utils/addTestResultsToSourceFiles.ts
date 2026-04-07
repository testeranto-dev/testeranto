import path from "path";
import { findNodeInTree } from "../../stakeholder/StakeholderUtils";
import { addFileToTree } from "./addFileToTree";
import { addTestResultStructureToNode } from "./addTestResultStructureToNode";
import { collectTestResults } from "./collectTestResults";
import { findSourceFileForTest } from "./findSourceFileForTest";

/**
 * Add test results to source files in the tree
 */
export async function addTestResultsToSourceFiles(tree: any, configs: any): Promise<void> {


  // Get all test results from the reports directory
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");
  const testResults = await collectTestResults(reportsDir);


  // For each test result, find its source file and attach the results
  for (const [testKey, testResult] of Object.entries(testResults)) {

    // Find which source file this test corresponds to
    const sourceFile = findSourceFileForTest(testKey, configs);

    if (sourceFile) {


      // Find the node for the source file in the tree
      const sourceNode = findNodeInTree(tree, sourceFile);
      if (sourceNode && sourceNode.type === "file") {
        // Ensure the source node has children
        if (!sourceNode.children) {
          sourceNode.children = {};
        }

        // Create a unique key for this test result based on the testKey
        // Use the configKey and test name to make it more readable
        const parts = testKey.split("/");
        const configKey = parts[0];
        const testName = parts.slice(1).join("/");
        const testResultKey = `${configKey}_${testName.replace(/\//g, "_").replace(/\./g, "-")}`;

        // Check if test results already exist for this key
        if (!sourceNode.children[testResultKey]) {
          // Create a test results node
          const testResultsNode = {
            type: "test-results",
            name: testResultKey,
            path: sourceFile + "/" + testResultKey,
            testData: testResult,
            children: {},
          };

          // Add the internal structure of the test results
          await addTestResultStructureToNode(
            testResultsNode,
            testResult,
          );

          sourceNode.children[testResultKey] = testResultsNode;

        } else {
          // Update existing test results
          sourceNode.children[testResultKey].testData = testResult;
          // Rebuild the structure
          sourceNode.children[testResultKey].children = {};
          await addTestResultStructureToNode(
            sourceNode.children[testResultKey],
            testResult,
          );

        }
      } else {
        console.warn(
          `[utils] Source node not found or not a file for: ${sourceFile}`,
        );
        // If the source file node doesn't exist, we should add it to the tree
        if (!sourceNode) {
          console.log(
            `[utils] Adding missing source file to tree: ${sourceFile}`,
          );
          addFileToTree(tree, sourceFile, "test-source");
          // Try again to attach test results
          const newSourceNode = findNodeInTree(tree, sourceFile);
          if (newSourceNode && newSourceNode.type === "file") {
            if (!newSourceNode.children) {
              newSourceNode.children = {};
            }
            const parts = testKey.split("/");
            const configKey = parts[0];
            const testName = parts.slice(1).join("/");
            const testResultKey = `${configKey}_${testName.replace(/\//g, "_").replace(/\./g, "-")}`;
            const testResultsNode = {
              type: "test-results",
              name: testResultKey,
              path: sourceFile + "/" + testResultKey,
              testData: testResult,
              children: {},
            };
            await addTestResultStructureToNode(
              testResultsNode,
              testResult,
            );
            newSourceNode.children[testResultKey] = testResultsNode;
            console.log(
              `[utils] Added source file and test results for ${testKey}`,
            );
          }
        }
      }
    } else {
      console.warn(
        `[utils] Could not find source file for test: ${testKey}`,
      );
      // Even if we can't find the source file, we can still add the test results to the tree
      // under a special section
      const testPath = `testeranto/test-results/${testKey}`;
      addFileToTree(tree, testPath, "test-results");
      const testNode = findNodeInTree(tree, testPath);
      if (testNode && testNode.type === "file") {
        testNode.testData = testResult;
        console.log(
          `[utils] Added orphan test results for ${testKey} to special section`,
        );
      }
    }
  }

}
