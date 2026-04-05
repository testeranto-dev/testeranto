import { findNodeInTree } from "../../stakeholder/StakeholderUtils";
import { addFileToTree } from "../utils/addFileToTree";
import { extractLocalFilePath } from "../utils/extractLocalFilePath";
import { isLocalFileUrl } from "../utils/isLocalFileUrl";

/**
 * Process test result into tree structure
 */
export async function processTestResultIntoTree(
  tree: any,
  testKey: string,
  testResult: any,
  configs: any
): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');
  const { existsSync } = require('fs');

  // Extract the test path from the key (format: runtime/testName)
  const [runtime, testName] = testKey.split("/");

  // Create a path for the test in the tree
  const testPath = `testeranto/reports/${runtime}/${testName}`;
  addFileToTree(tree, testPath, "test-directory");

  // Add the tests.json file
  const testsJsonPath = `${testPath}/tests.json`;
  addFileToTree(tree, testsJsonPath, "test-results");

  // Find the node for tests.json
  const testsJsonNode = findNodeInTree(tree, testsJsonPath);
  if (testsJsonNode) {
    // Process the test result data
    testsJsonNode.testData = testResult;

    // Also add test result files to the tree
    if (testResult.artifacts && Array.isArray(testResult.artifacts)) {
      for (const artifact of testResult.artifacts) {
        if (artifact.path) {
          const artifactPath = `${testPath}/${artifact.path}`;
          addFileToTree(tree, artifactPath, "test-artifact");
        }
      }
    }

    // Extract features and their associated steps
    if (testResult.testJob && testResult.testJob.givens) {
      const featuresMap = new Map<string, any>();

      for (const given of testResult.testJob.givens) {
        if (given.features) {
          for (const feature of given.features) {
            if (!featuresMap.has(feature)) {
              featuresMap.set(feature, {
                type: "feature",
                name: feature,
                path: feature,
                // Check if feature is a URL to a local file
                isUrl: isLocalFileUrl(feature),
                givens: [],
                whens: [],
                thens: [],
              });
            }

            const featureNode = featuresMap.get(feature);

            // Add the given
            featureNode.givens.push({
              key: given.key,
              status: !given.failed,
              error: given.error,
            });

            // Add whens
            if (given.whens) {
              for (const when of given.whens) {
                featureNode.whens.push({
                  name: when.name,
                  status: when.status,
                  error: when.error,
                });
              }
            }

            // Add thens
            if (given.thens) {
              for (const then of given.thens) {
                featureNode.thens.push({
                  name: then.name,
                  status: then.status,
                  error: then.error,
                });
              }
            }
          }
        }
      }

      // Add features to the tree
      for (const [featureName, featureData] of featuresMap) {
        // If feature is a URL to a local file, add it to the tree
        if (featureData.isUrl) {
          const filePath = extractLocalFilePath(featureName);
          if (filePath) {
            addFileToTree(tree, filePath, "documentation");

            // Try to load the file content
            try {
              const fullPath = path.join(process.cwd(), filePath);
              if (existsSync(fullPath)) {
                const content = await fs.readFile(fullPath, "utf-8");
                const fileNode = findNodeInTree(tree, filePath);
                if (fileNode) {
                  fileNode.content = content;
                }
              }
            } catch (error) {
              console.warn(
                `[utils] Could not read documentation file ${filePath}: ${error}`,
              );
            }
          }
        }

        // Add feature node under tests.json
        if (!testsJsonNode.children) {
          testsJsonNode.children = {};
        }
        const featureKey = featureName.replace(/[^a-zA-Z0-9]/g, "_");
        testsJsonNode.children[featureKey] = featureData;
      }
    }
  }
}
