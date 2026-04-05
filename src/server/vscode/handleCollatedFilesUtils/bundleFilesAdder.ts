import path from "path";
import type { TreeNode } from "./types";

export const addBundleFilesToTestNode = (
  testNode: TreeNode,
  outputFiles: string[],
  runtime: string,
  runtimeKey: string,
  testName: string
): void => {
  const bundleFiles = outputFiles.filter(
    (f) =>
      f.includes("testeranto/bundles/") && !f.includes("inputFiles.json")
  );

  if (bundleFiles.length === 0) {
    return;
  }

  if (!testNode.children) {
    testNode.children = {};
  }

  const bundleSectionKey = "bundle";
  if (!testNode.children[bundleSectionKey]) {
    testNode.children[bundleSectionKey] = {
      type: "directory",
      name: "Bundle Files",
      children: {},
    };
  }

  const bundleSection = testNode.children[bundleSectionKey];
  if (!bundleSection.children) {
    bundleSection.children = {};
  }

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

  const inputFilesJson = outputFiles.find((f) =>
    f.includes("inputFiles.json")
  );
  if (inputFilesJson) {
    bundleSection.children["inputFiles.json"] = {
      type: "file",
      path: inputFilesJson,
      runtime,
      runtimeKey,
      testName,
      fileType: "bundle",
    };
  }
};
