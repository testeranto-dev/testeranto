import type { TreeNode } from "./types";
import { getInputFilesForTest, getOutputFilesForTest } from "./fileOperations";
import { createRuntimeNode, createTestNode } from "./treeNodeCreators";
import { addSourceFilesToTestNode } from "./sourceFilesAdder";
import { addFeaturesFromTestsJson } from "./featuresAdder";
import { addLogFilesToTestNode } from "./logFilesAdder";
import { addBundleFilesToTestNode } from "./bundleFilesAdder";
import { getAllSourceFiles, findTestsJsonFile } from "./helpers";

export const processTest = (
  runtimeKey: string,
  runtime: string,
  testName: string,
  treeRoot: Record<string, TreeNode>
): void => {
  const inputFiles = getInputFilesForTest(runtime, testName);
  const outputFiles = getOutputFilesForTest(runtime, testName);

  if (!treeRoot[runtimeKey]) {
    treeRoot[runtimeKey] = createRuntimeNode(runtimeKey);
  }

  const runtimeNode = treeRoot[runtimeKey];
  if (!runtimeNode.children) {
    runtimeNode.children = {};
  }

  const testNodeKey = testName;
  if (!runtimeNode.children[testNodeKey]) {
    runtimeNode.children[testNodeKey] = createTestNode(testName);
  }

  const testNode = runtimeNode.children[testNodeKey];

  const allSourceFiles = getAllSourceFiles(runtimeKey, testName, inputFiles);
  addSourceFilesToTestNode(testNode, allSourceFiles, runtime, runtimeKey, testName);

  const testsJsonFile = findTestsJsonFile(outputFiles, runtimeKey, testName);
  addFeaturesFromTestsJson(testNode, testsJsonFile, outputFiles, runtime, runtimeKey, testName);

  addLogFilesToTestNode(testNode, outputFiles, runtime, runtimeKey, testName);
  addBundleFilesToTestNode(testNode, outputFiles, runtime, runtimeKey, testName);
};
